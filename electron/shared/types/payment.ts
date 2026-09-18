import { z } from "zod";

// ---------- Payment ----------

export type Payment = {
  id: number;
  customerId: number;
  customerName: string;
  billId: number | null;
  billNumber: string | null;
  amount: number;
  paymentDate: number;
  remarks: string | null;
  createdAt: number;
};

export type PaymentAllocation = {
  id: number;
  billId: number;
  billNumber: string;
  billDate: number;
  amount: number;
};

export type PaymentDetail = Payment & {
  allocations: PaymentAllocation[];
};

const optionalTrimmedString = (max: number) =>
  z.union([z.string(), z.null(), z.undefined()]).transform((v) => {
    if (v === null || v === undefined) return undefined;
    const t = v.trim();
    if (t === "") return undefined;
    if (t.length > max) throw new Error(`Must be at most ${max} characters`);
    return t;
  });

export const createPaymentSchema = z.object({
  customerId: z.number().int().positive(),
  amount: z.number().int().positive("Amount must be positive"),
  paymentDate: z.coerce.date().optional(),
  remarks: optionalTrimmedString(500),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export const paymentListQuerySchema = z.object({
  customerId: z.number().int().positive().optional(),
  search: z.string().trim().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  limit: z.number().int().positive().max(500).optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type PaymentListQuery = z.infer<typeof paymentListQuerySchema>;

// ---------- Khaata ----------

export type KhaataEntry = {
  customerId: number;
  customerName: string;
  contactNumber: string | null;
  totalOutstanding: number;
  billCount: number;
  oldestBillDate: number | null;
};

export type KhaataBill = {
  billId: number;
  billNumber: string;
  billDate: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
};

export type KhaataUdhaar = {
  udhaarId: number;
  reason: string | null;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  udhaarDate: number;
};

export type KhaataDetail = {
  customerId: number;
  customerName: string;
  contactNumber: string | null;
  address: string | null;
  totalOutstanding: number;
  bills: KhaataBill[];
  udhaars: KhaataUdhaar[];
};

export const khaataListQuerySchema = z.object({
  search: z.string().trim().optional(),
  limit: z.number().int().positive().max(500).optional().default(200),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type KhaataListQuery = z.infer<typeof khaataListQuerySchema>;