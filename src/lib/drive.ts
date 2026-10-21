import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

const scope = "https://www.googleapis.com/auth/drive.readonly";
export const driveScope = scope;

export function driveKey() {
  const key = Buffer.from(process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY ?? "", "base64");
  if (key.length !== 32) throw new Error("GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key");
  return key;
}
export function encryptToken(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", driveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((v) => v.toString("base64url")).join(".");
}
export function decryptToken(value: string): string {
  const [iv, tag, ciphertext] = value.split(".");
  if (!iv || !tag || !ciphertext) throw new Error("Invalid encrypted token");
  const decipher = createDecipheriv("aes-256-gcm", driveKey(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64url")), decipher.final()]).toString("utf8");
}
export function driveRedirectUri(): string {
  const origin = process.env.AUTH_URL;
  if (!origin) throw new Error("AUTH_URL is required");
  return new URL("/api/admin/drive/callback", origin).toString();
}
export function driveOAuthCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth credentials missing");
  return { clientId, clientSecret };
}
export async function driveAccessToken(): Promise<string> {
  const settings = await prisma.driveConnection.findUnique({ where: { id: 1 } });
  if (!settings) throw new Error("Google Drive not connected");
  const { clientId, clientSecret } = driveOAuthCredentials();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: decryptToken(settings.refreshToken), grant_type: "refresh_token" }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("Google Drive token refresh failed");
  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error("Google Drive access token missing");
  return data.access_token;
}
export async function getDriveFolder(folderId: string) {
  if (!/^[a-zA-Z0-9_-]{10,200}$/.test(folderId)) throw new Error("Invalid folder ID");
  const accessToken = await driveAccessToken();
  const url = new URL("https://www.googleapis.com/drive/v3/files/" + encodeURIComponent(folderId));
  url.searchParams.set("fields", "id,name,mimeType,trashed");
  url.searchParams.set("supportsAllDrives", "true");
  const response = await fetch(url, { headers: { Authorization: "Bearer " + accessToken }, cache: "no-store" });
  if (!response.ok) throw new Error("Drive folder inaccessible");
  const folder = await response.json() as { id: string; name: string; mimeType: string; trashed?: boolean };
  if (folder.mimeType !== "application/vnd.google-apps.folder" || folder.trashed) throw new Error("Not a valid Drive folder");
  return folder;
}
