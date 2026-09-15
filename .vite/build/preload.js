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
  },
  product: {
    list: (query) => electron.ipcRenderer.invoke("product:list", query ?? {}),
    count: (query) => electron.ipcRenderer.invoke("product:count", query ?? {}),
    get: (id) => electron.ipcRenderer.invoke("product:get", id),
    create: (input) => electron.ipcRenderer.invoke("product:create", input),
    update: (input) => electron.ipcRenderer.invoke("product:update", input),
    delete: (id) => electron.ipcRenderer.invoke("product:delete", id),
    restore: (id) => electron.ipcRenderer.invoke("product:restore", id)
  },
  variant: {
    list: (query) => electron.ipcRenderer.invoke("variant:list", query ?? {}),
    count: (query) => electron.ipcRenderer.invoke("variant:count", query ?? {}),
    get: (id) => electron.ipcRenderer.invoke("variant:get", id),
    create: (input) => electron.ipcRenderer.invoke("variant:create", input),
    update: (input) => electron.ipcRenderer.invoke("variant:update", input),
    delete: (id) => electron.ipcRenderer.invoke("variant:delete", id),
    restore: (id) => electron.ipcRenderer.invoke("variant:restore", id)
  },
  purchase: {
    list: (query) => electron.ipcRenderer.invoke("purchase:list", query ?? {}),
    count: (query) => electron.ipcRenderer.invoke("purchase:count", query ?? {}),
    get: (id) => electron.ipcRenderer.invoke("purchase:get", id),
    getBatches: (purchaseId) => electron.ipcRenderer.invoke("purchase:getBatches", purchaseId),
    create: (input) => electron.ipcRenderer.invoke("purchase:create", input),
    setPaidAmount: (input) => electron.ipcRenderer.invoke("purchase:setPaidAmount", input)
  },
  inventory: {
    listStock: (query) => electron.ipcRenderer.invoke("inventory:listStock", query ?? {}),
    totals: () => electron.ipcRenderer.invoke("inventory:totals"),
    priceHistory: (query) => electron.ipcRenderer.invoke("inventory:priceHistory", query)
  },
  adjustment: {
    list: (query) => electron.ipcRenderer.invoke("adjustment:list", query ?? {}),
    get: (id) => electron.ipcRenderer.invoke("adjustment:get", id),
    create: (input) => electron.ipcRenderer.invoke("adjustment:create", input)
  }
};
electron.contextBridge.exposeInMainWorld("api", api);
