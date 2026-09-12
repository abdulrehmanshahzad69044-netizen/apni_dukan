import {
  sqliteTable,
  integer,
  text,
  unique,
  index,
} from "drizzle-orm/sqlite-core";
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

/**
 * Directed conversion: 1 `fromUnit` = `factor` × `toUnit`.
 * factor is stored as milli-factor (integer × 1000) to avoid float drift.
 *
 * Example: 1 Carton = 12 Packs
 *   fromUnitId = Carton.id
 *   toUnitId   = Pack.id
 *   factor     = 12000  (i.e. 12 * 1000)
 */
export const unitConversions = sqliteTable(
  "unit_conversions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    fromUnitId: integer("from_unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    toUnitId: integer("to_unit_id")
      .notNull()
      .references(() => units.id, { onDelete: "cascade" }),
    factor: integer("factor").notNull(),
    ...timestamps,
  },
  (t) => ({
    pairUnique: unique("unit_conversions_pair_unique").on(
      t.fromUnitId,
      t.toUnitId
    ),
    fromIdx: index("unit_conversions_from_idx").on(t.fromUnitId),
    toIdx: index("unit_conversions_to_idx").on(t.toUnitId),
  })
);

export const unitsRelations = relations(units, ({ many }) => ({
  conversionsFrom: many(unitConversions, { relationName: "fromUnit" }),
  conversionsTo: many(unitConversions, { relationName: "toUnit" }),
}));

export const unitConversionsRelations = relations(
  unitConversions,
  ({ one }) => ({
    fromUnit: one(units, {
      fields: [unitConversions.fromUnitId],
      references: [units.id],
      relationName: "fromUnit",
    }),
    toUnit: one(units, {
      fields: [unitConversions.toUnitId],
      references: [units.id],
      relationName: "toUnit",
    }),
  })
);