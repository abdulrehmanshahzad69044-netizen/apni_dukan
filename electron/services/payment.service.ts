import { and, asc, desc, eq, gte, isNull, like, lte, or, sql } from "drizzle-orm";
import { getDb } from "../database/client";
import {
  bills,
  customerUdhaar,
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

export const paymentService = {
  /**
   * Record a customer payment with FIFO allocation across BOTH unpaid bills
   * and unpaid manual udhaar entries.
   *
   * Order: oldest by (date, type) first — bills and udhaars interleaved.
   */
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

      // Load unpaid bills
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

      // Load unpaid udhaar
      const unpaidUdhaar = tx
        .select()
        .from(customerUdhaar)
        .where(
          and(
            eq(customerUdhaar.customerId, input.customerId),
            sql`${customerUdhaar.remainingAmount} > 0`
          )
        )
        .orderBy(asc(customerUdhaar.udhaarDate), asc(customerUdhaar.id))
        .all();

      // Merge into a single chronological queue (oldest first)
      type Item =
        | { kind: "bill"; row: typeof unpaidBills[number] }
        | { kind: "udhaar"; row: typeof unpaidUdhaar[number] };

      const queue: Array<{ when: number; item: Item }> = [];
      for (const b of unpaidBills) {
        queue.push({
          when: b.billDate.getTime(),
          item: { kind: "bill", row: b },
        });
      }
      for (const u of unpaidUdhaar) {
        queue.push({
          when: u.udhaarDate.getTime(),
          item: { kind: "udhaar", row: u },
        });
      }
      queue.sort((a, b) => {
        if (a.when !== b.when) return a.when - b.when;
        // Tiebreaker: bills before udhaar, then by id
        if (a.item.kind !== b.item.kind) return a.item.kind === "bill" ? -1 : 1;
        return a.item.row.id - b.item.row.id;
      });

      let remainingToAllocate = input.amount;
      let totalAllocated = 0;

      for (const q of queue) {
        if (remainingToAllocate <= 0) break;

        if (q.item.kind === "bill") {
          const bill = q.item.row;
          const allocate = Math.min(remainingToAllocate, bill.remainingAmount);
          remainingToAllocate -= allocate;
          totalAllocated += allocate;

          tx.insert(paymentAllocations)
            .values({
              paymentId: payment.id,
              billId: bill.id,
              udhaarId: null,
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
        } else {
          const udhaar = q.item.row;
          const allocate = Math.min(
            remainingToAllocate,
            udhaar.remainingAmount
          );
          remainingToAllocate -= allocate;
          totalAllocated += allocate;

          tx.insert(paymentAllocations)
            .values({
              paymentId: payment.id,
              billId: null,
              udhaarId: udhaar.id,
              amount: allocate,
            })
            .run();

          tx.update(customerUdhaar)
            .set({
              paidAmount: udhaar.paidAmount + allocate,
              remainingAmount: udhaar.remainingAmount - allocate,
              updatedAt: new Date(),
            })
            .where(eq(customerUdhaar.id, udhaar.id))
            .run();
        }
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
        udhaarId: paymentAllocations.udhaarId,
        billNumber: sql<string | null>`b.bill_number`,
        billDate: sql<Date | null>`b.bill_date`,
        udhaarDate: sql<Date | null>`u.udhaar_date`,
        udhaarReason: sql<string | null>`u.reason`,
        amount: paymentAllocations.amount,
      })
      .from(paymentAllocations)
      .leftJoin(sql`bills b`, sql`b.id = ${paymentAllocations.billId}`)
      .leftJoin(
        sql`customer_udhaar u`,
        sql`u.id = ${paymentAllocations.udhaarId}`
      )
      .where(eq(paymentAllocations.paymentId, id))
      .orderBy(asc(sql`COALESCE(b.bill_date, u.udhaar_date)`));

    return {
      ...toPaymentDto(header),
      allocations: allocations
        .map((a) => {
          if (a.billId) {
            return {
              id: a.id,
              billId: a.billId,
              billNumber: a.billNumber ?? "",
              billDate: Math.floor(
                typeof a.billDate === "object" && a.billDate
                  ? a.billDate.getTime() / 1000
                  : Number(a.billDate ?? 0)
              ),
              amount: a.amount,
            };
          }
          return null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null),
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

// ---------- Khaata ----------

export const khaataService = {
  async list(query: KhaataListQuery): Promise<KhaataEntry[]> {
    const db = getDb();

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
        ) + (
          SELECT COUNT(*) FROM customer_udhaar
          WHERE customer_id = ${customers.id}
            AND remaining_amount > 0
        )`,
        oldestBillDate: sql<number | null>`(
          SELECT MIN(d) FROM (
            SELECT bill_date AS d FROM bills
              WHERE customer_id = ${customers.id}
                AND status = 'finalized'
                AND remaining_amount > 0
            UNION ALL
            SELECT udhaar_date AS d FROM customer_udhaar
              WHERE customer_id = ${customers.id}
                AND remaining_amount > 0
          )
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

  /**
   * Detail view: all unpaid bills AND unpaid udhaar entries, merged by date.
   */
  async detail(customerId: number): Promise<KhaataDetail | null> {
    const db = getDb();

    const [cust] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (!cust) return null;

    const billsRows = await db
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

    const udhaarRows = await db
      .select()
      .from(customerUdhaar)
      .where(
        and(
          eq(customerUdhaar.customerId, customerId),
          sql`${customerUdhaar.remainingAmount} > 0`
        )
      )
      .orderBy(asc(customerUdhaar.udhaarDate), asc(customerUdhaar.id));

    // Merge and sort by date
    type Entry =
      | { kind: "bill"; bill: KhaataBill; when: number }
      | {
          kind: "udhaar";
          udhaarId: number;
          reason: string | null;
          amount: number;
          paidAmount: number;
          remainingAmount: number;
          when: number;
        };

    const entries: Entry[] = [];

    for (const b of billsRows) {
      entries.push({
        kind: "bill",
        when: b.billDate.getTime(),
        bill: {
          billId: b.billId,
          billNumber: b.billNumber,
          billDate: Math.floor(b.billDate.getTime() / 1000),
          totalAmount: b.totalAmount,
          paidAmount: b.paidAmount,
          remainingAmount: b.remainingAmount,
        },
      });
    }

    for (const u of udhaarRows) {
      entries.push({
        kind: "udhaar",
        udhaarId: u.id,
        reason: u.reason,
        amount: u.amount,
        paidAmount: u.paidAmount,
        remainingAmount: u.remainingAmount,
        when: u.udhaarDate.getTime(),
      });
    }

    entries.sort((a, b) => a.when - b.when);

    const billsDto: KhaataBill[] = [];
    const udhaarDto: Array<{
      udhaarId: number;
      reason: string | null;
      amount: number;
      paidAmount: number;
      remainingAmount: number;
      when: number;
    }> = [];

    for (const e of entries) {
      if (e.kind === "bill") {
        billsDto.push(e.bill);
      } else {
        udhaarDto.push({
          udhaarId: e.udhaarId,
          reason: e.reason,
          amount: e.amount,
          paidAmount: e.paidAmount,
          remainingAmount: e.remainingAmount,
          when: e.when,
        });
      }
    }

    // Compute total (should match cachedOutstanding, but compute fresh)
    const totalOutstanding =
      billsDto.reduce((s, b) => s + b.remainingAmount, 0) +
      udhaarDto.reduce((s, u) => s + u.remainingAmount, 0);

    // Extend KhaataDetail with udhaar — see updated type below
    return {
      customerId: cust.id,
      customerName: cust.name,
      contactNumber: cust.contactNumber,
      address: cust.address,
      totalOutstanding,
      bills: billsDto,
      udhaars: udhaarDto.map((u) => ({
        udhaarId: u.udhaarId,
        reason: u.reason,
        amount: u.amount,
        paidAmount: u.paidAmount,
        remainingAmount: u.remainingAmount,
        udhaarDate: Math.floor(u.when / 1000),
      })),
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