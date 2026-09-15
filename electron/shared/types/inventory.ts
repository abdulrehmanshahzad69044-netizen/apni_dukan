import { z } from "zod";

export type StockItem = {
  variantId: number;
  productId: number;
  productName: string;
  variantName: string;
  baseUnitId: number;
  baseUnitName: string;
  baseUnitShortName: string;

  currentStock: number;
  avgCost: number;
  stockValue: number;
  latestRetailPrice: number | null;
  latestWholesalePrice: number | null;
  activeBatchCount: number;
  lastPurchaseDate: number | null;
  lowStockThreshold: number | null;
};

export const stockListQuerySchema = z.object({
  search: z.string().trim().optional(),
  filter: z.enum(["all", "in", "low", "out"]).optional().default("all"),
  sort: z
    .enum(["name", "stock_asc", "stock_desc", "value_desc", "value_asc"])
    .optional()
    .default("name"),
  limit: z.number().int().positive().max(1000).optional().default(500),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type StockListQuery = z.infer<typeof stockListQuerySchema>;

/**
 * One row in a variant's price history — one purchase batch.
 */
export type PriceHistoryEntry = {
  batchId: number;
  purchaseId: number | null;
  purchaseNumber: string | null;
  companyName: string | null;
  purchaseDate: number; // unix seconds
  purchasePrice: number; // paisa
  quantityPurchased: number; // milli-units
  remainingQuantity: number; // milli-units
  suggestedRetailPrice: number | null;
  suggestedWholesalePrice: number | null;
};

export const priceHistoryQuerySchema = z.object({
  variantId: z.number().int().positive(),
});

export type PriceHistoryQuery = z.infer<typeof priceHistoryQuerySchema>;