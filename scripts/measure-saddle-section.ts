import assert from "node:assert/strict";
import { relative, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { build } from "vite";

const root = resolve(import.meta.dirname, "..");
const output = await build({ root, configFile: false, publicDir: false, logLevel: "silent", base: "./",
  build: { write: false, minify: true, target: "esnext", cssCodeSplit: true,
    rolldownOptions: { input: resolve(root, "experiments/saddle-section-reference/index.html") } } });
const files: { file: string; raw: number; gzip: number }[] = [], modules: string[] = [];
for (const result of Array.isArray(output) ? output : [output]) {
  if (!("output" in result)) throw new Error("Expected completed production build.");
  for (const item of result.output) {
    const bytes = Buffer.from(item.type === "chunk" ? item.code : item.source);
    files.push({ file: item.fileName, raw: bytes.length, gzip: gzipSync(bytes).length });
    if (item.type === "chunk") modules.push(...Object.keys(item.modules).map(path => relative(root, path)));
  }
}
assert.ok(!modules.some(path => /node_modules\/(three|katex|prosemirror)|fraction-notebook\/|editor-chat\/|direct-webgl-graph\//.test(path)),
  "The complete section reference must not import the experiment, editors, Three or a notation engine.");
const sum = (selected: typeof files) => ({ files: selected.length, raw: selected.reduce((n, f) => n + f.raw, 0), gzip: selected.reduce((n, f) => n + f.gzip, 0) });
const javascript = sum(files.filter(f => f.file.endsWith(".js")));
// Bounded initial allowance for the complete real host, not a reduced library surrogate.
assert.ok(javascript.raw < 60_000 && javascript.gzip < 21_000, "Section reference exceeds its measured-host allowance.");
console.log(JSON.stringify({ javascript, css: sum(files.filter(f => f.file.endsWith(".css"))), completeEmitted: sum(files) }, null, 2));
console.log("Complete reference HTML build, including emitted styles and font formats. Gzip sums estimate files, not network transfer or GPU execution time.");
