import { ipcMain } from "electron";
import { variantService } from "../services/variant.service";
import {
  createVariantSchema,
  updateVariantSchema,
  variantListQuerySchema,
} from "../shared/types/variant";

export function registerVariantIpc() {
  ipcMain.handle("variant:list", async (_e, rawQuery: unknown) => {
    const query = variantListQuerySchema.parse(rawQuery ?? {});
    return variantService.list(query);
  });

  ipcMain.handle("variant:count", async (_e, rawQuery: unknown) => {
    const query = variantListQuerySchema
      .pick({ search: true, includeDeleted: true, productId: true })
      .parse(rawQuery ?? {});
    return variantService.count(query);
  });

  ipcMain.handle("variant:get", async (_e, id: number) => {
    return variantService.getById(id);
  });

  ipcMain.handle("variant:create", async (_e, rawInput: unknown) => {
    const input = createVariantSchema.parse(rawInput);
    return variantService.create(input);
  });

  ipcMain.handle("variant:update", async (_e, rawInput: unknown) => {
    const input = updateVariantSchema.parse(rawInput);
    return variantService.update(input);
  });

  ipcMain.handle("variant:delete", async (_e, id: number) => {
    await variantService.softDelete(id);
    return { ok: true };
  });

  ipcMain.handle("variant:restore", async (_e, id: number) => {
    await variantService.restore(id);
    return { ok: true };
  });
}