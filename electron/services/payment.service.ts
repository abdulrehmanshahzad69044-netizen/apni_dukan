import { and, asc, desc, eq, gte, isNull, like, lte, or, sql } from "drizzle-orm";
import { getDb } from "../database/client";
import {
  bills,
  customers,
  paymentAllocations,
  payments,
} from "../database/schema";
import type {
  CreatePaymentInput,
  KhaataBill,
  KhaataDetail,
  KhaataEntry,
  KhaataListQuery,
  Payment,
  PaymentDetail,
  PaymentListQuery,
} from "../shared/types/payment";

// ---------- Helpers ----------

function toPaymentDto(row: {
  id: number;
  customerId: number;
  customerName: string;
  billId: number | null;
  billNumber: string | null;
  amount: number;
  paymentDate: Date;
  remarks: string | null;
  createdAt: Date;
}): Payment {
  return {
    id: row.id,
    customerId: row.customerId,
    customerName: row.customerName,
    billId: row.billId,
    billNumber: row.billNumber,
    amount: row.amount,
    paymentDate: Math.floor(row.paymentDate.getTime() / 1000),
    remarks: row.remarks,
    createdAt: Math.floor(row.createdAt.getTime() / 1000),
  };
}

// ---------- Payment Service ----------

export const paymentService = {
  async create(input: CreatePaymentInput): Promise<PaymentDetail> {
    const db = getDb();
    const paymentDate = input.paymentDate ?? new Date();

    const paymentId = db.transaction((tx) => {
      const [cust] = tx
        .select()
        .from(customers)
        .where(eq(customers.id, input.customerId))
        .limit(1)
        .all();

      if (!cust) throw new Error(`Customer ${input.customerId} not found`);

      const [payment] = tx
        .insert(payments)
        .values({
          customerId: input.customerId,
          billId: null,
          amount: input.amount,
          paymentDate,
          remarks: input.remarks ?? null,
        })
        .returning({ id: payments.id })
        .all();

      const unpaidBills = tx
        .select()
        .from(bills)
        .where(
          and(
            eq(bills.customerId, input.customerId),
            eq(bills.status, "finalized"),
            sql`${bills.remainingAmount} > 0`
          )
        )
        .orderBy(asc(bills.billDate), asc(bills.id))
        .all();

      let remainingToAllocate = input.amount;
      let totalAllocated = 0;

      for (const bill of unpaidBills) {
        if (remainingToAllocate <= 0) break;
        const allocate = Math.min(remainingToAllocate, bill.remainingAmount);
        remainingToAllocate -= allocate;
        totalAllocated += allocate;

        tx.insert(paymentAllocations)
          .values({
            paymentId: payment.id,
            billId: bill.id,
            amount: allocate,
          })
          .run();

        tx.update(bills)
          .set({
            paidAmount: bill.paidAmount + allocate,
            remainingAmount: bill.remainingAmount - allocate,
            updatedAt: new Date(),
          })
          .where(eq(bills.id, bill.id))
          .run();
      }

      if (totalAllocated > 0) {
        tx.update(customers)
          .set({
            cachedOutstanding: cust.cachedOutstanding - totalAllocated,
            updatedAt: new Date(),
          })
          .where(eq(customers.id, input.customerId))
          .run();
      }

      return payment.id;
    });

    const created = await this.getById(paymentId);
    if (!created) throw new Error("Failed to load created payment");
    return created;
  },

  async getById(id: number): Promise<PaymentDetail | null> {
    const db = getDb();

    const [header] = await db
      .select({
        id: payments.id,
        customerId: payments.customerId,
        customerName: sql<string>`c.name`,
        billId: payments.billId,
        billNumber: sql<string | null>`b.bill_number`,
        amount: payments.amount,
        paymentDate: payments.paymentDate,
        remarks: payments.remarks,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .innerJoin(sql`customers c`, sql`c.id = ${payments.customerId}`)
      .leftJoin(sql`bills b`, sql`b.id = ${payments.billId}`)
      .where(eq(payments.id, id))
      .limit(1);

    if (!header) return null;

    const allocations = await db
      .select({
        id: paymentAllocations.id,
        billId: paymentAllocations.billId,
        billNumber: sql<string>`b.bill_number`,
        billDate: sql<Date>`b.bill_date`,
        amount: paymentAllocations.amount,
      })
      .from(paymentAllocations)
      .innerJoin(sql`bills b`, sql`b.id = ${paymentAllocations.billId}`)
      .where(eq(paymentAllocations.paymentId, id))
      .orderBy(asc(sql`b.bill_date`));

    return {
      ...toPaymentDto(header),
      allocations: allocations.map((a) => ({
        id: a.id,
        billId: a.billId,
        billNumber: a.billNumber,
        billDate: Math.floor(
          typeof a.billDate === "object"
            ? a.billDate.getTime() / 1000
            : Number(a.billDate)
        ),
        amount: a.amount,
      })),
    };
  },

  async list(query: PaymentListQuery): Promise<Payment[]> {
    const db = getDb();
    const conditions = [];

    if (query.customerId) {
      conditions.push(eq(payments.customerId, query.customerId));
    }
    if (query.fromDate) {
      conditions.push(gte(payments.paymentDate, query.fromDate));
    }
    if (query.toDate) {
      conditions.push(lte(payments.paymentDate, query.toDate));
    }
    if (query.search) {
      conditions.push(like(sql`c.name`, `%${query.search}%`));
    }

    const rows = await db
      .select({
        id: payments.id,
        customerId: payments.customerId,
        customerName: sql<string>`c.name`,
        billId: payments.billId,
        billNumber: sql<string | null>`b.bill_number`,
        amount: payments.amount,
        paymentDate: payments.paymentDate,
        remarks: payments.remarks,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .innerJoin(sql`customers c`, sql`c.id = ${payments.customerId}`)
      .leftJoin(sql`bills b`, sql`b.id = ${payments.billId}`)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(payments.paymentDate), desc(payments.id))
      .limit(query.limit)
      .offset(query.offset);

    return rows.map(toPaymentDto);
  },

  async count(
    query: Pick<PaymentListQuery, "customerId" | "fromDate" | "toDate">
  ): Promise<number> {
    const db = getDb();
    const conditions = [];
    if (query.customerId)
      conditions.push(eq(payments.customerId, query.customerId));
    if (query.fromDate)
      conditions.push(gte(payments.paymentDate, query.fromDate));
    if (query.toDate)
      conditions.push(lte(payments.paymentDate, query.toDate));

    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(payments)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return row?.count ?? 0;
  },
};

// ---------- Khaata Service ----------

export const khaataService = {
  async list(query: KhaataListQuery): Promise<KhaataEntry[]> {
    const db = getDb();

    // ✅ Use typed Drizzle conditions instead of raw `c.xxx` references
    const conditions = [
      sql`${customers.cachedOutstanding} > 0`,
      isNull(customers.deletedAt),
    ];

    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(
          like(customers.name, term),
          like(customers.contactNumber, term)
        )!
      );
    }

    const rows = await db
      .select({
        customerId: customers.id,
        customerName: customers.name,
        contactNumber: customers.contactNumber,
        totalOutstanding: customers.cachedOutstanding,
        billCount: sql<number>`(
          SELECT COUNT(*) FROM bills
          WHERE customer_id = ${customers.id}
            AND status = 'finalized'
            AND remaining_amount > 0
        )`,
        oldestBillDate: sql<number | null>`(
          SELECT MIN(bill_date) FROM bills
          WHERE customer_id = ${customers.id}
            AND status = 'finalized'
            AND remaining_amount > 0
        )`,
      })
      .from(customers)
      .where(and(...conditions))
      .orderBy(desc(customers.cachedOutstanding))
      .limit(query.limit)
      .offset(query.offset);

    return rows.map((r) => ({
      customerId: r.customerId,
      customerName: r.customerName,
      contactNumber: r.contactNumber,
      totalOutstanding: r.totalOutstanding,
      billCount: r.billCount,
      oldestBillDate: r.oldestBillDate,
    }));
  },

  async detail(customerId: number): Promise<KhaataDetail | null> {
    const db = getDb();

    const [cust] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!cust) return null;

    const rows = await db
      .select({
        billId: bills.id,
        billNumber: bills.billNumber,
        billDate: bills.billDate,
        totalAmount: bills.totalAmount,
        paidAmount: bills.paidAmount,
        remainingAmount: bills.remainingAmount,
      })
      .from(bills)
      .where(
        and(
          eq(bills.customerId, customerId),
          eq(bills.status, "finalized"),
          sql`${bills.remainingAmount} > 0`
        )
      )
      .orderBy(asc(bills.billDate), asc(bills.id));

    const billsDto: KhaataBill[] = rows.map((r) => ({
      billId: r.billId,
      billNumber: r.billNumber,
      billDate: Math.floor(r.billDate.getTime() / 1000),
      totalAmount: r.totalAmount,
      paidAmount: r.paidAmount,
      remainingAmount: r.remainingAmount,
    }));

    const totalOutstanding = billsDto.reduce(
      (s, b) => s + b.remainingAmount,
      0
    );

    return {
      customerId: cust.id,
      customerName: cust.name,
      contactNumber: cust.contactNumber,
      address: cust.address,
      totalOutstanding,
      bills: billsDto,
    };
  },

  async totalOutstanding(): Promise<number> {
    const db = getDb();
    const [row] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${customers.cachedOutstanding}), 0)`,
      })
      .from(customers)
      .where(isNull(customers.deletedAt));
    return row?.total ?? 0;
  },
};