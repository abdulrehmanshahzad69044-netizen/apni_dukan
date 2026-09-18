import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { timestamps, softDelete } from "./_shared";

export const units = sqliteTable(
  "units",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    shortName: text("short_name").notNull(),
    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    nameIdx: index("units_name_idx").on(t.name),
  })
);

export const unitsRelations = relations(units, ({ many }) => ({
  variantsAsBase: many(variants, { relationName: "baseUnit" }),
  variantsAsPurchase: many(variants, { relationName: "purchaseUnit" }),
}));

import { variants } from "./variants";