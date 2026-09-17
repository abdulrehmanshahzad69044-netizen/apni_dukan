import { useCallback, useEffect, useState } from "react";
import {
  DownloadCloud,
  UploadCloud,
  HardDrive,
  RefreshCw,
  Trash2,
  Link2,
  Link2Off,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/lib/toast";
import { formatDate } from "@/lib/format";
import type {
  BackupFile,
  GdriveStatus,
} from "../../../electron/shared/types/backup";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function BackupSection() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [restorePath, setRestorePath] = useState<string | null>(null);

  const [gdStatus, setGdStatus] = useState<GdriveStatus | null>(null);
  const [gdBackups, setGdBackups] = useState<BackupFile[]>([]);
  const [gdBusy, setGdBusy] = useState(false);
  const [gdClientId, setGdClientId] = useState("");
  const [gdClientSecret, setGdClientSecret] = useState("");
  const [gdRestoreId, setGdRestoreId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [local, status] = await Promise.all([
        window.api.backup.listLocal(),
        window.api.gdrive.status(),
      ]);
      setBackups(local);
      setGdStatus(status);
      if (status.connected) {
        try {
          const gd = await window.api.gdrive.list();
          setGdBackups(gd);
        } catch {
          setGdBackups([]);
        }
      }
    } catch (e) {
      toast.error((e as Error).message ?? "Failed to load backups");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleBackupNow() {
    setBusy(true);
    try {
      const file = await window.api.backup.createLocal();
      toast.success(`Backup saved: ${file.name}`);
      await reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Backup failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleBackupAs() {
    setBusy(true);
    try {
      const dest = await window.api.backup.saveAsDialog();
      if (!dest) {
        setBusy(false);
        return;
      }
      // Save directly to that path
      const folder = dest.replace(/[\\/][^\\/]+$/, "");
      const file = await window.api.backup.createLocal({ targetDir: folder });
      toast.success(`Backup saved: ${file.name}`);
      await reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Backup failed");
    } finally {
      setBusy(false);
    }
  }

  async function handlePickRestore() {
    const p = await window.api.backup.pickFile();
    if (p) setRestorePath(p);
  }

  async function handleConfirmRestore() {
    if (!restorePath) return;
    try {
      const r = await window.api.backup.restore({ path: restorePath });
      toast.success(
        `Restored. Safety backup saved to: ${r.safetyBackupPath}`
      );
      // Prompt for restart
      setTimeout(async () => {
        const confirmed = confirm(
          "Restore complete. The app must restart for changes to take effect.\n\nRestart now?"
        );
        if (confirmed) {
          await window.api.backup.restart();
        }
      }, 500);
    } catch (e) {
      toast.error((e as Error).message ?? "Restore failed");
    } finally {
      setRestorePath(null);
    }
  }

  async function handleDeleteLocal(path: string) {
    if (!confirm("Delete this backup file?")) return;
    try {
      await window.api.backup.deleteLocal(path);
      toast.success("Backup deleted");
      await reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Delete failed");
    }
  }

  // ---------- Google Drive handlers ----------

  async function handleGdConfigure() {
    if (!gdClientId.trim() || !gdClientSecret.trim()) {
      toast.error("Enter both Client ID and Client Secret");
      return;
    }
    setGdBusy(true);
    try {
      await window.api.gdrive.configure({
        clientId: gdClientId.trim(),
        clientSecret: gdClientSecret.trim(),
      });
      toast.success("Google Drive configured");
      setGdClientId("");
      setGdClientSecret("");
      await reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Failed");
    } finally {
      setGdBusy(false);
    }
  }

  async function handleGdConnect() {
    setGdBusy(true);
    try {
      toast.info("Opening browser for Google sign-in…");
      await window.api.gdrive.connect();
      toast.success("Connected to Google Drive");
      await reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Connect failed");
    } finally {
      setGdBusy(false);
    }
  }

  async function handleGdDisconnect() {
    if (!confirm("Disconnect Google Drive?")) return;
    try {
      await window.api.gdrive.disconnect();
      toast.success("Disconnected");
      await reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Failed");
    }
  }

  async function handleGdUpload() {
    setGdBusy(true);
    try {
      const file = await window.api.gdrive.upload({});
      toast.success(`Uploaded: ${file.name}`);
      await reload();
    } catch (e) {
      toast.error((e as Error).message ?? "Upload failed");
    } finally {
      setGdBusy(false);
    }
  }

  async function handleGdRestoreConfirm() {
    if (!gdRestoreId) return;
    try {
      const r = await window.api.gdrive.restore({ fileId: gdRestoreId });
      toast.success(`Restored. Safety backup: ${r.safetyBackupPath}`);
      setTimeout(async () => {
        const confirmed = confirm("Restart now to apply?");
        if (confirmed) await window.api.backup.restart();
      }, 500);
    } catch (e) {
      toast.error((e as Error).message ?? "Restore failed");
    } finally {
      setGdRestoreId(null);
    }
  }

  return (
    <section className="space-y-8">
      {/* ─── Local backup ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-[rgb(var(--muted-fg))]" />
          <h2 className="text-base font-semibold">Local Backups</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleBackupNow} loading={busy}>
            <DownloadCloud className="w-4 h-4" />
            Backup Now
          </Button>
          <Button variant="outline" onClick={handleBackupAs} disabled={busy}>
            Backup As…
          </Button>
          <Button variant="outline" onClick={handlePickRestore} disabled={busy}>
            <UploadCloud className="w-4 h-4" />
            Restore from File…
          </Button>
          <Button variant="ghost" onClick={reload} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="rounded-lg border bg-[rgb(var(--card))] overflow-hidden">
          {loading ? (
            <p className="text-sm text-[rgb(var(--muted-fg))] p-4 text-center">
              Loading…
            </p>
          ) : backups.length === 0 ? (
            <p className="text-sm text-[rgb(var(--muted-fg))] p-4 text-center">
              No local backups yet.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">File</th>
                  <th className="text-right px-4 py-2 font-medium">Size</th>
                  <th className="text-right px-4 py-2 font-medium">Date</th>
                  <th className="text-right px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {backups.map((b) => (
                  <tr key={b.path} className="border-t">
                    <td className="px-4 py-2 font-mono text-xs truncate max-w-[280px]">
                      {b.name}
                    </td>
                    <td className="text-right px-4 py-2 text-xs text-[rgb(var(--muted-fg))]">
                      {formatBytes(b.sizeBytes)}
                    </td>
                    <td className="text-right px-4 py-2 text-xs text-[rgb(var(--muted-fg))]">
                      {formatDate(b.createdAt)}
                    </td>
                    <td className="text-right px-4 py-2">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRestorePath(b.path)}
                          title="Restore this backup"
                        >
                          <UploadCloud className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteLocal(b.path)}
                          title="Delete this backup"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── Google Drive ─── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <DownloadCloud className="w-4 h-4 text-[rgb(var(--muted-fg))]" />
          <h2 className="text-base font-semibold">Google Drive Backup</h2>
          {gdStatus?.connected ? (
            <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-green-500/15 text-green-700 dark:text-green-400">
              Connected
            </span>
          ) : gdStatus?.configured ? (
            <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400">
              Not connected
            </span>
          ) : (
            <span className="ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-500/15 text-gray-700 dark:text-gray-400">
              Not configured
            </span>
          )}
        </div>

        {!gdStatus?.configured && (
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
            <div className="flex gap-2 items-start">
              <AlertTriangle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-700 dark:text-blue-400">
                <p className="font-medium">Setup required</p>
                <p className="mt-1">
                  You need a Google Cloud OAuth Client ID. See the setup
                  instructions at the end of this doc.
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="gd-id">OAuth Client ID</Label>
                <Input
                  id="gd-id"
                  value={gdClientId}
                  onChange={(e) => setGdClientId(e.target.value)}
                  placeholder="xxxxx.apps.googleusercontent.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gd-secret">OAuth Client Secret</Label>
                <Input
                  id="gd-secret"
                  type="password"
                  value={gdClientSecret}
                  onChange={(e) => setGdClientSecret(e.target.value)}
                  placeholder="GOCSPX-…"
                />
              </div>
              <Button onClick={handleGdConfigure} loading={gdBusy}>
                Save Configuration
              </Button>
            </div>
          </div>
        )}

        {gdStatus?.configured && !gdStatus?.connected && (
          <div className="flex gap-2">
            <Button onClick={handleGdConnect} loading={gdBusy}>
              <Link2 className="w-4 h-4" />
              Connect to Google Drive
            </Button>
          </div>
        )}

        {gdStatus?.connected && (
          <>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleGdUpload} loading={gdBusy}>
                <UploadCloud className="w-4 h-4" />
                Upload Backup
              </Button>
              <Button variant="ghost" onClick={handleGdDisconnect}>
                <Link2Off className="w-4 h-4" />
                Disconnect
              </Button>
            </div>

            <div className="rounded-lg border bg-[rgb(var(--card))] overflow-hidden">
              {gdBackups.length === 0 ? (
                <p className="text-sm text-[rgb(var(--muted-fg))] p-4 text-center">
                  No Google Drive backups yet. Click "Upload Backup".
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-[rgb(var(--muted))] text-[rgb(var(--muted-fg))]">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">File</th>
                      <th className="text-right px-4 py-2 font-medium">Size</th>
                      <th className="text-right px-4 py-2 font-medium">Date</th>
                      <th className="text-right px-4 py-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {gdBackups.map((b) => (
                      <tr key={b.fileId} className="border-t">
                        <td className="px-4 py-2 font-mono text-xs truncate max-w-[280px]">
                          {b.name}
                        </td>
                        <td className="text-right px-4 py-2 text-xs text-[rgb(var(--muted-fg))]">
                          {formatBytes(b.sizeBytes)}
                        </td>
                        <td className="text-right px-4 py-2 text-xs text-[rgb(var(--muted-fg))]">
                          {formatDate(b.createdAt)}
                        </td>
                        <td className="text-right px-4 py-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setGdRestoreId(b.fileId ?? null)}
                            title="Restore from this backup"
                          >
                            <UploadCloud className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!restorePath}
        onClose={() => setRestorePath(null)}
        onConfirm={handleConfirmRestore}
        title="Restore from backup?"
        description="Your current database will be safety-backed up first, then replaced by the selected backup. The app will restart."
        confirmLabel="Restore"
        destructive
      />

      <ConfirmDialog
        open={!!gdRestoreId}
        onClose={() => setGdRestoreId(null)}
        onConfirm={handleGdRestoreConfirm}
        title="Restore from Google Drive?"
        description="The chosen backup will be downloaded and restored. Current DB is safety-backed up first. The app will restart."
        confirmLabel="Restore"
        destructive
      />
    </section>
  );
}