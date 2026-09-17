import { shell } from "electron";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import https from "node:https";
import http from "node:http";
import { safeStorage } from "electron";
import { getDatabasePath, getBackupDir, getUserDataDir } from "../database/paths";
import { getRawDb } from "../database/client";
import type {
  BackupFile,
  GdriveConfigInput,
  GdriveRestoreInput,
  GdriveStatus,
  GdriveUploadInput,
  RestoreResult,
} from "../shared/types/backup";

// ---------- Config storage ----------

type GdriveConfig = {
  clientId: string;
  clientSecret: string;
  refreshToken?: string;
  accessToken?: string;
  accessTokenExpiry?: number; // unix ms
  email?: string;
};

function configPath(): string {
  return path.join(getUserDataDir(), "gdrive-config.bin");
}

function loadConfig(): GdriveConfig | null {
  const p = configPath();
  if (!fs.existsSync(p)) return null;
  try {
    const encrypted = fs.readFileSync(p);
    const json = safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(encrypted)
      : encrypted.toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function saveConfig(cfg: GdriveConfig) {
  const json = JSON.stringify(cfg);
  const p = configPath();
  if (safeStorage.isEncryptionAvailable()) {
    fs.writeFileSync(p, safeStorage.encryptString(json));
  } else {
    fs.writeFileSync(p, json, "utf8");
  }
}

// ---------- HTTP helpers ----------

function httpsJson(
  options: https.RequestOptions,
  body?: string
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          resolve({
            status: res.statusCode ?? 0,
            data: data ? JSON.parse(data) : null,
          });
        } catch {
          resolve({ status: res.statusCode ?? 0, data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

// ---------- OAuth flow ----------

const OAUTH_PORT = 56234; // fixed port so redirect URI is stable
const REDIRECT_URI = `http://localhost:${OAUTH_PORT}/oauth/callback`;
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

async function startOauthFlow(cfg: GdriveConfig): Promise<string> {
  // PKCE
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  const state = crypto.randomBytes(16).toString("hex");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", cfg.clientId);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES.join(" "));
  authUrl.searchParams.set("code_challenge", codeChallenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("state", state);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  return new Promise<string>((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url ?? "/", `http://localhost:${OAUTH_PORT}`);
        if (url.pathname !== "/oauth/callback") {
          res.writeHead(404);
          res.end();
          return;
        }

        const code = url.searchParams.get("code");
        const returnedState = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end(
            `<h1>Authorization failed</h1><p>${error}</p><p>Close this tab and try again.</p>`
          );
          server.close();
          reject(new Error(`OAuth error: ${error}`));
          return;
        }
        if (returnedState !== state || !code) {
          res.writeHead(400);
          res.end("Invalid state");
          server.close();
          reject(new Error("OAuth state mismatch"));
          return;
        }

        // Exchange code for tokens
        const tokenBody = new URLSearchParams({
          code,
          client_id: cfg.clientId,
          client_secret: cfg.clientSecret,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
          code_verifier: codeVerifier,
        }).toString();

        const tokenRes = await httpsJson(
          {
            method: "POST",
            hostname: "oauth2.googleapis.com",
            path: "/token",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Content-Length": Buffer.byteLength(tokenBody),
            },
          },
          tokenBody
        );

        if (tokenRes.status !== 200 || !tokenRes.data?.refresh_token) {
          res.writeHead(500);
          res.end("Token exchange failed");
          server.close();
          reject(new Error("Token exchange failed"));
          return;
        }

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
          `<h1 style="font-family:system-ui">✓ Connected</h1><p style="font-family:system-ui">You can close this tab and return to Apni Dukan.</p>`
        );
        server.close();

        resolve(tokenRes.data.refresh_token as string);
      } catch (err) {
        server.close();
        reject(err);
      }
    });

    server.listen(OAUTH_PORT, () => {
      void shell.openExternal(authUrl.toString());
    });
    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error("OAuth timed out"));
    }, 5 * 60 * 1000);
  });
}

