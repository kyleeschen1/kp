import { createHash } from "node:crypto";
import { basename } from "node:path";
import katex from "katex";
import { checkBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { projectBayesReading } from "../src/experiments/bayesian-reasoning/readings.ts";
import { projectBayesPrompts } from "../src/experiments/bayesian-reasoning/prompts.ts";
import { extractBayesDenominator } from "../src/experiments/bayesian-reasoning/extraction.ts";
import { renderBayesTreeSvg } from "../src/experiments/bayesian-reasoning/tree-svg.ts";
import { encodeKpHtmlText as escape } from "../src/rendering/html-output-encoding.ts";
import { createKpCompiledPublicationArtifact, assertKpCompiledPublicationArtifact } from "../src/tutorial/kp-compiled-publication-artifact.ts";

const digest = (text: string): `sha256:${string}` => `sha256:${createHash("sha256").update(text).digest("hex")}`;

/** Compilation owns source verification; the artifact envelope pins bytes,
 * not mathematical truth. No editor, browser session or playback is emitted. */
export function compileBayesPublication(sourceText: string, sourcePath: string) {
  const result = checkBayesDraft(sourceText);
  if (result.status !== "compiled") throw new Error(`${result.diagnostic.path}: ${result.diagnostic.expected}`);
  const draft = result.draft, full = projectBayesReading(draft, "full"), compact = projectBayesReading(draft, "compact");
  const context = extractBayesDenominator(draft, 4), prompts = projectBayesPrompts(draft);
  const latex = draft.notation.animation.bundle.objects.map(object => {
    const value = object.value as { latex?: unknown };
    if (typeof value.latex !== "string") throw new Error("Native equation endpoint must retain its exact LaTeX.");
    return value.latex;
  });
  const math = latex.map(source => katex.renderToString(source, { displayMode: true, throwOnError: true, trust: false, output: "htmlAndMathml" }));
  const html = `<article data-bayes-publication-revision="${draft.revisionId}"><h1>Change the question. Keep the facts.</h1>
    ${full.html}<details><summary>Compact reading</summary>${compact.html}</details>
    <h2>Seven semantic checkpoints</h2>${draft.score.map((beat, index) => `<section id="${escape(beat.id)}"><h3>${index + 1}. ${escape(beat.title)}</h3>${beat.html}${renderBayesTreeSvg(draft.tree, index, `bayes-static-${index}`)}${index === 3 ? math[0] : index === 4 ? math[1] : ""}</section>`).join("")}
    <h2>Self-checks</h2>${prompts.map(prompt => `<section><h3>${escape(prompt.card.title)}</h3><p>${escape(prompt.card.prompt)}</p><details><summary>Reveal answer</summary><p>${escape(prompt.card.answer!.value)}</p></details></section>`).join("")}
    <p>Explanatory prose is editorial. Self-checks do not automatically grade unrestricted explanations. Tree order does not reverse causation.</p>
    <p>Revision: <code>${draft.revisionId}</code>. <a href="./source.json">Exact authored source</a></p></article>`;
  const payload = { revisionId: draft.revisionId, evidenceRevisionId: draft.authority.revisionId,
    source: JSON.parse(sourceText) as unknown, full, compact, context,
    prompts: prompts.map(prompt => ({ kind: prompt.kind, revisionId: prompt.revisionId, card: prompt.card, context: prompt.context })),
    reading: { html }, checkpoints: draft.score.map(beat => ({ id: beat.id, title: beat.title })) };
  return createKpCompiledPublicationArtifact({ artifactId: "publication.bayesian-reasoning",
    source: { path: basename(sourcePath), sha256: digest(sourceText) }, compiler: { id: "kp.bayesian-reasoning-publication", version: "1" },
    math: { engine: "katex", engineVersion: katex.version, rendering: "build-time", output: "htmlAndMathml", trust: false,
      fragmentCount: math.length, sourceLatex: [...new Set(latex)].sort() }, payloadSha256: digest(JSON.stringify(payload)), payload });
}
export function verifyBayesPublication(value: unknown, sourceText: string, sourcePath: string) {
  assertKpCompiledPublicationArtifact(value);
  if (JSON.stringify(value) !== JSON.stringify(compileBayesPublication(sourceText, sourcePath)))
    throw new Error("Publication does not reproduce from the selected probability source and trusted compiler.");
}
