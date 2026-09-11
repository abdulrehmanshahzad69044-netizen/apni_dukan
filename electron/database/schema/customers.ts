import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { timestamps, softDelete, money } from "./_shared";

export const customers = sqliteTable(
  "customers",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    contactNumber: text("contact_number"),
    address: text("address"),
    /**
     * Cached outstanding balance in paisa.
     * Recalculated by the payment service on every bill/payment write.
     * NEVER trust this for accounting math — always recompute from bills.
     */
    cachedOutstanding: money("cached_outstanding").notNull().default(0),
    ...timestamps,
    ...softDelete,
  },
  (t) => ({
    nameIdx: index("customers_name_idx").on(t.name),
    contactIdx: index("customers_contact_idx").on(t.contactNumber),
  })
);

export const customersRelations = relations(customers, ({ many }) => ({
  // Forward references declared in their own modules.
  // Drizzle resolves them via the barrel file.
}));