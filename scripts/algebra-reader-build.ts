import { build } from "vite";
import { fileURLToPath } from "node:url";
import { relative, resolve } from "node:path";

/** Capture the real read-only native reader closure, including lazy chunks and
 * emitted assets. No application config, public directory or dev runtime. */
export async function buildAlgebraReader(mode: "edition" | "editor" = "edition") {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const files = new Map<string, Buffer>();
  const chunks: { file: string; entry: boolean; imports: string[]; dynamicImports: string[]; modules: string[] }[] = [];
  const result = await build({ root, configFile: false, publicDir: false, logLevel: "silent", base: "./",
    build: { write: false, minify: true, target: "es2022", rolldownOptions: {
      input: { reader: resolve(root, `src/experiments/composed-algebra-intuition/${mode === "edition" ? "edition-reader" : "entry"}.ts`) },
      preserveEntrySignatures: "strict",
      output: { entryFileNames: "reader.js", chunkFileNames: "chunks/[name]-[hash].js", assetFileNames: "assets/[name]-[hash][extname]" }
    } } });
  // Read final output after Vite replaces lazy-preload placeholders. An early
  // generateBundle capture can package invalid, unfinished JavaScript.
  for (const output of Array.isArray(result) ? result : [result]) {
    if (!("output" in output)) throw new Error("Expected a completed reader build, not a watcher.");
    for (const item of output.output) {
      files.set(item.fileName, Buffer.from(item.type === "chunk" ? item.code : item.source));
      if (item.type === "chunk") {
        if (item.code.includes("__VITE_PRELOAD__")) throw new Error("Unresolved reader preload placeholder.");
        chunks.push({ file: item.fileName, entry: item.isEntry,
          imports: [...item.imports], dynamicImports: [...item.dynamicImports],
          modules: Object.keys(item.modules).map(path => relative(root, path)).sort() });
      }
    }
  }
  if (chunks.filter(c => c.entry).length !== 1 || !files.has("reader.js")) throw new Error("Expected one algebra reader entry.");
  for (const chunk of chunks) for (const dependency of [...chunk.imports, ...chunk.dynamicImports])
    if (!files.has(dependency)) throw new Error(`Reader dependency is outside the local closure: ${dependency}`);
  return { entry: "reader.js", files, chunks };
}
