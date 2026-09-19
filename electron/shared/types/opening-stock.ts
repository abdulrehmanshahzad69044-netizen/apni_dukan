import { z } from "zod";

/**
 * One line in the opening stock entry.
 * Quantity is entered in base units (milli-units after conversion).
 * Cost is per base unit (paisa).
 */
export const openingStockLineSchema = z.object({
  variantId: z.number().int().positive(),
  /** milli-units (base unit) */
  quantity: z.number().int().positive("Quantity must be positive"),
  /** paisa per base unit */
  purchasePrice: z.number().int().nonnegative("Cost cannot be negative"),
});

export type OpeningStockLineInput = z.infer<typeof openingStockLineSchema>;

export const createOpeningStockSchema = z.object({
  lines: z.array(openingStockLineSchema).min(1, "Add at least one item"),
});

export type CreateOpeningStockInput = z.infer<typeof createOpeningStockSchema>;

export type OpeningStockEntry = {
  variantId: number;
  productName: string;
  variantName: string;
  baseUnitShortName: string;
  quantity: number;
  purchasePrice: number;
  source: string;
  purchaseDate: number;
  batchId: number;
};