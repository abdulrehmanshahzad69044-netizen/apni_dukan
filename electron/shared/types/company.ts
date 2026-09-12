import { z } from "zod";

export type Company = {
  id: number;
  name: string;
  contactNumber: string | null;
  createdAt: number; // unix seconds
  updatedAt: number;
  deletedAt: number | null;
};

// ---------- Input schemas ----------

export const createCompanySchema = z.object({
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
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
});

export const updateCompanySchema = createCompanySchema.partial().extend({
  id: z.number().int().positive(),
});

export const companyListQuerySchema = z.object({
  search: z.string().trim().optional(),
  includeDeleted: z.boolean().optional().default(false),
  limit: z.number().int().positive().max(500).optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CompanyListQuery = z.infer<typeof companyListQuerySchema>;