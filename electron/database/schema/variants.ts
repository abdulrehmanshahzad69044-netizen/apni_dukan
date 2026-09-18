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

    /** The unit stock is tracked in. All quantities are stored in this unit. */
    baseUnitId: integer("base_unit_id")
      .notNull()
      .references(() => units.id),

    /**
     * Bulk/purchase unit — e.g. Carton, Crate, Dozen.
     * Optional. If null, the variant can only be bought/sold in base unit.
     */
    purchaseUnitId: integer("purchase_unit_id").references(() => units.id),

    /**
     * How many BASE units are in ONE purchase unit.
     * Example: 24 means "1 Carton = 24 Packs"
     *
     * Must be a positive integer. Whole numbers only (no fractional cartons).
     * Always paired with purchaseUnitId — both set or both null.
     */
    purchaseUnitFactor: integer("purchase_unit_factor"),

    lowStockThreshold: quantity("low_stock_threshold"),

    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    productIdx: index("variants_product_idx").on(t.productId),
    unitIdx: index("variants_unit_idx").on(t.baseUnitId),
    purchaseUnitIdx: index("variants_purchase_unit_idx").on(t.purchaseUnitId),
    nameIdx: index("variants_name_idx").on(t.name),
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