// Junta os fontes num único HTML.  Uso:  node build.mjs [destino.html]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const read = (f) => readFileSync(resolve(here, f), "utf8");

const core = read("core.js").replace(/^if \(typeof module.*$/m, "");
const app = ["base.js", "views.js", "extra.js", "tools.js"].map(read).join("\n");
const out = read("shell.html").replace("/*CORE*/", core).replace("/*APP*/", app);

const dest = resolve(process.argv[2] || resolve(here, "../schedule1-save-editor.html"));
writeFileSync(dest, out);
console.log("Escrito", dest, "(" + Math.round(out.length / 1024) + " KB)");
