"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  getAppVersion: () => {
    return "0.1.0";
  }
});
