import { and, asc, desc, eq, gte, like, lte, or, sql } from "drizzle-orm";
import { getDb } from "../database/client";
import {
  purchases,
  stockBatches,
  stockLedger,
} from "../database/schema";
import type {
  CreatePurchaseInput,
  Purchase,
  PurchaseListQuery,
  StockBatch,
} from "../shared/types/purchase";

// ---------- Helpers ----------

function toPurchaseDto(row: {
  id: number;
  purchaseNumber: string;
  companyId: number;
  purchaseDate: Date;
  totalAmount: number;
  paidAmount: number;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
  companyName: string;
}): Purchase {
  return {
    id: row.id,
    purchaseNumber: row.purchaseNumber,
    companyId: row.companyId,
    companyName: row.companyName,
    purchaseDate: Math.floor(row.purchaseDate.getTime() / 1000),
    totalAmount: row.totalAmount,
    paidAmount: row.paidAmount,
    remarks: row.remarks,
    createdAt: Math.floor(row.createdAt.getTime() / 1000),
    updatedAt: Math.floor(row.updatedAt.getTime() / 1000),
  };
}

/**
 * Generate a human-readable purchase number.
 * Format: PUR-YYYY-NNNN (e.g. PUR-2026-0001)
 * Uniqueness enforced by the DB unique constraint; we query the max for the
 * current year and increment.
 */
async function generatePurchaseNumber(): Promise<string> {
  const db = getDb();
  const year = new Date().getFullYear();
  const prefix = `PUR-${year}-`;

  const [row] = await db
    .select({ max: sql<string | null>`max(${purchases.purchaseNumber})` })
    .from(purchases)
    .where(like(purchases.purchaseNumber, `${prefix}%`));

  const lastNumber = row?.max
    ? parseInt(row.max.slice(prefix.length), 10)
    : 0;
  const next = (lastNumber + 1).toString().padStart(4, "0");
  return `${prefix}${next}`;
}

// ---------- Service ----------

