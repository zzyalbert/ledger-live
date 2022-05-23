import { of, interval, Observable, TimeoutError, ReplaySubject } from "rxjs";
import { scan, debounce, debounceTime, switchMap, tap, distinctUntilChanged, timeout, filter } from "rxjs/operators";
import { useEffect, useState } from "react";
import { log } from "@ledgerhq/logs";
import { useReplaySubject } from "../../observable";
import installLanguageExec, { InstallLanguageEvent } from "../installLanguage";
import type { Action, Device } from "./types";
import isEqual from "lodash/isEqual";
import { LanguageInstallTimeout } from "../../errors";
import { currentMode } from "./app";
import { DisconnectedDevice, DisconnectedDeviceDuringOperation } from "@ledgerhq/errors";
import { getDeviceModel } from "@ledgerhq/devices";
import { Language } from "../../types/languages";

type State = {
  step: "preparing" | "downloadingLanguague" | "askingDeviceConfirmation" | "success" | "error";
  progress?: number;
  error?: Error;
};

type Event =
  | InstallLanguageEvent
  | {
      type: "installationCompleted";
    }
  | {
      type: "error";
      error: Error;
    };

const initialState: State = {
  step: "preparing",
};

type InstallLanguageAction = Action<Language, State, undefined>;

// TODO: maybe doesn't need to be a function as it's static
const getInitialState = (): State => initialState;

const reducer = (_: State, e: Event): State => {
  switch (e.type) {
    case "devicePermissionRequested":
      return { step: "askingDeviceConfirmation" };
    case "progress":
      return { step: "downloadingLanguague", progress: e.progress };
    case "error":
      return {
        step: "error",
        error: e.error,
      };
    case "installationCompleted":
      return { step: "success" };
    case "appDetected":
      return { step: "preparing" };
    case "unresponsiveDevice":
      return { step: "error", error: new LanguageInstallTimeout() };
  }
};

