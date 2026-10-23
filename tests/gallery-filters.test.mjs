import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const load=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("gallery includes accessible filters and pagination",()=>{
 const page=load("src/app/page.tsx");
 const data=load("src/lib/models.ts");
 const filters=load("src/components/gallery-filters.tsx");
 for(const input of ['label="Catégorie"','label="Tag"','label="Organisation"','id="filter-query"']) assert.ok(filters.includes(input),input);
 const select=load("src/components/custom-select.tsx");
 assert.match(select,/aria-label=\{label\}/);
 assert.match(select,/role="listbox"/);
 assert.match(page,/aria-label="Pagination"/);
 assert.match(data,/tags: \{ some: \{ tagId:/);
 assert.match(data,/categoryId: filters.categoryId/);
 assert.match(data,/PAGE_SIZE = 24/);
});
