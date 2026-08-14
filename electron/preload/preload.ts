import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getAppVersion: (): string => {
    return "0.1.0";
  },
});