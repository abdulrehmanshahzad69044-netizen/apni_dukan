import { sqliteTable, integer, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { timestamps, money } from "./_shared";

/**
 * Records how a company payment was applied across purchases.
 * FIFO: oldest unpaid purchase first.
 *
 * Example:
 *   company_payment #7 (Rs. 30) splits as:
 *     → purchase #1, amount=30      (Juice)
 *   (Cream purchase #2 untouched because payment exhausted)
 */
export const companyPaymentAllocations = sqliteTable(
  "company_payment_allocations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyPaymentId: integer("company_payment_id")
      .notNull()
      .references(() => companyPayments.id, { onDelete: "cascade" }),
    purchaseId: integer("purchase_id")
      .notNull()
      .references(() => purchases.id),
    amount: money("amount").notNull(),
    ...timestamps,
  },
  (t) => ({
    paymentIdx: index("company_payment_alloc_payment_idx").on(
      t.companyPaymentId
    ),
    purchaseIdx: index("company_payment_alloc_purchase_idx").on(t.purchaseId),
  })
);

export const companyPaymentAllocationsRelations = relations(
  companyPaymentAllocations,
  ({ one }) => ({
    companyPayment: one(companyPayments, {
      fields: [companyPaymentAllocations.companyPaymentId],
      references: [companyPayments.id],
    }),
    purchase: one(purchases, {
      fields: [companyPaymentAllocations.purchaseId],
      references: [purchases.id],
    }),
  })
);

import { companyPayments } from "./company-payments";
import { purchases } from "./purchases";