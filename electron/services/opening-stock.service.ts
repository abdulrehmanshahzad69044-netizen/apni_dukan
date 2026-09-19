import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "../database/client";
import {
    stockBatches,
    stockLedger,
} from "../database/schema";
import type {
    CreateOpeningStockInput,
    OpeningStockEntry,
} from "../shared/types/opening-stock";

export const openingStockService = {
    /**
     * Create opening stock batches for a list of variants.
     * Each batch is marked with source = "opening" and gets a stock ledger entry.
     */
    async create(input: CreateOpeningStockInput): Promise<OpeningStockEntry[]> {
        const db = getDb();
        const now = new Date();

        const ids = db.transaction((tx) => {
            const createdIds: number[] = [];

            for (const line of input.lines) {
                const [batch] = tx
                    .insert(stockBatches)
                    .values({
                        variantId: line.variantId,
                        purchaseId: null,
                        purchasePrice: line.purchasePrice,
                        suggestedRetailPrice: null,
                        suggestedWholesalePrice: null,
                        quantityPurchased: line.quantity,
                        remainingQuantity: line.quantity,
                        purchaseDate: now,
                        source: "opening",
                    })
                    .returning({ id: stockBatches.id })
                    .all();

                tx.insert(stockLedger)
                    .values({
                        batchId: batch.id,
                        variantId: line.variantId,
                        quantityChange: line.quantity,
                        unitCost: line.purchasePrice,
                        movementType: "purchase",
                        referenceType: null,
                        referenceId: null,
                        notes: "Opening stock",
                    })
                    .run();

                createdIds.push(batch.id);
            }

            return createdIds;
        });

        return this.getEntriesByIds(ids);
    },

    /**
     * List existing opening stock entries.
     */
    async list(): Promise<OpeningStockEntry[]> {
        const db = getDb();
        const rows = await db
            .select({
                batchId: stockBatches.id,
                variantId: stockBatches.variantId,
                quantity: stockBatches.quantityPurchased,
                purchasePrice: stockBatches.purchasePrice,
                source: stockBatches.source,
                purchaseDate: stockBatches.purchaseDate,
                productName: sql<string>`p.name`,
                variantName: sql<string>`v.name`,
                baseUnitShortName: sql<string>`u.short_name`,
            })
            .from(stockBatches)
            .innerJoin(sql`variants v`, sql`v.id = ${stockBatches.variantId}`)
            .innerJoin(sql`products p`, sql`p.id = v.product_id`)
            .innerJoin(sql`units u`, sql`u.id = v.base_unit_id`)
            .where(eq(stockBatches.source, "opening"))
            .orderBy(desc(stockBatches.id));

        return rows.map((r) => ({
            batchId: r.batchId,
            variantId: r.variantId,
            quantity: r.quantity,
            purchasePrice: r.purchasePrice,
            source: r.source,
            purchaseDate: Math.floor(r.purchaseDate.getTime() / 1000),
            productName: r.productName,
            variantName: r.variantName,
            baseUnitShortName: r.baseUnitShortName,
        }));
    },

    /**
     * Get entries by batch IDs.
     */
    async getEntriesByIds(batchIds: number[]): Promise<OpeningStockEntry[]> {
        if (batchIds.length === 0) return [];
        const db = getDb();
        const ids = batchIds.map((id) => `'${id}'`).join(",");
        const rows = db.$client
            .prepare(
                `
        SELECT
          b.id                   AS batchId,
          b.variant_id           AS variantId,
          b.quantity_purchased   AS quantity,
          b.purchase_price       AS purchasePrice,
          b.source               AS source,
          b.purchase_date        AS purchaseDate,
          p.name                 AS productName,
          v.name                 AS variantName,
          u.short_name           AS baseUnitShortName
        FROM stock_batches b
        INNER JOIN variants v ON v.id = b.variant_id
        INNER JOIN products p ON p.id = v.product_id
        INNER JOIN units    u ON u.id = v.base_unit_id
        WHERE b.id IN (${ids})
        `
            )
            .all() as Array<{
                batchId: number;
                variantId: number;
                quantity: number;
                purchasePrice: number;
                source: string;
                purchaseDate: number;
                productName: string;
                variantName: string;
                baseUnitShortName: string;
            }>;

        return rows.map((r) => ({
            batchId: r.batchId,
            variantId: r.variantId,
            quantity: r.quantity,
            purchasePrice: r.purchasePrice,
            source: r.source,
            purchaseDate: Math.floor(r.purchaseDate),
            productName: r.productName,
            variantName: r.variantName,
            baseUnitShortName: r.baseUnitShortName,
        }));
    },

    /**
     * Delete an opening stock batch (only if source = "opening").
     */
    async remove(batchId: number): Promise<void> {
        const db = getDb();

        db.transaction((tx) => {
            const [batch] = tx
                .select()
                .from(stockBatches)
                .where(
                    and(
                        eq(stockBatches.id, batchId),
                        eq(stockBatches.source, "opening")
                    )
                )
                .limit(1)
                .all();

            if (!batch) {
                throw new Error("Opening stock entry not found or not deletable");
            }

            // Only allow deletion if fully unconsumed
            if (batch.remainingQuantity !== batch.quantityPurchased) {
                throw new Error(
                    "Cannot delete — this opening stock has been partially sold."
                );
            }

            // Delete associated ledger entry
            tx.delete(stockLedger)
                .where(eq(stockLedger.batchId, batchId))
                .run();

            tx.delete(stockBatches)
                .where(eq(stockBatches.id, batchId))
                .run();
        });
    },
};