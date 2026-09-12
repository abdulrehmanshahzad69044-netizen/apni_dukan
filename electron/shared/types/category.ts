import { z } from "zod";

export type Category = {
  id: number;
  name: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
};

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(80, "Name is too long"),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.number().int().positive(),
});

export const categoryListQuerySchema = z.object({
  search: z.string().trim().optional(),
  includeDeleted: z.boolean().optional().default(false),
  limit: z.number().int().positive().max(500).optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryListQuery = z.infer<typeof categoryListQuerySchema>;