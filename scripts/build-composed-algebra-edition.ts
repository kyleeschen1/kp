import { resolve } from "node:path";
import { collectFocusCardEditionStyles } from "./local-stylesheet-closure.ts";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { writeKpImmutableLocalEditionReceipt } from "./immutable-local-edition.ts";
import { readAuthorSource } from "./author-check.ts";
import { encodeKpHtmlText as escape } from "../src/rendering/html-output-encoding.ts";
import { compileComposedAlgebraPublication, composedAlgebraEditionRoot } from "./composed-algebra-publication.ts";
export { compileComposedAlgebraPublication, verifyComposedAlgebraPublication, composedAlgebraEditionRoot } from "./composed-algebra-publication.ts";

const repo = fileURLToPath(new URL("..", import.meta.url));
export function buildComposedAlgebraEdition(sourcePath: string, check = false) {
  const selected = resolve(sourcePath);
  if (selected.startsWith(`${composedAlgebraEditionRoot}/`)) throw new Error("Keep authored source outside generated editions.");
  const sourceText = readAuthorSource(selected), artifact = compileComposedAlgebraPublication(sourceText, selected);
  const files = new Map<string, string | Buffer>([
    ["source.json", sourceText], ["publication.json", JSON.stringify(artifact, null, 2) + "\n"],
    ...collectFocusCardEditionStyles(repo, "experiments/composed-algebra/style.css"),
    ["index.html", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(artifact.payload.source.editorial.title)}</title><link rel="stylesheet" href="./styles/experiments/authored-focus-card.css"><link rel="stylesheet" href="./styles/experiments/composed-algebra/style.css"></head><body><main id="authored-focus-card">${artifact.payload.reading.html}</main></body></html>`]
  ]);
  // Copy the current shared form into a new content-addressed edition. Existing
  // editions remain byte-stable; the writer never edits an old publication.
  const edition = writeKpImmutableLocalEditionReceipt({ repo, editionRoot: composedAlgebraEditionRoot, schemaVersion: "kp.composed-algebra-edition-files.v1",
    revisionId: artifact.payload.revisionId, files, check });
  // revisionId is retained as the explanation-revision compatibility alias.
  return { ...edition, revisionId: artifact.payload.revisionId, sourceRevision: artifact.source.sha256, checked: check };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: { source: { type: "string" }, check: { type: "boolean", default: false }, interactive: { type: "boolean", default: false } } });
  if (!values.source) throw new Error("Use --source <composed-algebra.json> [--interactive] [--check]; source selection is explicit.");
  // Static output does not import the browser bundler or change its byte closure.
  const build = values.interactive ? (await import("./algebra-interactive-edition.ts")).buildInteractiveAlgebraEdition : buildComposedAlgebraEdition;
  console.log(JSON.stringify(await build(values.source, values.check), null, 2));
}
