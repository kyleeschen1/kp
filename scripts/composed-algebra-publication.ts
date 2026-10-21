import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import katex from "katex";
import { digestEditionBytes as digest } from "./immutable-local-edition.ts";
import { prepareComposedAlgebraPublicationSource } from "./composed-algebra-publication-source.ts";
import { encodeKpHtmlText as escape } from "../src/rendering/html-output-encoding.ts";
import { createKpCompiledPublicationArtifact, assertKpCompiledPublicationArtifact } from "../src/tutorial/kp-compiled-publication-artifact.ts";

export const composedAlgebraEditionRoot = join(fileURLToPath(new URL("..", import.meta.url)), "tmp/codex/composed-algebra-editions");
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
