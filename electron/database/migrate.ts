import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { getDb } from "./client";
import { getMigrationsPath } from "./paths";
import fs from "node:fs";

/**
 * Runs all pending Drizzle migrations.
 * Call this ONCE at app startup, before any window opens.
 *
 * Safe to call every launch — Drizzle tracks applied migrations in the
 * `__drizzle_migrations` table and skips already-applied ones.
 */
export function runMigrations() {
  const migrationsFolder = getMigrationsPath();

  // In dev, `drizzle/` may not exist yet if the developer hasn't run
  // `npm run db:generate` — this is fine, we just skip.
  if (!fs.existsSync(migrationsFolder)) {
    console.warn(
      `[migrate] Migrations folder not found at ${migrationsFolder}. Skipping.`
    );
    return;
  }

  console.log(`[migrate] Running migrations from ${migrationsFolder}`);

  try {
    migrate(getDb(), { migrationsFolder });
    console.log("[migrate] Migrations applied successfully.");
  } catch (err) {
    console.error("[migrate] Migration failed:", err);
    throw err;
  }
}