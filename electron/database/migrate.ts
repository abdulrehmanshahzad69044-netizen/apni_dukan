import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";
import { getDb, getRawDb } from "./client";
import {
  getDatabasePath,
  getMigrationBackupDir,
  getMigrationsPath,
} from "./paths";

/**
 * Timestamp like "2026-09-21_14_30"
 */
function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(
    d.getHours()
  )}_${p(d.getMinutes())}`;
}

/**
 * Count how many migrations have been applied to the DB vs how many exist
 * on disk. If there are pending migrations, we should back up first.
 */
function hasPendingMigrations(): boolean {
  const migrationsFolder = getMigrationsPath();
  if (!fs.existsSync(migrationsFolder)) return false;

  // Collect migration files from disk (exclude meta folder)
  const files = fs
    .readdirSync(migrationsFolder)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  if (files.length === 0) return false;

  try {
    const raw = getRawDb();
    const rows = raw
      .prepare(
        `SELECT COUNT(*) AS c FROM __drizzle_migrations`
      )
      .get() as { c: number } | undefined;

    const applied = rows?.c ?? 0;
    return applied < files.length;
  } catch {
    // __drizzle_migrations table doesn't exist → fresh install
    // For a fresh install, there's no data to back up. Return false.
    return false;
  }
}

/**
 * Copy the current DB file to migration-backups/ with a timestamp.
 * Non-fatal — if it fails, we log and continue.
 */
function backupBeforeMigration(): string | null {
  try {
    const dbPath = getDatabasePath();
    if (!fs.existsSync(dbPath)) {
      // No DB yet → nothing to back up
      return null;
    }

    // Flush WAL first so the .db file is complete
    try {
      getRawDb().pragma("wal_checkpoint(TRUNCATE)");
    } catch {
      // ignore — DB might not be open yet in some cases
    }

    const backupDir = getMigrationBackupDir();
    const dest = path.join(backupDir, `pre_migration_${timestamp()}.db`);
    fs.copyFileSync(dbPath, dest);

    // Keep only the 5 most recent
    try {
      const files = fs
        .readdirSync(backupDir)
        .filter((f) => f.startsWith("pre_migration_") && f.endsWith(".db"))
        .sort()
        .reverse();

      for (const f of files.slice(5)) {
        fs.unlinkSync(path.join(backupDir, f));
      }
    } catch {
      // ignore cleanup failures
    }

    return dest;
  } catch (e) {
    console.warn("[migrate] Pre-migration backup failed:", e);
    return null;
  }
}

/**
 * Runs all pending Drizzle migrations.
 * Call this ONCE at app startup, before any window opens.
 *
 * Safe to call every launch — Drizzle tracks applied migrations in the
 * `__drizzle_migrations` table and skips already-applied ones.
 *
 * If there ARE pending migrations, a timestamped backup of the current DB
 * is created in `migration-backups/` BEFORE running them.
 */
export function runMigrations() {
  const migrationsFolder = getMigrationsPath();

  if (!fs.existsSync(migrationsFolder)) {
    console.warn(
      `[migrate] Migrations folder not found at ${migrationsFolder}. Skipping.`
    );
    return;
  }

  // Snapshot before touching the DB
  if (hasPendingMigrations()) {
    const backup = backupBeforeMigration();
    if (backup) {
      console.log(`[migrate] Pre-migration backup created: ${backup}`);
    }
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