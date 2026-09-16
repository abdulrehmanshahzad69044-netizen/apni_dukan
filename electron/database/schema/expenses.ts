import { sqliteTable, integer, text, index } from "drizzle-orm/sqlite-core";
import { timestamps, money } from "./_shared";

/**
 * Business expenses = operating costs (rent, salary, tea, transport, etc).
 * These reduce NET PROFIT.
 */
export const expenses = sqliteTable(
  "expenses",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    amount: money("amount").notNull(),
    date: integer("date", { mode: "timestamp" }).notNull(),
    remarks: text("remarks"),
    ...timestamps,
  },
  (t) => ({
    dateIdx: index("expenses_date_idx").on(t.date),
    nameIdx: index("expenses_name_idx").on(t.name),
  })
);