import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const load = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("Drive OAuth uses state cookie and separate admin callback", () => {
  const connect = load("src/app/api/admin/drive/connect/route.ts");
  const callback = load("src/app/api/admin/drive/callback/route.ts");
  assert.match(connect, /admin\?\.role !== "ADMIN"/);
  assert.match(connect, /drive_oauth_state/);
  assert.match(connect, /access_type: "offline"/);
  assert.match(callback, /timingSafeEqual/);
  assert.match(callback, /encryptToken\(tokens.refresh_token\)/);
  assert.match(callback, /admin\?\.role !== "ADMIN"/);
});
test("Drive connection is persisted in migration and Prisma schema", () => {
  assert.match(load("prisma/schema.prisma"), /model DriveConnection/);
  assert.match(load("prisma/migrations/20261021010000_drive_connection/migration.sql"), /CREATE TABLE `DriveConnection`/);
  assert.match(load("src/lib/drive.ts"), /aes-256-gcm/);
  assert.match(load("docker-compose.yml"), /GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY:/);
});
