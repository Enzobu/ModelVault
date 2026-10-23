import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const load = p => readFileSync(new URL("../"+p,import.meta.url), "utf8");
test("Bridge tickets are user-scoped, short lived, one-time and hashed", () => {
 const create = load("src/app/api/bridge/tickets/route.ts");
 const claim = load("src/app/api/bridge/download/route.ts");
 assert.match(create,/roleAllows\(viewer.role, "USER"\)/);
 assert.match(create,/createHash\("sha256"\)/);
 assert.match(create,/2 \* 60_000/);
 assert.match(claim,/updateMany/);
 assert.match(claim,/consumedAt: null/);
 assert.match(claim,/expiresAt: \{ gt:/);
 assert.match(claim,/user.role === "PENDING"/);
});
test("Windows helper restricts host, protocol and zip contents", () => {
 const bridge = load("bridge/modelvault_bridge.py");
 assert.match(bridge,/ALLOWED_HOSTS/);
 assert.match(bridge,/origin.scheme != "https"/);
 assert.match(bridge,/len\(filename.parts\) != 1/);
 assert.match(bridge,/subprocess.Popen/);
});
