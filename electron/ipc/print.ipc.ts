import { ipcMain } from "electron";
import { printHtml, type PrintSize } from "../printing/print";

type PrintRequest = {
  html: string;
  size: PrintSize;
  documentTitle?: string;
};

export function registerPrintIpc() {
  ipcMain.handle("print:html", async (_e, req: PrintRequest) => {
    await printHtml(req);
    return { ok: true };
  });

  ipcMain.handle("print:pdf", async (_e, req: PrintRequest) => {
    // Handled by same path — print dialog includes "Save as PDF"
    await printHtml(req);
    return { ok: true };
  });
}