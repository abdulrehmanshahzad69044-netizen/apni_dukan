import { ipcMain } from "electron";
import { udhaarService } from "../services/udhaar.service";
import {
  createUdhaarSchema,
  udhaarListQuerySchema,
} from "../shared/types/udhaar";

export function registerUdhaarIpc() {
  ipcMain.handle("udhaar:list", async (_e, rawQuery: unknown) => {
    const query = udhaarListQuerySchema.parse(rawQuery ?? {});
    return udhaarService.list(query);
  });

  ipcMain.handle("udhaar:get", async (_e, id: number) => {
    return udhaarService.getById(id);
  });

  ipcMain.handle("udhaar:create", async (_e, rawInput: unknown) => {
    const input = createUdhaarSchema.parse(rawInput);
    return udhaarService.create(input);
  });

  ipcMain.handle("udhaar:delete", async (_e, id: number) => {
    await udhaarService.remove(id);
    return { ok: true };
  });
}