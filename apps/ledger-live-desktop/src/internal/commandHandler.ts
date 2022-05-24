import { serializeError } from "@ledgerhq/errors";
import { commandsById, Commands } from "./commands";
import logger from "../logger";

const subscriptions: any = {};

export function executeCommand(command: { requestId: any, data: any, id: keyof Commands}, send: any) {
  const { data, requestId, id } = command;
  const cmd = commandsById[id];
  if (!cmd) {
    logger.warn(`command ${id} not found`);
    return;
  }
  const startTime = Date.now();
  logger.onCmd("cmd.START", id, 0, data);
  try {
    subscriptions[requestId] = cmd(data).subscribe({
      next: data => {
        logger.onCmd("cmd.NEXT", id, Date.now() - startTime, data);
        send({ type: "cmd.NEXT", requestId, data });
      },
      complete: () => {
        delete subscriptions[requestId];
        logger.onCmd("cmd.COMPLETE", id, Date.now() - startTime);
        send({ type: "cmd.COMPLETE", requestId });
      },
      error: (error: Error) => {
        logger.warn("Command error:", { error });
        delete subscriptions[requestId];
        logger.onCmd("cmd.ERROR", id, Date.now() - startTime, error);
        send({ type: "cmd.ERROR", requestId, data: serializeError(error) });
      },
    });
  } catch (error: any) {
    logger.warn("Command impl error:", { error });
    delete subscriptions[requestId];
    logger.onCmd("cmd.ERROR", id, Date.now() - startTime, error);
    send({ type: "cmd.ERROR", requestId, data: serializeError(error) });
  }
}

export function unsubscribeCommand(requestId: string) {
  const sub = subscriptions[requestId];
  if (sub) {
    sub.unsubscribe();
    delete subscriptions[requestId];
  }
}

export function unsubscribeAllCommands() {
  for (const k in subscriptions) {
    logger.debug("unsubscribeAllCommands: unsubscribe " + k);
    const sub = subscriptions[k];
    sub.unsubscribe();
    delete subscriptions[k];
  }
}
