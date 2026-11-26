import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const output = await build({ root, configFile: false, publicDir: false, logLevel: "silent", base: "./",
  build: { write: false, minify: true, target: "esnext", cssCodeSplit: true,
    rolldownOptions: { input: resolve(root, "experiments/direct-webgl-graph/index.html") } } });
const files: { file: string; raw: number; gzip: number }[] = [];
const chunks: { file: string; entry: boolean; imports: readonly string[]; dynamicImports: readonly string[]; modules: string[] }[] = [];
for (const result of Array.isArray(output) ? output : [output]) {
  if (!("output" in result)) throw new Error("Expected a completed production build.");
  for (const item of result.output) {
    const bytes = Buffer.from(item.type === "chunk" ? item.code : item.source);
    files.push({ file: item.fileName, raw: bytes.length, gzip: gzipSync(bytes).length });
    if (item.type === "chunk") chunks.push({ file: item.fileName, entry: item.isEntry,
      imports: item.imports, dynamicImports: item.dynamicImports,
      modules: Object.keys(item.modules).map((path) => relative(root, path)).sort() });
  }
}
const initial = new Set<string>(), queue = chunks.filter((chunk) => chunk.entry).map((chunk) => chunk.file);
while (queue.length) {
  const file = queue.pop()!;
  if (initial.has(file)) continue;
  initial.add(file);
  const chunk = chunks.find((candidate) => candidate.file === file);
  if (!chunk) throw new Error(`Missing emitted dependency ${file}`);
  queue.push(...chunk.imports);
}
const initialModules = chunks.filter((chunk) => initial.has(chunk.file)).flatMap((chunk) => chunk.modules);
assert.ok(!initialModules.some((module) => /node_modules\/three\/|graph-webgl-three|direct-webgl-graph\/reference/.test(module)),
  "The direct graph must not load the comparison's renderer eagerly.");
assert.ok(chunks.some((chunk) => chunk.modules.some((module) => /node_modules\/three\//.test(module))),
  "Measure the complete comparison closure, not a reduced surrogate.");
const sum = (selected: typeof files) => ({ files: selected.length, raw: selected.reduce((total, file) => total + file.raw, 0),
  gzip: selected.reduce((total, file) => total + file.gzip, 0) });
const summary = {
  initialJs: sum(files.filter((file) => initial.has(file.file))),
  comparisonJs: sum(files.filter((file) => /\.js$/.test(file.file) && !initial.has(file.file))),
  styles: sum(files.filter((file) => /\.css$/.test(file.file))),
  completeEmitted: sum(files)
};
const qualification = "Production HTML entry and complete reachable imports, lazy comparison, CSS and emitted assets. Gzip is a per-file estimate, not measured HTTP transfer. Complete emitted counts all emitted font formats; a browser may request only one. Runtime and visual evidence are separate in visual:direct-webgl-graph. This is an isolated pilot, not a before/after measurement of the notebook or renderer performance.";
const directory = resolve(root, "tmp/codex/direct-webgl-graph-cost");
await mkdir(directory, { recursive: true });
await writeFile(resolve(directory, "production.json"), JSON.stringify({ summary, qualification, files, chunks }, null, 2));
console.log(JSON.stringify(summary, null, 2));
console.log(qualification);
