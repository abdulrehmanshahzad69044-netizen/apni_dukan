import { app, BrowserWindow, dialog } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { runMigrations } from "../database/migrate";
import { closeDb } from "../database/client";
import { registerAllIpc } from "../ipc";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.once("ready-to-show", () => win.show());

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    win.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }
}

app.whenReady().then(() => {
  // ─── Migrations ───
  // If a migration fails, we must not open the window — the DB is in an
  // unknown state and the app would crash on first query.
  try {
    runMigrations();
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown migration error";

    dialog.showErrorBox(
      "Database Update Failed",
      [
        "Apni Dukan could not update the database to the latest version.",
        "",
        "Your data has NOT been lost. A safety backup of your database was",
        "created before the update was attempted.",
        "",
        "Please contact support and share the error below:",
        "",
        message,
      ].join("\n")
    );

    app.exit(1);
    return;
  }

  // ─── IPC ───
  registerAllIpc();

  // ─── Window ───
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  closeDb();
});