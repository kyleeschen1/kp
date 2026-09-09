import { createHash } from "node:crypto";
import { basename, dirname, join, relative, resolve } from "node:path";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import katex from "katex";
import { checkBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { projectBayesReading } from "../src/experiments/bayesian-reasoning/readings.ts";
import { projectBayesPrompts } from "../src/experiments/bayesian-reasoning/prompts.ts";
import { extractBayesDenominator } from "../src/experiments/bayesian-reasoning/extraction.ts";
import { renderBayesTreeSvg } from "../src/experiments/bayesian-reasoning/tree-svg.ts";
import { encodeKpHtmlText as escape } from "../src/rendering/html-output-encoding.ts";
import { createKpCompiledPublicationArtifact, assertKpCompiledPublicationArtifact } from "../src/tutorial/kp-compiled-publication-artifact.ts";

const digest = (text: string | Uint8Array): `sha256:${string}` => `sha256:${createHash("sha256").update(text).digest("hex")}`;
const repo = fileURLToPath(new URL("..", import.meta.url));
export const bayesEditionRoot = join(repo, "tmp/codex/bayesian-editions");

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
  const editorialReason = context.editorial ? `<section data-bayes-publication-reason><h2>Why this denominator?</h2><p>${escape(context.editorial.text)}</p></section>` : "";
  // The authored full Article already owns its title. Keep the legacy shell
  // heading only for v1 rather than duplicating a v2 learner-visible heading.
  const heading = draft.editorial ? "" : "<h1>Change the question. Keep the facts.</h1>";
  const html = `<article data-bayes-publication-revision="${draft.revisionId}">${heading}
    ${full.html}<details><summary>Compact reading</summary>${compact.html}</details>
    <h2>Seven semantic checkpoints</h2>${draft.score.map((beat, index) => `<section id="${escape(beat.id)}"><h3>${index + 1}. ${escape(beat.title)}</h3>${beat.html}${renderBayesTreeSvg(draft.tree, index, `bayes-static-${index}`)}${index === 3 ? math[0] : index === 4 ? math[1] : ""}</section>`).join("")}
    ${editorialReason}<h2>Self-checks</h2>${prompts.map(prompt => `<section><h3>${escape(prompt.card.title)}</h3><p>${escape(prompt.card.prompt)}</p><details><summary>Reveal answer</summary><p>${escape(prompt.card.answer!.value)}</p></details></section>`).join("")}
    <p>Explanatory prose is editorial. Self-checks do not automatically grade unrestricted explanations. Tree order does not reverse causation.</p>
    <p>Revision: <code>${draft.revisionId}</code>. <a href="./source.json">Exact authored source</a></p></article>`;
  const payload = { revisionId: draft.revisionId, evidenceRevisionId: draft.authority.revisionId,
    ...(draft.editorial ? { editorialTitle: draft.editorial.title } : {}),
    source: JSON.parse(sourceText) as unknown, full, compact, context,
    prompts: prompts.map(prompt => ({ kind: prompt.kind, revisionId: prompt.revisionId, card: prompt.card, context: prompt.context })),
    reading: { html }, checkpoints: draft.score.map(beat => ({ id: beat.id, title: beat.title })) };
  return createKpCompiledPublicationArtifact({ artifactId: "publication.bayesian-reasoning",
    source: { path: basename(sourcePath), sha256: digest(sourceText) }, compiler: { id: "kp.bayesian-reasoning-publication", version: draft.editorial ? "2" : "1" },
    math: { engine: "katex", engineVersion: katex.version, rendering: "build-time", output: "htmlAndMathml", trust: false,
      fragmentCount: math.length, sourceLatex: [...new Set(latex)].sort() }, payloadSha256: digest(JSON.stringify(payload)), payload });
}
export function verifyBayesPublication(value: unknown, sourceText: string, sourcePath: string) {
  assertKpCompiledPublicationArtifact(value);
  if (JSON.stringify(value) !== JSON.stringify(compileBayesPublication(sourceText, sourcePath)))
    throw new Error("Publication does not reproduce from the selected probability source and trusted compiler.");
}

