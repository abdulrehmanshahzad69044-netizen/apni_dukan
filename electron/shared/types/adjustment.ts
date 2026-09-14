import { z } from "zod";

export const ADJUSTMENT_TYPES = [
  "damaged",
  "lost",
  "correction",
  "return",
] as const;

export type AdjustmentType = (typeof ADJUSTMENT_TYPES)[number];

export type StockAdjustment = {
  id: number;
  variantId: number;
  productName: string;
  variantName: string;
  baseUnitShortName: string;
  quantity: number; // milli-units, signed
  unitCost: number; // paisa
  adjustmentType: AdjustmentType;
  reason: string | null;
  adjustmentDate: number; // unix seconds
  createdAt: number;
};

/**
 * Input for creating an adjustment.
 *
 * `quantity` is UNSIGNED milli-units. The service negates it for
 * write-offs (damaged / lost) and for negative corrections.
 */
export const createAdjustmentSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().positive("Quantity must be positive"),
  adjustmentType: z.enum(ADJUSTMENT_TYPES),
  /**
   * For "correction": positive = found, negative = missing.
   * For "damaged" / "lost": always negative (write-off).
   * For "return": always positive.
   */
  sign: z.enum(["positive", "negative"]).optional(),
  reason: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});

export type CreateAdjustmentInput = z.infer<typeof createAdjustmentSchema>;

export const adjustmentListQuerySchema = z.object({
  variantId: z.number().int().positive().optional(),
  adjustmentType: z.enum(ADJUSTMENT_TYPES).optional(),
  search: z.string().trim().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  limit: z.number().int().positive().max(500).optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type AdjustmentListQuery = z.infer<typeof adjustmentListQuerySchema>;