import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");
test("viewer supports STL, OBJ and 3MF", () => {
 const viewer=read("src/components/model-viewer.tsx");
 for(const loader of ["STLLoader","OBJLoader","ThreeMFLoader"]) assert.match(viewer,new RegExp(loader));
 assert.match(viewer,/ResizeObserver/);
 assert.match(viewer,/renderer\.dispose/);
});
test("file API only streams files owned by accessible models", () => {
 const api=read("src/app/api/models/[id]/files/[fileId]/content/route.ts");
 assert.match(api,/roleAllows\(viewer\.role, "USER"\)/);
 assert.match(api,/model: \{ isHidden: false, removedFromDrive: false \}/);
 assert.match(api,/Authorization: "Bearer " \+ token/);
 assert.match(api,/private, no-store/);
});
