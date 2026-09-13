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
  unit: {
    list: (query) => ipcRenderer.invoke("unit:list", query ?? {}),
    count: (query) => ipcRenderer.invoke("unit:count", query ?? {}),
    get: (id) => ipcRenderer.invoke("unit:get", id),
    create: (input) => ipcRenderer.invoke("unit:create", input),
    update: (input) => ipcRenderer.invoke("unit:update", input),
    delete: (id) => ipcRenderer.invoke("unit:delete", id),
    restore: (id) => ipcRenderer.invoke("unit:restore", id),
  },
  unitConversion: {
    list: (filter) => ipcRenderer.invoke("unitConversion:list", filter),
    create: (input) => ipcRenderer.invoke("unitConversion:create", input),
    update: (input) => ipcRenderer.invoke("unitConversion:update", input),
    delete: (id) => ipcRenderer.invoke("unitConversion:delete", id),
  },
  product: {
    list: (query) => ipcRenderer.invoke("product:list", query ?? {}),
    count: (query) => ipcRenderer.invoke("product:count", query ?? {}),
    get: (id) => ipcRenderer.invoke("product:get", id),
    create: (input) => ipcRenderer.invoke("product:create", input),
    update: (input) => ipcRenderer.invoke("product:update", input),
    delete: (id) => ipcRenderer.invoke("product:delete", id),
    restore: (id) => ipcRenderer.invoke("product:restore", id),
  },
  variant: {
    list: (query) => ipcRenderer.invoke("variant:list", query ?? {}),
    count: (query) => ipcRenderer.invoke("variant:count", query ?? {}),
    get: (id) => ipcRenderer.invoke("variant:get", id),
    create: (input) => ipcRenderer.invoke("variant:create", input),
    update: (input) => ipcRenderer.invoke("variant:update", input),
    delete: (id) => ipcRenderer.invoke("variant:delete", id),
    restore: (id) => ipcRenderer.invoke("variant:restore", id),
  },
};

contextBridge.exposeInMainWorld("api", api);