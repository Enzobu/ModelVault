import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../src/lib/drive-indexer.ts", import.meta.url), "utf8");
test("indexing uses Drive metadata, pagination and read-only access", () => {
  assert.match(source, /nextPageToken/);
  assert.match(source, /pageSize/);
  assert.match(source, /listDriveChildren\(folder\.id, token\)/);
  assert.match(source, /files\(id,name,mimeType,size,trashed\)/);
  assert.doesNotMatch(source, /alt=media|files\.get\?alt=media/);
});
test("model indexing is repeatable and does not overwrite organization choices", () => {
  assert.match(source, /model3D\.upsert/);
  assert.match(source, /modelFile\.upsert/);
  assert.match(source, /update: \{ driveName: folder\.name, removedFromDrive: false \}/);
  assert.match(source, /\$transaction/);
});