/** An immutable local edition snapshots the shared CSS too: rebuilding after a
 * template/style change creates new bytes, never rewrites a distributed edition. */
export function buildBayesEdition(sourcePath: string, check = false) {
  const selected = resolve(sourcePath);
  if (selected.startsWith(`${bayesEditionRoot}/`)) throw new Error("Keep authored source outside generated editions.");
  const sourceText = readFileSync(selected, "utf8"), artifact = compileBayesPublication(sourceText, selected);
  const katexRoot = join(repo, "node_modules/katex/dist");
  const files = new Map<string, string | Buffer>([
    ["source.json", sourceText], ["publication.json", JSON.stringify(artifact, null, 2) + "\n"],
    ["katex.min.css", readFileSync(join(katexRoot, "katex.min.css"))],
    ...readdirSync(join(katexRoot, "fonts")).sort().map(file => [`fonts/${file}`, readFileSync(join(katexRoot, "fonts", file))] as [string, Buffer]),
    ["index.html", `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(artifact.payload.editorialTitle ?? "Bayesian probability reading")}</title><link rel="stylesheet" href="./styles/experiments/authored-focus-card.css"><link rel="stylesheet" href="./styles/experiments/bayesian-reasoning/style.css"></head><body><main id="authored-focus-card">${artifact.payload.reading.html}</main></body></html>`]
  ]);
  for (const path of ["experiments/authored-focus-card.css", "experiments/bayesian-reasoning/style.css",
    "reader/app/exemplar.css", "rendering/canonical-equation-stage.css", "tutorial/focus-deck-scaffold.css"]) {
    const source = readFileSync(join(repo, "src", path), "utf8");
    files.set(`styles/${path}`, path === "reader/app/exemplar.css"
      ? source.replace('@import "katex/dist/katex.min.css";', '@import "../../../katex.min.css";') : source);
  }
  const manifest = { schemaVersion: "kp.bayes-edition-files.v1", revisionId: artifact.payload.revisionId,
    files: Object.fromEntries([...files].sort(([a], [b]) => a.localeCompare(b)).map(([name, bytes]) => [name, digest(bytes)])) };
  const directory = join(bayesEditionRoot, digest(JSON.stringify(manifest)).slice(7));
  files.set("edition.json", JSON.stringify(manifest, null, 2) + "\n");
  for (const name of files.keys()) {
    let current = repo;
    for (const part of relative(repo, join(directory, name)).split("/")) {
      current = join(current, part);
      if (lstatSync(current, { throwIfNoEntry: false })?.isSymbolicLink()) throw new Error("Edition output cannot traverse symlinks.");
    }
  }
  if (check || existsSync(directory)) {
    for (const [name, bytes] of files) if (!readFileSync(join(directory, name)).equals(Buffer.from(bytes)))
      throw new Error(`Edition is stale or altered: ${name}`);
  } else {
    mkdirSync(bayesEditionRoot, { recursive: true });
    const staging = mkdtempSync(join(bayesEditionRoot, ".building-"));
    try {
      for (const [name, bytes] of files) { const target = join(staging, name); mkdirSync(dirname(target), { recursive: true }); writeFileSync(target, bytes, { flag: "wx" }); }
      renameSync(staging, directory);
    } finally { rmSync(staging, { recursive: true, force: true }); }
  }
  return { directory, revisionId: artifact.payload.revisionId, sourceRevision: artifact.source.sha256, checked: check };
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const { values } = parseArgs({ options: { source: { type: "string" }, check: { type: "boolean", default: false } } });
  if (!values.source) throw new Error("Use --source <bayes.json>; source selection is explicit.");
  console.log(JSON.stringify(buildBayesEdition(values.source, values.check), null, 2));
}
