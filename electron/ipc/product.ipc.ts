import { ipcMain } from "electron";
import { productService } from "../services/product.service";
import {
  createProductSchema,
  productListQuerySchema,
  updateProductSchema,
  createFullProductSchema,
} from "../shared/types/product";

export function registerProductIpc() {
  ipcMain.handle("product:list", async (_e, rawQuery: unknown) => {
    const query = productListQuerySchema.parse(rawQuery ?? {});
    return productService.list(query);
  });

  ipcMain.handle("product:count", async (_e, rawQuery: unknown) => {
    const query = productListQuerySchema
      .pick({
        search: true,
        includeDeleted: true,
        categoryId: true,
        companyId: true,
      })
      .parse(rawQuery ?? {});
    return productService.count(query);
  });

  ipcMain.handle("product:get", async (_e, id: number) => {
    return productService.getById(id);
  });

  ipcMain.handle("product:create", async (_e, rawInput: unknown) => {
    const input = createProductSchema.parse(rawInput);
    return productService.create(input);
  });

  ipcMain.handle("product:update", async (_e, rawInput: unknown) => {
    const input = updateProductSchema.parse(rawInput);
    return productService.update(input);
  });
    ipcMain.handle("product:createFull", async (_e, rawInput: unknown) => {
    const input = createFullProductSchema.parse(rawInput);
    return productService.createFull(input);
  });

  ipcMain.handle("product:delete", async (_e, id: number) => {
    await productService.softDelete(id);
    return { ok: true };
  });

  ipcMain.handle("product:restore", async (_e, id: number) => {
    await productService.restore(id);
    return { ok: true };
  });
}