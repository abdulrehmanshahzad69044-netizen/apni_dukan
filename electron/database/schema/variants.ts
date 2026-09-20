import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { timestamps, softDelete, quantity } from "./_shared";

export const variants = sqliteTable(
  "variants",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id),
    name: text("name").notNull(),

    baseUnitId: integer("base_unit_id")
      .notNull()
      .references(() => units.id),

    purchaseUnitId: integer("purchase_unit_id").references(() => units.id),
    purchaseUnitFactor: integer("purchase_unit_factor"),

    lowStockThreshold: quantity("low_stock_threshold"),

    /** Pinned items sort to the top of lists and search results */
    pinned: integer("pinned", { mode: "boolean" }).notNull().default(false),

    /** Quick items are auto-created from the billing screen */
    isQuickItem: integer("is_quick_item", { mode: "boolean" })
      .notNull()
      .default(false),

    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    productIdx: index("variants_product_idx").on(t.productId),
    unitIdx: index("variants_unit_idx").on(t.baseUnitId),
    purchaseUnitIdx: index("variants_purchase_unit_idx").on(t.purchaseUnitId),
    nameIdx: index("variants_name_idx").on(t.name),
    pinnedIdx: index("variants_pinned_idx").on(t.pinned),
    quickItemIdx: index("variants_quick_item_idx").on(t.isQuickItem),
  })
);

export const variantsRelations = relations(variants, ({ one }) => ({
  product: one(products, {
    fields: [variants.productId],
    references: [products.id],
  }),
  baseUnit: one(units, {
    fields: [variants.baseUnitId],
    references: [units.id],
    relationName: "baseUnit",
  }),
  purchaseUnit: one(units, {
    fields: [variants.purchaseUnitId],
    references: [units.id],
    relationName: "purchaseUnit",
  }),
}));

import { products } from "./products";
import { units } from "./units";