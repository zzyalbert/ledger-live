import { Observable, from, of, throwError } from "rxjs";
import { catchError, concatMap, delay, mergeMap } from "rxjs/operators";
import { DeviceOnDashboardExpected, TransportError, TransportStatusError } from "@ledgerhq/errors";

import ManagerAPI from "../api/Manager";
import { withDevice } from "./deviceAccess";
import getDeviceInfo from "./getDeviceInfo";
import { Language, languageIds, LanguagePackage } from "../types/languages";
import { getProviderId } from "../manager/provider";
import network from "../network";
import { LanguageInstallRefusedOnDevice } from "../errors";
import { AppAndVersion } from "./connectApp";
import appSupportsQuitApp from "../appSupportsQuitApp";
import quitApp from "./quitApp";
import getAppAndVersion from "./getAppAndVersion";
import { isDashboardName } from "./isDashboardName";

export type InstallLanguageEvent =
  | {
      type: "appDetected";
    }
  | {
      type: "unresponsiveDevice";
    }
  | {
      type: "progress";
      progress: number;
    }
  | {
      type: "devicePermissionRequested";
      wording: string; // TODO: <--- 
    };

const attemptToQuitApp = (transport, appAndVersion?: AppAndVersion): Observable<InstallLanguageEvent> =>
  appAndVersion && appSupportsQuitApp(appAndVersion)
    ? from(quitApp(transport)).pipe(
        concatMap(() =>
          of(<InstallLanguageEvent>{
            type: "unresponsiveDevice",
          })
        ),
        catchError((e) => throwError(e))
      )
    : of({
        type: "appDetected",
      });

export type InstallLanguageRequest = {
  deviceId: string;
  language: Language;
};

export default function installLanguage({
  deviceId,
  language,
}: InstallLanguageRequest): Observable<InstallLanguageEvent> {
  debugger;
  const sub = withDevice(deviceId)(
    (transport) =>
      new Observable<InstallLanguageEvent>((subscriber) => {
        const timeoutSub = of<InstallLanguageEvent>({
          type: "unresponsiveDevice",
        })
          .pipe(delay(1000))
          .subscribe((e) => subscriber.next(e));

        const sub = from(getDeviceInfo(transport))
          .pipe(
            mergeMap(async (deviceInfo) => {
              timeoutSub.unsubscribe();

              const deviceVersion = await ManagerAPI.getDeviceVersion(deviceInfo.targetId, getProviderId(deviceInfo));

              const seFirmwareVersion = await ManagerAPI.getCurrentFirmware({
                version: deviceInfo.version,
                deviceId: deviceVersion.id,
                provider: getProviderId(deviceInfo),
              });

              const languages = await ManagerAPI.getLanguagePackages(deviceVersion.id, seFirmwareVersion.id);

              const packs: LanguagePackage[] = languages.filter((l: any) => l.language === language);

              if (!packs.length) return subscriber.error(new Error(`No language ${language} found`));
              const pack = packs[1];

              const { apdu_install_url } = pack;
              const url = apdu_install_url;

              const { data: rawApdus } = await network({
                method: "GET",
                url,
              });

              const apdus = rawApdus.split(/\r?\n/).filter(Boolean);

              // Gab comment: this will be done with a single apdu in the future IIRC
              for (const id of Object.values(languageIds)) {
                // do we want to reflect this on the UI? do we need to emit events here
                // what about error handling, maybe unhandled promise rejection might happen
                // at least try catch
                await transport.send(
                  0xe0,
                  0x33,
                  id,
                  0x00,
                  undefined,
                  [0x9000, 0x5501] // Expected responses when uninstalling.
                );
              }

              for (let i = 0; i < apdus.length; i++) {
                if (apdus[i].startsWith("e030")) {
                  subscriber.next({
                    type: "devicePermissionRequested",
                    wording: "Aceita ai na moralzinha", // TODO: <---
                  });
                }

                const response = await transport.exchange(Buffer.from(apdus[i], "hex"));
                const status = response.readUInt16BE(response.length - 2);
                const statusStr = status.toString(16);

                // Some error handling
                if (status === 0x5501) {
                  return subscriber.error(new LanguageInstallRefusedOnDevice(statusStr));
                } else if (status !== 0x9000) {
                  return subscriber.error(new TransportError("Unexpected device response", statusStr));
                }

                subscriber.next({
                  type: "progress",
                  progress: (i + 1) / apdus.length,
                });
              }

              subscriber.complete();
            }),
            catchError((e: Error) => {
              if (
                e instanceof DeviceOnDashboardExpected ||
                (e &&
                  e instanceof TransportStatusError &&
                  // @ts-expect-error typescript not checking agains the instanceof
                  [0x6e00, 0x6d00, 0x6e01, 0x6d01, 0x6d02].includes(e.statusCode))
              ) {
                return from(getAppAndVersion(transport)).pipe(
                  concatMap((appAndVersion) => {
                    return !isDashboardName(appAndVersion.name)
                      ? attemptToQuitApp(transport, appAndVersion)
                      : of({
                          type: "appDetected",
                        });
                  })
                );
              }

              return throwError(e);
            })
          )
          .subscribe();

        return () => {
          timeoutSub.unsubscribe();
          sub.unsubscribe();
        };
      })
  );

  return sub;
}
