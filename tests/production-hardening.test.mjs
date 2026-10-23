import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("production cache eviction is bounded and invoked by worker",()=>{
 const cache=read("src/lib/thumbnails.ts");
 const worker=read("src/app/api/internal/drive-sync/route.ts");
 assert.match(cache,/pruneThumbnailCache/);
 assert.match(cache,/45 \* 24 \* 60 \* 60/);
 assert.match(worker,/pruneThumbnailCache\(\)/);
});
test("large downloads and bridge ticket floods are limited",()=>{
 for(const p of ["src/app/api/models/[id]/download/route.ts","src/app/api/bridge/download/route.ts"]) {
   const code=read(p);
   assert.match(code,/1_500_000_000n/);
   assert.match(code,/model.files.length > 500/);
 }
 const bridge=read("src/app/api/bridge/tickets/route.ts");
 assert.match(bridge,/activeTickets >= 5/);
 assert.match(bridge,/bridgeTicket.deleteMany/);
});
test("backup is opt-in and never writes into the repository",()=>{
 const compose=read("docker-compose.yml");
 const backup=read("scripts/backup-mariadb.sh");
 const ignore=read(".gitignore");
 assert.match(compose,/profiles: \["backups"\]/);
 assert.match(backup,/single-transaction/);
 assert.match(backup,/umask 077/);
 assert.match(ignore,/backups\//);
});
test("admin diagnostics are restricted to administrators",()=>{
 const s=read("src/app/admin/diagnostics/page.tsx");
 assert.match(s,/viewer.role !== "ADMIN"/);
 assert.match(s,/process.memoryUsage/);
});
