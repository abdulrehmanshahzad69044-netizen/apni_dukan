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
  },
  company: {
    list: (query) => electron.ipcRenderer.invoke("company:list", query ?? {}),
    count: (query) => electron.ipcRenderer.invoke("company:count", query ?? {}),
    get: (id) => electron.ipcRenderer.invoke("company:get", id),
    create: (input) => electron.ipcRenderer.invoke("company:create", input),
    update: (input) => electron.ipcRenderer.invoke("company:update", input),
    delete: (id) => electron.ipcRenderer.invoke("company:delete", id),
    restore: (id) => electron.ipcRenderer.invoke("company:restore", id)
  },
  category: {
    list: (query) => electron.ipcRenderer.invoke("category:list", query ?? {}),
    count: (query) => electron.ipcRenderer.invoke("category:count", query ?? {}),
    get: (id) => electron.ipcRenderer.invoke("category:get", id),
    create: (input) => electron.ipcRenderer.invoke("category:create", input),
    update: (input) => electron.ipcRenderer.invoke("category:update", input),
    delete: (id) => electron.ipcRenderer.invoke("category:delete", id),
    restore: (id) => electron.ipcRenderer.invoke("category:restore", id)
  },
  unit: {
    list: (query) => electron.ipcRenderer.invoke("unit:list", query ?? {}),
    count: (query) => electron.ipcRenderer.invoke("unit:count", query ?? {}),
    get: (id) => electron.ipcRenderer.invoke("unit:get", id),
    create: (input) => electron.ipcRenderer.invoke("unit:create", input),
    update: (input) => electron.ipcRenderer.invoke("unit:update", input),
    delete: (id) => electron.ipcRenderer.invoke("unit:delete", id),
    restore: (id) => electron.ipcRenderer.invoke("unit:restore", id)
  },
  unitConversion: {
    list: (filter) => electron.ipcRenderer.invoke("unitConversion:list", filter),
    create: (input) => electron.ipcRenderer.invoke("unitConversion:create", input),
    update: (input) => electron.ipcRenderer.invoke("unitConversion:update", input),
    delete: (id) => electron.ipcRenderer.invoke("unitConversion:delete", id)
  }
};
electron.contextBridge.exposeInMainWorld("api", api);
