import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { timestamps, money } from "./_shared";

/**
 * Company payments = money you pay a supplier.
 * These are NOT operating expenses — they settle a purchase debt.
 * They reduce CASH but not NET PROFIT.
 */
export const companyPayments = sqliteTable(
  "company_payments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id),
    purchaseId: integer("purchase_id").references(() => purchases.id),
    amount: money("amount").notNull(),
    date: integer("date", { mode: "timestamp" }).notNull(),
    remarks: text("remarks"),
    ...timestamps,
  },
  (t) => ({
    companyIdx: index("company_payments_company_idx").on(t.companyId),
    dateIdx: index("company_payments_date_idx").on(t.date),
  })
);

export const companyPaymentsRelations = relations(
  companyPayments,
  ({ one }) => ({
    company: one(companies, {
      fields: [companyPayments.companyId],
      references: [companies.id],
    }),
    purchase: one(purchases, {
      fields: [companyPayments.purchaseId],
      references: [purchases.id],
    }),
  })
);

import { companies } from "./companies";
import { purchases } from "./purchases";