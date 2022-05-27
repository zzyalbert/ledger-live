import React, { useMemo, useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { App, DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/live-common/lib/types/manager";
import type { InstalledItem, ListAppsResult } from "@ledgerhq/live-common/lib/apps/types";
import { distribute, initState } from "@ledgerhq/live-common/lib/apps/logic";
import { mockExecWithInstalledContext } from "@ledgerhq/live-common/lib/apps/mock";
import { mockedEventEmitter } from "~/renderer/components/debug/DebugMock";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import type { AppOp } from "@ledgerhq/live-common/lib/apps";
import AppsList from "./AppsList";
import TrackPage from "~/renderer/analytics/TrackPage";
import Box from "~/renderer/components/Box";
import { command } from "~/renderer/commands";
import FirmwareUpdate from "./FirmwareUpdate";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { useLocation } from "react-router";
import { createAction } from "@ledgerhq/live-common/lib/hw/actions/installLanguage";
import DeviceAction from "~/renderer/components/DeviceAction";
import Button from "~/renderer/components/Button";

type Props = {
  device: Device,
  deviceInfo: DeviceInfo,
  result?: ListAppsResult,
  onReset: (apps?: string[], firmwareUpdateOpened?: boolean) => void,
  appsToRestore: string[],
};



const Dashboard = ({ device, deviceInfo, result, onReset, appsToRestore }: Props) => {
  const { search } = useLocation();

  const currentDevice = useSelector(getCurrentDevice);
  const [firmwareUpdateOpened, setFirmwareUpdateOpened] = useState(false);
  const hasDisconnectedDuringFU = useRef(false);
  const [firmware, setFirmware] = useState<FirmwareUpdateContext | null>(null);
  const [firmwareError, setFirmwareError] = useState<Error | null>(null);

  const params = new URLSearchParams(search || "");
  const openFirmwareUpdate = params.get("firmwareUpdate") === "true";

  useEffect(() => {
    command("getLatestFirmwareForDevice")(deviceInfo)
      .toPromise()
      .then(setFirmware, setFirmwareError);
  }, [deviceInfo]);

  // on disconnect, go back to connect
  useEffect(() => {
    // if there is no device but firmware update still happening
    if (!currentDevice && firmwareUpdateOpened) {
      hasDisconnectedDuringFU.current = true; // set disconnected to true for a later onReset()
    }

    // we must not reset during firmware update
    if (firmwareUpdateOpened) {
      return;
    }

    // we need to reset only if device is unplugged OR a disconnection happened during firmware update
    if (!currentDevice || hasDisconnectedDuringFU.current) {
      onReset([], firmwareUpdateOpened);
    }
  }, [onReset, firmwareUpdateOpened, currentDevice]);

  const exec = useMemo(
    () =>
      getEnv("MOCK")
        ? mockExecWithInstalledContext(result?.installed || [])
        : (appOp: AppOp, targetId: string | number, app: App ) =>
            command("appOpExec")({ appOp, targetId, app, deviceId: device.deviceId }),
    [device, result],
  );

  const appsStoragePercentage = useMemo(() => {
    if (!result) return 0;
    const d = distribute(initState(result));
    return d.totalAppsBytes / d.appsSpaceBytes;
  }, [result]);

  
  const [installingLanguage, setInstallingLanguage] = useState(false);
  
  if(installingLanguage) {
    console.log("installLanguage - device", device);
    return <DeviceAction action={installLanguageAction} request="french" />
  }

  return (
    <Box flow={4} selectable>
      <TrackPage
        category="Manager"
        name="Dashboard"
        deviceModelId={device.modelId}
        deviceVersion={deviceInfo.version}
        appsStoragePercentage={appsStoragePercentage}
        appLength={result ? result.installed.length : 0}
      />
      {result ? (
        <AppsList
          device={device}
          deviceInfo={deviceInfo}
          firmware={firmware}
          result={result}
          appsToRestore={appsToRestore}
          exec={exec}
          render={({ disableFirmwareUpdate, installed }: {
            disableFirmwareUpdate: boolean,
            installed: InstalledItem[],
          }) => (
            <FirmwareUpdate
              device={device}
              deviceInfo={deviceInfo}
              firmware={firmware}
              error={firmwareError}
              setFirmwareUpdateOpened={setFirmwareUpdateOpened}
              disableFirmwareUpdate={disableFirmwareUpdate}
              installed={installed}
              onReset={onReset}
              openFirmwareUpdate={openFirmwareUpdate}
            />
          )}
        />
      ) : (
        <FirmwareUpdate
          device={device}
          deviceInfo={deviceInfo}
          firmware={firmware}
          error={firmwareError}
          setFirmwareUpdateOpened={setFirmwareUpdateOpened}
          onReset={onReset}
          openFirmwareUpdate={openFirmwareUpdate}
        />
      )}
    </Box>
  );
};



export default Dashboard;
