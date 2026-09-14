import { and, asc, desc, eq, gte, isNull, lte, or, sql } from "drizzle-orm";
import { getDb } from "../database/client";
import {
  stockAdjustments,
  stockBatches,
  stockLedger,
} from "../database/schema";
import type {
  AdjustmentListQuery,
  AdjustmentType,
  CreateAdjustmentInput,
  StockAdjustment,
} from "../shared/types/adjustment";

// ---------- Helpers ----------

function toDto(row: {
  id: number;
  variantId: number;
  quantity: number;
  unitCost: number;
  adjustmentType: string;
  reason: string | null;
  adjustmentDate: Date;
  createdAt: Date;
  productName: string;
  variantName: string;
  baseUnitShortName: string;
}): StockAdjustment {
  return {
    id: row.id,
    variantId: row.variantId,
    productName: row.productName,
    variantName: row.variantName,
    baseUnitShortName: row.baseUnitShortName,
    quantity: row.quantity,
    unitCost: row.unitCost,
    adjustmentType: row.adjustmentType as AdjustmentType,
    reason: row.reason,
    adjustmentDate: Math.floor(row.adjustmentDate.getTime() / 1000),
    createdAt: Math.floor(row.createdAt.getTime() / 1000),
  };
}

function resolveSignedQuantity(input: CreateAdjustmentInput): number {
  const absQty = input.quantity;

  switch (input.adjustmentType) {
    case "damaged":
    case "lost":
      return -absQty;
    case "return":
      return absQty;
    case "correction":
      if (!input.sign) {
        throw new Error("Sign is required for correction type");
      }
      return input.sign === "negative" ? -absQty : absQty;
    default:
      throw new Error(`Unknown adjustment type: ${input.adjustmentType}`);
  }
}

// ---------- Service ----------

