import { and, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { getDb } from "../database/client";
import {
  companyPayments,
  purchases,
} from "../database/schema";
import type {
  CompanyPayment,
  CompanyPaymentListQuery,
  CreateCompanyPaymentInput,
} from "../shared/types/expense";

function toDto(row: {
  id: number;
  companyId: number;
  companyName: string;
  purchaseId: number | null;
  purchaseNumber: string | null;
  amount: number;
  date: Date;
  remarks: string | null;
  createdAt: Date;
}): CompanyPayment {
  return {
    id: row.id,
    companyId: row.companyId,
    companyName: row.companyName,
    purchaseId: row.purchaseId,
    purchaseNumber: row.purchaseNumber,
    amount: row.amount,
    date: Math.floor(row.date.getTime() / 1000),
    remarks: row.remarks,
    createdAt: Math.floor(row.createdAt.getTime() / 1000),
  };
}

export const companyPaymentService = {
  async list(query: CompanyPaymentListQuery): Promise<CompanyPayment[]> {
    const db = getDb();
    const conditions = [];

    if (query.companyId) {
      conditions.push(eq(companyPayments.companyId, query.companyId));
    }
    if (query.fromDate) {
      conditions.push(gte(companyPayments.date, query.fromDate));
    }
    if (query.toDate) {
      conditions.push(lte(companyPayments.date, query.toDate));
    }
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(
          like(sql`c.name`, term),
          like(sql`pur.purchase_number`, term)
        )
      );
    }

    const rows = await db
      .select({
        id: companyPayments.id,
        companyId: companyPayments.companyId,
        companyName: sql<string>`c.name`,
        purchaseId: companyPayments.purchaseId,
        purchaseNumber: sql<string | null>`pur.purchase_number`,
        amount: companyPayments.amount,
        date: companyPayments.date,
        remarks: companyPayments.remarks,
        createdAt: companyPayments.createdAt,
      })
      .from(companyPayments)
      .innerJoin(sql`companies c`, sql`c.id = ${companyPayments.companyId}`)
      .leftJoin(sql`purchases pur`, sql`pur.id = ${companyPayments.purchaseId}`)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(companyPayments.date), desc(companyPayments.id))
      .limit(query.limit)
      .offset(query.offset);

    return rows.map(toDto);
  },

  async getById(id: number): Promise<CompanyPayment | null> {
    const db = getDb();
    const rows = await db
      .select({
        id: companyPayments.id,
        companyId: companyPayments.companyId,
        companyName: sql<string>`c.name`,
        purchaseId: companyPayments.purchaseId,
        purchaseNumber: sql<string | null>`pur.purchase_number`,
        amount: companyPayments.amount,
        date: companyPayments.date,
        remarks: companyPayments.remarks,
        createdAt: companyPayments.createdAt,
      })
      .from(companyPayments)
      .innerJoin(sql`companies c`, sql`c.id = ${companyPayments.companyId}`)
      .leftJoin(sql`purchases pur`, sql`pur.id = ${companyPayments.purchaseId}`)
      .where(eq(companyPayments.id, id))
      .limit(1);
    return rows[0] ? toDto(rows[0]) : null;
  },

  /**
   * Record a payment to a company.
   * Optionally applies it to a specific purchase (updates purchase.paidAmount).
   * If no purchase specified, it's a general payment on account.
   */
  async create(input: CreateCompanyPaymentInput): Promise<CompanyPayment> {
    const db = getDb();
    const date = input.date ?? new Date();

    const insertedId = db.transaction((tx) => {
      const [payment] = tx
        .insert(companyPayments)
        .values({
          companyId: input.companyId,
          purchaseId: input.purchaseId ?? null,
          amount: input.amount,
          date,
          remarks: input.remarks ?? null,
        })
        .returning({ id: companyPayments.id })
        .all();

      // If tied to a specific purchase, bump its paidAmount
      if (input.purchaseId) {
        const [pur] = tx
          .select({ paidAmount: purchases.paidAmount, totalAmount: purchases.totalAmount })
          .from(purchases)
          .where(eq(purchases.id, input.purchaseId))
          .limit(1)
          .all();

        if (!pur) throw new Error(`Purchase ${input.purchaseId} not found`);

        const newPaid = Math.min(
          pur.paidAmount + input.amount,
          pur.totalAmount
        );

        tx.update(purchases)
          .set({ paidAmount: newPaid, updatedAt: new Date() })
          .where(eq(purchases.id, input.purchaseId))
          .run();
      }

      return payment.id;
    });

    const created = await this.getById(insertedId);
    if (!created) throw new Error("Failed to load created payment");
    return created;
  },

  async remove(id: number): Promise<void> {
    const db = getDb();
    await db.delete(companyPayments).where(eq(companyPayments.id, id));
  },

  /**
   * Total company payments within a date range (for dashboard/reports).
   */
  async totalInRange(fromDate: Date, toDate: Date): Promise<number> {
    const db = getDb();
    const [row] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${companyPayments.amount}), 0)`,
      })
      .from(companyPayments)
      .where(
        and(gte(companyPayments.date, fromDate), lte(companyPayments.date, toDate))
      );
    return row?.total ?? 0;
  },
};