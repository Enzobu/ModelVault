import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const file = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("runtime applies migrations before starting Next.js", () => {
  const entrypoint = file("docker/entrypoint.sh");
  assert.ok(entrypoint.indexOf("prisma migrate deploy") < entrypoint.indexOf("exec node server.js"));
  assert.match(entrypoint, /set -eu/);
  const dockerfile = file("Dockerfile");
  assert.match(dockerfile, /COPY --from=builder --chown=app:app \/app\/prisma \.\/prisma/);
  assert.match(dockerfile, /ENTRYPOINT \["\.\/docker\/entrypoint\.sh"\]/);
});

test("initial migration contains all application tables", () => {
  const sql = file("prisma/migrations/20261021000000_init/migration.sql");
  for (const table of ["User", "Model3D", "ModelFile", "Category", "Tag", "ModelTag", "Favorite"]) {
    assert.ok(sql.includes("CREATE TABLE `" + table + "`"), table);
  }
});
