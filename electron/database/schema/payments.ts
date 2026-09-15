import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { timestamps, money } from "./_shared";

/**
 * Unified payments table for customer payments.
 * A payment may be tied to a specific bill (billId) or on-account (billId NULL).
 * Payment allocations (below) record how a payment splits across bills.
 */
export const payments = sqliteTable(
  "payments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id),
    billId: integer("bill_id").references(() => bills.id),

    amount: money("amount").notNull(),
    paymentDate: integer("payment_date", { mode: "timestamp" }).notNull(),
    remarks: text("remarks"),

    ...timestamps,
  },
  (t) => ({
    customerIdx: index("payments_customer_idx").on(t.customerId),
    billIdx: index("payments_bill_idx").on(t.billId),
    dateIdx: index("payments_date_idx").on(t.paymentDate),
  })
);

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  customer: one(customers, {
    fields: [payments.customerId],
    references: [customers.id],
  }),
  bill: one(bills, {
    fields: [payments.billId],
    references: [bills.id],
  }),
  allocations: many(paymentAllocations),
}));

import { customers } from "./customers";
import { bills } from "./bills";
import { paymentAllocations } from "./payment-allocations";