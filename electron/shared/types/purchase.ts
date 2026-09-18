import { z } from "zod";

// ---------- Purchase ----------

export type Purchase = {
  id: number;
  purchaseNumber: string;
  companyId: number;
  companyName: string;
  purchaseDate: number; // unix seconds
  totalAmount: number; // paisa
  paidAmount: number; // paisa
  remarks: string | null;
  createdAt: number;
  updatedAt: number;
};

// ---------- Stock Batch ----------

export type StockBatch = {
  id: number;
  variantId: number;
  variantName: string;
  productName: string;
  baseUnitShortName: string;
  purchaseUnitShortName: string | null;
  purchaseUnitFactor: number | null;
  purchaseId: number;
  purchaseNumber: string;
  purchasePrice: number;
  suggestedRetailPrice: number | null;
  suggestedWholesalePrice: number | null;
  quantityPurchased: number;
  remainingQuantity: number;
  purchaseDate: number;
};

// ---------- Shared optional-string helper ----------

/**
 * Bulletproof optional string: accepts string | null | undefined,
 * trims, converts empty/null/undefined → undefined.
 */
const optionalTrimmedString = (max: number) =>
  z.union([z.string(), z.null(), z.undefined()]).transform((v) => {
    if (v === null || v === undefined) return undefined;
    const t = v.trim();
    if (t === "") return undefined;
    if (t.length > max) throw new Error(`Must be at most ${max} characters`);
    return t;
  });

// ---------- Purchase Line ----------

export const purchaseLineSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().positive("Quantity must be positive"),
  purchasePrice: z.number().int().nonnegative("Price cannot be negative"),
  suggestedRetailPrice: z.number().int().nonnegative().nullable().optional(),
  suggestedWholesalePrice: z.number().int().nonnegative().nullable().optional(),
});

export type PurchaseLineInput = z.infer<typeof purchaseLineSchema>;

// ---------- Create Purchase ----------

export const createPurchaseSchema = z.object({
  companyId: z.number().int().positive(),
  purchaseDate: z.coerce.date().optional(),
  paidAmount: z.number().int().nonnegative().optional().default(0),
  remarks: optionalTrimmedString(500),
  lines: z.array(purchaseLineSchema).min(1, "Add at least one line"),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

// ---------- List Query ----------

export const purchaseListQuerySchema = z.object({
  search: z.string().trim().optional(),
  companyId: z.number().int().positive().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  limit: z.number().int().positive().max(500).optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type PurchaseListQuery = z.infer<typeof purchaseListQuerySchema>;