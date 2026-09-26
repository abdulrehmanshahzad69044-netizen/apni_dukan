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
  product: {
    list: (query) => ipcRenderer.invoke("product:list", query ?? {}),
    count: (query) => ipcRenderer.invoke("product:count", query ?? {}),
    get: (id) => ipcRenderer.invoke("product:get", id),
    create: (input) => ipcRenderer.invoke("product:create", input),
    createFull: (input) => ipcRenderer.invoke("product:createFull", input),
    update: (input) => ipcRenderer.invoke("product:update", input),
    delete: (id) => ipcRenderer.invoke("product:delete", id),
    restore: (id) => ipcRenderer.invoke("product:restore", id),
  },
  variant: {
    list: (query) => ipcRenderer.invoke("variant:list", query ?? {}),
    count: (query) => ipcRenderer.invoke("variant:count", query ?? {}),
    get: (id) => ipcRenderer.invoke("variant:get", id),
    create: (input) => ipcRenderer.invoke("variant:create", input),
    createQuick: (input) => ipcRenderer.invoke("variant:createQuick", input),
    update: (input) => ipcRenderer.invoke("variant:update", input),
    delete: (id) => ipcRenderer.invoke("variant:delete", id),
    restore: (id) => ipcRenderer.invoke("variant:restore", id),
    setPinned: (payload) =>
      ipcRenderer.invoke("variant:setPinned", payload),
    setPriceVolatile: (payload) =>
      ipcRenderer.invoke("variant:setPriceVolatile", payload),
    promoteFromQuick: (id) =>
      ipcRenderer.invoke("variant:promoteFromQuick", id),
    listVolatile: () => ipcRenderer.invoke("variant:listVolatile"),
    bulkUpdatePrices: (payload) =>
      ipcRenderer.invoke("variant:bulkUpdatePrices", payload),
  },
  purchase: {
    list: (query) => ipcRenderer.invoke("purchase:list", query ?? {}),
    count: (query) => ipcRenderer.invoke("purchase:count", query ?? {}),
    get: (id) => ipcRenderer.invoke("purchase:get", id),
    getBatches: (purchaseId) =>
      ipcRenderer.invoke("purchase:getBatches", purchaseId),
    create: (input) => ipcRenderer.invoke("purchase:create", input),
    setPaidAmount: (input) =>
      ipcRenderer.invoke("purchase:setPaidAmount", input),
  },
  inventory: {
    listStock: (query) => ipcRenderer.invoke("inventory:listStock", query ?? {}),
    totals: () => ipcRenderer.invoke("inventory:totals"),
    priceHistory: (query) =>
      ipcRenderer.invoke("inventory:priceHistory", query),
  },
  adjustment: {
    list: (query) => ipcRenderer.invoke("adjustment:list", query ?? {}),
    get: (id) => ipcRenderer.invoke("adjustment:get", id),
    create: (input) => ipcRenderer.invoke("adjustment:create", input),
  },
  bill: {
    list: (query) => ipcRenderer.invoke("bill:list", query ?? {}),
    count: (query) => ipcRenderer.invoke("bill:count", query ?? {}),
    get: (id) => ipcRenderer.invoke("bill:get", id),
    create: (input) => ipcRenderer.invoke("bill:create", input),
    finalize: (id) => ipcRenderer.invoke("bill:finalize", id),
    deleteDraft: (id) => ipcRenderer.invoke("bill:deleteDraft", id),
    previewFifoCost: (input) =>
      ipcRenderer.invoke("bill:previewFifoCost", input),
    getForEdit: (id) => ipcRenderer.invoke("bill:getForEdit", id),
    updateAndSave: (input) =>
      ipcRenderer.invoke("bill:updateAndSave", input),
    getForDuplicate: (id) =>
      ipcRenderer.invoke("bill:getForDuplicate", id),
  },
  payment: {
    list: (query) => ipcRenderer.invoke("payment:list", query ?? {}),
    count: (query) => ipcRenderer.invoke("payment:count", query ?? {}),
    get: (id) => ipcRenderer.invoke("payment:get", id),
    create: (input) => ipcRenderer.invoke("payment:create", input),
  },
  khaata: {
    list: (query) => ipcRenderer.invoke("khaata:list", query ?? {}),
    detail: (customerId) => ipcRenderer.invoke("khaata:detail", customerId),
    totalOutstanding: () => ipcRenderer.invoke("khaata:totalOutstanding"),
  },
  expense: {
    list: (query) => ipcRenderer.invoke("expense:list", query ?? {}),
    count: (query) => ipcRenderer.invoke("expense:count", query ?? {}),
    get: (id) => ipcRenderer.invoke("expense:get", id),
    create: (input) => ipcRenderer.invoke("expense:create", input),
    update: (input) => ipcRenderer.invoke("expense:update", input),
    delete: (id) => ipcRenderer.invoke("expense:delete", id),
  },
  companyPayment: {
    list: (query) => ipcRenderer.invoke("companyPayment:list", query ?? {}),
    get: (id) => ipcRenderer.invoke("companyPayment:get", id),
    getAllocations: (id) =>
      ipcRenderer.invoke("companyPayment:getAllocations", id),
    create: (input) => ipcRenderer.invoke("companyPayment:create", input),
    delete: (id) => ipcRenderer.invoke("companyPayment:delete", id),
    totalOutstanding: () =>
      ipcRenderer.invoke("companyPayment:totalOutstanding"),
  },
  report: {
    full: (query) => ipcRenderer.invoke("report:full", query ?? {}),
    today: () => ipcRenderer.invoke("report:today"),
  },
  print: {
    html: (req) => ipcRenderer.invoke("print:html", req),
    pdf: (req) => ipcRenderer.invoke("print:pdf", req),
  },
  backup: {
    createLocal: (input) => ipcRenderer.invoke("backup:createLocal", input ?? {}),
    saveAsDialog: () => ipcRenderer.invoke("backup:saveAsDialog"),
    pickFile: () => ipcRenderer.invoke("backup:pickFile"),
    listLocal: () => ipcRenderer.invoke("backup:listLocal"),
    restore: (input) => ipcRenderer.invoke("backup:restore", input),
    deleteLocal: (filePath) => ipcRenderer.invoke("backup:deleteLocal", filePath),
    restart: () => ipcRenderer.invoke("backup:restart"),
  },
  gdrive: {
    status: () => ipcRenderer.invoke("gdrive:status"),
    configure: (input) => ipcRenderer.invoke("gdrive:configure", input),
    connect: () => ipcRenderer.invoke("gdrive:connect"),
    disconnect: () => ipcRenderer.invoke("gdrive:disconnect"),
    upload: (input) => ipcRenderer.invoke("gdrive:upload", input ?? {}),
    list: () => ipcRenderer.invoke("gdrive:list"),
    restore: (input) => ipcRenderer.invoke("gdrive:restore", input),
  },
  settings: {
    get: () => ipcRenderer.invoke("settings:get"),
    update: (input) => ipcRenderer.invoke("settings:update", input),
  },
  udhaar: {
    list: (query) => ipcRenderer.invoke("udhaar:list", query ?? {}),
    get: (id) => ipcRenderer.invoke("udhaar:get", id),
    create: (input) => ipcRenderer.invoke("udhaar:create", input),
    delete: (id) => ipcRenderer.invoke("udhaar:delete", id),
  },
  openingStock: {
    list: () => ipcRenderer.invoke("openingStock:list"),
    create: (input) => ipcRenderer.invoke("openingStock:create", input),
    delete: (batchId) => ipcRenderer.invoke("openingStock:delete", batchId),
  },
};

contextBridge.exposeInMainWorld("api", api);