import { ipcMain } from "electron";
import { customerService } from "../services/customer.service";
import {
  createCustomerSchema,
  customerListQuerySchema,
  updateCustomerSchema,
} from "../shared/types/customer";

export function registerCustomerIpc() {
  ipcMain.handle("customer:list", async (_e, rawQuery: unknown) => {
    const query = customerListQuerySchema.parse(rawQuery ?? {});
    return customerService.list(query);
  });

  ipcMain.handle("customer:count", async (_e, rawQuery: unknown) => {
    const query = customerListQuerySchema
      .pick({ search: true, includeDeleted: true })
      .parse(rawQuery ?? {});
    return customerService.count(query);
  });

  ipcMain.handle("customer:get", async (_e, id: number) => {
    return customerService.getById(id);
  });

  ipcMain.handle("customer:create", async (_e, rawInput: unknown) => {
    const input = createCustomerSchema.parse(rawInput);
    return customerService.create(input);
  });

  ipcMain.handle("customer:update", async (_e, rawInput: unknown) => {
    const input = updateCustomerSchema.parse(rawInput);
    return customerService.update(input);
  });

  ipcMain.handle("customer:delete", async (_e, id: number) => {
    await customerService.softDelete(id);
    return { ok: true };
  });

  ipcMain.handle("customer:restore", async (_e, id: number) => {
    await customerService.restore(id);
    return { ok: true };
  });
}