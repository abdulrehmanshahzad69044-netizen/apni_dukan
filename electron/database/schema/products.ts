import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { timestamps, softDelete } from "./_shared";

export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    categoryId: integer("category_id").references(() => categories.id),
    companyId: integer("company_id").references(() => companies.id),
    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    nameIdx: index("products_name_idx").on(t.name),
    categoryIdx: index("products_category_idx").on(t.categoryId),
    companyIdx: index("products_company_idx").on(t.companyId),
  })
);

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  company: one(companies, {
    fields: [products.companyId],
    references: [companies.id],
  }),
  // variants: many(variants), — added in Phase 1.6
}));

import { categories } from "./categories";
import { companies } from "./companies";