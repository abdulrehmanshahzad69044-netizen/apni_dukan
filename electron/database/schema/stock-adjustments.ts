import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { timestamps, money, quantity } from "./_shared";

/**
 * A stock adjustment = a manual correction to inventory.
 *
 * Types:
 *   damaged  → stock written off because it's damaged/expired
 *   lost     → stock written off because it's missing
 *   correction → recount; qty can be positive (found) or negative (missing)
 *   return   → customer returned stock
 *
 * Every adjustment writes a row here AND a stock_ledger entry.
 */
export const stockAdjustments = sqliteTable(
  "stock_adjustments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    variantId: integer("variant_id")
      .notNull()
      .references(() => variants.id),

    // Signed: negative = write-off, positive = found/returned
    quantity: quantity("quantity").notNull(),

    // Cost per unit at adjustment time (paisa). Used for COGS/loss accounting.
    unitCost: money("unit_cost").notNull(),

    adjustmentType: text("adjustment_type", {
      enum: ["damaged", "lost", "correction", "return"],
    }).notNull(),

    reason: text("reason"),
    adjustmentDate: integer("adjustment_date", {
      mode: "timestamp",
    }).notNull(),

    ...timestamps,
  },
  (t) => ({
    variantIdx: index("stock_adjustments_variant_idx").on(t.variantId),
    typeIdx: index("stock_adjustments_type_idx").on(t.adjustmentType),
    dateIdx: index("stock_adjustments_date_idx").on(t.adjustmentDate),
  })
);

export const stockAdjustmentsRelations = relations(
  stockAdjustments,
  ({ one }) => ({
    variant: one(variants, {
      fields: [stockAdjustments.variantId],
      references: [variants.id],
    }),
  })
);

import { variants } from "./variants";