import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { timestamps, softDelete } from "./_shared";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  ...timestamps,
  ...softDelete,
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  // Populated when products exist.
}));