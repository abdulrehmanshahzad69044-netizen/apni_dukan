import { dialog } from "electron";
import fs from "node:fs";
import path from "node:path";
import { getRawDb } from "../database/client";
import { getDatabasePath, getBackupDir } from "../database/paths";
import type {
  BackupFile,
  LocalBackupInput,
  RestoreInput,
  RestoreResult,
} from "../shared/types/backup";

/**
 * Timestamp suffix like "2026_09_17_14_30"
 */
function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}_${p(d.getMonth() + 1)}_${p(d.getDate())}_${p(
    d.getHours()
  )}_${p(d.getMinutes())}`;
}

/**
 * Force SQLite to flush WAL to the main DB file.
 * Must be called BEFORE copying the .db, otherwise the copy is stale.
 */
function checkpoint() {
  const raw = getRawDb();
  raw.pragma("wal_checkpoint(TRUNCATE)");
}

export const backupService = {
  /**
   * Save a backup copy of the DB to the given directory (or default).
   * If targetDir is not provided, the OS save dialog opens.
   */
  async createLocal(input: LocalBackupInput): Promise<BackupFile> {
    // 1. Flush WAL to disk
    checkpoint();

    // 2. Determine target
    let targetDir = input.targetDir;

    if (!targetDir) {
      // Default: userData/backups/
      targetDir = getBackupDir();
    }

    // Make sure dir exists
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // 3. Compose filename
    const filename = `ApniDukan_Backup_${timestamp()}.db`;
    const destPath = path.join(targetDir, filename);

    // 4. Copy DB file
    const srcPath = getDatabasePath();
    fs.copyFileSync(srcPath, destPath);

    const stat = fs.statSync(destPath);

    return {
      name: filename,
      path: destPath,
      sizeBytes: stat.size,
      createdAt: Math.floor(stat.mtimeMs / 1000),
      source: "local",
    };
  },

  /**
   * Save-as dialog: let the user pick WHERE to save the backup.
   * Returns the chosen path, or null if canceled.
   */
  async saveAsDialog(): Promise<string | null> {
    const result = await dialog.showSaveDialog({
      title: "Save Backup As",
      defaultPath: `ApniDukan_Backup_${timestamp()}.db`,
      filters: [{ name: "SQLite Database", extensions: ["db"] }],
    });
    return result.canceled ? null : result.filePath ?? null;
  },

  /**
   * Open file dialog: let the user pick a .db backup to restore.
   */
  async pickBackupFile(): Promise<string | null> {
    const result = await dialog.showOpenDialog({
      title: "Choose Backup File",
      properties: ["openFile"],
      filters: [{ name: "SQLite Database", extensions: ["db"] }],
    });
    return result.canceled ? null : result.filePaths[0] ?? null;
  },

  /**
   * List backups in the default backups folder.
   */
  async listLocal(): Promise<BackupFile[]> {
    const dir = getBackupDir();
    if (!fs.existsSync(dir)) return [];

    const files = fs.readdirSync(dir);
    const out: BackupFile[] = [];

    for (const f of files) {
      if (!f.endsWith(".db")) continue;
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      out.push({
        name: f,
        path: full,
        sizeBytes: stat.size,
        createdAt: Math.floor(stat.mtimeMs / 1000),
        source: "local",
      });
    }

    // Newest first
    out.sort((a, b) => b.createdAt - a.createdAt);
    return out;
  },

  /**
   * Restore from a backup file. Safety-backups the current DB first.
   */
  async restore(input: RestoreInput): Promise<RestoreResult> {
    const backupPath = input.path;

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    // Validate it looks like a SQLite file (first 16 bytes: "SQLite format 3\0")
    const fd = fs.openSync(backupPath, "r");
    const header = Buffer.alloc(16);
    fs.readSync(fd, header, 0, 16, 0);
    fs.closeSync(fd);
    if (header.toString("utf8").slice(0, 15) !== "SQLite format 3") {
      throw new Error("Selected file is not a valid SQLite database");
    }

    // Close DB before replacing
    const raw = getRawDb();
    raw.close();

    // 1. Safety backup: copy current DB to backups/pre_restore_*.db
    const currentPath = getDatabasePath();
    const safetyDir = getBackupDir();
    if (!fs.existsSync(safetyDir)) {
      fs.mkdirSync(safetyDir, { recursive: true });
    }
    const safetyPath = path.join(safetyDir, `pre_restore_${timestamp()}.db`);

    if (fs.existsSync(currentPath)) {
      fs.copyFileSync(currentPath, safetyPath);
      // Also remove any WAL/SHM files that would conflict with the restored DB
      const walPath = currentPath + "-wal";
      const shmPath = currentPath + "-shm";
      if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
      if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
    }

    // 2. Replace current DB with backup
    fs.copyFileSync(backupPath, currentPath);

    return {
      ok: true,
      safetyBackupPath: safetyPath,
    };
  },

  /**
   * Delete a local backup file.
   */
  async deleteLocal(filePath: string): Promise<void> {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  },

  /**
   * Restart the app. Used after restore.
   */
  async restartApp(): Promise<void> {
    // Use the raw approach — main process handles this in main.ts
    throw new Error("Restart must be triggered from main process");
  },
};