export const purchaseService = {
  /**
   * Create a purchase + batches + ledger entries in ONE transaction.
   * If any step fails, nothing is written.
   */
  async create(input: CreatePurchaseInput): Promise<Purchase> {
    const db = getDb();

    // Compute total from lines
    const totalAmount = input.lines.reduce(
      (sum, line) => sum + line.quantity * line.purchasePrice,
      0
    );

    const purchaseDate = input.purchaseDate ?? new Date();
    const purchaseNumber = await generatePurchaseNumber();

    // better-sqlite3 transactions are synchronous. Drizzle wraps this
    // pattern with .transaction(tx => ...). We do the writes inside.
    const insertedId = db.transaction((tx) => {
      // 1. Insert purchase header
      const [purchase] = tx
        .insert(purchases)
        .values({
          purchaseNumber,
          companyId: input.companyId,
          purchaseDate,
          totalAmount,
          paidAmount: input.paidAmount ?? 0,
          remarks: input.remarks ?? null,
        })
        .returning({ id: purchases.id })
        .all();

      // 2. Insert batch + ledger for each line
      for (const line of input.lines) {
        const [batch] = tx
          .insert(stockBatches)
          .values({
            variantId: line.variantId,
            purchaseId: purchase.id,
            purchasePrice: line.purchasePrice,
            suggestedRetailPrice: line.suggestedRetailPrice ?? null,
            suggestedWholesalePrice: line.suggestedWholesalePrice ?? null,
            quantityPurchased: line.quantity,
            remainingQuantity: line.quantity,
            purchaseDate,
          })
          .returning({ id: stockBatches.id })
          .all();

        tx.insert(stockLedger)
          .values({
            batchId: batch.id,
            variantId: line.variantId,
            quantityChange: line.quantity, // positive = stock in
            unitCost: line.purchasePrice,
            movementType: "purchase",
            referenceType: "purchase",
            referenceId: purchase.id,
            notes: null,
          })
          .run();
      }

      return purchase.id;
    });

    const created = await this.getById(insertedId);
    if (!created) throw new Error("Failed to load created purchase");
    return created;
  },

  async list(query: PurchaseListQuery): Promise<Purchase[]> {
    const db = getDb();
    const conditions = [];

    if (query.companyId) {
      conditions.push(eq(purchases.companyId, query.companyId));
    }
    if (query.fromDate) {
      conditions.push(gte(purchases.purchaseDate, query.fromDate));
    }
    if (query.toDate) {
      conditions.push(lte(purchases.purchaseDate, query.toDate));
    }
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        or(
          like(purchases.purchaseNumber, term),
          like(sql`c.name`, term)
        )
      );
    }

    const rows = await db
      .select({
        id: purchases.id,
        purchaseNumber: purchases.purchaseNumber,
        companyId: purchases.companyId,
        purchaseDate: purchases.purchaseDate,
        totalAmount: purchases.totalAmount,
        paidAmount: purchases.paidAmount,
        remarks: purchases.remarks,
        createdAt: purchases.createdAt,
        updatedAt: purchases.updatedAt,
        companyName: sql<string>`c.name`,
      })
      .from(purchases)
      .innerJoin(sql`companies AS c`, sql`c.id = ${purchases.companyId}`)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(purchases.purchaseDate), desc(purchases.id))
      .limit(query.limit)
      .offset(query.offset);

    return rows.map(toPurchaseDto);
  },

  async getById(id: number): Promise<Purchase | null> {
    const db = getDb();
    const rows = await db
      .select({
        id: purchases.id,
        purchaseNumber: purchases.purchaseNumber,
        companyId: purchases.companyId,
        purchaseDate: purchases.purchaseDate,
        totalAmount: purchases.totalAmount,
        paidAmount: purchases.paidAmount,
        remarks: purchases.remarks,
        createdAt: purchases.createdAt,
        updatedAt: purchases.updatedAt,
        companyName: sql<string>`c.name`,
      })
      .from(purchases)
      .innerJoin(sql`companies AS c`, sql`c.id = ${purchases.companyId}`)
      .where(eq(purchases.id, id))
      .limit(1);

    return rows[0] ? toPurchaseDto(rows[0]) : null;
  },

  /**
   * Get all batches created by a specific purchase.
   */
  async getBatches(purchaseId: number): Promise<StockBatch[]> {
    const db = getDb();
    const rows = await db
      .select({
        id: stockBatches.id,
        variantId: stockBatches.variantId,
        purchaseId: stockBatches.purchaseId,
        purchasePrice: stockBatches.purchasePrice,
        suggestedRetailPrice: stockBatches.suggestedRetailPrice,
        suggestedWholesalePrice: stockBatches.suggestedWholesalePrice,
        quantityPurchased: stockBatches.quantityPurchased,
        remainingQuantity: stockBatches.remainingQuantity,
        purchaseDate: stockBatches.purchaseDate,
        variantName: sql<string>`v.name`,
        productName: sql<string>`p.name`,
        baseUnitShortName: sql<string>`u.short_name`,
        purchaseNumber: sql<string>`pur.purchase_number`,
      })
      .from(stockBatches)
      .innerJoin(sql`variants AS v`, sql`v.id = ${stockBatches.variantId}`)
      .innerJoin(sql`products AS p`, sql`p.id = v.product_id`)
      .innerJoin(sql`units AS u`, sql`u.id = v.base_unit_id`)
      .innerJoin(
        sql`purchases AS pur`,
        sql`pur.id = ${stockBatches.purchaseId}`
      )
      .where(eq(stockBatches.purchaseId, purchaseId))
      .orderBy(asc(stockBatches.id));

    return rows.map((row) => ({
      id: row.id,
      variantId: row.variantId,
      variantName: row.variantName,
      productName: row.productName,
      baseUnitShortName: row.baseUnitShortName,
      purchaseId: row.purchaseId,
      purchaseNumber: row.purchaseNumber,
      purchasePrice: row.purchasePrice,
      suggestedRetailPrice: row.suggestedRetailPrice,
      suggestedWholesalePrice: row.suggestedWholesalePrice,
      quantityPurchased: row.quantityPurchased,
      remainingQuantity: row.remainingQuantity,
      purchaseDate: Math.floor(row.purchaseDate.getTime() / 1000),
    }));
  },

  async count(
    query: Pick<PurchaseListQuery, "companyId" | "fromDate" | "toDate">
  ): Promise<number> {
    const db = getDb();
    const conditions = [];
    if (query.companyId)
      conditions.push(eq(purchases.companyId, query.companyId));
    if (query.fromDate)
      conditions.push(gte(purchases.purchaseDate, query.fromDate));
    if (query.toDate)
      conditions.push(lte(purchases.purchaseDate, query.toDate));

    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(purchases)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return row?.count ?? 0;
  },

  /**
   * Update paid amount (used for company payments later).
   * Not a full CRUD update — purchases are immutable documents.
   */
  async setPaidAmount(id: number, paidAmount: number): Promise<void> {
    const db = getDb();
    await db
      .update(purchases)
      .set({ paidAmount, updatedAt: new Date() })
      .where(eq(purchases.id, id));
  },
};