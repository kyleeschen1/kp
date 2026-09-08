import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import katex from "katex";
import { compileReasoningDraft } from "../src/experiments/reusable-reasoning/authoring.ts";
import { escapeReasoningText as escape, reasoningBeats } from "../src/experiments/reusable-reasoning/scaffold.ts";
import { createKpAuthoredDistributionProjection } from "../src/experiments/authoring-structural/distribution-projection.ts";
import { assertKpCompiledPublicationArtifact, createKpCompiledPublicationArtifact } from "../src/tutorial/kp-compiled-publication-artifact.ts";

const repo = fileURLToPath(new URL("..", import.meta.url));
export const reasoningEditionRoot = join(repo, "tmp/codex/reasoning-editions");
const digest = (text: string): `sha256:${string}` => `sha256:${createHash("sha256").update(text).digest("hex")}`;

/** A hash pins bytes; reproduction through the trusted compiler supplies proof. */
export function compileReasoningPublication(sourceText: string, sourcePath: string) {
  if (sourceText.length > 100_000) throw new Error("Reasoning source exceeds its bounded size.");
  const draft = compileReasoningDraft(JSON.parse(sourceText), createKpAuthoredDistributionProjection().projection.animationCandidate);
  const { evidence, context, full, compact, prompts } = draft;
  const mathSources = context.states.map(state => state.segments.map(segment => segment.latex).join(""));
  const math = (latex: string) => katex.renderToString(latex, { displayMode: true, throwOnError: true, trust: false, output: "htmlAndMathml" });
  const beats = reasoningBeats(evidence, "reason");
  const html = `<article data-reasoning-revision="${escape(evidence.revisionId)}">
    <h1>${escape(evidence.source.title)}</h1>
    <section id="parent"><h2>Argument</h2><p>${escape(evidence.editorial.parent)}</p>
      ${math(mathSources.at(-1)!)}<a href="#reason">Inspect the supporting reason</a></section>
    <section id="reason"><h2>${escape(evidence.source.reason.title)}</h2><p>${escape(full.text)}</p>
      <details><summary>Compact reading</summary><p>${escape(compact.text)}</p></details>
      <h3>Required assumptions</h3><ul>${context.assumptions.map(item => `<li id="${escape(item.id)}">${escape(item.statement)}</li>`).join("")}</ul>
      <h3>Verified steps</h3>${context.states.map((state, index) => `<section id="${escape(state.stateId)}"><h4>${escape(beats[index]!.title)}</h4>${beats[index]!.html}${math(mathSources[index]!)}</section>`).join("")}
      <h3>Definitions and evidence</h3><ul>${context.definitions.map(item => `<li><code>${escape(item.id)}</code>: ${escape(item.description)}</li>`).join("")}</ul>
      <ol>${context.operations.map(item => `<li><code>${escape(item.reference.id)}</code>: ${item.evidenceIds.map(escape).join("; ")}</li>`).join("")}</ol>
      <a href="#parent">Return to the argument</a></section>
    <section><h2>Retrieval practice</h2>${prompts.map(prompt => `<section><h3>${escape(prompt.card.title)}</h3><p>${escape(prompt.card.prompt)}</p><details><summary>Compare with the verified answer</summary>${math(prompt.answerLatex)}</details></section>`).join("")}</section>
    <p>Explanatory prose is editorial; the bounded equation relationships are verified. Practice is a self-check, not automatic grading.</p>
    <p>Revision: <code>${escape(evidence.revisionId)}</code>. <a href="./source.json">Authored source</a></p></article>`;
  const payload = { source: evidence.source, revisionId: evidence.revisionId, context, full, compact, prompts, reading: { html } };
  const sources = [...new Set([...mathSources, ...prompts.map(prompt => prompt.answerLatex)])].sort();
  return createKpCompiledPublicationArtifact({ artifactId: "publication.reusable-reasoning",
    source: { path: basename(sourcePath), sha256: digest(sourceText) },
    compiler: { id: "kp.reusable-reasoning-publication", version: "1" },
    math: { engine: "katex", engineVersion: katex.version, rendering: "build-time", output: "htmlAndMathml", trust: false,
      fragmentCount: mathSources.length + prompts.length + 1, sourceLatex: sources },
    payloadSha256: digest(JSON.stringify(payload)), payload });
}

export function verifyReasoningPublication(value: unknown, sourceText: string, sourcePath: string) {
  assertKpCompiledPublicationArtifact(value);
  if (JSON.stringify(value) !== JSON.stringify(compileReasoningPublication(sourceText, sourcePath))) {
    throw new Error("Publication does not reproduce from the selected source and trusted compiler.");
  }
}

/** Immutable local edition: never overwrites an older revision or publishes externally. */
export function buildReasoningEdition(sourcePath: string, check = false) {
  const selected = resolve(sourcePath), sourceText = readFileSync(selected, "utf8");
  const artifact = compileReasoningPublication(sourceText, selected);
  const directory = join(reasoningEditionRoot, digest(JSON.stringify(artifact)).slice(7));
  if (selected.startsWith(`${reasoningEditionRoot}/`)) throw new Error("Keep authored source outside generated editions.");
  let ancestor = repo;
  for (const part of ["tmp", "codex", "reasoning-editions", basename(directory)]) {
    ancestor = join(ancestor, part);
    if (lstatSync(ancestor, { throwIfNoEntry: false })?.isSymbolicLink()) throw new Error("Generated editions cannot traverse symlinks.");
  }
  const katexRoot = join(repo, "node_modules/katex/dist");
  const files = new Map<string, string | Buffer>([
    ["publication.json", JSON.stringify(artifact, null, 2) + "\n"], ["source.json", sourceText],
    ["index.html", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(artifact.payload.source.title)}</title><link rel="stylesheet" href="./katex.min.css"></head><body>${artifact.payload.reading.html}</body></html>`],
    ["katex.min.css", readFileSync(join(katexRoot, "katex.min.css"))],
    ...readdirSync(join(katexRoot, "fonts")).sort().map(file => [`fonts/${file}`, readFileSync(join(katexRoot, "fonts", file))] as [string, Buffer])
  ]);
  if (check || existsSync(directory)) {
    for (const [name, content] of files) {
      if (!readFileSync(join(directory, name)).equals(Buffer.from(content))) throw new Error(`Edition is stale or altered: ${name}`);
    }
  } else {
    mkdirSync(reasoningEditionRoot, { recursive: true });
    const staging = mkdtempSync(join(reasoningEditionRoot, ".building-"));
    try {
      mkdirSync(join(staging, "fonts"));
      for (const [name, content] of files) writeFileSync(join(staging, name), content, { flag: "wx" });
      renameSync(staging, directory);
    } finally { rmSync(staging, { recursive: true, force: true }); }
  }
  return { directory, revisionId: artifact.payload.revisionId, sourceRevision: artifact.source.sha256, checked: check };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { values } = parseArgs({ options: { source: { type: "string" }, check: { type: "boolean", default: false } } });
  if (!values.source) throw new Error("Use --source <reasoning.json>; source selection is explicit.");
  console.log(JSON.stringify(buildReasoningEdition(values.source, values.check), null, 2));
}
