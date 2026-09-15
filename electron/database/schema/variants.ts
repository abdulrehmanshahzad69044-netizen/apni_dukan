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
    /**
     * Low-stock alert threshold (milli-units).
     * null = no threshold set (never alerts).
     */
    lowStockThreshold: quantity("low_stock_threshold"),
    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    productIdx: index("variants_product_idx").on(t.productId),
    unitIdx: index("variants_unit_idx").on(t.baseUnitId),
    nameIdx: index("variants_name_idx").on(t.name),
  })
);

export const variantsRelations = relations(variants, ({ one, many }) => ({
  product: one(products, {
    fields: [variants.productId],
    references: [products.id],
  }),
  baseUnit: one(units, {
    fields: [variants.baseUnitId],
    references: [units.id],
  }),
}));

import { products } from "./products";
import { units } from "./units";