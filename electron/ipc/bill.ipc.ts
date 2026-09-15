import { ipcMain } from "electron";
import { billService } from "../services/bill.service";
import {
  billListQuerySchema,
  createBillSchema,
} from "../shared/types/bill";

export function registerBillIpc() {
  ipcMain.handle("bill:list", async (_e, rawQuery: unknown) => {
    const query = billListQuerySchema.parse(rawQuery ?? {});
    return billService.list(query);
  });

  ipcMain.handle("bill:count", async (_e, rawQuery: unknown) => {
    const query = billListQuerySchema
      .pick({ customerId: true, status: true, fromDate: true, toDate: true })
      .parse(rawQuery ?? {});
    return billService.count(query);
  });

  ipcMain.handle("bill:get", async (_e, id: number) => {
    return billService.getById(id);
  });

  ipcMain.handle("bill:create", async (_e, rawInput: unknown) => {
    const input = createBillSchema.parse(rawInput);
    return billService.create(input);
  });
}