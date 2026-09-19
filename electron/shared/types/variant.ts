import { z } from "zod";


export type Variant = {
  id: number;
  productId: number;
  productName: string;
  name: string;

  baseUnitId: number;
  baseUnitName: string;
  baseUnitShortName: string;

  purchaseUnitId: number | null;
  purchaseUnitName: string | null;
  purchaseUnitShortName: string | null;
  purchaseUnitFactor: number | null;

  lowStockThreshold: number | null;

  /** Pinned items sort to the top */
  pinned: boolean;

  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
};

const optionalTrimmedString = (max: number) =>
  z.union([z.string(), z.null(), z.undefined()]).transform((v) => {
    if (v === null || v === undefined) return undefined;
    const t = v.trim();
    return t === "" ? undefined : t;
  });

/**
 * Purchase unit fields must both be set or both be null.
 */
const validatePurchaseUnit = (data: {
  purchaseUnitId?: number | null;
  purchaseUnitFactor?: number | null;
}) => {
  const hasId =
    data.purchaseUnitId !== undefined &&
    data.purchaseUnitId !== null &&
    data.purchaseUnitId > 0;
  const hasFactor =
    data.purchaseUnitFactor !== undefined &&
    data.purchaseUnitFactor !== null &&
    data.purchaseUnitFactor > 0;

  // Both unset = OK
  if (!hasId && !hasFactor) return true;
  // Both set = OK
  if (hasId && hasFactor) return true;
  // One set, one not = error
  return false;
};

export const createVariantSchema = z
  .object({
    productId: z.number().int().positive(),
    name: z.string().trim().min(1, "Name is required").max(80),
    baseUnitId: z.number().int().positive(),
    purchaseUnitId: z.number().int().positive().nullable().optional(),
    purchaseUnitFactor: z
      .number()
      .int()
      .positive("Factor must be a positive whole number")
      .max(100_000)
      .nullable()
      .optional(),
    lowStockThreshold: z.number().int().nonnegative().nullable().optional(),
  })
  .refine(validatePurchaseUnit, {
    message:
      "Both purchase unit and conversion factor are required, or leave both empty",
    path: ["purchaseUnitFactor"],
  });

export const updateVariantSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string().trim().min(1).max(80).optional(),
    baseUnitId: z.number().int().positive().optional(),
    purchaseUnitId: z.number().int().positive().nullable().optional(),
    purchaseUnitFactor: z
      .number()
      .int()
      .positive("Factor must be a positive whole number")
      .max(100_000)
      .nullable()
      .optional(),
    lowStockThreshold: z.number().int().nonnegative().nullable().optional(),
  })
  .refine(validatePurchaseUnit, {
    message:
      "Both purchase unit and conversion factor are required, or leave both empty",
    path: ["purchaseUnitFactor"],
  });

export const variantListQuerySchema = z.object({
  search: z.string().trim().optional(),
  productId: z.number().int().positive().optional(),
  includeDeleted: z.boolean().optional().default(false),
  limit: z.number().int().positive().max(500).optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type CreateVariantInput = z.infer<typeof createVariantSchema>;
export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;
export type VariantListQuery = z.infer<typeof variantListQuerySchema>;

/**
 * Utility: convert a quantity expressed in purchase units to base units.
 * If no purchase factor exists, returns as-is.
 */
export function purchaseQtyToBase(
  qty: number,
  factor: number | null
): number {
  if (!factor) return qty;
  return qty * factor;
}

/**
 * Utility: convert a quantity expressed in base units to purchase units.
 */
export function baseQtyToPurchase(
  qty: number,
  factor: number | null
): number {
  if (!factor) return qty;
  return qty / factor;
}