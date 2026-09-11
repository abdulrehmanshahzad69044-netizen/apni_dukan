import { app } from "electron";
import path from "node:path";
import fs from "node:fs";

/**
 * Resolves all filesystem paths the database layer needs.
 *
 * Dev  → DB lives in project root as `dev-apni-dukan.db` (git-ignored)
 * Prod → DB lives in app.getPath('userData')/apni-dukan.db
 *        On Windows userData = C:\Users\<user>\AppData\Roaming\Apni Dukan\
 *
 * Nothing here should ever write into the installation directory —
 * that path is wiped on every app update.
 */

const DB_FILENAME = "apni-dukan.db";

export function getUserDataDir(): string {
  const dir = app.getPath("userData");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getDatabasePath(): string {
  if (process.env.NODE_ENV === "development" || !app.isPackaged) {
    // Dev DB sits next to the project root so drizzle-kit and the app
    // both point at the same file.
    return path.join(process.cwd(), "dev-apni-dukan.db");
  }
  return path.join(getUserDataDir(), DB_FILENAME);
}

export function getBackupDir(): string {
  const dir = path.join(getUserDataDir(), "backups");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export function getLogsDir(): string {
  const dir = path.join(getUserDataDir(), "logs");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Path to the migrations folder.
 *
 * In dev, it's `./drizzle` relative to project root.
 * In prod, `drizzle/` is bundled into the app resources.
 *
 * The exact packaged path depends on the electron-forge Vite plugin
 * output; we resolve it defensively.
 */
export function getMigrationsPath(): string {
  if (process.env.NODE_ENV === "development" || !app.isPackaged) {
    return path.join(process.cwd(), "drizzle");
  }
  return path.join(process.resourcesPath, "drizzle");
}