async function getAccessToken(cfg: GdriveConfig): Promise<string> {
  if (
    cfg.accessToken &&
    cfg.accessTokenExpiry &&
    cfg.accessTokenExpiry > Date.now() + 30_000
  ) {
    return cfg.accessToken;
  }

  if (!cfg.refreshToken) throw new Error("Not connected to Google Drive");

  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    refresh_token: cfg.refreshToken,
    grant_type: "refresh_token",
  }).toString();

  const res = await httpsJson(
    {
      method: "POST",
      hostname: "oauth2.googleapis.com",
      path: "/token",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(body),
      },
    },
    body
  );

  if (res.status !== 200 || !res.data?.access_token) {
    throw new Error("Failed to refresh access token");
  }

  cfg.accessToken = res.data.access_token;
  cfg.accessTokenExpiry = Date.now() + res.data.expires_in * 1000;
  saveConfig(cfg);

  return cfg.accessToken!;
}

// ---------- Drive operations ----------

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const DRIVE_UPLOAD = "https://www.googleapis.com/upload/drive/v3";

async function findOrCreateFolder(
  accessToken: string,
  name: string
): Promise<string> {
  // Search for folder by name
  const q = `mimeType='application/vnd.google-apps.folder' and name='${name.replace(
    /'/g,
    "\\'"
  )}' and trashed=false`;
  const listRes = await httpsJson({
    method: "GET",
    hostname: "www.googleapis.com",
    path: `/drive/v3/files?q=${encodeURIComponent(
      q
    )}&fields=files(id,name)&spaces=drive`,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (listRes.data?.files?.length > 0) {
    return listRes.data.files[0].id;
  }

  // Create folder
  const body = JSON.stringify({
    name,
    mimeType: "application/vnd.google-apps.folder",
  });
  const createRes = await httpsJson(
    {
      method: "POST",
      hostname: "www.googleapis.com",
      path: "/drive/v3/files?fields=id",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    },
    body
  );

  if (!createRes.data?.id) throw new Error("Failed to create folder");
  return createRes.data.id;
}

async function uploadFile(
  accessToken: string,
  parentFolderId: string,
  filename: string,
  filePath: string
): Promise<{ id: string }> {
  const fileBuffer = fs.readFileSync(filePath);
  const boundary = "-------apni_dukan_" + crypto.randomBytes(8).toString("hex");
  const metadata = JSON.stringify({
    name: filename,
    parents: [parentFolderId],
  });

  const bodyBuffer = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(`Content-Type: application/json; charset=UTF-8\r\n\r\n`),
    Buffer.from(metadata),
    Buffer.from(`\r\n--${boundary}\r\n`),
    Buffer.from(`Content-Type: application/octet-stream\r\n\r\n`),
    fileBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method: "POST",
        hostname: "www.googleapis.com",
        path: "/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,createdTime",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
          "Content-Length": bodyBuffer.length,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.id) resolve(parsed);
            else reject(new Error(parsed.error?.message ?? "Upload failed"));
          } catch {
            reject(new Error("Upload failed"));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(bodyBuffer);
    req.end();
  });
}

