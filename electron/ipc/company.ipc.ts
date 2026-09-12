import { ipcMain } from "electron";
import { companyService } from "../services/company.service";
import {
  companyListQuerySchema,
  createCompanySchema,
  updateCompanySchema,
} from "../shared/types/company";

export function registerCompanyIpc() {
  ipcMain.handle("company:list", async (_e, rawQuery: unknown) => {
    const query = companyListQuerySchema.parse(rawQuery ?? {});
    return companyService.list(query);
  });

  ipcMain.handle("company:count", async (_e, rawQuery: unknown) => {
    const query = companyListQuerySchema
      .pick({ search: true, includeDeleted: true })
      .parse(rawQuery ?? {});
    return companyService.count(query);
  });

  ipcMain.handle("company:get", async (_e, id: number) => {
    return companyService.getById(id);
  });

  ipcMain.handle("company:create", async (_e, rawInput: unknown) => {
    const input = createCompanySchema.parse(rawInput);
    return companyService.create(input);
  });

  ipcMain.handle("company:update", async (_e, rawInput: unknown) => {
    const input = updateCompanySchema.parse(rawInput);
    return companyService.update(input);
  });

  ipcMain.handle("company:delete", async (_e, id: number) => {
    await companyService.softDelete(id);
    return { ok: true };
  });

  ipcMain.handle("company:restore", async (_e, id: number) => {
    await companyService.restore(id);
    return { ok: true };
  });
}