import { and, desc, eq, like, sql } from "drizzle-orm";
import { getDb } from "../database/client";
import { customerUdhaar, customers } from "../database/schema";
import type {
  CreateUdhaarInput,
  CustomerUdhaar,
  UdhaarListQuery,
} from "../shared/types/udhaar";

function toDto(row: {
  id: number;
  customerId: number;
  customerName: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  udhaarDate: Date;
  reason: string | null;
  createdAt: Date;
}): CustomerUdhaar {
  return {
    id: row.id,
    customerId: row.customerId,
    customerName: row.customerName,
    amount: row.amount,
    paidAmount: row.paidAmount,
    remainingAmount: row.remainingAmount,
    udhaarDate: Math.floor(row.udhaarDate.getTime() / 1000),
    reason: row.reason,
    createdAt: Math.floor(row.createdAt.getTime() / 1000),
  };
}

export const udhaarService = {
  async list(query: UdhaarListQuery): Promise<CustomerUdhaar[]> {
    const db = getDb();
    const conditions = [];

    if (query.customerId) {
      conditions.push(eq(customerUdhaar.customerId, query.customerId));
    }
    if (query.search) {
      conditions.push(like(sql`c.name`, `%${query.search}%`));
    }
    if (query.onlyUnpaid) {
      conditions.push(sql`${customerUdhaar.remainingAmount} > 0`);
    }

    const rows = await db
      .select({
        id: customerUdhaar.id,
        customerId: customerUdhaar.customerId,
        customerName: sql<string>`c.name`,
        amount: customerUdhaar.amount,
        paidAmount: customerUdhaar.paidAmount,
        remainingAmount: customerUdhaar.remainingAmount,
        udhaarDate: customerUdhaar.udhaarDate,
        reason: customerUdhaar.reason,
        createdAt: customerUdhaar.createdAt,
      })
      .from(customerUdhaar)
      .innerJoin(sql`customers c`, sql`c.id = ${customerUdhaar.customerId}`)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(customerUdhaar.udhaarDate), desc(customerUdhaar.id))
      .limit(query.limit)
      .offset(query.offset);

    return rows.map(toDto);
  },

  async getById(id: number): Promise<CustomerUdhaar | null> {
    const db = getDb();
    const rows = await db
      .select({
        id: customerUdhaar.id,
        customerId: customerUdhaar.customerId,
        customerName: sql<string>`c.name`,
        amount: customerUdhaar.amount,
        paidAmount: customerUdhaar.paidAmount,
        remainingAmount: customerUdhaar.remainingAmount,
        udhaarDate: customerUdhaar.udhaarDate,
        reason: customerUdhaar.reason,
        createdAt: customerUdhaar.createdAt,
      })
      .from(customerUdhaar)
      .innerJoin(sql`customers c`, sql`c.id = ${customerUdhaar.customerId}`)
      .where(eq(customerUdhaar.id, id))
      .limit(1);
    return rows[0] ? toDto(rows[0]) : null;
  },

  /**
   * Create a manual udhaar entry. Bumps customer's cachedOutstanding.
   */
  async create(input: CreateUdhaarInput): Promise<CustomerUdhaar> {
    const db = getDb();
    const date = input.udhaarDate ?? new Date();

    const insertedId = db.transaction((tx) => {
      const [cust] = tx
        .select()
        .from(customers)
        .where(eq(customers.id, input.customerId))
        .limit(1)
        .all();

      if (!cust) throw new Error(`Customer ${input.customerId} not found`);

      const [udhaar] = tx
        .insert(customerUdhaar)
        .values({
          customerId: input.customerId,
          amount: input.amount,
          paidAmount: 0,
          remainingAmount: input.amount,
          udhaarDate: date,
          reason: input.reason ?? null,
        })
        .returning({ id: customerUdhaar.id })
        .all();

      tx.update(customers)
        .set({
          cachedOutstanding: cust.cachedOutstanding + input.amount,
          updatedAt: new Date(),
        })
        .where(eq(customers.id, input.customerId))
        .run();

      return udhaar.id;
    });

    const created = await this.getById(insertedId);
    if (!created) throw new Error("Failed to load created udhaar");
    return created;
  },

  /**
   * Delete an unpaid udhaar entry (only if nothing has been paid toward it).
   */
  async remove(id: number): Promise<void> {
    const db = getDb();

    db.transaction((tx) => {
      const [row] = tx
        .select()
        .from(customerUdhaar)
        .where(eq(customerUdhaar.id, id))
        .limit(1)
        .all();

      if (!row) throw new Error(`Udhaar ${id} not found`);
      if (row.paidAmount > 0) {
        throw new Error(
          "Cannot delete — this udhaar has payments recorded against it."
        );
      }

      const [cust] = tx
        .select()
        .from(customers)
        .where(eq(customers.id, row.customerId))
        .limit(1)
        .all();

      tx.delete(customerUdhaar).where(eq(customerUdhaar.id, id)).run();

      if (cust) {
        tx.update(customers)
          .set({
            cachedOutstanding: Math.max(
              0,
              cust.cachedOutstanding - row.remainingAmount
            ),
            updatedAt: new Date(),
          })
          .where(eq(customers.id, row.customerId))
          .run();
      }
    });
  },
};