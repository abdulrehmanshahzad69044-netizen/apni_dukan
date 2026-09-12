import { z } from "zod";

// ---------- Unit ----------

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

// ---------- Unit Conversion ----------

/**
 * Conversion DTO as seen by the renderer.
 * `factor` is milli-factor (integer × 1000). 12000 means 12.
 */
export type UnitConversion = {
  id: number;
  fromUnitId: number;
  toUnitId: number;
  fromUnitName: string;
  fromUnitShortName: string;
  toUnitName: string;
  toUnitShortName: string;
  factor: number;
  createdAt: number;
  updatedAt: number;
};

export const createUnitConversionSchema = z
  .object({
    fromUnitId: z.number().int().positive(),
    toUnitId: z.number().int().positive(),
    factor: z
      .number()
      .positive("Factor must be positive")
      .max(1_000_000_000, "Factor too large"),
  })
  .refine((v) => v.fromUnitId !== v.toUnitId, {
    message: "From and To units must be different",
    path: ["toUnitId"],
  });

export const updateUnitConversionSchema = z.object({
  id: z.number().int().positive(),
  factor: z
    .number()
    .positive("Factor must be positive")
    .max(1_000_000_000, "Factor too large"),
});

export type CreateUnitConversionInput = z.infer<
  typeof createUnitConversionSchema
>;
export type UpdateUnitConversionInput = z.infer<
  typeof updateUnitConversionSchema
>;