const implementations = {
  // in this paradigm, we know that deviceSubject is reflecting the device events
  // so we just trust deviceSubject to reflect the device context (switch between apps, dashboard,...)
  event: ({
    deviceSubject,
    installLanguage,
    language,
  }: {
    deviceSubject: ReplaySubject<Device | null | undefined>;
    installLanguage: typeof installLanguageExec;
    language: Language;
  }): Observable<Event> =>
    new Observable<Event>((subscriber) => {
      deviceSubject
        .pipe(
          debounceTime(1000),
          filter((device): device is Device => device !== undefined && device !== null),
          switchMap(({ deviceId }) => installLanguage({ deviceId, language }))
        )
        .subscribe(
          (event) => event,
          (error) => subscriber.next({ type: "error", error }),
          () => subscriber.next({ type: "installationCompleted" })
        );
    }),
  // in this paradigm, we can't observe directly the device, so we have to poll it
  polling: ({
    deviceSubject,
    installLanguage,
    language,
  }: {
    deviceSubject: ReplaySubject<Device | null | undefined>;
    installLanguage: typeof installLanguageExec;
    language: Language;
  }) =>
    new Observable<Event>((subscriber) => {
      const POLLING = 2000;
      const INIT_DEBOUNCE = 5000;
      const DISCONNECT_DEBOUNCE = 5000;
      const DEVICE_POLLING_TIMEOUT = 20000;
      // this pattern allows to actually support events based (like if deviceSubject emits new device changes) but inside polling paradigm
      let pollingOnDevice: Device | null = null;
      const sub = deviceSubject.subscribe((d) => {
        if (d) {
          pollingOnDevice = d;
        }
      });
      let initT: NodeJS.Timeout | null = setTimeout(() => {
        // initial timeout to unset the device if it's still not connected
        device = null;
        log("app/polling", "device init timeout");
      }, INIT_DEBOUNCE);

      let installSub;
      let loopT;
      let disconnectT;
      let device: Device | null = null; // used as internal state for polling

      let stopDevicePollingError: Error | null = null;

      function loop() {
        stopDevicePollingError = null;

        if (!pollingOnDevice) {
          loopT = setTimeout(loop, POLLING);
          return;
        }

        log("manager/polling", "polling loop");
        // maybe filter on device
        installSub = installLanguage({ deviceId: pollingOnDevice.deviceId, language })
          .pipe(timeout(DEVICE_POLLING_TIMEOUT))
          .subscribe({
            next: (event: Event) => {
              if (initT && device) {
                clearTimeout(initT);
                initT = null;
              }

              if (disconnectT) {
                // any connect app event unschedule the disconnect debounced event
                clearTimeout(disconnectT);
                disconnectT = null;
              }

              if (event.type === "error" && event.error) {
                if (
                  event.error instanceof DisconnectedDevice ||
                  event.error instanceof DisconnectedDeviceDuringOperation
                ) {
                  // disconnect on manager actions seems to trigger a type "error" instead of "disconnect"
                  // the disconnect event is delayed to debounce the reconnection that happens when switching apps
                  disconnectT = setTimeout(() => {
                    disconnectT = null;
                    // a disconnect will locally be remembered via locally setting device to null...
                    device = null;
                    subscriber.next(event);
                    log("app/polling", "device disconnect timeout");
                  }, DISCONNECT_DEBOUNCE);
                } else {
                  // These error events should stop polling
                  stopDevicePollingError = event.error;

                  // clear all potential polling loops
                  if (loopT) {
                    clearTimeout(loopT);
                    loopT = null;
                  }

                  // send in the event for the UI immediately
                  subscriber.next(event);
                }
              } else if (event.type === "unresponsiveDevice") {
                return; // ignore unresponsive case which happens for polling
              } else {
                if (device !== pollingOnDevice) {
                  // ...but any time an event comes back, it means our device was responding and need to be set back on in polling context
                  device = pollingOnDevice;
                }

                subscriber.next(event);
              }
            },
            complete: () => {
              // start a new polling if available
              if (!stopDevicePollingError) loopT = setTimeout(loop, POLLING);
            },
            error: (err) => {
              if (pollingOnDevice && err instanceof TimeoutError) {
                const productName = getDeviceModel(pollingOnDevice.modelId).productName;

                if (err instanceof TimeoutError) {
                  return of({
                    type: "error",
                    error: new LanguageInstallTimeout(undefined, {
                      productName,
                    }) as Error,
                  });
                }
              }

              subscriber.error(err);
            },
          });
      }

      // delay a bit the first loop run in order to be async and wait pollingOnDevice
      loopT = setTimeout(loop, 0);
      return () => {
        if (initT) clearTimeout(initT);
        if (disconnectT) clearTimeout(disconnectT);
        if (installSub) installSub.unsubscribe();
        sub.unsubscribe();
        clearTimeout(loopT);
      };
    }).pipe(distinctUntilChanged(isEqual)),
};

export const createAction = (installLanguage: typeof installLanguageExec): InstallLanguageAction => {
  const useHook = (device: Device | null | undefined, language: Language): State => {
    // repair modal will interrupt everything and be rendered instead of the background content

    const [state, setState] = useState(() => getInitialState());
    const [resetIndex, setResetIndex] = useState(0);
    const deviceSubject = useReplaySubject(device);

    useEffect(() => {
      const impl = implementations[currentMode]({
        deviceSubject,
        installLanguage,
        language,
      });
      // TODO, continue here, implementations should probably map the events the reducer type of event
      // according to errors and stuff and device disconnected yatta yatta

      const sub = impl
        .pipe(
          // debounce a bit the connect/disconnect event that we don't need
          tap((e: Event) => log("actions-install-language-event", e.type, e)), // tap(e => console.log("connectManager event", e)),
          // we gather all events with a reducer into the UI state
          scan(reducer, getInitialState()), // tap(s => console.log("connectManager state", s)),
          // we debounce the UI state to not blink on the UI
          debounce(() => interval(1500))
        ) // the state simply goes into a React state
        .subscribe(setState);
      return () => {
        sub.unsubscribe();
      };
    }, [deviceSubject, resetIndex, language]);

    // TODO: do we need a retry function??
    // const onRetry = useCallback(() => {
    //   setResetIndex((currIndex) => currIndex + 1);
    //   setState((s) => getInitialState());
    // }, []);
    // onRetry

    return state;
  };

  return {
    useHook,
    mapResult: (_) => undefined,
  };
};
