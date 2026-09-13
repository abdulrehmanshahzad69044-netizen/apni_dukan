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

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;