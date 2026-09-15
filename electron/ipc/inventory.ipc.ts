import { ipcMain } from "electron";
import { inventoryService } from "../services/inventory.service";
import {
  priceHistoryQuerySchema,
  stockListQuerySchema,
} from "../shared/types/inventory";

export function registerInventoryIpc() {
  ipcMain.handle("inventory:listStock", async (_e, rawQuery: unknown) => {
    const query = stockListQuerySchema.parse(rawQuery ?? {});
    return inventoryService.listStock(query);
  });

  ipcMain.handle("inventory:totals", async () => {
    return inventoryService.totals();
  });

  ipcMain.handle("inventory:priceHistory", async (_e, rawQuery: unknown) => {
    const { variantId } = priceHistoryQuerySchema.parse(rawQuery ?? {});
    return inventoryService.priceHistory(variantId);
  });
}