export const adjustmentService = {
  async create(input: CreateAdjustmentInput): Promise<StockAdjustment> {
    const db = getDb();
    const signedQty = resolveSignedQuantity(input);

    const insertedId = db.transaction((tx) => {
      // 1. Compute average cost from active batches (typed query, no raw client)
      const [costRow] = tx
        .select({
          avgCost: sql<number | null>`
            CAST(
              COALESCE(
                SUM(${stockBatches.remainingQuantity} * ${stockBatches.purchasePrice})
                  / NULLIF(SUM(${stockBatches.remainingQuantity}), 0),
                0
              ) AS INTEGER
            )
          `,
        })
        .from(stockBatches)
        .where(
          and(
            eq(stockBatches.variantId, input.variantId),
            sql`${stockBatches.remainingQuantity} > 0`
          )
        )
        .all();

      const unitCost = Math.round(costRow?.avgCost ?? 0);

      // 2. Insert the adjustment record
      const [adj] = tx
        .insert(stockAdjustments)
        .values({
          variantId: input.variantId,
          quantity: signedQty,
          unitCost,
          adjustmentType: input.adjustmentType,
          reason: input.reason ?? null,
          adjustmentDate: new Date(),
        })
        .returning({ id: stockAdjustments.id })
        .all();

      if (signedQty < 0) {
        // NEGATIVE — consume from oldest batches first (FIFO)
        let remaining = -signedQty;
        const batches = tx
          .select()
          .from(stockBatches)
          .where(
            and(
              eq(stockBatches.variantId, input.variantId),
              sql`${stockBatches.remainingQuantity} > 0`
            )
          )
          .orderBy(asc(stockBatches.purchaseDate), asc(stockBatches.id))
          .all();

        const totalAvailable = batches.reduce(
          (sum, b) => sum + b.remainingQuantity,
          0
        );
        if (totalAvailable < remaining) {
          throw new Error(
            `Not enough stock. Available: ${(totalAvailable / 1000).toFixed(3)}, requested: ${(remaining / 1000).toFixed(3)}`
          );
        }

        for (const batch of batches) {
          if (remaining <= 0) break;
          const consume = Math.min(remaining, batch.remainingQuantity);
          remaining -= consume;

          tx.update(stockBatches)
            .set({ remainingQuantity: batch.remainingQuantity - consume })
            .where(eq(stockBatches.id, batch.id))
            .run();

          tx.insert(stockLedger)
            .values({
              batchId: batch.id,
              variantId: input.variantId,
              quantityChange: -consume,
              unitCost: batch.purchasePrice,
              movementType:
                input.adjustmentType === "damaged" ? "damage" : "adjustment",
              referenceType: "adjustment",
              referenceId: adj.id,
              notes: input.reason ?? null,
            })
            .run();
        }
      } else if (signedQty > 0) {
        // POSITIVE — create a synthetic batch (no purchase)
        const [batch] = tx
          .insert(stockBatches)
          .values({
            variantId: input.variantId,
            purchaseId: null,
            purchasePrice: unitCost,
            suggestedRetailPrice: null,
            suggestedWholesalePrice: null,
            quantityPurchased: signedQty,
            remainingQuantity: signedQty,
            purchaseDate: new Date(),
          })
          .returning({ id: stockBatches.id })
          .all();

        tx.insert(stockLedger)
          .values({
            batchId: batch.id,
            variantId: input.variantId,
            quantityChange: signedQty,
            unitCost,
            movementType: "adjustment",
            referenceType: "adjustment",
            referenceId: adj.id,
            notes: input.reason ?? null,
          })
          .run();
      }

      return adj.id;
    });

    const created = await this.getById(insertedId);
    if (!created) throw new Error("Failed to load created adjustment");
    return created;
  },

  async getById(id: number): Promise<StockAdjustment | null> {
    const db = getDb();
    const rows = await db
      .select({
        id: stockAdjustments.id,
        variantId: stockAdjustments.variantId,
        quantity: stockAdjustments.quantity,
        unitCost: stockAdjustments.unitCost,
        adjustmentType: stockAdjustments.adjustmentType,
        reason: stockAdjustments.reason,
        adjustmentDate: stockAdjustments.adjustmentDate,
        createdAt: stockAdjustments.createdAt,
        productName: sql<string>`p.name`,
        variantName: sql<string>`v.name`,
        baseUnitShortName: sql<string>`u.short_name`,
      })
      .from(stockAdjustments)
      .innerJoin(sql`variants v`, sql`v.id = ${stockAdjustments.variantId}`)
      .innerJoin(sql`products p`, sql`p.id = v.product_id`)
      .innerJoin(sql`units u`, sql`u.id = v.base_unit_id`)
      .where(eq(stockAdjustments.id, id))
      .limit(1);

    return rows[0] ? toDto(rows[0]) : null;
  },

  async list(query: AdjustmentListQuery): Promise<StockAdjustment[]> {
    const db = getDb();
    const conditions = [];

    if (query.variantId) {
      conditions.push(eq(stockAdjustments.variantId, query.variantId));
    }
    if (query.adjustmentType) {
      conditions.push(
        eq(stockAdjustments.adjustmentType, query.adjustmentType)
      );
    }
    if (query.fromDate) {
      conditions.push(gte(stockAdjustments.adjustmentDate, query.fromDate));
    }
    if (query.toDate) {
      conditions.push(lte(stockAdjustments.adjustmentDate, query.toDate));
    }
    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(or(sql`p.name LIKE ${term}`, sql`v.name LIKE ${term}`));
    }

    const rows = await db
      .select({
        id: stockAdjustments.id,
        variantId: stockAdjustments.variantId,
        quantity: stockAdjustments.quantity,
        unitCost: stockAdjustments.unitCost,
        adjustmentType: stockAdjustments.adjustmentType,
        reason: stockAdjustments.reason,
        adjustmentDate: stockAdjustments.adjustmentDate,
        createdAt: stockAdjustments.createdAt,
        productName: sql<string>`p.name`,
        variantName: sql<string>`v.name`,
        baseUnitShortName: sql<string>`u.short_name`,
      })
      .from(stockAdjustments)
      .innerJoin(sql`variants v`, sql`v.id = ${stockAdjustments.variantId}`)
      .innerJoin(sql`products p`, sql`p.id = v.product_id`)
      .innerJoin(sql`units u`, sql`u.id = v.base_unit_id`)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        desc(stockAdjustments.adjustmentDate),
        desc(stockAdjustments.id)
      )
      .limit(query.limit)
      .offset(query.offset);

    return rows.map(toDto);
  },

  /**
   * Count adjustments for a variant — useful for showing "N adjustments" on
   * a variant row.
   */
  async countByVariant(variantId: number): Promise<number> {
    const db = getDb();
    const [row] = await db
      .select({ count: sql<number>`count(*)` })
      .from(stockAdjustments)
      .where(eq(stockAdjustments.variantId, variantId));
    return row?.count ?? 0;
  },
};

void isNull;