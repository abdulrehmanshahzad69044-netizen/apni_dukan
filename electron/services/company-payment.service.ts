import { and, asc, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { getDb } from "../database/client";
import {
  companyPaymentAllocations,
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
        or(like(sql`c.name`, term), like(sql`pur.purchase_number`, term))
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
   * Get allocations for a payment (which purchases it was applied to).
   */
  async getAllocations(paymentId: number): Promise<
    Array<{
      id: number;
      purchaseId: number;
      purchaseNumber: string;
      purchaseDate: number;
      amount: number;
    }>
  > {
    const db = getDb();
    const rows = await db
      .select({
        id: companyPaymentAllocations.id,
        purchaseId: companyPaymentAllocations.purchaseId,
        purchaseNumber: sql<string>`p.purchase_number`,
        purchaseDate: sql<Date>`p.purchase_date`,
        amount: companyPaymentAllocations.amount,
      })
      .from(companyPaymentAllocations)
      .innerJoin(
        sql`purchases p`,
        sql`p.id = ${companyPaymentAllocations.purchaseId}`
      )
      .where(eq(companyPaymentAllocations.companyPaymentId, paymentId))
      .orderBy(asc(sql`p.purchase_date`));

    return rows.map((r) => ({
      id: r.id,
      purchaseId: r.purchaseId,
      purchaseNumber: r.purchaseNumber,
      purchaseDate: Math.floor(
        typeof r.purchaseDate === "object"
          ? r.purchaseDate.getTime() / 1000
          : Number(r.purchaseDate)
      ),
      amount: r.amount,
    }));
  },

  /**
   * Record a payment to a company.
   *
   * - If purchaseId is set → allocate ONLY to that purchase.
   * - If purchaseId is null  → FIFO allocate across unpaid purchases (oldest first).
   *
   * Every allocation updates the corresponding purchase's paidAmount.
   * Everything runs in ONE transaction.
   */
  async create(input: CreateCompanyPaymentInput): Promise<CompanyPayment> {
    const db = getDb();
    const date = input.date ?? new Date();

    const insertedId = db.transaction((tx) => {
      // 1. Insert payment header
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

      // 2. Determine which purchases to allocate to
      if (input.purchaseId) {
        // Targeted allocation
        const [pur] = tx
          .select()
          .from(purchases)
          .where(eq(purchases.id, input.purchaseId))
          .limit(1)
          .all();

        if (!pur) throw new Error(`Purchase ${input.purchaseId} not found`);

        const outstanding = pur.totalAmount - pur.paidAmount;
        const allocate = Math.min(input.amount, outstanding);

        if (allocate > 0) {
          tx.insert(companyPaymentAllocations)
            .values({
              companyPaymentId: payment.id,
              purchaseId: pur.id,
              amount: allocate,
            })
            .run();

          tx.update(purchases)
            .set({
              paidAmount: pur.paidAmount + allocate,
              updatedAt: new Date(),
            })
            .where(eq(purchases.id, pur.id))
            .run();
        }
      } else {
        // FIFO allocation across unpaid purchases for this company
        const unpaidPurchases = tx
          .select()
          .from(purchases)
          .where(
            and(
              eq(purchases.companyId, input.companyId),
              sql`${purchases.paidAmount} < ${purchases.totalAmount}`
            )
          )
          .orderBy(asc(purchases.purchaseDate), asc(purchases.id))
          .all();

        let remaining = input.amount;

        for (const pur of unpaidPurchases) {
          if (remaining <= 0) break;

          const outstanding = pur.totalAmount - pur.paidAmount;
          const allocate = Math.min(remaining, outstanding);
          remaining -= allocate;

          if (allocate <= 0) continue;

          tx.insert(companyPaymentAllocations)
            .values({
              companyPaymentId: payment.id,
              purchaseId: pur.id,
              amount: allocate,
            })
            .run();

          tx.update(purchases)
            .set({
              paidAmount: pur.paidAmount + allocate,
              updatedAt: new Date(),
            })
            .where(eq(purchases.id, pur.id))
            .run();
        }

        if (remaining > 0) {
          // Fully allocated less than paid — overpayment.
          // For now we reject (frontend validates too), but throw here defensively.
          throw new Error(
            `Payment exceeds total outstanding by Rs. ${(remaining / 100).toFixed(2)}. Please reduce the amount.`
          );
        }
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
   * Total company payments within a date range.
   */
  async totalInRange(fromDate: Date, toDate: Date): Promise<number> {
    const db = getDb();
    const [row] = await db
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
    return row?.total ?? 0;
  },

  /**
   * Total outstanding across ALL companies.
   */
  async totalOutstanding(): Promise<number> {
    const db = getDb();
    const [row] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${purchases.totalAmount} - ${purchases.paidAmount}), 0)`,
      })
      .from(purchases);
    return row?.total ?? 0;
  },
};