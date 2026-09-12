import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { timestamps, softDelete } from "./_shared";

export const companies = sqliteTable(
  "companies",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    contactNumber: text("contact_number"),
    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    nameIdx: index("companies_name_idx").on(t.name),
  })
);

export const companiesRelations = relations(companies, ({ many }) => ({
  // Populated when products / purchases / company-payments exist.
}));