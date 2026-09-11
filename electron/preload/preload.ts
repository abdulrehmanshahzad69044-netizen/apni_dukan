import { contextBridge, ipcRenderer } from "electron";
import type { AppApi } from "../shared/types/ipc";

const api: AppApi = {
  app: {
    ping: (message) => ipcRenderer.invoke("app:ping", { message }),
    version: () => ipcRenderer.invoke("app:version"),
  },
  customer: {
    list: (query) => ipcRenderer.invoke("customer:list", query ?? {}),
    count: (query) => ipcRenderer.invoke("customer:count", query ?? {}),
    get: (id) => ipcRenderer.invoke("customer:get", id),
    create: (input) => ipcRenderer.invoke("customer:create", input),
    update: (input) => ipcRenderer.invoke("customer:update", input),
    delete: (id) => ipcRenderer.invoke("customer:delete", id),
    restore: (id) => ipcRenderer.invoke("customer:restore", id),
  },
};

contextBridge.exposeInMainWorld("api", api);