import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const load=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("favorite mutation is user-scoped and checks model visibility",()=>{
 const source=load("src/app/models/[id]/favorite-actions.ts");
 assert.match(source,/roleAllows\(viewer.role, "USER"\)/);
 assert.match(source,/userId: viewer.id, modelId/);
 assert.match(source,/isHidden: false, removedFromDrive: false/);
});
test("favorites can be filtered in gallery",()=>{
 const source=load("src/lib/models.ts");
 assert.match(source,/favorites: \{ some: \{ userId:/);
});
