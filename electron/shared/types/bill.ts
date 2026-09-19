import { z } from "zod";

// ---------- Bill DTOs ----------

export type Bill = {
  id: number;
  billNumber: string;
  customerId: number | null;
  customerName: string | null;
  billDate: number;
  totalAmount: number;
  /** Customer's outstanding BEFORE this bill */
  previousDue: number;
  paidAmount: number;
  /** Total cash received from customer at bill time (may exceed paidAmount) */
  amountReceived: number;
  /** What's still owed ON THIS BILL only */
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
  previousDue: z.number().int().nonnegative().optional().default(0),
  paidAmount: z.number().int().nonnegative().optional().default(0),
  /** Raw cash received — may exceed paidAmount */
  amountReceived: z.number().int().nonnegative().optional().default(0),
  remarks: optionalTrimmedString(500),
  status: z
    .enum(["draft", "held", "finalized"])
    .optional()
    .default("finalized"),
  lines: z.array(billLineSchema).min(1, "Add at least one item"),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;

// ---------- Query ----------

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

export type FifoCostPreview = {
  quantity: number;
  avgCostPerBaseUnit: number;
  totalCost: number;
  batches: Array<{
    batchId: number;
    purchaseDate: number;
    quantityConsumed: number;
    unitCost: number;
  }>;
  insufficient: boolean;
  availableQuantity: number;
};

export const fifoCostPreviewSchema = z.object({
  variantId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export type FifoCostPreviewInput = z.infer<typeof fifoCostPreviewSchema>;