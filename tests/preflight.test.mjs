import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("preflight requires separate auth, Drive and worker secrets",()=>{
 const s=read("scripts/preflight.mjs");
 for(const key of ["AUTH_SECRET","AUTH_URL","GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY","DRIVE_SYNC_CRON_SECRET"]) assert.ok(s.includes(key));
 assert.match(s,/https:/);
});
test("QA deliberately gates main behind live tests",()=>{
 const s=read("docs/final-qa.md");
 assert.match(s,/Ne pas merger/);
 assert.match(s,/isolée/);
});
