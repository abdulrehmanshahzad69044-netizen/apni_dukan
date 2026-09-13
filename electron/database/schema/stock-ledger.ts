import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { timestamps, money, quantity } from "./_shared";

/**
 * Stock ledger: the source of truth for every stock movement.
 *
 * `remaining_quantity` on stock_batches is a CACHE. This ledger is the truth.
 * If they ever diverge, we rebuild from here.
 *
 * Every movement records the exact unit cost — this is what makes COGS
 * accurate.
 */
export const stockLedger = sqliteTable(
  "stock_ledger",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    batchId: integer("batch_id")
      .notNull()
      .references(() => stockBatches.id),
    variantId: integer("variant_id")
      .notNull()
      .references(() => variants.id),

    // Positive = stock in, negative = stock out
    quantityChange: quantity("quantity_change").notNull(),
    unitCost: money("unit_cost").notNull(),

    movementType: text("movement_type", {
      enum: ["purchase", "sale", "adjustment", "damage", "return"],
    }).notNull(),

    // Polymorphic reference: which purchase / bill / adjustment caused this.
    referenceType: text("reference_type", {
      enum: ["purchase", "bill", "adjustment"],
    }),
    referenceId: integer("reference_id"),

    notes: text("notes"),
    ...timestamps,
  },
  (t) => ({
    batchIdx: index("stock_ledger_batch_idx").on(t.batchId),
    variantIdx: index("stock_ledger_variant_idx").on(t.variantId),
    refIdx: index("stock_ledger_ref_idx").on(t.referenceType, t.referenceId),
    typeIdx: index("stock_ledger_type_idx").on(t.movementType),
    dateIdx: index("stock_ledger_created_idx").on(t.createdAt),
  })
);

export const stockLedgerRelations = relations(stockLedger, ({ one }) => ({
  batch: one(stockBatches, {
    fields: [stockLedger.batchId],
    references: [stockBatches.id],
  }),
  variant: one(variants, {
    fields: [stockLedger.variantId],
    references: [variants.id],
  }),
}));

import { stockBatches } from "./stock-batches";
import { variants } from "./variants";