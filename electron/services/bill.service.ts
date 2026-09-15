import { and, asc, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { getDb } from "../database/client";
import {
  bills,
  billItems,
  billItemFifo,
  stockBatches,
  stockLedger,
  customers,
} from "../database/schema";
import type {
  Bill,
  BillDetail,
  BillItem,
  BillItemFifoEntry,
  BillListQuery,
  CreateBillInput,
} from "../shared/types/bill";

// ---------- Helpers ----------

async function generateBillNumber(): Promise<string> {
  const db = getDb();
  const year = new Date().getFullYear();
  const prefix = `BILL-${year}-`;

  const [row] = await db
    .select({ max: sql<string | null>`max(${bills.billNumber})` })
    .from(bills)
    .where(like(bills.billNumber, `${prefix}%`));

  const lastNumber = row?.max ? parseInt(row.max.slice(prefix.length), 10) : 0;
  const next = (lastNumber + 1).toString().padStart(4, "0");
  return `${prefix}${next}`;
}

function toBillDto(row: {
  id: number;
  billNumber: string;
  customerId: number | null;
  customerName: string | null;
  billDate: Date;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  cogs: number;
  status: string;
  remarks: string | null;
  itemCount: number;
  createdAt: Date;
  updatedAt: Date;
}): Bill {
  return {
    id: row.id,
    billNumber: row.billNumber,
    customerId: row.customerId,
    customerName: row.customerName,
    billDate: Math.floor(row.billDate.getTime() / 1000),
    totalAmount: row.totalAmount,
    paidAmount: row.paidAmount,
    remainingAmount: row.remainingAmount,
    cogs: row.cogs,
    grossProfit: row.totalAmount - row.cogs,
    status: row.status as Bill["status"],
    remarks: row.remarks,
    itemCount: row.itemCount,
    createdAt: Math.floor(row.createdAt.getTime() / 1000),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1000),
  };
}

// ---------- Service ----------

