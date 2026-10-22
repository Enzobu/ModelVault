import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const load = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");
test("sync preserves metadata and tracks deletions", () => {
 const code=load("src/lib/drive-indexer.ts");
 assert.match(code,/removedFromDrive: false/);
 assert.match(code,/removedFromDrive: true/);
 assert.match(code,/modelFile\.deleteMany/);
 assert.match(code,/model3D\.updateMany/);
 assert.match(code,/upsert/);
});
test("soft removal is migrated", () => {
 assert.match(load("prisma/schema.prisma"),/removedFromDrive\s+Boolean/);
 assert.match(load("prisma/migrations/20261022010000_drive_soft_deleted/migration.sql"),/ADD COLUMN `removedFromDrive`/);
});
