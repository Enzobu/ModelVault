import test from "node:test";import assert from "node:assert/strict";import{readFileSync}from"node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("favorites are separate route and no favorite checkbox",()=>{assert.match(read("src/components/site-header.tsx"),/\/favorites/);assert.doesNotMatch(read("src/components/gallery-filters.tsx"),/Uniquement mes favoris/);});
test("profile uploads validated files under cache and checks permissions",()=>{const s=read("src/app/profile/actions.ts");assert.match(s,/roleAllows\(user.role,"USER"\)/);assert.match(s,/file.size>2\*1024\*1024/);assert.match(s,/profile-avatars/);});
test("all filter selects use custom controls",()=>{const s=read("src/components/gallery-filters.tsx");assert.match(s,/CustomSelect/);assert.doesNotMatch(s,/<select/);});
