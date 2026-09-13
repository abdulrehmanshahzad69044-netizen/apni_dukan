import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { timestamps, money } from "./_shared";

/**
 * A purchase is you buying stock from a company.
 * It creates one or more stock batches.
 */
export const purchases = sqliteTable(
  "purchases",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    purchaseNumber: text("purchase_number").notNull().unique(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id),
    purchaseDate: integer("purchase_date", { mode: "timestamp" }).notNull(),
    totalAmount: money("total_amount").notNull(),
    paidAmount: money("paid_amount").notNull().default(0),
    remarks: text("remarks"),
    ...timestamps,
  },
  (t) => ({
    companyIdx: index("purchases_company_idx").on(t.companyId),
    dateIdx: index("purchases_date_idx").on(t.purchaseDate),
  })
);

export const purchasesRelations = relations(purchases, ({ one, many }) => ({
  company: one(companies, {
    fields: [purchases.companyId],
    references: [companies.id],
  }),
  batches: many(stockBatches),
}));

import { companies } from "./companies";
import { stockBatches } from "./stock-batches";