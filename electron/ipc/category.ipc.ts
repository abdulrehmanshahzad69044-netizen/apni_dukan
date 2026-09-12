import { ipcMain } from "electron";
import { categoryService } from "../services/category.service";
import {
  categoryListQuerySchema,
  createCategorySchema,
  updateCategorySchema,
} from "../shared/types/category";

export function registerCategoryIpc() {
  ipcMain.handle("category:list", async (_e, rawQuery: unknown) => {
    const query = categoryListQuerySchema.parse(rawQuery ?? {});
    return categoryService.list(query);
  });

  ipcMain.handle("category:count", async (_e, rawQuery: unknown) => {
    const query = categoryListQuerySchema
      .pick({ search: true, includeDeleted: true })
      .parse(rawQuery ?? {});
    return categoryService.count(query);
  });

  ipcMain.handle("category:get", async (_e, id: number) => {
    return categoryService.getById(id);
  });

  ipcMain.handle("category:create", async (_e, rawInput: unknown) => {
    const input = createCategorySchema.parse(rawInput);
    return categoryService.create(input);
  });

  ipcMain.handle("category:update", async (_e, rawInput: unknown) => {
    const input = updateCategorySchema.parse(rawInput);
    return categoryService.update(input);
  });

  ipcMain.handle("category:delete", async (_e, id: number) => {
    await categoryService.softDelete(id);
    return { ok: true };
  });

  ipcMain.handle("category:restore", async (_e, id: number) => {
    await categoryService.restore(id);
    return { ok: true };
  });
}