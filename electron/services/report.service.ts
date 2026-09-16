import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { getDb } from "../database/client";
import {
  bills,
  customers,
  expenses,
  companyPayments,
  payments,
} from "../database/schema";
import type {
  CollectionRow,
  FullReport,
  ReportQuery,
  SalesSummary,
  SalesTimePoint,
  TopCategoryRow,
  TopCompanyRow,
  TopCustomerRow,
  TopProductRow,
} from "../shared/types/report";

/**
 * Default range: current month.
 */
function resolveRange(query: ReportQuery): { fromDate: Date; toDate: Date } {
  const now = new Date();
  if (query.fromDate && query.toDate) {
    return { fromDate: query.fromDate, toDate: query.toDate };
  }
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { fromDate: query.fromDate ?? from, toDate: query.toDate ?? to };
}

function daysBetween(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export const reportService = {
  /**
   * Full report — one call returns everything the Reports page needs.
   */
  async full(query: ReportQuery): Promise<FullReport> {
    const { fromDate, toDate } = resolveRange(query);

    const [summary, timeSeries, topProducts, topCategories, topCustomers, topCompanies, collections] =
      await Promise.all([
        this.summary({ fromDate, toDate }),
        this.timeSeries({ fromDate, toDate, groupBy: query.groupBy ?? "day" }),
        this.topProducts({ fromDate, toDate, limit: query.limit ?? 10 }),
        this.topCategories({ fromDate, toDate, limit: query.limit ?? 10 }),
        this.topCustomers({ fromDate, toDate, limit: query.limit ?? 10 }),
        this.topCompanies({ fromDate, toDate, limit: query.limit ?? 10 }),
        this.collections({ fromDate, toDate, limit: query.limit ?? 10 }),
      ]);

    return {
      range: {
        fromDate: Math.floor(fromDate.getTime() / 1000),
        toDate: Math.floor(toDate.getTime() / 1000),
      },
      summary,
      timeSeries,
      topProducts,
      topCategories,
      topCustomers,
      topCompanies,
      collections,
    };
  },

  /**
   * Sales summary — headline numbers.
   */
  async summary({
    fromDate,
    toDate,
  }: {
    fromDate: Date;
    toDate: Date;
  }): Promise<SalesSummary> {
    const db = getDb();

    // Sales-side: bills finalized in range
    const [salesRow] = await db
      .select({
        billCount: sql<number>`COUNT(*)`,
        totalSales: sql<number>`COALESCE(SUM(${bills.totalAmount}), 0)`,
        totalCogs: sql<number>`COALESCE(SUM(${bills.cogs}), 0)`,
      })
      .from(bills)
      .where(
        and(
          eq(bills.status, "finalized"),
          gte(bills.billDate, fromDate),
          lte(bills.billDate, toDate)
        )
      );

    // Business expenses in range
    const [expenseRow] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(
        and(gte(expenses.date, fromDate), lte(expenses.date, toDate))
      );

    // Customer payments received in range
    const [paymentRow] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(
        and(gte(payments.paymentDate, fromDate), lte(payments.paymentDate, toDate))
      );

    // Company payments made in range
    const [companyPaymentRow] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${companyPayments.amount}), 0)`,
      })
      .from(companyPayments)
      .where(
        and(
          gte(companyPayments.date, fromDate),
          lte(companyPayments.date, toDate)
        )
      );

    const totalSales = salesRow?.totalSales ?? 0;
    const totalCogs = salesRow?.totalCogs ?? 0;
    const grossProfit = totalSales - totalCogs;
    const businessExpenses = expenseRow?.total ?? 0;
    const netProfit = grossProfit - businessExpenses;

    const billCount = salesRow?.billCount ?? 0;
    const avgBillValue = billCount > 0 ? Math.round(totalSales / billCount) : 0;

    const grossMarginPct =
      totalSales > 0 ? Math.round((grossProfit / totalSales) * 1000) / 10 : 0;
    const netMarginPct =
      totalSales > 0 ? Math.round((netProfit / totalSales) * 1000) / 10 : 0;

    const customerPaymentsReceived = paymentRow?.total ?? 0;
    const companyPaymentsMade = companyPaymentRow?.total ?? 0;
    const cashOutflow = businessExpenses + companyPaymentsMade;

    return {
      billCount,
      totalSales,
      totalCogs,
      grossProfit,
      grossMarginPct,
      avgBillValue,
      businessExpenses,
      netProfit,
      netMarginPct,
      customerPaymentsReceived,
      companyPaymentsMade,
      cashOutflow,
    };
  },

  /**
   * Time series — grouped by day or month.
   */
  async timeSeries({
    fromDate,
    toDate,
    groupBy,
  }: {
    fromDate: Date;
    toDate: Date;
    groupBy: "day" | "month";
  }): Promise<SalesTimePoint[]> {
    const db = getDb();

    const periodExpr =
      groupBy === "day"
        ? sql<string>`strftime('%Y-%m-%d', ${bills.billDate}, 'unixepoch')`
        : sql<string>`strftime('%Y-%m', ${bills.billDate}, 'unixepoch')`;

    const rows = await db
      .select({
        period: periodExpr,
        billCount: sql<number>`COUNT(*)`,
        sales: sql<number>`COALESCE(SUM(${bills.totalAmount}), 0)`,
        cogs: sql<number>`COALESCE(SUM(${bills.cogs}), 0)`,
      })
      .from(bills)
      .where(
        and(
          eq(bills.status, "finalized"),
          gte(bills.billDate, fromDate),
          lte(bills.billDate, toDate)
        )
      )
      .groupBy(periodExpr)
      .orderBy(asc(periodExpr));

    // Expenses grouped by period
    const expenseRows = await db
      .select({
        period:
          groupBy === "day"
            ? sql<string>`strftime('%Y-%m-%d', ${expenses.date}, 'unixepoch')`
            : sql<string>`strftime('%Y-%m', ${expenses.date}, 'unixepoch')`,
        total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(and(gte(expenses.date, fromDate), lte(expenses.date, toDate)))
      .groupBy(
        groupBy === "day"
          ? sql`strftime('%Y-%m-%d', ${expenses.date}, 'unixepoch')`
          : sql`strftime('%Y-%m', ${expenses.date}, 'unixepoch')`
      );

    const expenseMap = new Map<string, number>();
    for (const e of expenseRows) expenseMap.set(e.period, e.total);

    return rows.map((r) => {
      const grossProfit = r.sales - r.cogs;
      const exp = expenseMap.get(r.period) ?? 0;
      return {
        period: r.period,
        billCount: r.billCount,
        sales: r.sales,
        cogs: r.cogs,
        grossProfit,
        expenses: exp,
        netProfit: grossProfit - exp,
      };
    });
  },

  async topProducts({
    fromDate,
    toDate,
    limit,
  }: {
    fromDate: Date;
    toDate: Date;
    limit: number;
  }): Promise<TopProductRow[]> {
    const db = getDb();
    const rows = db.$client
      .prepare(
        `
        SELECT
          bi.variant_id           AS variantId,
          p.name                  AS productName,
          v.name                  AS variantName,
          u.short_name            AS baseUnitShortName,
          SUM(bi.quantity)        AS quantitySold,
          SUM(bi.line_total)      AS revenue,
          SUM(bi.line_cogs)       AS cogs
        FROM bill_items bi
        INNER JOIN bills    b ON b.id = bi.bill_id
        INNER JOIN variants v ON v.id = bi.variant_id
        INNER JOIN products p ON p.id = v.product_id
        INNER JOIN units    u ON u.id = v.base_unit_id
        WHERE b.status = 'finalized'
          AND b.bill_date >= ?
          AND b.bill_date <= ?
        GROUP BY bi.variant_id
        ORDER BY revenue DESC
        LIMIT ?
        `
      )
      .all(
        Math.floor(fromDate.getTime() / 1000),
        Math.floor(toDate.getTime() / 1000),
        limit
      ) as Array<{
      variantId: number;
      productName: string;
      variantName: string;
      baseUnitShortName: string;
      quantitySold: number;
      revenue: number;
      cogs: number;
    }>;

    return rows.map((r) => ({
      variantId: r.variantId,
      productName: r.productName,
      variantName: r.variantName,
      baseUnitShortName: r.baseUnitShortName,
      quantitySold: r.quantitySold,
      revenue: r.revenue,
      cogs: r.cogs,
      profit: r.revenue - r.cogs,
    }));
  },

  async topCategories({
    fromDate,
    toDate,
    limit,
  }: {
    fromDate: Date;
    toDate: Date;
    limit: number;
  }): Promise<TopCategoryRow[]> {
    const db = getDb();
    const rows = db.$client
      .prepare(
        `
        SELECT
          c.id                    AS categoryId,
          COALESCE(c.name, 'Uncategorized') AS categoryName,
          SUM(bi.line_total)      AS revenue,
          SUM(bi.line_cogs)       AS cogs,
          COUNT(*)                AS itemCount
        FROM bill_items bi
        INNER JOIN bills    b ON b.id = bi.bill_id
        INNER JOIN variants v ON v.id = bi.variant_id
        INNER JOIN products p ON p.id = v.product_id
        LEFT  JOIN categories c ON c.id = p.category_id
        WHERE b.status = 'finalized'
          AND b.bill_date >= ?
          AND b.bill_date <= ?
        GROUP BY c.id
        ORDER BY revenue DESC
        LIMIT ?
        `
      )
      .all(
        Math.floor(fromDate.getTime() / 1000),
        Math.floor(toDate.getTime() / 1000),
        limit
      ) as Array<{
      categoryId: number | null;
      categoryName: string;
      revenue: number;
      cogs: number;
      itemCount: number;
    }>;

    return rows.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      revenue: r.revenue,
      cogs: r.cogs,
      profit: r.revenue - r.cogs,
      itemCount: r.itemCount,
    }));
  },

  async topCustomers({
    fromDate,
    toDate,
    limit,
  }: {
    fromDate: Date;
    toDate: Date;
    limit: number;
  }): Promise<TopCustomerRow[]> {
    const db = getDb();
    const rows = db.$client
      .prepare(
        `
        SELECT
          c.id                    AS customerId,
          c.name                  AS customerName,
          COUNT(b.id)             AS billCount,
          SUM(b.total_amount)     AS revenue,
          SUM(b.cogs)             AS cogs,
          c.cached_outstanding    AS currentOutstanding
        FROM bills b
        INNER JOIN customers c ON c.id = b.customer_id
        WHERE b.status = 'finalized'
          AND b.bill_date >= ?
          AND b.bill_date <= ?
          AND b.customer_id IS NOT NULL
        GROUP BY c.id
        ORDER BY revenue DESC
        LIMIT ?
        `
      )
      .all(
        Math.floor(fromDate.getTime() / 1000),
        Math.floor(toDate.getTime() / 1000),
        limit
      ) as Array<{
      customerId: number;
      customerName: string;
      billCount: number;
      revenue: number;
      cogs: number;
      currentOutstanding: number;
    }>;

    return rows.map((r) => ({
      customerId: r.customerId,
      customerName: r.customerName,
      billCount: r.billCount,
      revenue: r.revenue,
      cogs: r.cogs,
      profit: r.revenue - r.cogs,
      currentOutstanding: r.currentOutstanding,
    }));
  },

  async topCompanies({
    fromDate,
    toDate,
    limit,
  }: {
    fromDate: Date;
    toDate: Date;
    limit: number;
  }): Promise<TopCompanyRow[]> {
    const db = getDb();
    const rows = db.$client
      .prepare(
        `
        SELECT
          c.id                            AS companyId,
          c.name                          AS companyName,
          COUNT(pu.id)                    AS purchaseCount,
          COALESCE(SUM(pu.total_amount), 0) AS totalPurchases,
          COALESCE(SUM(pu.paid_amount), 0)  AS totalPaid
        FROM purchases pu
        INNER JOIN companies c ON c.id = pu.company_id
        WHERE pu.purchase_date >= ?
          AND pu.purchase_date <= ?
        GROUP BY c.id
        ORDER BY totalPurchases DESC
        LIMIT ?
        `
      )
      .all(
        Math.floor(fromDate.getTime() / 1000),
        Math.floor(toDate.getTime() / 1000),
        limit
      ) as Array<{
      companyId: number;
      companyName: string;
      purchaseCount: number;
      totalPurchases: number;
      totalPaid: number;
    }>;

    return rows.map((r) => ({
      companyId: r.companyId,
      companyName: r.companyName,
      purchaseCount: r.purchaseCount,
      totalPurchases: r.totalPurchases,
      totalPaid: r.totalPaid,
      totalOutstanding: r.totalPurchases - r.totalPaid,
    }));
  },

  async collections({
    fromDate,
    toDate,
    limit,
  }: {
    fromDate: Date;
    toDate: Date;
    limit: number;
  }): Promise<CollectionRow[]> {
    const db = getDb();
    const rows = db.$client
      .prepare(
        `
        SELECT
          c.id                    AS customerId,
          c.name                  AS customerName,
          COUNT(p.id)             AS paymentCount,
          SUM(p.amount)           AS totalReceived
        FROM payments p
        INNER JOIN customers c ON c.id = p.customer_id
        WHERE p.payment_date >= ?
          AND p.payment_date <= ?
        GROUP BY c.id
        ORDER BY totalReceived DESC
        LIMIT ?
        `
      )
      .all(
        Math.floor(fromDate.getTime() / 1000),
        Math.floor(toDate.getTime() / 1000),
        limit
      ) as Array<{
      customerId: number;
      customerName: string;
      paymentCount: number;
      totalReceived: number;
    }>;

    return rows.map((r) => ({
      customerId: r.customerId,
      customerName: r.customerName,
      paymentCount: r.paymentCount,
      totalReceived: r.totalReceived,
    }));
  },

  /**
   * Daily summary — quick numbers for the dashboard.
   */
  async today(): Promise<SalesSummary> {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const to = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );
    return this.summary({ fromDate: from, toDate: to });
  },
};

// Silence unused-import warnings
void daysBetween;