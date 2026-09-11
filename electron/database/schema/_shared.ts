import { integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/**
 * Money is stored as INTEGER paisa (1 PKR = 100 paisa).
 * Never use real/float for money — floating point errors destroy accounting.
 *
 * Display layer divides by 100. Input layer multiplies by 100.
 *
 * Example: Rs. 1250.50 → stored as 125050
 */
export const money = (name: string) => integer(name);

/**
 * Quantity is stored as INTEGER milli-units (1 unit = 1000 milli-units).
 * Allows fractional quantities (1.5 kg, 0.25 litre) without float errors.
 *
 * Display layer divides by 1000. Input layer multiplies by 1000.
 *
 * Example: 1.5 kg → stored as 1500
 */
export const quantity = (name: string) => integer(name);

/**
 * Standard timestamp columns every table gets.
 * SQLite stores them as Unix epoch seconds (integer).
 */
export const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
};

/**
 * Soft delete marker. NULL = active. Non-NULL = deleted.
 * Only used on master tables (customers, companies, products, etc.)
 * NEVER on financial tables (bills, payments, ledger).
 */
export const softDelete = {
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
};