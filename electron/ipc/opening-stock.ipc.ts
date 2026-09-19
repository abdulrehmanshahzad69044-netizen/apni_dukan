import { ipcMain } from "electron";
import { openingStockService } from "../services/opening-stock.service";
import { createOpeningStockSchema } from "../shared/types/opening-stock";

export function registerOpeningStockIpc() {
  ipcMain.handle("openingStock:list", async () => {
    return openingStockService.list();
  });

  ipcMain.handle("openingStock:create", async (_e, rawInput: unknown) => {
    const input = createOpeningStockSchema.parse(rawInput);
    return openingStockService.create(input);
  });

  ipcMain.handle("openingStock:delete", async (_e, batchId: number) => {
    await openingStockService.remove(batchId);
    return { ok: true };
  });
}