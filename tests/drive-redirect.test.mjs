import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
test("Drive OAuth returns to public AUTH_URL, not internal container hostname", () => {
 const source = readFileSync(new URL("../src/app/api/admin/drive/callback/route.ts", import.meta.url),"utf8");
 assert.match(source, /new URL\("\/admin\/drive\?connected=1", process\.env\.AUTH_URL/);
 assert.doesNotMatch(source, /new URL\("\/admin\/drive\?connected=1", request\.url/);
});
