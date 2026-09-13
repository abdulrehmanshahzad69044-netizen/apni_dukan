import { ipcMain } from "electron";
import { purchaseService } from "../services/purchase.service";
import {
  createPurchaseSchema,
  purchaseListQuerySchema,
} from "../shared/types/purchase";

export function registerPurchaseIpc() {
  ipcMain.handle("purchase:list", async (_e, rawQuery: unknown) => {
    const query = purchaseListQuerySchema.parse(rawQuery ?? {});
    return purchaseService.list(query);
  });

  ipcMain.handle("purchase:count", async (_e, rawQuery: unknown) => {
    const query = purchaseListQuerySchema
      .pick({ companyId: true, fromDate: true, toDate: true })
      .parse(rawQuery ?? {});
    return purchaseService.count(query);
  });

  ipcMain.handle("purchase:get", async (_e, id: number) => {
    return purchaseService.getById(id);
  });

  ipcMain.handle("purchase:getBatches", async (_e, purchaseId: number) => {
    return purchaseService.getBatches(purchaseId);
  });

  ipcMain.handle("purchase:create", async (_e, rawInput: unknown) => {
    const input = createPurchaseSchema.parse(rawInput);
    return purchaseService.create(input);
  });
}