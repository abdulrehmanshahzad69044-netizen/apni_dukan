import { ipcMain } from "electron";
import { adjustmentService } from "../services/adjustment.service";
import {
  adjustmentListQuerySchema,
  createAdjustmentSchema,
} from "../shared/types/adjustment";

export function registerAdjustmentIpc() {
  ipcMain.handle("adjustment:list", async (_e, rawQuery: unknown) => {
    const query = adjustmentListQuerySchema.parse(rawQuery ?? {});
    return adjustmentService.list(query);
  });

  ipcMain.handle("adjustment:get", async (_e, id: number) => {
    return adjustmentService.getById(id);
  });

  ipcMain.handle("adjustment:create", async (_e, rawInput: unknown) => {
    const input = createAdjustmentSchema.parse(rawInput);
    return adjustmentService.create(input);
  });
}