export const billService = {
  /**
   * Create a bill with FIFO consumption.
   *
   * Steps inside ONE transaction:
   *  1. Generate bill number
   *  2. Compute total from lines
   *  3. Insert bill header
   *  4. For each line:
   *     a. FIFO-consume oldest batches
   *     b. Update batch.remainingQuantity
   *     c. Insert bill_items (with lineCogs computed)
   *     d. Insert bill_item_fifo rows (traceability)
   *     e. Insert stock_ledger entries
   *  5. Update bill totals (totalAmount, cogs, remaining)
   *  6. Update customer cachedOutstanding (if customer set + remaining > 0)
   *
   * Stock goes down. Cost is captured exactly. Nothing is guessed.
   */
  async create(input: CreateBillInput): Promise<BillDetail> {
    const db = getDb();

    // Compute total from lines (paisa)
    // quantity is milli-units, unitPrice is paisa
    const totalAmount = input.lines.reduce(
      (sum, line) =>
        sum + Math.round((line.quantity * line.unitPrice) / 1000),
      0
    );

    const billDate = input.billDate ?? new Date();
    const billNumber = await generateBillNumber();
    const paidAmount = input.paidAmount ?? 0;
    const status = input.status ?? "finalized";

    const billId = db.transaction((tx) => {
      // 1. Insert bill header (temp cogs/remaining — update after)
      const [bill] = tx
        .insert(bills)
        .values({
          billNumber,
          customerId: input.customerId ?? null,
          billDate,
          totalAmount,
          paidAmount,
          remainingAmount: 0,
          cogs: 0,
          status,
          remarks: input.remarks ?? null,
        })
        .returning({ id: bills.id })
        .all();

      let totalCogs = 0;

      // 2. Process each line
      for (const line of input.lines) {
        // FIFO: fetch oldest non-empty batches for this variant
        const availableBatches = tx
          .select()
          .from(stockBatches)
          .where(
            and(
              eq(stockBatches.variantId, line.variantId),
              sql`${stockBatches.remainingQuantity} > 0`
            )
          )
          .orderBy(asc(stockBatches.purchaseDate), asc(stockBatches.id))
          .all();

        const totalAvailable = availableBatches.reduce(
          (sum, b) => sum + b.remainingQuantity,
          0
        );

        if (totalAvailable < line.quantity) {
          throw new Error(
            `Not enough stock for variant ${line.variantId}. Available: ${(totalAvailable / 1000).toFixed(3)}, requested: ${(line.quantity / 1000).toFixed(3)}`
          );
        }

        // Insert bill item first (we need its id for FIFO rows)
        const lineTotal = Math.round(
          (line.quantity * line.unitPrice) / 1000
        );

        const [item] = tx
          .insert(billItems)
          .values({
            billId: bill.id,
            variantId: line.variantId,
            unitId: line.unitId,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal,
            lineCogs: 0, // update after FIFO
          })
          .returning({ id: billItems.id })
          .all();

        // FIFO consume
        let remaining = line.quantity;
        let lineCogs = 0;

        for (const batch of availableBatches) {
          if (remaining <= 0) break;
          const consume = Math.min(remaining, batch.remainingQuantity);
          remaining -= consume;

          const costContribution = Math.round(
            (consume * batch.purchasePrice) / 1000
          );
          lineCogs += costContribution;

          // Update batch remaining qty
          tx.update(stockBatches)
            .set({ remainingQuantity: batch.remainingQuantity - consume })
            .where(eq(stockBatches.id, batch.id))
            .run();

          // Traceability
          tx.insert(billItemFifo)
            .values({
              billItemId: item.id,
              batchId: batch.id,
              quantityConsumed: consume,
              unitCost: batch.purchasePrice,
            })
            .run();

          // Ledger entry
          tx.insert(stockLedger)
            .values({
              batchId: batch.id,
              variantId: line.variantId,
              quantityChange: -consume,
              unitCost: batch.purchasePrice,
              movementType: "sale",
              referenceType: "bill",
              referenceId: bill.id,
              notes: null,
            })
            .run();
        }

        // Update line's cogs
        tx.update(billItems)
          .set({ lineCogs })
          .where(eq(billItems.id, item.id))
          .run();

        totalCogs += lineCogs;
      }

      // 3. Update bill totals
      const remainingAmount = totalAmount - paidAmount;
      tx.update(bills)
        .set({
          cogs: totalCogs,
          remainingAmount,
          updatedAt: new Date(),
        })
        .where(eq(bills.id, bill.id))
        .run();

      // 4. Update customer cachedOutstanding
      if (input.customerId && remainingAmount > 0 && status === "finalized") {
        const [cust] = tx
          .select({ cachedOutstanding: customers.cachedOutstanding })
          .from(customers)
          .where(eq(customers.id, input.customerId))
          .limit(1)
          .all();

        if (cust) {
          tx.update(customers)
            .set({
              cachedOutstanding: cust.cachedOutstanding + remainingAmount,
              updatedAt: new Date(),
            })
            .where(eq(customers.id, input.customerId))
            .run();
        }
      }

      return bill.id;
    });

    const created = await this.getById(billId);
    if (!created) throw new Error("Failed to load created bill");
    return created;
  },

  async getById(id: number): Promise<BillDetail | null> {
    const db = getDb();

    // 1. Header
    const [header] = await db
      .select({
        id: bills.id,
        billNumber: bills.billNumber,
        customerId: bills.customerId,
        customerName: sql<string | null>`c.name`,
        billDate: bills.billDate,
        totalAmount: bills.totalAmount,
        paidAmount: bills.paidAmount,
        remainingAmount: bills.remainingAmount,
        cogs: bills.cogs,
        status: bills.status,
        remarks: bills.remarks,
        itemCount: sql<number>`(SELECT COUNT(*) FROM bill_items WHERE bill_id = ${bills.id})`,
        createdAt: bills.createdAt,
        updatedAt: bills.updatedAt,
      })
      .from(bills)
      .leftJoin(sql`customers c`, sql`c.id = ${bills.customerId}`)
      .where(eq(bills.id, id))
      .limit(1);

    if (!header) return null;

    // 2. Items
    const items = await db
      .select({
        id: billItems.id,
        variantId: billItems.variantId,
        unitId: billItems.unitId,
        quantity: billItems.quantity,
        unitPrice: billItems.unitPrice,
        lineTotal: billItems.lineTotal,
        lineCogs: billItems.lineCogs,
        productName: sql<string>`p.name`,
        variantName: sql<string>`v.name`,
        baseUnitShortName: sql<string>`u.short_name`,
        unitName: sql<string>`unit.name`,
      })
      .from(billItems)
      .innerJoin(sql`variants v`, sql`v.id = ${billItems.variantId}`)
      .innerJoin(sql`products p`, sql`p.id = v.product_id`)
      .innerJoin(sql`units u`, sql`u.id = v.base_unit_id`)
      .innerJoin(sql`units unit`, sql`unit.id = ${billItems.unitId}`)
      .where(eq(billItems.billId, id))
      .orderBy(asc(billItems.id));

    // 3. FIFO per item
    const fifoRows = await db
      .select({
        id: billItemFifo.id,
        billItemId: billItemFifo.billItemId,
        batchId: billItemFifo.batchId,
        quantityConsumed: billItemFifo.quantityConsumed,
        unitCost: billItemFifo.unitCost,
        batchPurchaseDate: stockBatches.purchaseDate,
      })
      .from(billItemFifo)
      .innerJoin(
        stockBatches,
        eq(stockBatches.id, billItemFifo.batchId)
      )
      .where(
        sql`${billItemFifo.billItemId} IN (SELECT id FROM bill_items WHERE bill_id = ${id})`
      );

    const fifoByItem: Record<number, BillItemFifoEntry[]> = {};
    for (const r of fifoRows) {
      const arr = fifoByItem[r.billItemId] ?? [];
      arr.push({
        id: r.id,
        batchId: r.batchId,
        batchPurchaseDate: Math.floor(r.batchPurchaseDate.getTime() / 1000),
        quantityConsumed: r.quantityConsumed,
        unitCost: r.unitCost,
      });
      fifoByItem[r.billItemId] = arr;
    }

    const itemsDto: BillItem[] = items.map((i) => ({
      id: i.id,
      variantId: i.variantId,
      productName: i.productName,
      variantName: i.variantName,
      baseUnitShortName: i.baseUnitShortName,
      unitId: i.unitId,
      unitName: i.unitName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
      lineCogs: i.lineCogs,
    }));

    return {
      ...toBillDto(header),
      items: itemsDto,
      fifo: fifoByItem,
    };
  },

  async list(query: BillListQuery): Promise<Bill[]> {
    const db = getDb();
    const conditions = [];

    if (query.customerId) {
      conditions.push(eq(bills.customerId, query.customerId));
    }
    if (query.status) {
      conditions.push(eq(bills.status, query.status));
    }
    if (query.fromDate) {
      conditions.push(gte(bills.billDate, query.fromDate));
    }
    if (query.toDate) {
      conditions.push(lte(bills.billDate, query.toDate));
    }
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(like(bills.billNumber, term), like(sql`c.name`, term))
      );
    }

    const rows = await db
      .select({
        id: bills.id,
        billNumber: bills.billNumber,
        customerId: bills.customerId,
        customerName: sql<string | null>`c.name`,
        billDate: bills.billDate,
        totalAmount: bills.totalAmount,
        paidAmount: bills.paidAmount,
        remainingAmount: bills.remainingAmount,
        cogs: bills.cogs,
        status: bills.status,
        remarks: bills.remarks,
        itemCount: sql<number>`(SELECT COUNT(*) FROM bill_items WHERE bill_id = ${bills.id})`,
        createdAt: bills.createdAt,
        updatedAt: bills.updatedAt,
      })
      .from(bills)
      .leftJoin(sql`customers c`, sql`c.id = ${bills.customerId}`)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(bills.billDate), desc(bills.id))
      .limit(query.limit)
      .offset(query.offset);

    return rows.map(toBillDto);
  },

  async count(
    query: Pick<BillListQuery, "customerId" | "status" | "fromDate" | "toDate">
  ): Promise<number> {
    const db = getDb();
    const conditions = [];
    if (query.customerId)
      conditions.push(eq(bills.customerId, query.customerId));
    if (query.status) conditions.push(eq(bills.status, query.status));
    if (query.fromDate)
      conditions.push(gte(bills.billDate, query.fromDate));
    if (query.toDate) conditions.push(lte(bills.billDate, query.toDate));

    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bills)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return row?.count ?? 0;
  },
};