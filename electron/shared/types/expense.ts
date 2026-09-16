import { z } from "zod";

// ---------- Business Expense ----------

export type Expense = {
  id: number;
  name: string;
  amount: number; // paisa
  date: number; // unix seconds
  remarks: string | null;
  createdAt: number;
  updatedAt: number;
};

const optionalTrimmedString = (max: number) =>
  z.union([z.string(), z.null(), z.undefined()]).transform((v) => {
    if (v === null || v === undefined) return undefined;
    const t = v.trim();
    if (t === "") return undefined;
    if (t.length > max) throw new Error(`Must be at most ${max} characters`);
    return t;
  });

export const createExpenseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(120, "Name is too long"),
  amount: z.number().int().positive("Amount must be positive"), // paisa
  date: z.coerce.date().optional(),
  remarks: optionalTrimmedString(500),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export const updateExpenseSchema = createExpenseSchema.partial().extend({
  id: z.number().int().positive(),
});

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export const expenseListQuerySchema = z.object({
  search: z.string().trim().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  limit: z.number().int().positive().max(500).optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type ExpenseListQuery = z.infer<typeof expenseListQuerySchema>;

// ---------- Company Payment ----------

export type CompanyPayment = {
  id: number;
  companyId: number;
  companyName: string;
  purchaseId: number | null;
  purchaseNumber: string | null;
  amount: number; // paisa
  date: number; // unix seconds
  remarks: string | null;
  createdAt: number;
};

export const createCompanyPaymentSchema = z.object({
  companyId: z.number().int().positive(),
  purchaseId: z.number().int().positive().nullable().optional(),
  amount: z.number().int().positive("Amount must be positive"), // paisa
  date: z.coerce.date().optional(),
  remarks: optionalTrimmedString(500),
});

export type CreateCompanyPaymentInput = z.infer<
  typeof createCompanyPaymentSchema
>;

export const companyPaymentListQuerySchema = z.object({
  companyId: z.number().int().positive().optional(),
  search: z.string().trim().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  limit: z.number().int().positive().max(500).optional().default(100),
  offset: z.number().int().nonnegative().optional().default(0),
});

export type CompanyPaymentListQuery = z.infer<
  typeof companyPaymentListQuerySchema
>;