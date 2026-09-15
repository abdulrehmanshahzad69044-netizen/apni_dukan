import { sqliteTable, integer, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { timestamps, money, quantity } from "./_shared";

/**
 * Traceability table: exactly which stock batches a bill line consumed,
 * and at what cost. This is what makes COGS auditable.
 *
 * One bill_item may span multiple batches (e.g. "3 cartons" consumes 2 from
 * batch A and 1 from batch B). This table records each piece.
 */
export const billItemFifo = sqliteTable(
  "bill_item_fifo",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    billItemId: integer("bill_item_id")
      .notNull()
      .references(() => billItems.id, { onDelete: "cascade" }),
    batchId: integer("batch_id")
      .notNull()
      .references(() => stockBatches.id),

    quantityConsumed: quantity("quantity_consumed").notNull(),
    unitCost: money("unit_cost").notNull(),

    ...timestamps,
  },
  (t) => ({
    billItemIdx: index("bill_item_fifo_item_idx").on(t.billItemId),
    batchIdx: index("bill_item_fifo_batch_idx").on(t.batchId),
  })
);

export const billItemFifoRelations = relations(billItemFifo, ({ one }) => ({
  billItem: one(billItems, {
    fields: [billItemFifo.billItemId],
    references: [billItems.id],
  }),
  batch: one(stockBatches, {
    fields: [billItemFifo.batchId],
    references: [stockBatches.id],
  }),
}));

import { billItems } from "./bill-items";
import { stockBatches } from "./stock-batches";