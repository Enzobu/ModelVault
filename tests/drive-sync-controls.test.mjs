import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("scheduled Drive sync requires a secret and uses atomic job claim", () => {
 const route = read("src/app/api/internal/drive-sync/route.ts");
 assert.match(route, /timingSafeEqual/);
 assert.match(route, /if \(!authorized\(request\)\)/);
 assert.match(route, /driveSyncState\.updateMany/);
 assert.match(route, /indexDriveModels\(\)/);
});
test("Compose adds recurring worker without exposing sync endpoint to public port", () => {
 const compose=read("docker-compose.yml");
 assert.match(compose,/drive-sync-worker:/);
 assert.match(compose,/DRIVE_SYNC_CRON_SECRET/);
 assert.match(compose,/http:\/\/app:3000\/api\/internal\/drive-sync/);
});
