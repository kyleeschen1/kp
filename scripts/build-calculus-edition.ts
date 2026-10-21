import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { compileCalculusPublication } from "./calculus-publication.ts";
import { readAuthorSource } from "./author-check.ts";
import { collectLocalStylesheetClosure } from "./local-stylesheet-closure.ts";
import { writeKpImmutableLocalEditionReceipt } from "./immutable-local-edition.ts";
import { encodeKpHtmlText as escape } from "../src/rendering/html-output-encoding.ts";

const repo = fileURLToPath(new URL("..", import.meta.url));
export const calculusEditionRoot = join(repo, "tmp/codex/calculus-editions");

export function calculusEditionStyles() {
  return collectLocalStylesheetClosure({ entries: [
    { root: join(repo, "src"), path: "tutorial/change-propagation/reader.css", output: "styles/tutorial/change-propagation/reader.css" },
    { root: join(repo, "node_modules/katex/dist"), path: "katex.min.css", output: "katex.min.css" }
  ] });
}

export function buildCalculusEdition(sourcePath: string, check = false) {
  const selected = resolve(sourcePath);
  if (selected.startsWith(`${calculusEditionRoot}/`)) throw new Error("Keep authored source outside generated editions.");
  const bytes = readAuthorSource(selected), artifact = compileCalculusPublication(bytes, selected);
  const files = new Map<string, string | Buffer>([
    ["source.json", bytes], ["publication.json", JSON.stringify(artifact, null, 2) + "\n"],
    ...calculusEditionStyles(),
    ["index.html", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(artifact.payload.source.title)}</title><link rel="stylesheet" href="./katex.min.css"><link rel="stylesheet" href="./styles/tutorial/change-propagation/reader.css"></head><body><main class="change-page">${artifact.payload.reading.html}<p><a href="./source.json">Exact authored source</a></p></main></body></html>`]
  ]);
  const edition = writeKpImmutableLocalEditionReceipt({ repo, editionRoot: calculusEditionRoot,
    schemaVersion: "kp.calculus-edition-files.v1", revisionId: artifact.payload.revisionId, files, check });
  return { ...edition, sourceRevision: artifact.source.sha256, mode: "static" as const, checked: check };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: { source: { type: "string" }, check: { type: "boolean", default: false } } });
  if (!values.source) throw new Error("Use --source <calculus.json> [--check]; source selection is explicit.");
  console.log(JSON.stringify(buildCalculusEdition(values.source, values.check), null, 2));
}
