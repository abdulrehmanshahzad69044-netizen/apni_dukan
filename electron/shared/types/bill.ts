import { z } from "zod";

// ---------- Bill DTOs ----------

export type Bill = {
  id: number;
  billNumber: string;
  customerId: number | null;
  customerName: string | null;
  billDate: number; // unix seconds
  totalAmount: number; // paisa
  paidAmount: number;
  remainingAmount: number;
  cogs: number; // paisa
  grossProfit: number; // totalAmount − cogs (computed)
  status: "draft" | "held" | "finalized" | "cancelled" | "returned";
  remarks: string | null;
  itemCount: number;
  createdAt: number;
  updatedAt: number;
};

export type BillItem = {
  id: number;
  variantId: number;
  productName: string;
  variantName: string;
  baseUnitShortName: string;
  unitId: number;
  unitName: string;
  quantity: number; // milli-units
  unitPrice: number; // paisa
  lineTotal: number; // paisa
  lineCogs: number; // paisa
};

export type BillItemFifoEntry = {
  id: number;
  batchId: number;
  batchPurchaseDate: number; // unix seconds
  quantityConsumed: number; // milli-units
  unitCost: number; // paisa
};

export type BillDetail = Bill & {
  items: BillItem[];
  fifo: Record<number, BillItemFifoEntry[]>; // keyed by billItemId
};

// ---------- Shared optional-string helper ----------

/**
 * Bulletproof optional string:
 *   - accepts string | null | undefined
 *   - trims and converts empty/null/undefined → undefined
 *   - enforces max length
 *
 * Uses a union so it can NEVER fail on `undefined` or `null`.
 */
const optionalTrimmedString = (max: number) =>
  z.union([z.string(), z.null(), z.undefined()]).transform((v) => {
    if (v === null || v === undefined) return undefined;
    const t = v.trim();
    if (t === "") return undefined;
    if (t.length > max) throw new Error(`Must be at most ${max} characters`);
    return t;
  });

// ---------- Input schemas ----------

export const billLineSchema = z.object({
  variantId: z.number().int().positive(),
  unitId: z.number().int().positive(),
  quantity: z.number().int().positive("Quantity must be positive"), // milli-units
  unitPrice: z.number().int().nonnegative("Price cannot be negative"), // paisa
});

export type BillLineInput = z.infer<typeof billLineSchema>;

export const createBillSchema = z.object({
  customerId: z.number().int().positive().nullable().optional(),
  billDate: z.coerce.date().optional(),
  paidAmount: z.number().int().nonnegative().optional().default(0),
  remarks: optionalTrimmedString(500),
  status: z
    .enum(["draft", "held", "finalized"])
    .optional()
    .default("finalized"),
  lines: z.array(billLineSchema).min(1, "Add at least one item"),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;

// ---------- Query schema ----------

export const billListQuerySchema = z.object({
  search: z.string().trim().optional(),
  customerId: z.number().int().positive().optional(),
  status: z
    .enum(["draft", "held", "finalized", "cancelled", "returned"])
    .optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  limit: z.number().int().positive().max(500).optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type BillListQuery = z.infer<typeof billListQuerySchema>;