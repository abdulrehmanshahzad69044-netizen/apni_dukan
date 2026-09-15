import { sqliteTable, integer, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { timestamps, money, quantity } from "./_shared";

export const billItems = sqliteTable(
  "bill_items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    billId: integer("bill_id")
      .notNull()
      .references(() => bills.id, { onDelete: "cascade" }),
    variantId: integer("variant_id")
      .notNull()
      .references(() => variants.id),
    unitId: integer("unit_id")
      .notNull()
      .references(() => units.id),

    quantity: quantity("quantity").notNull(),
    unitPrice: money("unit_price").notNull(),
    lineTotal: money("line_total").notNull(),
    lineCogs: money("line_cogs").notNull().default(0),

    ...timestamps,
  },
  (t) => ({
    billIdx: index("bill_items_bill_idx").on(t.billId),
    variantIdx: index("bill_items_variant_idx").on(t.variantId),
  })
);

export const billItemsRelations = relations(billItems, ({ one, many }) => ({
  bill: one(bills, {
    fields: [billItems.billId],
    references: [bills.id],
  }),
  variant: one(variants, {
    fields: [billItems.variantId],
    references: [variants.id],
  }),
  unit: one(units, {
    fields: [billItems.unitId],
    references: [units.id],
  }),
  fifoConsumptions: many(billItemFifo),
}));

import { bills } from "./bills";
import { variants } from "./variants";
import { units } from "./units";
import { billItemFifo } from "./bill-item-fifo";