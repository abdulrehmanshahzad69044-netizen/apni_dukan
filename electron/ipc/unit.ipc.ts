import { ipcMain } from "electron";
import { unitService } from "../services/unit.service";
import {
  createUnitSchema,
  unitListQuerySchema,
  updateUnitSchema,
} from "../shared/types/unit";

export function registerUnitIpc() {
  ipcMain.handle("unit:list", async (_e, rawQuery: unknown) => {
    const query = unitListQuerySchema.parse(rawQuery ?? {});
    return unitService.list(query);
  });

  ipcMain.handle("unit:count", async (_e, rawQuery: unknown) => {
    const query = unitListQuerySchema
      .pick({ search: true, includeDeleted: true })
      .parse(rawQuery ?? {});
    return unitService.count(query);
  });

  ipcMain.handle("unit:get", async (_e, id: number) => {
    return unitService.getById(id);
  });

  ipcMain.handle("unit:create", async (_e, rawInput: unknown) => {
    const input = createUnitSchema.parse(rawInput);
    return unitService.create(input);
  });

  ipcMain.handle("unit:update", async (_e, rawInput: unknown) => {
    const input = updateUnitSchema.parse(rawInput);
    return unitService.update(input);
  });

  ipcMain.handle("unit:delete", async (_e, id: number) => {
    await unitService.softDelete(id);
    return { ok: true };
  });

  ipcMain.handle("unit:restore", async (_e, id: number) => {
    await unitService.restore(id);
    return { ok: true };
  });
}