async function listBackupFiles(accessToken: string): Promise<BackupFile[]> {
  const folderId = await findOrCreateFolder(accessToken, "Apni Dukan Backups");
  const q = `'${folderId}' in parents and trashed=false and mimeType!='application/vnd.google-apps.folder'`;
  const res = await httpsJson({
    method: "GET",
    hostname: "www.googleapis.com",
    path: `/drive/v3/files?q=${encodeURIComponent(
      q
    )}&fields=files(id,name,size,createdTime)&orderBy=createdTime desc&pageSize=100`,
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const files = res.data?.files ?? [];
  return files.map((f: any) => ({
    name: f.name,
    path: f.id,
    fileId: f.id,
    sizeBytes: parseInt(f.size ?? "0", 10),
    createdAt: Math.floor(new Date(f.createdTime).getTime() / 1000),
    source: "gdrive" as const,
  }));
}

async function downloadFile(
  accessToken: string,
  fileId: string,
  destPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method: "GET",
        hostname: "www.googleapis.com",
        path: `/drive/v3/files/${fileId}?alt=media`,
        headers: { Authorization: `Bearer ${accessToken}` },
      },
      (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Download failed: HTTP ${res.statusCode}`));
          return;
        }
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          fs.writeFileSync(destPath, Buffer.concat(chunks));
          resolve();
        });
      }
    );
    req.on("error", reject);
    req.end();
  });
}

// ---------- Service ----------

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}_${p(d.getMonth() + 1)}_${p(d.getDate())}_${p(
    d.getHours()
  )}_${p(d.getMinutes())}`;
}

export const gdriveService = {
  async getStatus(): Promise<GdriveStatus> {
    const cfg = loadConfig();
    if (!cfg) return { connected: false, email: null, configured: false };
    return {
      connected: !!cfg.refreshToken,
      email: cfg.email ?? null,
      configured: !!(cfg.clientId && cfg.clientSecret),
    };
  },

  async configure(input: GdriveConfigInput): Promise<GdriveStatus> {
    let cfg = loadConfig() ?? {
      clientId: "",
      clientSecret: "",
    };
    cfg.clientId = input.clientId;
    cfg.clientSecret = input.clientSecret;
    saveConfig(cfg);
    return this.getStatus();
  },

  async connect(): Promise<GdriveStatus> {
    const cfg = loadConfig();
    if (!cfg?.clientId || !cfg?.clientSecret) {
      throw new Error(
        "Google Drive not configured. Enter Client ID and Secret first."
      );
    }
    const refreshToken = await startOauthFlow(cfg);
    cfg.refreshToken = refreshToken;
    cfg.accessToken = undefined;
    cfg.accessTokenExpiry = undefined;
    saveConfig(cfg);
    return this.getStatus();
  },

  async disconnect(): Promise<GdriveStatus> {
    const cfg = loadConfig();
    if (cfg) {
      delete cfg.refreshToken;
      delete cfg.accessToken;
      delete cfg.accessTokenExpiry;
      saveConfig(cfg);
    }
    return this.getStatus();
  },

  async upload(input: GdriveUploadInput): Promise<BackupFile> {
    const cfg = loadConfig();
    if (!cfg?.refreshToken) throw new Error("Not connected to Google Drive");

    // Flush WAL before uploading
    getRawDb().pragma("wal_checkpoint(TRUNCATE)");

    const accessToken = await getAccessToken(cfg);
    const folderId = await findOrCreateFolder(accessToken, "Apni Dukan Backups");

    const filename =
      input.filename ?? `ApniDukan_Backup_${timestamp()}.db`;
    const dbPath = getDatabasePath();

    const uploaded = await uploadFile(
      accessToken,
      folderId,
      filename,
      dbPath
    );

    const stat = fs.statSync(dbPath);

    return {
      name: filename,
      path: uploaded.id,
      fileId: uploaded.id,
      sizeBytes: stat.size,
      createdAt: Math.floor(Date.now() / 1000),
      source: "gdrive",
    };
  },

  async list(): Promise<BackupFile[]> {
    const cfg = loadConfig();
    if (!cfg?.refreshToken) throw new Error("Not connected to Google Drive");
    const accessToken = await getAccessToken(cfg);
    return listBackupFiles(accessToken);
  },

  async restore(input: GdriveRestoreInput): Promise<RestoreResult> {
    const cfg = loadConfig();
    if (!cfg?.refreshToken) throw new Error("Not connected to Google Drive");

    const accessToken = await getAccessToken(cfg);

    // Download to a temp file
    const tmpDir = getBackupDir();
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const tmpPath = path.join(tmpDir, `gdrive_download_${timestamp()}.db`);

    await downloadFile(accessToken, input.fileId, tmpPath);

    // Now reuse the local restore logic
    const { backupService } = await import("./backup.service");
    return backupService.restore({ path: tmpPath });
  },
};