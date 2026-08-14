import { app, BrowserWindow } from "electron";
import path from "node:path";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,

    minWidth: 1200,
    minHeight: 700,

    autoHideMenuBar: true,

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),

      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(
        __dirname,
        `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`
      )
    );
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});