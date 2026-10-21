import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { readAuthorSource } from "./author-check.ts";
import { compileMatrixPublication, matrixEditionRoot } from "./matrix-publication.ts";
import { collectLocalStylesheetClosure } from "./local-stylesheet-closure.ts";
import { writeKpImmutableLocalEditionReceipt } from "./immutable-local-edition.ts";
import { encodeKpHtmlAttribute as escape } from "../src/rendering/html-output-encoding.ts";

const repo = fileURLToPath(new URL("..", import.meta.url));
export async function buildMatrixEdition(sourcePath: string, options: { interactive?: boolean; check?: boolean } = {}) {
  const selected = resolve(sourcePath);
  if (selected.startsWith(`${matrixEditionRoot}/`)) throw new Error("Keep authored source outside generated editions.");
  const sourceText = readAuthorSource(selected), artifact = compileMatrixPublication(sourceText, selected);
  const { source, revisionId } = artifact.payload;
  const styles = ["experiments/matrix-example-page.css", "experiments/matrix-column-combinations/style.css"];
  const files = new Map<string, string | Buffer>([
    ["source.json", sourceText], ["publication.json", JSON.stringify(artifact, null, 2) + "\n"],
    ...collectLocalStylesheetClosure({ entries: styles.map(path => ({ root: join(repo, "src"), path, output: `styles/${path}` })),
      aliases: { "katex/dist/katex.min.css": { root: join(repo, "node_modules/katex/dist"), path: "katex.min.css", output: "katex.min.css" } } })
  ]);
  const css = styles.map(path => `styles/${path}`);
  if (options.interactive) {
    // Static editions do not load the bundler. Both reader families share its
    // complete-output capture and dependency checks, not their domain compilers.
    const { buildLocalReader } = await import("./local-reader-build.ts");
    const reader = await buildLocalReader("src/experiments/matrix-column-combinations/edition-reader.ts");
    for (const [path, bytes] of reader.files) {
      if (files.has(path)) throw new Error(`Reader asset collision: ${path}`);
      files.set(path, bytes); if (path.endsWith(".css")) css.push(path);
    }
  }
  const interactive = options.interactive ? `<div id="comb-player" class="matrix-player" aria-busy="true"><p>Preparing the column combination…</p></div>
    <script type="application/json" data-matrix-source>${JSON.stringify(source).replaceAll("<", "\\u003c")}</script>
    <noscript><style>#comb-player{display:none}</style></noscript>` : "";
  files.set("index.html", `<!doctype html><html lang="en" class="matrix-example-page"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(source.reading.title)}</title>${css.map(path => `<link rel="stylesheet" href="./${escape(path)}">`).join("")}</head><body>
    <main id="matrix-story" data-matrix-revision="${escape(revisionId)}"><h1>${escape(source.reading.title)}</h1><p>${escape(source.reading.introduction)}</p>
    ${interactive}${artifact.payload.reading.html}</main>${options.interactive ? '<script type="module" src="./reader.js"></script>' : ""}</body></html>`);
  const edition = writeKpImmutableLocalEditionReceipt({ repo, editionRoot: matrixEditionRoot,
    schemaVersion: "kp.matrix-columns-edition-files.v1", revisionId, files, check: options.check ?? false });
  return { ...edition, revisionId, sourceRevision: artifact.source.sha256,
    mode: options.interactive ? "interactive" as const : "static" as const, checked: options.check ?? false };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: { source: { type: "string" }, check: { type: "boolean", default: false }, interactive: { type: "boolean", default: false } } });
  if (!values.source) throw new Error("Use --source <matrix.json> [--interactive] [--check]; source selection is explicit.");
  console.log(JSON.stringify(await buildMatrixEdition(values.source, values), null, 2));
}
