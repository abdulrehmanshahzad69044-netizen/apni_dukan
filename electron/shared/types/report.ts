import { z } from "zod";

// ---------- Query ----------

export const reportDateRangeSchema = z.object({
  fromDate: z.coerce.date(),
  toDate: z.coerce.date(),
});

export type ReportDateRange = z.infer<typeof reportDateRangeSchema>;

export const reportQuerySchema = z.object({
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  /** How to group time series: by day or by month */
  groupBy: z.enum(["day", "month"]).optional().default("day"),
  /** Number of top items to return */
  limit: z.number().int().positive().max(100).optional().default(10),
});

export type ReportQuery = z.infer<typeof reportQuerySchema>;

// ---------- Sales Summary ----------

export type SalesSummary = {
  billCount: number;
  totalSales: number; // paisa
  totalCogs: number; // paisa
  grossProfit: number; // paisa
  grossMarginPct: number; // 0–100
  avgBillValue: number; // paisa
  businessExpenses: number; // paisa
  netProfit: number; // paisa
  netMarginPct: number; // 0–100

  // Cash flow (not part of profit)
  customerPaymentsReceived: number; // paisa
  companyPaymentsMade: number; // paisa
  cashOutflow: number; // business expenses + company payments
};

// ---------- Time series ----------

export type SalesTimePoint = {
  period: string; // "2026-09-15" or "2026-09"
  billCount: number;
  sales: number; // paisa
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
};

// ---------- Top items ----------

export type TopProductRow = {
  variantId: number;
  productName: string;
  variantName: string;
  baseUnitShortName: string;
  quantitySold: number; // milli-units
  revenue: number; // paisa
  cogs: number;
  profit: number;
};

export type TopCategoryRow = {
  categoryId: number | null;
  categoryName: string;
  revenue: number;
  cogs: number;
  profit: number;
  itemCount: number;
};

export type TopCustomerRow = {
  customerId: number;
  customerName: string;
  billCount: number;
  revenue: number;
  cogs: number;
  profit: number;
  currentOutstanding: number; // paisa
};

export type TopCompanyRow = {
  companyId: number;
  companyName: string;
  purchaseCount: number;
  totalPurchases: number; // paisa
  totalPaid: number;
  totalOutstanding: number;
};

// ---------- Collection ----------

export type CollectionRow = {
  customerId: number;
  customerName: string;
  paymentCount: number;
  totalReceived: number;
};

// ---------- Full Report ----------

export type FullReport = {
  range: { fromDate: number; toDate: number }; // unix seconds
  summary: SalesSummary;
  timeSeries: SalesTimePoint[];
  topProducts: TopProductRow[];
  topCategories: TopCategoryRow[];
  topCustomers: TopCustomerRow[];
  topCompanies: TopCompanyRow[];
  collections: CollectionRow[];
};