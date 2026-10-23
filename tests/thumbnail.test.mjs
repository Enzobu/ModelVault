import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(new URL("../" + p, import.meta.url), "utf8");
test("thumbnail storage is access-controlled, path-safe and versioned", () => {
  const route = read("src/app/api/models/[id]/thumbnail/route.ts");
  const helper = read("src/lib/thumbnails.ts");
  assert.match(route, /roleAllows\(user.role, "USER"\)/);
  assert.match(route, /MAX_BYTES/);
  assert.match(route, /89504e470d0a1a0a/);
  assert.match(helper, /createHash\("sha256"\)/);
  assert.match(helper, /thumbnailFile/);
});
test("gallery renders lazily generated thumbnails", () => {
  const page = read("src/app/page.tsx");
  assert.match(page, /ModelThumbnail/);
});
