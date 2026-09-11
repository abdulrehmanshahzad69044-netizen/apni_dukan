import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { getDatabasePath } from "./paths";

/**
 * Singleton SQLite + Drizzle client.
 *
 * - WAL mode for concurrent read performance
 * - foreign_keys ON (SQLite defaults to OFF — a classic bug source)
 * - busy_timeout so concurrent writes retry instead of throwing
 */
function createClient() {
  const dbPath = getDatabasePath();

  const sqlite = new Database(dbPath);

  // SQLite pragmas — set once at connection open
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("synchronous = NORMAL");

  return drizzle(sqlite, { schema });
}

let _db: ReturnType<typeof createClient> | null = null;

export function getDb() {
  if (!_db) {
    _db = createClient();
  }
  return _db;
}

/**
 * Underlying raw better-sqlite3 handle — needed for a few operations
 * (backup API, closing on quit) that Drizzle doesn't expose.
 */
export function getRawDb() {
  return getDb().$client;
}

export function closeDb() {
  if (_db) {
    _db.$client.close();
    _db = null;
  }
}

export type Db = ReturnType<typeof getDb>;