import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const load=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("gallery includes accessible filters and pagination",()=>{
 const page=load("src/app/page.tsx");
 const data=load("src/lib/models.ts");
 for(const input of ['name="category"','name="tag"','name="organization"','name="q"']) assert.ok(page.includes(input),input);
 assert.match(page,/aria-label="Pagination"/);
 assert.match(data,/tags: \{ some: \{ tagId:/);
 assert.match(data,/categoryId: filters.categoryId/);
 assert.match(data,/PAGE_SIZE = 24/);
});
