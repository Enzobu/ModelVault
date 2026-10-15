import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url)));
test("quality scripts exist", () => {
  for (const name of ["build", "lint", "typecheck", "test"]) assert.ok(pkg.scripts[name]);
});
