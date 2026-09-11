import { contextBridge, ipcRenderer } from "electron";
import type { AppApi } from "../shared/types/ipc";

/**
 * Preload script runs in an isolated context with access to both
 * Node APIs and the renderer's window object.
 *
 * We expose a narrow, typed `window.api` — never raw ipcRenderer.
 */

const api: AppApi = {
  app: {
    ping: (message) => ipcRenderer.invoke("app:ping", { message }),
    version: () => ipcRenderer.invoke("app:version"),
  },
};

contextBridge.exposeInMainWorld("api", api);