import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");

test("production deploy only runs on main",()=>{
 const flow=read(".github/workflows/ci.yml");
 assert.match(flow,/github\.ref == 'refs\/heads\/main'/);
 assert.match(flow,/github\.ref == 'refs\/heads\/dev'/);
 assert.match(flow,/needs: build/);
});
test("deployment handles Prisma migrations on startup",()=>{
 const entry=read("docker/entrypoint.sh");
 assert.ok(entry.indexOf("prisma migrate deploy") < entry.indexOf("exec node server.js"));
});
test("production release is explicitly gated by preprod validation",()=>{
 const guide=read("docs/release-checklist.md");
 assert.match(guide,/NON VALIDÉ/);
 assert.match(guide,/restauration testée/);
 assert.match(guide,/ne pas fusionner/i);
});
