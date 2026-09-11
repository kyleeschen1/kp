import { basename, join, resolve } from "node:path";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import katex from "katex";
import { digestEditionBytes as digest, writeKpImmutableLocalEdition } from "./immutable-local-edition.ts";
import { readAuthorSource } from "./author-check.ts";
import { prepareComposedAlgebraPublicationSource } from "./composed-algebra-publication-source.ts";
import { encodeKpHtmlText as escape } from "../src/rendering/html-output-encoding.ts";
import { createKpCompiledPublicationArtifact, assertKpCompiledPublicationArtifact } from "../src/tutorial/kp-compiled-publication-artifact.ts";

const repo = fileURLToPath(new URL("..", import.meta.url));
export const composedAlgebraEditionRoot = join(repo, "tmp/codex/composed-algebra-editions");
export function compileComposedAlgebraPublication(sourceText: string, sourcePath: string) {
  const prepared = prepareComposedAlgebraPublicationSource(sourceText), { draft, full, compact, questions } = prepared, source = draft.checked.source;
  const prompts = prepared.prompts.map(p => ({ kind: p.kind, revisionId: p.revisionId, card: p.card, answerLatex: p.answerLatex, answerExplanation: p.answerExplanation }));
  const math = (latex: string) => katex.renderToString(latex, { displayMode: true, throwOnError: true, trust: false, output: "htmlAndMathml" });
  const questionHtml = questions.map(q => `<section><h2>${escape(q.question)}</h2><p>${escape(q.setup)}</p>${q.states.map(s => math(s.latex)).join("")}<p>${escape(q.answer)}</p><p>All symbols are real scalars. Product and addend order are preserved.</p>${q.prompts.map(p => `<details><summary>${escape(p.card.prompt)}</summary>${math(p.answerLatex)}<p>${escape(p.answerExplanation)}</p></details>`).join("")}</section>`).join("");
  const html = `<article data-composed-publication-revision="${draft.revisionId}"><h1>${escape(source.editorial.title)}</h1>
    ${full.html}<details><summary>Compact reading</summary>${compact.html}</details>
    <section><h2>Self-checks</h2>${prompts.map(p => `<section><h3>${escape(p.card.title)}</h3><p>${escape(p.card.prompt)}</p>
    <details><summary>Compare with the verified answer</summary>${math(p.answerLatex)}<p>${escape(p.answerExplanation)}</p></details></section>`).join("")}</section>${questionHtml ? `\n    ${questionHtml}` : ""}
    <p>${source.states.length === 3 ? "Two" : draft.steps.length} verified deductions, not general symbolic algebra. Self-checks do not automatically grade your explanation.</p>
    <p>Revision: <code>${draft.revisionId}</code>. <a href="./source.json">Exact authored source</a></p></article>`;
  const payload = { source, revisionId: draft.revisionId, proofRevisionId: draft.checked.chain.revisionId,
    full, compact, prompts, ...(questions.length ? { questions } : {}), checkpoints: source.states.map(s => ({ id: s.id, narration: s.narration })), reading: { html } };
  return createKpCompiledPublicationArtifact({ artifactId: "publication.composed-algebra", source: { path: basename(sourcePath), sha256: digest(sourceText) },
    compiler: { id: "kp.composed-algebra-publication", version: prepared.version }, math: { engine: "katex", engineVersion: katex.version,
      rendering: "build-time", output: "htmlAndMathml", trust: false, fragmentCount: (html.match(/<math/g) ?? []).length, sourceLatex: [...new Set(source.states.map(s => s.latex))].sort() },
    payloadSha256: digest(JSON.stringify(payload)), payload });
}
export function verifyComposedAlgebraPublication(value: unknown, sourceText: string, sourcePath: string) {
  assertKpCompiledPublicationArtifact(value);
  if (JSON.stringify(value) !== JSON.stringify(compileComposedAlgebraPublication(sourceText, sourcePath)))
    throw new Error("Publication does not reproduce from the selected composed source and trusted compiler.");
}
export function buildComposedAlgebraEdition(sourcePath: string, check = false) {
  const selected = resolve(sourcePath);
  if (selected.startsWith(`${composedAlgebraEditionRoot}/`)) throw new Error("Keep authored source outside generated editions.");
  const sourceText = readAuthorSource(selected), artifact = compileComposedAlgebraPublication(sourceText, selected), katexRoot = join(repo, "node_modules/katex/dist");
  const files = new Map<string, string | Buffer>([
    ["source.json", sourceText], ["publication.json", JSON.stringify(artifact, null, 2) + "\n"],
    ["katex.min.css", readFileSync(join(katexRoot, "katex.min.css"))],
    ...readdirSync(join(katexRoot, "fonts")).sort().map(file => [`fonts/${file}`, readFileSync(join(katexRoot, "fonts", file))] as [string, Buffer]),
    ["index.html", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(artifact.payload.source.editorial.title)}</title><link rel="stylesheet" href="./styles/experiments/authored-focus-card.css"><link rel="stylesheet" href="./styles/experiments/composed-algebra/style.css"></head><body><main id="authored-focus-card">${artifact.payload.reading.html}</main></body></html>`]
  ]);
  // Copy the current shared form into a new content-addressed edition. Existing
  // editions remain byte-stable; the writer never edits an old publication.
  for (const path of ["experiments/authored-focus-card.css", "experiments/composed-algebra/style.css", "reader/app/exemplar.css", "rendering/canonical-equation-stage.css", "tutorial/focus-deck-scaffold.css"]) {
    const source = readFileSync(join(repo, "src", path), "utf8");
    files.set(`styles/${path}`, path === "reader/app/exemplar.css" ? source.replace('@import "katex/dist/katex.min.css";', '@import "../../../katex.min.css";') : source);
  }
  const directory = writeKpImmutableLocalEdition({ repo, editionRoot: composedAlgebraEditionRoot, schemaVersion: "kp.composed-algebra-edition-files.v1",
    revisionId: artifact.payload.revisionId, files, check });
  return { directory, revisionId: artifact.payload.revisionId, sourceRevision: artifact.source.sha256, checked: check };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: { source: { type: "string" }, check: { type: "boolean", default: false } } });
  if (!values.source) throw new Error("Use --source <composed-algebra.json>; source selection is explicit.");
  console.log(JSON.stringify(buildComposedAlgebraEdition(values.source, values.check), null, 2));
}
