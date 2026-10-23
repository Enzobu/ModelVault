import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read=p=>readFileSync(new URL("../"+p,import.meta.url),"utf8");
test("Windows helper supports packaged exe and retains Cura imports",()=>{
 const source=read("bridge/modelvault_bridge.py");
 assert.match(source,/getattr\(sys, "frozen", False\)/);
 assert.match(source,/storage = APP_DIR/);
 assert.match(source,/7 \* 86400/);
 assert.match(source,/detect_cura/);
 assert.doesNotMatch(source,/time\.sleep\(20\)/);
});
test("Windows CI produces an installer artifact",()=>{
 const flow=read(".github/workflows/bridge-windows.yml");
 const iss=read("bridge/installer.iss");
 assert.match(flow,/windows-latest/);
 assert.match(flow,/PyInstaller/);
 assert.match(flow,/upload-artifact@v4/);
 assert.match(iss,/PrivilegesRequired=lowest/);
 assert.match(iss,/ModelVaultBridge-Setup/);
});
