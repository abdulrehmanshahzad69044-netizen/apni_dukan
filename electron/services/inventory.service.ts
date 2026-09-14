import { and, asc, desc, eq, isNull, like, or, sql } from "drizzle-orm";
import { getDb } from "../database/client";
import { stockBatches } from "../database/schema";
import type {
  StockItem,
  StockListQuery,
} from "../shared/types/inventory";

/**
 * Aggregate all non-exhausted batches per variant into a single stock row.
 *
 * We compute:
 *   currentStock  = SUM(remainingQuantity)
 *   stockValue    = SUM(remainingQuantity × purchasePrice)   [in paisa-milli units]
 *   avgCost       = stockValue / currentStock                [back to paisa]
 *
 * Note on units:
 *   remainingQuantity is milli-units (× 1000)
 *   purchasePrice is paisa (× 100)
 *
 *   Value in paisa: SUM(remaining × price) / 1000
 *   Average cost in paisa: (SUM(remaining × price) / 1000) / (SUM(remaining) / 1000)
 *                        = SUM(remaining × price) / SUM(remaining)
 */
export const inventoryService = {
  async listStock(query: StockListQuery): Promise<StockItem[]> {
    const db = getDb();

    // Base aggregation across batches
    // We group by variant_id and join to variant/product/unit for display.
    const conditions = [sql`b.remaining_quantity > 0`];

    if (query.search) {
      const term = `%${query.search}%`;
      conditions.push(
        sql`(p.name LIKE ${term} OR v.name LIKE ${term})`
      );
    }

    // Build aggregation query using raw SQL for clarity
    const rows = db.$client
      .prepare(
        `
        SELECT
          b.variant_id                              AS variantId,
          v.product_id                              AS productId,
          p.name                                    AS productName,
          v.name                                    AS variantName,
          v.base_unit_id                            AS baseUnitId,
          u.name                                    AS baseUnitName,
          u.short_name                              AS baseUnitShortName,
          SUM(b.remaining_quantity)                 AS currentStock,
          SUM(b.remaining_quantity * b.purchase_price) AS valueMilliPaisa,
          COUNT(*)                                  AS activeBatchCount,
          MAX(b.purchase_date)                      AS lastPurchaseDate
        FROM stock_batches b
        INNER JOIN variants  v ON v.id = b.variant_id
        INNER JOIN products  p ON p.id = v.product_id
        INNER JOIN units     u ON u.id = v.base_unit_id
        WHERE ${conditions.map(() => "1=1").join(" AND ")}
          AND b.remaining_quantity > 0
          ${query.search ? "AND (p.name LIKE @search OR v.name LIKE @search)" : ""}
        GROUP BY b.variant_id
        `
      )
      .all(
        query.search ? { search: `%${query.search}%` } : {}
      ) as Array<{
      variantId: number;
      productId: number;
      productName: string;
      variantName: string;
      baseUnitId: number;
      baseUnitName: string;
      baseUnitShortName: string;
      currentStock: number;
      valueMilliPaisa: number;
      activeBatchCount: number;
      lastPurchaseDate: number | null;
    }>;

    // Fetch the latest batch's suggested prices per variant separately.
    // (Cleaner than doing it in the aggregate query.)
    const variantIds = rows.map((r) => r.variantId);
    const latestPrices = new Map<
      number,
      { retail: number | null; wholesale: number | null }
    >();

    if (variantIds.length > 0) {
      const placeholders = variantIds.map(() => "?").join(",");
      const priceRows = db.$client
        .prepare(
          `
          SELECT b1.variant_id, b1.suggested_retail_price AS retail,
                 b1.suggested_wholesale_price AS wholesale
          FROM stock_batches b1
          INNER JOIN (
            SELECT variant_id, MAX(purchase_date) AS max_date
            FROM stock_batches
            WHERE variant_id IN (${placeholders})
            GROUP BY variant_id
          ) b2 ON b2.variant_id = b1.variant_id AND b2.max_date = b1.purchase_date
          GROUP BY b1.variant_id
          `
        )
        .all(...variantIds) as Array<{
        variant_id: number;
        retail: number | null;
        wholesale: number | null;
      }>;

      for (const pr of priceRows) {
        latestPrices.set(pr.variant_id, {
          retail: pr.retail,
          wholesale: pr.wholesale,
        });
      }
    }

    // Compute derived fields
    let items: StockItem[] = rows.map((r) => {
      const currentStock = r.currentStock;
      const stockValuePaisa = Math.round(r.valueMilliPaisa / 1000);
      const avgCost =
        currentStock > 0 ? Math.round(stockValuePaisa / (currentStock / 1000)) : 0;
      const prices = latestPrices.get(r.variantId);

      return {
        variantId: r.variantId,
        productId: r.productId,
        productName: r.productName,
        variantName: r.variantName,
        baseUnitId: r.baseUnitId,
        baseUnitName: r.baseUnitName,
        baseUnitShortName: r.baseUnitShortName,
        currentStock,
        avgCost,
        stockValue: stockValuePaisa,
        latestRetailPrice: prices?.retail ?? null,
        latestWholesalePrice: prices?.wholesale ?? null,
        activeBatchCount: r.activeBatchCount,
        lastPurchaseDate: r.lastPurchaseDate
          ? Math.floor(r.lastPurchaseDate)
          : null,
        lowStockThreshold: null, // populated in Phase 2.7
      };
    });

    // In-memory filters (small dataset, safe)
    if (query.filter === "out") {
      items = items.filter((i) => i.currentStock === 0);
    } else if (query.filter === "in") {
      items = items.filter((i) => i.currentStock > 0);
    } else if (query.filter === "low") {
      // Only variants with a threshold AND stock <= threshold
      items = items.filter(
        (i) =>
          i.lowStockThreshold !== null &&
          i.currentStock <= i.lowStockThreshold
      );
    }

    // Sort
    const sort = query.sort ?? "name";
    items.sort((a, b) => {
      switch (sort) {
        case "name":
          return (
            a.productName.localeCompare(b.productName) ||
            a.variantName.localeCompare(b.variantName)
          );
        case "stock_asc":
          return a.currentStock - b.currentStock;
        case "stock_desc":
          return b.currentStock - a.currentStock;
        case "value_asc":
          return a.stockValue - b.stockValue;
        case "value_desc":
          return b.stockValue - a.stockValue;
        default:
          return 0;
      }
    });

    // Pagination
    return items.slice(query.offset, query.offset + query.limit);
  },

  /**
   * Aggregate inventory totals for dashboard tiles.
   */
  async totals(): Promise<{
    totalVariants: number;
    totalStockValue: number; // paisa
    lowStockCount: number;
    outOfStockCount: number;
  }> {
    const db = getDb();

    const [row] = db.$client
      .prepare(
        `
        SELECT
          COUNT(DISTINCT variant_id) AS totalVariants,
          COALESCE(SUM(remaining_quantity * purchase_price) / 1000, 0) AS valuePaisa
        FROM stock_batches
        WHERE remaining_quantity > 0
        `
      )
      .all() as Array<{ totalVariants: number; valuePaisa: number }>;

    // Out of stock count — variants that exist but have no remaining batches
    const [outRow] = db.$client
      .prepare(
        `
        SELECT COUNT(*) AS outCount
        FROM variants v
        WHERE NOT EXISTS (
          SELECT 1 FROM stock_batches b
          WHERE b.variant_id = v.id AND b.remaining_quantity > 0
        )
        AND v.deleted_at IS NULL
        `
      )
      .all() as Array<{ outCount: number }>;

    return {
      totalVariants: row?.totalVariants ?? 0,
      totalStockValue: Math.round(row?.valuePaisa ?? 0),
      lowStockCount: 0, // Phase 2.7
      outOfStockCount: outRow?.outCount ?? 0,
    };
  },
};

// Silence unused import warnings — remove these when reusing
void and;
void asc;
void desc;
void eq;
void isNull;
void like;
void or;
void stockBatches;