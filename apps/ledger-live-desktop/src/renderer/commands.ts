import { ipcRenderer } from "electron";
import type { Commands, CommandFn } from "~/internal/commands";
import { v4 as uuidv4 } from "uuid";
import { Observable } from "rxjs";
import logger from "~/logger";
import { deserializeError } from "@ledgerhq/errors";

// Implements command message of (Renderer proc -> Main proc)
type Msg<A> = {
  type: "cmd.NEXT" | "cmd.COMPLETE" | "cmd.ERROR",
  requestId: string,
  data?: A,
};

export function command<Id extends keyof Commands>(id: Id): CommandFn<Id> {
  return (<A>(data: A) =>
    new Observable(subscriber => {
      const requestId: string = uuidv4();
      const startTime = Date.now();

      const unsubscribe = () => {
        ipcRenderer.send("command-unsubscribe", { requestId });
        ipcRenderer.removeListener("command-event", handleCommandEvent);
      };

      function handleCommandEvent(_: any, msg: Msg<A>) {
        if (requestId !== msg.requestId) return;
        logger.onCmd(msg.type, id, Date.now() - startTime, msg.data);
        switch (msg.type) {
          case "cmd.NEXT":
            if (msg.data) {
              subscriber.next(msg.data);
            }
            break;

          case "cmd.COMPLETE":
            subscriber.complete();
            ipcRenderer.removeListener("command-event", handleCommandEvent);
            break;

          case "cmd.ERROR": {
            const error = deserializeError(msg.data);
            subscriber.error(error);
            ipcRenderer.removeListener("command-event", handleCommandEvent);
            break;
          }

          default:
        }
      }

      ipcRenderer.on("command-event", handleCommandEvent);

      ipcRenderer.send("command", { id, data, requestId });

      logger.onCmd("cmd.START", id, 0, data);

      return unsubscribe;
    })) as CommandFn<Id>;
}
