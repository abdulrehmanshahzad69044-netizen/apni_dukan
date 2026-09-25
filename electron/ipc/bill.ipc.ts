import { ipcMain } from "electron";
import { billService } from "../services/bill.service";
import { billListQuerySchema, createBillSchema, fifoCostPreviewSchema } from "../shared/types/bill";

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

  ipcMain.handle("bill:finalize", async (_e, id: number) => {
    return billService.finalize(id);
  });

  ipcMain.handle("bill:deleteDraft", async (_e, id: number) => {
    await billService.deleteDraft(id);
    return { ok: true };
  });

  ipcMain.handle("bill:previewFifoCost", async (_e, rawInput: unknown) => {
    const input = fifoCostPreviewSchema.parse(rawInput);
    return billService.previewFifoCost(input);
  });

    ipcMain.handle("bill:getForDuplicate", async (_e, id: number) => {
    const detail = await billService.getById(id);
    if (!detail) return null;
    return {
      customerId: detail.customerId,
      remarks: detail.remarks ?? "",
      lines: detail.items.map((it) => ({
        variantId: it.variantId,
        productName: it.productName,
        variantName: it.variantName,
        baseUnitShortName: it.baseUnitShortName,
        purchaseUnitShortName: it.purchaseUnitShortName,
        purchaseUnitFactor: it.purchaseUnitFactor,
        unitId: it.unitId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
    };
  });
}