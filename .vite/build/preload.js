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
    restore: (id) => electron.ipcRenderer.invoke("variant:restore", id),
    setPinned: (payload) => electron.ipcRenderer.invoke("variant:setPinned", payload)
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
  },
  bill: {
    list: (query) => electron.ipcRenderer.invoke("bill:list", query ?? {}),
    count: (query) => electron.ipcRenderer.invoke("bill:count", query ?? {}),
    get: (id) => electron.ipcRenderer.invoke("bill:get", id),
    create: (input) => electron.ipcRenderer.invoke("bill:create", input),
    finalize: (id) => electron.ipcRenderer.invoke("bill:finalize", id),
    deleteDraft: (id) => electron.ipcRenderer.invoke("bill:deleteDraft", id),
    previewFifoCost: (input) => electron.ipcRenderer.invoke("bill:previewFifoCost", input)
  },
  payment: {
    list: (query) => electron.ipcRenderer.invoke("payment:list", query ?? {}),
    count: (query) => electron.ipcRenderer.invoke("payment:count", query ?? {}),
    get: (id) => electron.ipcRenderer.invoke("payment:get", id),
    create: (input) => electron.ipcRenderer.invoke("payment:create", input)
  },
  khaata: {
    list: (query) => electron.ipcRenderer.invoke("khaata:list", query ?? {}),
    detail: (customerId) => electron.ipcRenderer.invoke("khaata:detail", customerId),
    totalOutstanding: () => electron.ipcRenderer.invoke("khaata:totalOutstanding")
  },
  expense: {
    list: (query) => electron.ipcRenderer.invoke("expense:list", query ?? {}),
    count: (query) => electron.ipcRenderer.invoke("expense:count", query ?? {}),
    get: (id) => electron.ipcRenderer.invoke("expense:get", id),
    create: (input) => electron.ipcRenderer.invoke("expense:create", input),
    update: (input) => electron.ipcRenderer.invoke("expense:update", input),
    delete: (id) => electron.ipcRenderer.invoke("expense:delete", id)
  },
  companyPayment: {
    list: (query) => electron.ipcRenderer.invoke("companyPayment:list", query ?? {}),
    get: (id) => electron.ipcRenderer.invoke("companyPayment:get", id),
    getAllocations: (id) => electron.ipcRenderer.invoke("companyPayment:getAllocations", id),
    create: (input) => electron.ipcRenderer.invoke("companyPayment:create", input),
    delete: (id) => electron.ipcRenderer.invoke("companyPayment:delete", id),
    totalOutstanding: () => electron.ipcRenderer.invoke("companyPayment:totalOutstanding")
  },
  report: {
    full: (query) => electron.ipcRenderer.invoke("report:full", query ?? {}),
    today: () => electron.ipcRenderer.invoke("report:today")
  },
  print: {
    html: (req) => electron.ipcRenderer.invoke("print:html", req),
    pdf: (req) => electron.ipcRenderer.invoke("print:pdf", req)
  },
  backup: {
    createLocal: (input) => electron.ipcRenderer.invoke("backup:createLocal", input ?? {}),
    saveAsDialog: () => electron.ipcRenderer.invoke("backup:saveAsDialog"),
    pickFile: () => electron.ipcRenderer.invoke("backup:pickFile"),
    listLocal: () => electron.ipcRenderer.invoke("backup:listLocal"),
    restore: (input) => electron.ipcRenderer.invoke("backup:restore", input),
    deleteLocal: (filePath) => electron.ipcRenderer.invoke("backup:deleteLocal", filePath),
    restart: () => electron.ipcRenderer.invoke("backup:restart")
  },
  gdrive: {
    status: () => electron.ipcRenderer.invoke("gdrive:status"),
    configure: (input) => electron.ipcRenderer.invoke("gdrive:configure", input),
    connect: () => electron.ipcRenderer.invoke("gdrive:connect"),
    disconnect: () => electron.ipcRenderer.invoke("gdrive:disconnect"),
    upload: (input) => electron.ipcRenderer.invoke("gdrive:upload", input ?? {}),
    list: () => electron.ipcRenderer.invoke("gdrive:list"),
    restore: (input) => electron.ipcRenderer.invoke("gdrive:restore", input)
  },
  settings: {
    get: () => electron.ipcRenderer.invoke("settings:get"),
    update: (input) => electron.ipcRenderer.invoke("settings:update", input)
  },
  udhaar: {
    list: (query) => electron.ipcRenderer.invoke("udhaar:list", query ?? {}),
    get: (id) => electron.ipcRenderer.invoke("udhaar:get", id),
    create: (input) => electron.ipcRenderer.invoke("udhaar:create", input),
    delete: (id) => electron.ipcRenderer.invoke("udhaar:delete", id)
  },
  openingStock: {
    list: () => electron.ipcRenderer.invoke("openingStock:list"),
    create: (input) => electron.ipcRenderer.invoke("openingStock:create", input),
    delete: (batchId) => electron.ipcRenderer.invoke("openingStock:delete", batchId)
  }
};
electron.contextBridge.exposeInMainWorld("api", api);
