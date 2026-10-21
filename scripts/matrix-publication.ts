import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import katex from "katex";
import { check } from "../src/authoring/matrix-columns/compile.ts";
import { columnExampleFromProduct } from "../src/experiments/matrix-column-combinations/model.ts";
import { calculationLatex } from "../src/experiments/matrix-column-combinations/presentation.ts";
import { encodeKpHtmlText as escape } from "../src/rendering/html-output-encoding.ts";
import { createKpCompiledPublicationArtifact, assertKpCompiledPublicationArtifact } from "../src/tutorial/kp-compiled-publication-artifact.ts";
import { digestEditionBytes as digest } from "./immutable-local-edition.ts";

export const matrixEditionRoot = join(fileURLToPath(new URL("..", import.meta.url)), "tmp/codex/matrix-editions");
export function compileMatrixPublication(sourceText: string, sourcePath: string) {
  const checked = check(sourceText);
  if (checked.status !== "compiled") throw new Error(`${checked.diagnostic.code} at ${checked.diagnostic.path}: ${checked.diagnostic.expected}`);
  const { source, product, result, revision } = checked.draft;
  const scenes = [0, 1].map(column => columnExampleFromProduct(product, column, source.reading));
  const matrix = (rows: readonly (readonly number[])[]) => `\\begin{bmatrix}${rows.map(row => row.join("&")).join("\\\\")}\\end{bmatrix}`;
  const equation = `${matrix(source.left)}${matrix(source.right)}=${matrix(result)}`;
  const sourceLatex = [equation, ...scenes.map(scene => calculationLatex(scene))];
  const math = (latex: string) => katex.renderToString(latex, { displayMode: true, throwOnError: true, trust: false, output: "htmlAndMathml" });
  const html = `<section aria-label="Complete matrix reading" data-matrix-reading="${escape(revision)}">
    <h2>${escape(source.reading.title)}</h2><p>${escape(source.reading.introduction)}</p>
    <div class="comb-static">${math(equation)}</div>
    ${scenes.map((scene, column) => `<section data-reading-column="${column}"><h3>Result column ${column + 1}</h3>
      <div class="comb-static">${math(sourceLatex[column + 1]!)}</div>
      <ol>${scene.beats.map(beat => `<li data-reading-beat="${beat.id}">${escape(beat.cue)}</li>`).join("")}</ol></section>`).join("")}
    ${source.reading.conclusion.map(text => `<p>${escape(text)}</p>`).join("")}
    <p>${escape(source.reading.question.prompt)}</p><details><summary>Check your reasoning</summary><p>${escape(source.reading.question.answer)}</p></details>
    <p>The numerical calculations are derived from the two factors. The explanation and question are authored text.</p>
    <p><a href="./source.json">Exact authored source</a> · Source revision: <code>${escape(revision)}</code></p></section>`;
  const payload = { source, revisionId: revision, result, reading: { html } };
  return createKpCompiledPublicationArtifact({ artifactId: "publication.matrix-columns",
    source: { path: basename(sourcePath), sha256: digest(sourceText) },
    compiler: { id: "kp.matrix-columns-publication", version: "1" },
    math: { engine: "katex", engineVersion: katex.version, rendering: "build-time", output: "htmlAndMathml", trust: false, fragmentCount: sourceLatex.length, sourceLatex: [...new Set(sourceLatex)].sort() },
    payloadSha256: digest(JSON.stringify(payload)), payload });
}

export function verifyMatrixPublication(value: unknown, sourceText: string, sourcePath: string) {
  assertKpCompiledPublicationArtifact(value);
  if (JSON.stringify(value) !== JSON.stringify(compileMatrixPublication(sourceText, sourcePath))) {
    throw new Error("Publication does not reproduce from the selected matrix source and compiler.");
  }
}
