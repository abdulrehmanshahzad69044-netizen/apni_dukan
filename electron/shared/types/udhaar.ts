import { z } from "zod";

export type CustomerUdhaar = {
  id: number;
  customerId: number;
  customerName: string;
  amount: number; // paisa
  paidAmount: number;
  remainingAmount: number;
  udhaarDate: number; // unix seconds
  reason: string | null;
  createdAt: number;
};

export const createUdhaarSchema = z.object({
  customerId: z.number().int().positive(),
  amount: z.number().int().positive("Amount must be positive"), // paisa
  udhaarDate: z.coerce.date().optional(),
  reason: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => {
      if (v === null || v === undefined) return undefined;
      const t = v.trim();
      return t === "" ? undefined : t;
    }),
});

export type CreateUdhaarInput = z.infer<typeof createUdhaarSchema>;

export const udhaarListQuerySchema = z.object({
  customerId: z.number().int().positive().optional(),
  search: z.string().trim().optional(),
  onlyUnpaid: z.boolean().optional().default(false),
  limit: z.number().int().positive().max(500).optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type UdhaarListQuery = z.infer<typeof udhaarListQuerySchema>;