import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { timestamps, money } from "./_shared";

/**
 * A manual debt entry for a customer — used when migrating from paper records
 * or for one-off loans/advances given to a customer outside of a bill.
 *
 * NOT counted as sales in reports. It only affects the customer's Khaata.
 *
 * Fields:
 *   - remainingAmount is managed by the payment allocation engine.
 *   - When fully paid, remainingAmount becomes 0 and it drops out of Khaata.
 */
export const customerUdhaar = sqliteTable(
  "customer_udhaar",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    customerId: integer("customer_id")
      .notNull()
      .references(() => customers.id),
    amount: money("amount").notNull(),
    paidAmount: money("paid_amount").notNull().default(0),
    remainingAmount: money("remaining_amount").notNull(),

    udhaarDate: integer("udhaar_date", { mode: "timestamp" }).notNull(),
    reason: text("reason"),

    ...timestamps,
  },
  (t) => ({
    customerIdx: index("customer_udhaar_customer_idx").on(t.customerId),
    dateIdx: index("customer_udhaar_date_idx").on(t.udhaarDate),
  })
);

export const customerUdhaarRelations = relations(
  customerUdhaar,
  ({ one }) => ({
    customer: one(customers, {
      fields: [customerUdhaar.customerId],
      references: [customers.id],
    }),
  })
);

import { customers } from "./customers";