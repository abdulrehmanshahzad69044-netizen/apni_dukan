"use strict";
const electron = require("electron");
const api = {
  app: {
    ping: (message) => electron.ipcRenderer.invoke("app:ping", { message }),
    version: () => electron.ipcRenderer.invoke("app:version")
  },
  customer: {
    list: (query) => electron.ipcRenderer.invoke("customer:list", query ?? {}),
    count: (query) => electron.ipcRenderer.invoke("customer:count", query ?? {}),
    get: (id) => electron.ipcRenderer.invoke("customer:get", id),
    create: (input) => electron.ipcRenderer.invoke("customer:create", input),
    update: (input) => electron.ipcRenderer.invoke("customer:update", input),
    delete: (id) => electron.ipcRenderer.invoke("customer:delete", id),
    restore: (id) => electron.ipcRenderer.invoke("customer:restore", id)
  }
};
electron.contextBridge.exposeInMainWorld("api", api);
