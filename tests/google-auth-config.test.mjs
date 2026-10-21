import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("Google provider uses the OAuth credentials provided by Docker Compose", () => {
  const auth = readFileSync(new URL("../src/auth.ts", import.meta.url), "utf8");
  const compose = readFileSync(new URL("../docker-compose.yml", import.meta.url), "utf8");
  assert.match(auth, /clientId:\s*process\.env\.GOOGLE_CLIENT_ID/);
  assert.match(auth, /clientSecret:\s*process\.env\.GOOGLE_CLIENT_SECRET/);
  assert.match(compose, /GOOGLE_CLIENT_ID:\s*\$\{GOOGLE_CLIENT_ID:\?required\}/);
  assert.match(compose, /GOOGLE_CLIENT_SECRET:\s*\$\{GOOGLE_CLIENT_SECRET:\?required\}/);
});
