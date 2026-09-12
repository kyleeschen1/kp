import { basename, join, resolve } from "node:path";
import { collectFocusCardEditionStyles } from "./local-stylesheet-closure.ts";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import katex from "katex";
import { digestEditionBytes as digest, writeKpImmutableLocalEditionReceipt } from "./immutable-local-edition.ts";
import { readAuthorSource } from "./author-check.ts";
import { checkKpCommonFactorDraft } from "../src/authoring/common-factor-author-check.ts";
import { projectCommonFactorReading } from "../src/experiments/common-factor/readings.ts";
import { projectCommonFactorPrompts } from "../src/experiments/common-factor/practice.ts";
import { encodeKpHtmlText as escape } from "../src/rendering/html-output-encoding.ts";
import { createKpCompiledPublicationArtifact, assertKpCompiledPublicationArtifact } from "../src/tutorial/kp-compiled-publication-artifact.ts";

const repo = fileURLToPath(new URL("..", import.meta.url));
export const commonFactorEditionRoot = join(repo, "tmp/codex/common-factor-editions");

export function compileCommonFactorPublication(sourceText: string, sourcePath: string) {
  const checked = checkKpCommonFactorDraft(sourceText);
  if (checked.status !== "compiled") throw new Error(`${checked.diagnostic.code} at ${checked.diagnostic.path}: ${checked.diagnostic.expected}`);
  const draft = checked.draft, full = projectCommonFactorReading(draft, "full"), compact = projectCommonFactorReading(draft, "compact");
  const prompts = projectCommonFactorPrompts(draft).map(p => ({ kind: p.kind, revisionId: p.revisionId, card: p.card, answerLatex: p.answerLatex, answerExplanation: p.answerExplanation }));
  const math = (latex: string) => katex.renderToString(latex, { displayMode: true, throwOnError: true, trust: false, output: "htmlAndMathml" });
  const html = `<article data-common-factor-publication-revision="${draft.revisionId}"><h1>${escape(draft.source.editorial.title)}</h1>
    ${full.html}<details><summary>Compact reading</summary>${compact.html}</details>
    <section><h2>Self-checks</h2>${prompts.map(p => `<section><h3>${escape(p.card.title)}</h3><p>${escape(p.card.prompt)}</p>
    <details><summary>Compare with the verified answer</summary>${math(p.answerLatex)}<p>${escape(p.answerExplanation)}</p></details></section>`).join("")}</section>
    <p>One verified transition, not general polynomial factoring. Self-checks do not automatically grade your explanation.</p>
    <p>Revision: <code>${draft.revisionId}</code>. <a href="./source.json">Exact authored source</a></p></article>`;
  const payload = { source: draft.source, revisionId: draft.revisionId, proofRevisionId: draft.proof.revisionId,
    full, compact, prompts, checkpoints: draft.source.states.map(s => ({ id: s.id, narration: s.narration })), reading: { html } };
  return createKpCompiledPublicationArtifact({ artifactId: "publication.common-factor", source: { path: basename(sourcePath), sha256: digest(sourceText) },
    compiler: { id: "kp.common-factor-publication", version: "1" }, math: { engine: "katex", engineVersion: katex.version,
      rendering: "build-time", output: "htmlAndMathml", trust: false, fragmentCount: 6, sourceLatex: [full.facts.sourceLatex, full.facts.targetLatex].sort() },
    payloadSha256: digest(JSON.stringify(payload)), payload });
}
export function verifyCommonFactorPublication(value: unknown, sourceText: string, sourcePath: string) {
  assertKpCompiledPublicationArtifact(value);
  if (JSON.stringify(value) !== JSON.stringify(compileCommonFactorPublication(sourceText, sourcePath)))
    throw new Error("Publication does not reproduce from the selected factoring source and trusted compiler.");
}
export function buildCommonFactorEdition(sourcePath: string, check = false) {
  const selected = resolve(sourcePath);
  if (selected.startsWith(`${commonFactorEditionRoot}/`)) throw new Error("Keep authored source outside generated editions.");
  const sourceText = readAuthorSource(selected), artifact = compileCommonFactorPublication(sourceText, selected);
  const files = new Map<string, string | Buffer>([
    ["source.json", sourceText], ["publication.json", JSON.stringify(artifact, null, 2) + "\n"],
    ...collectFocusCardEditionStyles(repo, "experiments/common-factor/style.css"),
    ["index.html", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(artifact.payload.source.editorial.title)}</title><link rel="stylesheet" href="./styles/experiments/authored-focus-card.css"><link rel="stylesheet" href="./styles/experiments/common-factor/style.css"></head><body><main id="authored-focus-card">${artifact.payload.reading.html}</main></body></html>`]
  ]);
  const edition = writeKpImmutableLocalEditionReceipt({ repo, editionRoot: commonFactorEditionRoot, schemaVersion: "kp.common-factor-edition-files.v1",
    revisionId: artifact.payload.revisionId, files, check });
  // revisionId is retained as the explanation-revision compatibility alias.
  return { ...edition, revisionId: artifact.payload.revisionId, sourceRevision: artifact.source.sha256, checked: check };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: { source: { type: "string" }, check: { type: "boolean", default: false } } });
  if (!values.source) throw new Error("Use --source <common-factor.json>; source selection is explicit.");
  console.log(JSON.stringify(buildCommonFactorEdition(values.source, values.check), null, 2));
}
