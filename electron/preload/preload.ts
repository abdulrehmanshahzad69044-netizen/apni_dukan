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
  company: {
    list: (query) => ipcRenderer.invoke("company:list", query ?? {}),
    count: (query) => ipcRenderer.invoke("company:count", query ?? {}),
    get: (id) => ipcRenderer.invoke("company:get", id),
    create: (input) => ipcRenderer.invoke("company:create", input),
    update: (input) => ipcRenderer.invoke("company:update", input),
    delete: (id) => ipcRenderer.invoke("company:delete", id),
    restore: (id) => ipcRenderer.invoke("company:restore", id),
  },
  category: {
    list: (query) => ipcRenderer.invoke("category:list", query ?? {}),
    count: (query) => ipcRenderer.invoke("category:count", query ?? {}),
    get: (id) => ipcRenderer.invoke("category:get", id),
    create: (input) => ipcRenderer.invoke("category:create", input),
    update: (input) => ipcRenderer.invoke("category:update", input),
    delete: (id) => ipcRenderer.invoke("category:delete", id),
    restore: (id) => ipcRenderer.invoke("category:restore", id),
  },
};

contextBridge.exposeInMainWorld("api", api);