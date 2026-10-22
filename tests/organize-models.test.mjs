import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("organization requires editor and keeps Drive metadata untouched",()=>{
 const source=read("src/app/admin/organize/actions.ts");
 assert.match(source,/roleAllows\(viewer.role, "EDITOR"\)/);
 assert.match(source,/tx\.modelTag\.deleteMany/);
 assert.match(source,/displayName: name \|\| null/);
 assert.doesNotMatch(source,/driveName: name/);
});
test("manual preview choices are migrated",()=>{
 const schema=read("prisma/schema.prisma");
 assert.match(schema,/previewFileId/);
 assert.match(schema,/previewZoom/);
});
