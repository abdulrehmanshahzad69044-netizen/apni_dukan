import { sqliteTable, integer, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { timestamps, money, quantity } from "./_shared";

export const stockBatches = sqliteTable(
  "stock_batches",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    variantId: integer("variant_id")
      .notNull()
      .references(() => variants.id),
    // Nullable: positive adjustments create batches without a purchase
    purchaseId: integer("purchase_id").references(() => purchases.id),

    purchasePrice: money("purchase_price").notNull(),
    suggestedRetailPrice: money("suggested_retail_price"),
    suggestedWholesalePrice: money("suggested_wholesale_price"),

    quantityPurchased: quantity("quantity_purchased").notNull(),
    remainingQuantity: quantity("remaining_quantity").notNull(),

    purchaseDate: integer("purchase_date", { mode: "timestamp" }).notNull(),

    ...timestamps,
  },
  (t) => ({
    variantIdx: index("stock_batches_variant_idx").on(t.variantId),
    fifoIdx: index("stock_batches_fifo_idx").on(t.variantId, t.purchaseDate),
  })
);

export const stockBatchesRelations = relations(stockBatches, ({ one, many }) => ({
  variant: one(variants, {
    fields: [stockBatches.variantId],
    references: [variants.id],
  }),
  purchase: one(purchases, {
    fields: [stockBatches.purchaseId],
    references: [purchases.id],
  }),
  ledgerEntries: many(stockLedger),
}));

import { variants } from "./variants";
import { purchases } from "./purchases";
import { stockLedger } from "./stock-ledger";