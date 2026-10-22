import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const load=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("individual downloads reuse protected content route",()=>{
 const source=load("src/app/api/models/[id]/files/[fileId]/content/route.ts");
 assert.match(source,/searchParams\.has\("download"\)/);
 assert.match(source,/Content-Disposition/);
});
test("model zip streams rather than buffering all pieces",()=>{
 const source=load("src/app/api/models/[id]/download/route.ts");
 assert.match(source,/roleAllows\(viewer.role, "USER"\)/);
 assert.match(source,/archiver\("zip"/);
 assert.match(source,/Readable\.fromWeb/);
 assert.match(source,/Readable\.toWeb/);
 assert.match(source,/isHidden: false, removedFromDrive: false/);
});
