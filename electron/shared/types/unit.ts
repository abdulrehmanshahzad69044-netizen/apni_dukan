import { z } from "zod";

export type Unit = {
  id: number;
  name: string;
  shortName: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
};

export const createUnitSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(40),
  shortName: z.string().trim().min(1, "Short name is required").max(10),
});

export const updateUnitSchema = createUnitSchema.partial().extend({
  id: z.number().int().positive(),
});

export const unitListQuerySchema = z.object({
  search: z.string().trim().optional(),
  includeDeleted: z.boolean().optional().default(false),
  limit: z.number().int().positive().max(500).optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
export type UnitListQuery = z.infer<typeof unitListQuerySchema>;