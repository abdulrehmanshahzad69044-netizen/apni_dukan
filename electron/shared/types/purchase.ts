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
  purchaseId: number;
  purchaseNumber: string;
  purchasePrice: number; // paisa
  suggestedRetailPrice: number | null;
  suggestedWholesalePrice: number | null;
  quantityPurchased: number; // milli-units
  remainingQuantity: number; // milli-units
  purchaseDate: number;
};

// ---------- Purchase Line (input) ----------

/**
 * Input shape for one line in a purchase.
 * All prices are in paisa, quantities in milli-units.
 * The UI layer converts user input before sending.
 */
export const purchaseLineSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().positive("Quantity must be positive"),
  purchasePrice: z.number().int().nonnegative("Price cannot be negative"),
  suggestedRetailPrice: z.number().int().nonnegative().nullable().optional(),
  suggestedWholesalePrice: z.number().int().nonnegative().nullable().optional(),
});

export type PurchaseLineInput = z.infer<typeof purchaseLineSchema>;

export const createPurchaseSchema = z.object({
  companyId: z.number().int().positive(),
  purchaseDate: z.coerce.date().optional(),
  paidAmount: z.number().int().nonnegative().optional().default(0),
  remarks: z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined) return undefined;
    const t = v.trim();
    return t === "" ? undefined : t;
  }),
});

export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;

export const purchaseListQuerySchema = z.object({
  search: z.string().trim().optional(), // searches purchase number / company name
  companyId: z.number().int().positive().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  limit: z.number().int().positive().max(500).optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type PurchaseListQuery = z.infer<typeof purchaseListQuerySchema>;