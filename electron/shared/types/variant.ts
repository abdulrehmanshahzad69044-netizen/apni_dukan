import { z } from "zod";

export type Variant = {
  id: number;
  productId: number;
  productName: string;
  name: string;
  baseUnitId: number;
  baseUnitName: string;
  baseUnitShortName: string;
  /** milli-units; null = no threshold */
  lowStockThreshold: number | null;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
};

export const createVariantSchema = z.object({
  productId: z.number().int().positive(),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name is too long"),
  baseUnitId: z.number().int().positive(),
  /** milli-units; null / undefined = no threshold */
  lowStockThreshold: z.number().int().nonnegative().nullable().optional(),
});

export const updateVariantSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1).max(80).optional(),
  baseUnitId: z.number().int().positive().optional(),
  lowStockThreshold: z.number().int().nonnegative().nullable().optional(),
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