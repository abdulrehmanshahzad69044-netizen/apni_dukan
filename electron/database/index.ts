import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

let sqlite: Database.Database | null = null;

export function initializeDatabase(databasePath: string) {
  if (sqlite) {
    return drizzle(sqlite, { schema });
  }

  sqlite = new Database(databasePath);

  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  const db = drizzle(sqlite, { schema });

  return db;
}

export function runMigrations(databasePath: string) {
  const database = initializeDatabase(databasePath);

  migrate(database, {
    migrationsFolder: "./drizzle",
  });

  console.log("Database migrations completed successfully.");
}

export function closeDatabase() {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
  }
}