import { z } from "zod";

export type BackupFile = {
  name: string;              // filename
  path: string;              // full path (local) or id (gdrive)
  sizeBytes: number;
  createdAt: number;         // unix seconds
  source: "local" | "gdrive";
  /** Only for gdrive entries */
  fileId?: string;
};

export type BackupResult = {
  ok: true;
  file: BackupFile;
};

export type RestoreResult = {
  ok: true;
  safetyBackupPath: string;  // path to the auto-saved pre-restore backup
};

export const localBackupSchema = z.object({
  /** Optional custom folder. If missing, uses default userData/backups */
  targetDir: z.string().optional(),
});

export const restoreSchema = z.object({
  path: z.string(),
});

export const gdriveUploadSchema = z.object({
  /** Optional custom name. Default: timestamped */
  filename: z.string().optional(),
});

export const gdriveRestoreSchema = z.object({
  fileId: z.string(),
});

export const gdriveConfigSchema = z.object({
  clientId: z.string().trim().min(1),
  clientSecret: z.string().trim().min(1),
});

export type LocalBackupInput = z.infer<typeof localBackupSchema>;
export type RestoreInput = z.infer<typeof restoreSchema>;
export type GdriveUploadInput = z.infer<typeof gdriveUploadSchema>;
export type GdriveRestoreInput = z.infer<typeof gdriveRestoreSchema>;
export type GdriveConfigInput = z.infer<typeof gdriveConfigSchema>;

export type GdriveStatus = {
  connected: boolean;
  email: string | null;
  configured: boolean;
};