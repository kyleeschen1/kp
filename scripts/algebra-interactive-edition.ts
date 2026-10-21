import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { check } from "../src/authoring/algebra/compile.ts";
import { renderAlgebraIntuitionCard } from "../src/experiments/composed-algebra-intuition/scaffold.ts";
import { encodeKpHtmlAttribute as escape } from "../src/rendering/html-output-encoding.ts";
import { readAuthorSource } from "./author-check.ts";
import { buildAlgebraReader } from "./algebra-reader-build.ts";
import { compileComposedAlgebraPublication, composedAlgebraEditionRoot } from "./composed-algebra-publication.ts";
import { collectLocalStylesheetClosure } from "./local-stylesheet-closure.ts";
import { writeKpImmutableLocalEditionReceipt } from "./immutable-local-edition.ts";

const repo = fileURLToPath(new URL("..", import.meta.url));

export function renderInteractiveAlgebraEdition(sourceText: string, sourcePath: string) {
  // The v2 compiler rejects other versions; static v1 output stays supported by
  // its existing command. A publication receipt never grants animation authority.
  const checked = check(sourceText);
  if (checked.status !== "compiled") throw new Error(`${checked.diagnostic.code} at ${checked.diagnostic.path}: ${checked.diagnostic.expected}`);
  const draft = checked.draft, artifact = compileComposedAlgebraPublication(sourceText, sourcePath);
  const encoded = JSON.stringify(draft.checked.source).replaceAll("<", "\\u003c");
  const html = `<section data-algebra-edition="${escape(draft.revisionId)}" data-composed-status="preparing">
    <h1>${escape(draft.checked.source.editorial.title)}</h1><p>${escape(draft.checked.source.editorial.setup)}</p>
    <div data-composed-reader>${renderAlgebraIntuitionCard(draft, undefined, true)}</div>
    <p>${escape(draft.checked.source.editorial.summary)}</p><p data-composed-error role="alert" hidden></p>
    <script type="application/json" data-composed-initial-source>${encoded}</script>
    <noscript><style>[data-composed-reader]{display:none}</style></noscript>
    <section aria-label="Complete verified reading">${artifact.payload.reading.html}</section></section>`;
  return { artifact, html };
}

export async function buildInteractiveAlgebraEdition(sourcePath: string, check = false) {
  const selected = resolve(sourcePath);
  if (selected.startsWith(`${composedAlgebraEditionRoot}/`)) throw new Error("Keep authored source outside generated editions.");
  const sourceText = readAuthorSource(selected), { artifact, html } = renderInteractiveAlgebraEdition(sourceText, selected);
  const styles = ["experiments/authoring-distribution-focus-card/style.css", "experiments/reusable-reasoning/style.css",
    "experiments/common-factor/style.css", "experiments/composed-algebra/style.css"];
  const files = new Map<string, string | Buffer>([
    ["source.json", sourceText], ["publication.json", JSON.stringify(artifact, null, 2) + "\n"],
    ...collectLocalStylesheetClosure({ entries: styles.map(path => ({ root: join(repo, "src"), path, output: `styles/${path}` })),
      aliases: { "katex/dist/katex.min.css": { root: join(repo, "node_modules/katex/dist"), path: "katex.min.css", output: "katex.min.css" } } })
  ]);
  const reader = await buildAlgebraReader();
  for (const [path, bytes] of reader.files) {
    if (files.has(path)) throw new Error(`Reader asset collision: ${path}`);
    files.set(path, bytes);
  }
  // Include emitted native renderer styles as well as the canonical host styles.
  const css = [...reader.files.keys()].filter(path => path.endsWith(".css"));
  files.set("index.html", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(artifact.payload.source.editorial.title)}</title>${[...css, ...styles.map(path => `styles/${path}`)].map(path => `<link rel="stylesheet" href="./${escape(path)}">`).join("")}</head><body><main id="authored-focus-card">${html}</main><script type="module" src="./reader.js"></script></body></html>`);
  const edition = writeKpImmutableLocalEditionReceipt({ repo, editionRoot: composedAlgebraEditionRoot,
    schemaVersion: "kp.composed-algebra-edition-files.v1", revisionId: artifact.payload.revisionId, files, check });
  return { ...edition, revisionId: artifact.payload.revisionId, sourceRevision: artifact.source.sha256, mode: "interactive" as const, checked: check };
}
