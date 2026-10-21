import { build } from "vite";
import { fileURLToPath } from "node:url";
import { relative, resolve } from "node:path";

/** Build only this existing reader, without the app config, public directory or
 * dev server. The edition writer owns publication of these captured bytes. */
export async function buildCalculusReader() {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const files = new Map<string, Buffer>();
  const chunks: { file: string; entry: boolean; imports: string[]; dynamicImports: string[]; modules: string[] }[] = [];
  await build({ root, configFile: false, publicDir: false, logLevel: "silent", base: "./",
    plugins: [{ name: "calculus-reader-capture", generateBundle(_options, bundle) {
      for (const item of Object.values(bundle)) {
        files.set(item.fileName, Buffer.from(item.type === "chunk" ? item.code : item.source));
        if (item.type === "chunk") chunks.push({ file: item.fileName, entry: item.isEntry,
          imports: [...item.imports], dynamicImports: [...item.dynamicImports],
          modules: Object.keys(item.modules).map(path => relative(root, path)).sort() });
      }
    } }],
    build: { write: false, minify: true, target: "es2022", rolldownOptions: {
      input: { reader: resolve(root, "src/tutorial/change-propagation/edition-reader.ts") },
      preserveEntrySignatures: "strict",
      output: { entryFileNames: "reader.js", chunkFileNames: "chunks/[name]-[hash].js", assetFileNames: "assets/[name]-[hash][extname]" }
    } } });
  if (chunks.filter(c => c.entry).length !== 1 || !files.has("reader.js")) throw new Error("Expected one calculus reader entry.");
  for (const chunk of chunks) for (const dependency of [...chunk.imports, ...chunk.dynamicImports])
    if (!files.has(dependency)) throw new Error(`Reader dependency is outside the local closure: ${dependency}`);
  return { entry: "reader.js", files, chunks };
}
