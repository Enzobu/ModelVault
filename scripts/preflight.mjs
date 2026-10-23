#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
const required = ["DATABASE_URL","AUTH_SECRET","AUTH_URL","GOOGLE_CLIENT_ID","GOOGLE_CLIENT_SECRET","GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY","DRIVE_SYNC_CRON_SECRET"];
let failed = false;
for (const name of required) {
  const value = process.env[name];
  if (!value || (name === "AUTH_SECRET" && value.length < 32) || (name === "DRIVE_SYNC_CRON_SECRET" && value.length < 24)) {
    console.error("Missing or insufficiently strong environment variable:",name);
    failed = true;
  }
}
try {
  const u = new URL(process.env.AUTH_URL ?? "");
  if(u.protocol !== "https:") throw new Error("AUTH_URL must use HTTPS");
} catch {
  console.error("AUTH_URL must be a valid HTTPS URL");
  failed = true;
}
if (!existsSync("prisma/migrations") || !existsSync("docker/entrypoint.sh")) {
  console.error("Required migration or entrypoint files missing");
  failed = true;
}
const compose = readFileSync("docker-compose.yml","utf8");
if (!compose.includes("condition: service_healthy") || !compose.includes("drive-sync-worker:")) {
  console.error("Expected database healthcheck and sync worker missing");failed=true;
}
if (failed) process.exit(1);
console.log("Configuration preflight OK (syntax/presence only; no connectivity or backups verified).");
