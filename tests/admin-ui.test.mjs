import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("dashboard requires admin privileges and displays real stats",()=>{
 const s=read("src/app/admin/page.tsx");
 assert.match(s,/viewer.role !== "ADMIN"/);
 assert.match(s,/prisma.user.count/);
 assert.match(s,/prisma.model3D.count/);
 assert.match(s,/driveSyncState.findUnique/);
});
test("admin sections use shared nav",()=>{
 for(const name of ["users","drive","organize"]){
  const s=read("src/app/admin/"+name+"/page.tsx");
  assert.match(s,/AdminNav/);
 }
});
