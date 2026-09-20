import { z } from "zod";

/**
 * Product DTO with denormalized category/company names for the UI.
 * This lets the list page render without extra lookups.
 */
export type Product = {
  id: number;
  name: string;
  categoryId: number | null;
  categoryName: string | null;
  companyId: number | null;
  companyName: string | null;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
};

export const createProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(150, "Name is too long"),
  categoryId: z.number().int().positive().nullable().optional(),
  companyId: z.number().int().positive().nullable().optional(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.number().int().positive(),
});

export const productListQuerySchema = z.object({
  search: z.string().trim().optional(),
  categoryId: z.number().int().positive().optional(),
  companyId: z.number().int().positive().optional(),
  includeDeleted: z.boolean().optional().default(false),
  limit: z.number().int().positive().max(500).optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
});
// ---------- Full Product Setup ----------

export const createFullProductSchema = z.object({
  // Product
  productName: z.string().trim().min(1, "Product name is required").max(150),
  categoryId: z.number().int().positive().nullable().optional(),
  companyId: z.number().int().positive().nullable().optional(),

  // Variant
  variantName: z.string().trim().min(1, "Variant name is required").max(80),
  baseUnitId: z.number().int().positive(),
  purchaseUnitId: z.number().int().positive().nullable().optional(),
  purchaseUnitFactor: z
    .number()
    .int()
    .positive()
    .max(100_000)
    .nullable()
    .optional(),
  lowStockThreshold: z.number().int().nonnegative().nullable().optional(),

  // Opening stock
  openingQuantity: z.number().int().positive("Quantity must be positive"),
  openingCost: z.number().int().nonnegative("Cost must be non-negative"),
  suggestedRetailPrice: z.number().int().nonnegative().nullable().optional(),
  suggestedWholesalePrice: z.number().int().nonnegative().nullable().optional(),
});

export type CreateFullProductInput = z.infer<typeof createFullProductSchema>;

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;