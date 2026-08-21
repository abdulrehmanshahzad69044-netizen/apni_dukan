import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const customers = sqliteTable("customers", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  customerCode: text("customer_code").notNull().unique(),

  name: text("name").notNull(),

  contactNumber: text("contact_number").notNull(),

  address: text("address").notNull(),

  isActive: integer("is_active", {
    mode: "boolean",
  })
    .notNull()
    .default(true),

  createdAt: integer("created_at", {
    mode: "timestamp",
  })
    .notNull()
    .$defaultFn(() => new Date()),

  updatedAt: integer("updated_at", {
    mode: "timestamp",
  })
    .notNull()
    .$defaultFn(() => new Date()),
});