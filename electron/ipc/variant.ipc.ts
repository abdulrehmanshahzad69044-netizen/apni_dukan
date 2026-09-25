import { ipcMain } from "electron";
import { z } from "zod";
import { variantService } from "../services/variant.service";
import {
  createQuickItemSchema,
  createVariantSchema,
  updateVariantSchema,
  variantListQuerySchema,
} from "../shared/types/variant";

const bulkPriceSchema = z.object({
  updates: z.array(
    z.object({
      variantId: z.number().int().positive(),
      retailPrice: z.number().int().nonnegative().nullable(),
      wholesalePrice: z.number().int().nonnegative().nullable(),
    })
  ),
});

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

  ipcMain.handle("variant:createQuick", async (_e, rawInput: unknown) => {
    const input = createQuickItemSchema.parse(rawInput);
    return variantService.createQuick(input);
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

  ipcMain.handle(
    "variant:setPinned",
    async (_e, payload: { id: number; pinned: boolean }) => {
      return variantService.setPinned(payload.id, payload.pinned);
    }
  );

  ipcMain.handle(
    "variant:setPriceVolatile",
    async (_e, payload: { id: number; priceVolatile: boolean }) => {
      return variantService.setPriceVolatile(payload.id, payload.priceVolatile);
    }
  );

  ipcMain.handle("variant:promoteFromQuick", async (_e, id: number) => {
    return variantService.promoteFromQuick(id);
  });

  ipcMain.handle("variant:listVolatile", async () => {
    return variantService.listVolatile();
  });

  ipcMain.handle("variant:bulkUpdatePrices", async (_e, rawInput: unknown) => {
    const input = bulkPriceSchema.parse(rawInput);
    return variantService.bulkUpdatePrices(input.updates);
  });
}