import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { buildAlgebraReader } from "./algebra-reader-build.ts";
import { buildInteractiveAlgebraEdition } from "./algebra-interactive-edition.ts";
import { buildComposedAlgebraEdition } from "./build-composed-algebra-edition.ts";

export async function measureAlgebraEditions() {
  const consumers = [];
  for (const mode of ["edition", "editor"] as const) {
    const built = await buildAlgebraReader(mode);
    const chunks = [...built.files].filter(([path]) => path.endsWith(".js"))
      .map(([path, bytes]) => ({ path, raw: bytes.length, gzip: gzipSync(bytes).length }));
    consumers.push({ mode, chunks, raw: chunks.reduce((n, c) => n + c.raw, 0), gzip: chunks.reduce((n, c) => n + c.gzip, 0),
      modules: [...new Set(built.chunks.flatMap(c => c.modules))].sort() });
  }
  const editions = [];
  for (const source of ["content/authoring/algebra/whole-and-parts.json", "src/authoring/examples/composed-algebra-intuition.json"]) {
    for (const mode of ["static", "interactive"] as const) {
      const edition = mode === "static" ? buildComposedAlgebraEdition(source) : await buildInteractiveAlgebraEdition(source);
      const manifest = JSON.parse(readFileSync(join(edition.directory, "edition.json"), "utf8"));
      const files = Object.keys(manifest.files).map(path => {
        const bytes = readFileSync(join(edition.directory, path));
        return { path, raw: bytes.length, gzip: gzipSync(bytes).length };
      });
      editions.push({ source, mode, byteEditionId: edition.byteEditionId, files, raw: files.reduce((n, f) => n + f.raw, 0),
        gzip: files.reduce((n, f) => n + f.gzip, 0), manifestBytes: readFileSync(join(edition.directory, "edition.json")).length });
    }
  }
  return { qualification: "Complete production JS consumers include every lazy chunk. Edition closures include all fonts, styles, source and publication evidence; manifest bytes are separate. Sum of per-file gzip is an estimate, not HTTP transfer. Renderer and compiler remain real dependencies.", consumers, editions };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  if (process.argv.length !== 2) throw new Error("Run the fixed complete cohort without arguments.");
  const report = await measureAlgebraEditions();
  console.log(JSON.stringify({ qualification: report.qualification,
    consumers: report.consumers.map(({ modules, ...rest }) => ({ ...rest, moduleCount: modules.length,
      authorModules: modules.filter(path => path.startsWith("src/authoring/")) })),
    editions: report.editions.map(({ files, ...rest }) => ({ ...rest, fileCount: files.length })) }, null, 2));
}
