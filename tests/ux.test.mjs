import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("profile appearance is applied to all views",()=>{
 const layout=read("src/app/layout.tsx");
 const css=read("src/app/globals.css");
 assert.match(layout,/paletteColors/);
 assert.match(layout,/data-theme/);
 assert.match(css,/data-theme="dark"/);
 assert.match(css,/data-theme="light"/);
});
test("filters update without full-page form submission",()=>{
 const ui=read("src/components/gallery-filters.tsx");
 assert.match(ui,/router.replace/);
 assert.match(ui,/setTimeout/);
 assert.match(ui,/useTransition/);
});
test("organized models can be edited after classification",()=>{
 const ui=read("src/app/admin/organize/page.tsx");
 assert.match(ui,/view === "all"/);
 assert.match(ui,/details key=\{model.id\}/);
 assert.match(ui,/SubmitButton/);
});
