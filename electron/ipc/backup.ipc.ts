import { ipcMain, app } from "electron";
import { backupService } from "../services/backup.service";
import { gdriveService } from "../services/gdrive.service";
import {
  gdriveConfigSchema,
  gdriveRestoreSchema,
  gdriveUploadSchema,
  localBackupSchema,
  restoreSchema,
} from "../shared/types/backup";

export function registerBackupIpc() {
  // ---------- Local ----------
  ipcMain.handle("backup:createLocal", async (_e, rawInput: unknown) => {
    const input = localBackupSchema.parse(rawInput ?? {});
    return backupService.createLocal(input);
  });

  ipcMain.handle("backup:saveAsDialog", async () => {
    return backupService.saveAsDialog();
  });

  ipcMain.handle("backup:pickFile", async () => {
    return backupService.pickBackupFile();
  });

  ipcMain.handle("backup:listLocal", async () => {
    return backupService.listLocal();
  });

  ipcMain.handle("backup:restore", async (_e, rawInput: unknown) => {
    const input = restoreSchema.parse(rawInput);
    return backupService.restore(input);
  });

  ipcMain.handle("backup:deleteLocal", async (_e, filePath: string) => {
    await backupService.deleteLocal(filePath);
    return { ok: true };
  });

  ipcMain.handle("backup:restart", async () => {
    app.relaunch();
    app.exit(0);
  });

  // ---------- Google Drive ----------
  ipcMain.handle("gdrive:status", async () => {
    return gdriveService.getStatus();
  });

  ipcMain.handle("gdrive:configure", async (_e, rawInput: unknown) => {
    const input = gdriveConfigSchema.parse(rawInput);
    return gdriveService.configure(input);
  });

  ipcMain.handle("gdrive:connect", async () => {
    return gdriveService.connect();
  });

  ipcMain.handle("gdrive:disconnect", async () => {
    return gdriveService.disconnect();
  });

  ipcMain.handle("gdrive:upload", async (_e, rawInput: unknown) => {
    const input = gdriveUploadSchema.parse(rawInput ?? {});
    return gdriveService.upload(input);
  });

  ipcMain.handle("gdrive:list", async () => {
    return gdriveService.list();
  });

  ipcMain.handle("gdrive:restore", async (_e, rawInput: unknown) => {
    const input = gdriveRestoreSchema.parse(rawInput);
    return gdriveService.restore(input);
  });
}