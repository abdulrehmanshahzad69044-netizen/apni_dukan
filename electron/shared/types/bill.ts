import { z } from "zod";

// ---------- Bill DTOs ----------

export type Bill = {
  id: number;
  billNumber: string;
  customerId: number | null;
  customerName: string | null;
  billDate: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  cogs: number;
  grossProfit: number;
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
  purchaseUnitShortName: string | null;
  purchaseUnitFactor: number | null;
  unitId: number;
  unitName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  lineCogs: number;
};

export type BillItemFifoEntry = {
  id: number;
  batchId: number;
  batchPurchaseDate: number;
  quantityConsumed: number;
  unitCost: number;
};

export type BillDetail = Bill & {
  items: BillItem[];
  fifo: Record<number, BillItemFifoEntry[]>;
};

// ---------- Input ----------

const optionalTrimmedString = (max: number) =>
  z.union([z.string(), z.null(), z.undefined()]).transform((v) => {
    if (v === null || v === undefined) return undefined;
    const t = v.trim();
    if (t === "") return undefined;
    if (t.length > max) throw new Error(`Must be at most ${max} characters`);
    return t;
  });

export const billLineSchema = z.object({
  variantId: z.number().int().positive(),
  unitId: z.number().int().positive(),
  quantity: z.number().int().positive("Quantity must be positive"),
  unitPrice: z.number().int().nonnegative("Price cannot be negative"),
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

// ---------- FIFO Cost Preview ----------

/**
 * Preview of what FIFO will consume for a given variant + quantity.
 * Used by the Bill Entry page to show the "cost" reference (not printed).
 */
export type FifoCostPreview = {
  /** Total base-unit quantity that will be consumed */
  quantity: number; // milli-units
  /** Weighted average cost per base unit (paisa) */
  avgCostPerBaseUnit: number;
  /** Total cost for the requested quantity (paisa) */
  totalCost: number;
  /** Breakdown of what batches will be consumed (oldest first) */
  batches: Array<{
    batchId: number;
    purchaseDate: number; // unix seconds
    quantityConsumed: number; // milli-units
    unitCost: number; // paisa
  }>;
  /** True if there's not enough stock to fulfill */
  insufficient: boolean;
  /** Available quantity in base units (milli-units) */
  availableQuantity: number;
};

export const fifoCostPreviewSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().positive(), // milli-units, base unit
});

export type FifoCostPreviewInput = z.infer<typeof fifoCostPreviewSchema>;