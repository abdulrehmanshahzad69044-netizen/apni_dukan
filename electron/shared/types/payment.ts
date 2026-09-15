import { z } from "zod";

// ---------- Payment DTO ----------

export type Payment = {
  id: number;
  customerId: number;
  customerName: string;
  billId: number | null;
  billNumber: string | null;
  amount: number; // paisa
  paymentDate: number; // unix seconds
  remarks: string | null;
  createdAt: number;
};

export type PaymentAllocation = {
  id: number;
  billId: number;
  billNumber: string;
  billDate: number;
  amount: number; // paisa
};

export type PaymentDetail = Payment & {
  allocations: PaymentAllocation[];
};

// ---------- Input ----------

export const createPaymentSchema = z.object({
  customerId: z.number().int().positive(),
  amount: z.number().int().positive("Amount must be positive"), // paisa
  paymentDate: z.coerce.date().optional(),
  remarks: z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined) return undefined;
    const t = v.trim();
    return t === "" ? undefined : t;
  }),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

// ---------- Query ----------

export const paymentListQuerySchema = z.object({
  customerId: z.number().int().positive().optional(),
  search: z.string().trim().optional(), // customer name
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  limit: z.number().int().positive().max(500).optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type PaymentListQuery = z.infer<typeof paymentListQuerySchema>;

// ---------- Khaata (outstanding bills per customer) ----------

export type KhaataEntry = {
  customerId: number;
  customerName: string;
  contactNumber: string | null;
  totalOutstanding: number; // paisa
  billCount: number;
  oldestBillDate: number | null; // unix seconds
};

export type KhaataBill = {
  billId: number;
  billNumber: string;
  billDate: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
};

export type KhaataDetail = {
  customerId: number;
  customerName: string;
  contactNumber: string | null;
  address: string | null;
  totalOutstanding: number;
  bills: KhaataBill[];
};

export const khaataListQuerySchema = z.object({
  search: z.string().trim().optional(),
  limit: z.number().int().positive().max(500).optional().default(200),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type KhaataListQuery = z.infer<typeof khaataListQuerySchema>;