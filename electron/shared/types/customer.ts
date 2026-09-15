import { z } from "zod";

/**
 * Customer DTO — what the renderer sees.
 * Note: money fields are always in paisa (integer). Display layer divides by 100.
 */
export type Customer = {
  id: number;
  name: string;
  contactNumber: string | null;
  address: string | null;
  cachedOutstanding: number;
  createdAt: number;   // unix seconds (Drizzle returns Date, we serialize to number)
  updatedAt: number;
  deletedAt: number | null;
};

// ---------- Input schemas (validated on main process) ----------

export const createCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name is too long"),
  contactNumber: z
  .string()
  .trim()
  .max(30)
  .optional()
  .transform((v) => (v === "" || v === undefined ? undefined : v)),
  address: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});

export const updateCustomerSchema = createCustomerSchema.partial().extend({
  id: z.number().int().positive(),
});

export const customerListQuerySchema = z.object({
  search: z.string().trim().optional(),
  includeDeleted: z.boolean().optional().default(false),
  limit: z.number().int().positive().max(500).optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;