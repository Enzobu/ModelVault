import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const load = path => readFileSync(new URL("../" + path, import.meta.url), "utf8");
test("gallery lists real paginated visible models", () => {
  const data = load("src/lib/models.ts");
  assert.match(data, /PAGE_SIZE = 24/);
  assert.match(data, /removedFromDrive: false/);
  assert.match(data, /isHidden: false/);
  assert.match(data, /findMany/);
  assert.match(data, /count/);
});
test("model pages reject unapproved accounts and hidden models", () => {
  const detail = load("src/app/models/[id]/page.tsx");
  assert.match(detail, /roleAllows\(viewer.role, "USER"\)/);
  assert.match(detail, /notFound\(\)/);
  assert.match(detail, /isHidden: false/);
});
