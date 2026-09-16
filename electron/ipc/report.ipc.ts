import { ipcMain } from "electron";
import { reportService } from "../services/report.service";
import { reportQuerySchema } from "../shared/types/report";

export function registerReportIpc() {
  ipcMain.handle("report:full", async (_e, rawQuery: unknown) => {
    const query = reportQuerySchema.parse(rawQuery ?? {});
    return reportService.full(query);
  });

  ipcMain.handle("report:today", async () => {
    return reportService.today();
  });
}