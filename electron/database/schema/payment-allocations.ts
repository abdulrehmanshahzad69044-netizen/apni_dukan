import { sqliteTable, integer, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { timestamps, money } from "./_shared";

/**
 * Records how a payment was applied across bills.
 * FIFO: oldest unpaid bill first.
 *
 * A payment of 5000 might split as:
 *   payment #7 → bill #3, amount=3000
 *   payment #7 → bill #5, amount=2000
 *
 * Each split is one row here.
 */
export const paymentAllocations = sqliteTable(
  "payment_allocations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    paymentId: integer("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    billId: integer("bill_id")
      .notNull()
      .references(() => bills.id),
    amount: money("amount").notNull(),
    ...timestamps,
  },
  (t) => ({
    paymentIdx: index("payment_alloc_payment_idx").on(t.paymentId),
    billIdx: index("payment_alloc_bill_idx").on(t.billId),
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
  })
);

import { payments } from "./payments";
import { bills } from "./bills";