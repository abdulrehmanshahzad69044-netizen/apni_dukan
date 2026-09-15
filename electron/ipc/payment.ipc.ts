import { ipcMain } from "electron";
import { paymentService, khaataService } from "../services/payment.service";
import {
  createPaymentSchema,
  khaataListQuerySchema,
  paymentListQuerySchema,
} from "../shared/types/payment";

export function registerPaymentIpc() {
  // ---------- Payments ----------
  ipcMain.handle("payment:list", async (_e, rawQuery: unknown) => {
    const query = paymentListQuerySchema.parse(rawQuery ?? {});
    return paymentService.list(query);
  });

  ipcMain.handle("payment:count", async (_e, rawQuery: unknown) => {
    const query = paymentListQuerySchema
      .pick({ customerId: true, fromDate: true, toDate: true })
      .parse(rawQuery ?? {});
    return paymentService.count(query);
  });

  ipcMain.handle("payment:get", async (_e, id: number) => {
    return paymentService.getById(id);
  });

  ipcMain.handle("payment:create", async (_e, rawInput: unknown) => {
    const input = createPaymentSchema.parse(rawInput);
    return paymentService.create(input);
  });

  // ---------- Khaata ----------
  ipcMain.handle("khaata:list", async (_e, rawQuery: unknown) => {
    const query = khaataListQuerySchema.parse(rawQuery ?? {});
    return khaataService.list(query);
  });

  ipcMain.handle("khaata:detail", async (_e, customerId: number) => {
    return khaataService.detail(customerId);
  });

  ipcMain.handle("khaata:totalOutstanding", async () => {
    return khaataService.totalOutstanding();
  });
}