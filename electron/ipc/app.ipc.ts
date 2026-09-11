import { ipcMain, app } from "electron";
import type { IpcChannels } from "../shared/types/ipc";

/**
 * Registers all app-level IPC handlers.
 * Called once from main.ts after the app is ready.
 */
export function registerAppIpc() {
  ipcMain.handle(
    "app:ping",
    async (
      _event,
      payload: IpcChannels["app:ping"]["request"]
    ): Promise<IpcChannels["app:ping"]["response"]> => {
      return {
        reply: `pong: ${payload.message}`,
        timestamp: Date.now(),
      };
    }
  );

  ipcMain.handle(
    "app:version",
    async (): Promise<IpcChannels["app:version"]["response"]> => {
      return {
        app: app.getVersion(),
        electron: process.versions.electron,
        node: process.versions.node,
        chrome: process.versions.chrome,
      };
    }
  );
}