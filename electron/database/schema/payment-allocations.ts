import { sqliteTable, integer, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { timestamps, money } from "./_shared";

/**
 * Records how a payment was applied.
 * A payment line targets EITHER a bill OR a manual udhaar entry — never both.
 */
export const paymentAllocations = sqliteTable(
  "payment_allocations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    paymentId: integer("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),

    /** Set when the allocation is against a bill */
    billId: integer("bill_id").references(() => bills.id),
    /** Set when the allocation is against a manual udhaar */
    udhaarId: integer("udhaar_id").references(() => customerUdhaar.id),

    amount: money("amount").notNull(),
    ...timestamps,
  },
  (t) => ({
    paymentIdx: index("payment_alloc_payment_idx").on(t.paymentId),
    billIdx: index("payment_alloc_bill_idx").on(t.billId),
    udhaarIdx: index("payment_alloc_udhaar_idx").on(t.udhaarId),
  })
);

export const paymentAllocationsRelations = relations(
  paymentAllocations,
  ({ one }) => ({
    payment: one(payments, {
      fields: [paymentAllocations.paymentId],
      references: [payments.id],
    }),
    bill: one(bills, {
      fields: [paymentAllocations.billId],
      references: [bills.id],
    }),
    udhaar: one(customerUdhaar, {
      fields: [paymentAllocations.udhaarId],
      references: [customerUdhaar.id],
    }),
  })
);

import { payments } from "./payments";
import { bills } from "./bills";
import { customerUdhaar } from "./customer-udhaar";