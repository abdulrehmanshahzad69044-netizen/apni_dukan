import { ipcMain } from "electron";
import { expenseService } from "../services/expense.service";
import { companyPaymentService } from "../services/company-payment.service";
import {
  companyPaymentListQuerySchema,
  createCompanyPaymentSchema,
  createExpenseSchema,
  expenseListQuerySchema,
  updateExpenseSchema,
} from "../shared/types/expense";

export function registerExpenseIpc() {
  // ---------- Business Expenses ----------
  ipcMain.handle("expense:list", async (_e, rawQuery: unknown) => {
    const query = expenseListQuerySchema.parse(rawQuery ?? {});
    return expenseService.list(query);
  });

  ipcMain.handle("expense:count", async (_e, rawQuery: unknown) => {
    const query = expenseListQuerySchema
      .pick({ search: true, fromDate: true, toDate: true })
      .parse(rawQuery ?? {});
    return expenseService.count(query);
  });

  ipcMain.handle("expense:get", async (_e, id: number) => {
    return expenseService.getById(id);
  });

  ipcMain.handle("expense:create", async (_e, rawInput: unknown) => {
    const input = createExpenseSchema.parse(rawInput);
    return expenseService.create(input);
  });

  ipcMain.handle("expense:update", async (_e, rawInput: unknown) => {
    const input = updateExpenseSchema.parse(rawInput);
    return expenseService.update(input);
  });

  ipcMain.handle("expense:delete", async (_e, id: number) => {
    await expenseService.remove(id);
    return { ok: true };
  });

  // ---------- Company Payments ----------
  ipcMain.handle("companyPayment:list", async (_e, rawQuery: unknown) => {
    const query = companyPaymentListQuerySchema.parse(rawQuery ?? {});
    return companyPaymentService.list(query);
  });

  ipcMain.handle("companyPayment:get", async (_e, id: number) => {
    return companyPaymentService.getById(id);
  });

  ipcMain.handle("companyPayment:getAllocations", async (_e, id: number) => {
    return companyPaymentService.getAllocations(id);
  });

  ipcMain.handle("companyPayment:create", async (_e, rawInput: unknown) => {
    const input = createCompanyPaymentSchema.parse(rawInput);
    return companyPaymentService.create(input);
  });

  ipcMain.handle("companyPayment:delete", async (_e, id: number) => {
    await companyPaymentService.remove(id);
    return { ok: true };
  });

  ipcMain.handle("companyPayment:totalOutstanding", async () => {
    return companyPaymentService.totalOutstanding();
  });
}