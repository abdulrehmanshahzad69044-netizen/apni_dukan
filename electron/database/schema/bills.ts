import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { timestamps, money } from "./_shared";

export const bills = sqliteTable(
  "bills",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    billNumber: text("bill_number").notNull().unique(),
    customerId: integer("customer_id").references(() => customers.id),
    billDate: integer("bill_date", { mode: "timestamp" }).notNull(),

    totalAmount: money("total_amount").notNull(),
    paidAmount: money("paid_amount").notNull().default(0),
    remainingAmount: money("remaining_amount").notNull().default(0),
    cogs: money("cogs").notNull().default(0),

    status: text("status", {
      enum: ["draft", "held", "finalized", "cancelled", "returned"],
    })
      .notNull()
      .default("finalized"),

    remarks: text("remarks"),
    ...timestamps,
  },
  (t) => ({
    customerIdx: index("bills_customer_idx").on(t.customerId),
    dateIdx: index("bills_date_idx").on(t.billDate),
    statusIdx: index("bills_status_idx").on(t.status),
  })
);

export const billsRelations = relations(bills, ({ one, many }) => ({
  customer: one(customers, {
    fields: [bills.customerId],
    references: [customers.id],
  }),
  items: many(billItems),
  payments: many(payments),
}));

import { customers } from "./customers";
import { billItems } from "./bill-items";
import { payments } from "./payments";