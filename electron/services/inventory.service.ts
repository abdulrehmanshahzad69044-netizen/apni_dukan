import { getDb } from "../database/client";
import type {
  StockItem,
  StockListQuery,
} from "../shared/types/inventory";

export const inventoryService = {
  async listStock(query: StockListQuery): Promise<StockItem[]> {
    const db = getDb();

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
          v.low_stock_threshold                     AS lowStockThreshold,
          SUM(b.remaining_quantity)                 AS currentStock,
          SUM(b.remaining_quantity * b.purchase_price) AS valueMilliPaisa,
          COUNT(*)                                  AS activeBatchCount,
          MAX(b.purchase_date)                      AS lastPurchaseDate
        FROM stock_batches b
        INNER JOIN variants  v ON v.id = b.variant_id
        INNER JOIN products  p ON p.id = v.product_id
        INNER JOIN units     u ON u.id = v.base_unit_id
        WHERE b.remaining_quantity > 0
          AND v.deleted_at IS NULL
          ${query.search ? "AND (p.name LIKE @search OR v.name LIKE @search)" : ""}
        GROUP BY b.variant_id
        `
      )
      .all(query.search ? { search: `%${query.search}%` } : {}) as Array<{
      variantId: number;
      productId: number;
      productName: string;
      variantName: string;
      baseUnitId: number;
      baseUnitName: string;
      baseUnitShortName: string;
      lowStockThreshold: number | null;
      currentStock: number;
      valueMilliPaisa: number;
      activeBatchCount: number;
      lastPurchaseDate: number | null;
    }>;

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
          SELECT b1.variant_id AS variant_id,
                 b1.suggested_retail_price AS retail,
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

    let items: StockItem[] = rows.map((r) => {
      const currentStock = r.currentStock;
      const stockValuePaisa = Math.round(r.valueMilliPaisa / 1000);
      const avgCost =
        currentStock > 0
          ? Math.round(stockValuePaisa / (currentStock / 1000))
          : 0;
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
        lowStockThreshold: r.lowStockThreshold ?? null,
      };
    });

    // Filters
    if (query.filter === "out") {
      items = items.filter((i) => i.currentStock === 0);
    } else if (query.filter === "in") {
      items = items.filter((i) => i.currentStock > 0);
    } else if (query.filter === "low") {
      items = items.filter(
        (i) =>
          i.lowStockThreshold !== null &&
          i.currentStock <= i.lowStockThreshold
      );
    }

    // Sorting
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

    return items.slice(query.offset, query.offset + query.limit);
  },

  async totals(): Promise<{
    totalVariants: number;
    totalStockValue: number;
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

    // Low stock count: variants with a threshold set AND current stock <= threshold
    // Includes out-of-stock variants with a threshold.
    const [lowRow] = db.$client
      .prepare(
        `
        SELECT COUNT(*) AS lowCount
        FROM variants v
        WHERE v.deleted_at IS NULL
          AND v.low_stock_threshold IS NOT NULL
          AND COALESCE(
            (SELECT SUM(b.remaining_quantity)
             FROM stock_batches b
             WHERE b.variant_id = v.id AND b.remaining_quantity > 0),
            0
          ) <= v.low_stock_threshold
        `
      )
      .all() as Array<{ lowCount: number }>;

    // Out of stock: variants that exist but have no remaining batches
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
      lowStockCount: lowRow?.lowCount ?? 0,
      outOfStockCount: outRow?.outCount ?? 0,
    };
  },
};