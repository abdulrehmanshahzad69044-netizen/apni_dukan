import { z } from "zod";

/**
 * Aggregated stock info for one variant — summed across all its batches.
 */
export type StockItem = {
  variantId: number;
  productId: number;
  productName: string;
  variantName: string;
  baseUnitId: number;
  baseUnitName: string;
  baseUnitShortName: string;

  /** Total remaining quantity across all non-exhausted batches (milli-units) */
  currentStock: number;
  /** Weighted average purchase price per unit (paisa) */
  avgCost: number;
  /** Stock value = currentStock × avgCost (in paisa) */
  stockValue: number;
  /** Suggested retail price from the most recent batch (paisa, nullable) */
  latestRetailPrice: number | null;
  /** Suggested wholesale price from the most recent batch (paisa, nullable) */
  latestWholesalePrice: number | null;
  /** Number of active batches (batches with remainingQuantity > 0) */
  activeBatchCount: number;
  /** Date of the most recent purchase for this variant (unix seconds) */
  lastPurchaseDate: number | null;

  /** Optional low-stock threshold (milli-units). null = no threshold set */
  lowStockThreshold: number | null;
};

export const stockListQuerySchema = z.object({
  search: z.string().trim().optional(),
  /** "all" | "in" | "low" | "out" */
  filter: z.enum(["all", "in", "low", "out"]).optional().default("all"),
  sort: z
    .enum(["name", "stock_asc", "stock_desc", "value_desc", "value_asc"])
    .optional()
    .default("name"),
  limit: z.number().int().positive().max(1000).optional().default(500),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type StockListQuery = z.infer<typeof stockListQuerySchema>;