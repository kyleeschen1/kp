import { compileKpAnimationAssetSemanticRefs } from "../../animation/asset.ts";
import type { KpAnimationAsset } from "../../animation/asset.ts";
import {
  createLinearSolveAnimationAsset,
  createLinearSolveTeacherZeroAnimationAsset
} from "../../animation/linear-solve-adapter.ts";
import type { KpSemanticAssetObject } from "../../semantic/asset.ts";
import {
  renderLatexToHtml,
  renderSelectorAnnotatedLatexToHtml
} from "../../rendering/katex-adapter.ts";
import { createKpSolveXSelectorAnnotatedLatex } from "../../rendering/solve-x-selector-annotated-latex.ts";
import { createKpCompiledLessonArtifact } from "../document/public-api.ts";
import {
  emitKpReaderHydrationManifest,
  serializeKpReaderHydrationManifest
} from "./hydration-manifest.ts";
import { parseKpLessonMarkdown } from "./lesson-markdown-parser.ts";
import { defineKpReaderAssetCatalog, resolveKpLessonReferences } from "./reference-resolver.ts";
import { compileKpStaticMathStates } from "./static-math-compiler.ts";
import { compileKpStaticLessonProse } from "./static-prose-compiler.ts";

export function compileKpXPlusThreeLesson(markdown: string) {
  return compileKpXPlusThreeLessonVariant(markdown, {
    animation: createLinearSolveAnimationAsset(),
    sourceId: "content/lessons/solve-x.md",
    documentId: "lesson.solve-x.x-plus-3",
    compiledId: "compiled.lesson.solve-x.x-plus-3",
    title: "Solve x + 3 = 7",
    variant: "streamlined"
  });
}

export function compileKpXPlusThreeTeacherZeroLesson(markdown: string) {
  return compileKpXPlusThreeLessonVariant(markdown, {
    animation: createLinearSolveTeacherZeroAnimationAsset(),
    sourceId: "content/lessons/solve-x-teacher-zero.md",
    documentId: "lesson.solve-x.x-plus-3.teacher-zero",
    compiledId: "compiled.lesson.solve-x.x-plus-3.teacher-zero",
    title: "Solve x + 3 = 7 with explicit zero",
    variant: "teacher-zero"
  });
}

function compileKpXPlusThreeLessonVariant(markdown: string, input: {
  readonly animation: KpAnimationAsset;
  readonly sourceId: string;
  readonly documentId: string;
  readonly compiledId: string;
  readonly title: string;
  readonly variant: "streamlined" | "teacher-zero";
}) {
  const animation = input.animation;
  const refs = compileKpAnimationAssetSemanticRefs(animation);
  if (refs.diagnostics.length > 0) {
    throw new Error(`canonical x-plus-3 animation is invalid: ${refs.diagnostics[0]!.message}`);
  }
  const objectRefs = animation.bundle.objects.flatMap((object) => [
    object.id,
    ...object.selectors.map((selector) => selector.id)
  ]);
  const document = parseKpLessonMarkdown({
    sourceId: input.sourceId,
    id: input.documentId,
    version: "1",
    title: input.title,
    language: "en",
    markdown
  });
  const catalog = defineKpReaderAssetCatalog({ entries: [{
    id: animation.id,
    version: "1",
    rendererId: "renderer.equation-dom",
    objectRefs
  }] });
  const resolved = resolveKpLessonReferences(document, catalog);
  const equationStates = equationObjectSequence(animation.bundle.objects, animation.transformations);
  const staticMath = compileKpStaticMathStates(document, ({ progressPermille }) => {
    const index = Math.round((progressPermille / 1_000) * (equationStates.length - 1));
    const state = equationStates[index];
    if (state === undefined) throw new Error(`no x-plus-3 equation state at index ${index}`);
    return { latex: latexValue(state), label: state.title };
  });
  const prose = compileKpStaticLessonProse(document, { staticMath });
  const hydration = emitKpReaderHydrationManifest(resolved, staticMath);
  const equationTemplate = compileEquationExemplarTemplate(animation);
  const variantLink = input.variant === "streamlined"
    ? {
        href: "/reader/solve-x/teacher-zero/?kpLesson=lesson.solve-x.x-plus-3.teacher-zero&amp;kpVersion=1&amp;kpCheckpoint=beat.make-zero&amp;kpProgress=500",
        label: "Explain the zero"
      }
    : {
        href: "/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&amp;kpVersion=1&amp;kpCheckpoint=beat.cancel&amp;kpProgress=667",
        label: "Skip the zero"
      };
  const html = [
    "<!doctype html>",
    `<html lang="en">`,
    "<head>",
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${attribute(input.title)}</title>`,
    `<meta name="description" content="See algebra move through a searchable, shareable explanation.">`,
    `<link rel="stylesheet" href="/src/reader/app/exemplar.css">`,
    "</head>",
    `<body data-kp-reader="semantic-document" data-kp-reader-document-id="${attribute(document.id)}" data-kp-reader-document-version="${attribute(document.version)}" data-kp-reader-lesson-variant="${input.variant}">`,
    `<header class="kp-reader-masthead">`,
    `<a class="kp-reader-wordmark" href="/">Kinetic Press</a>`,
    `<span class="kp-reader-tagline">See concepts move</span>`,
    `<a class="kp-reader-mode" href="${variantLink.href}">${variantLink.label}</a>`,
    `<a class="kp-reader-share" href="#story.solve-x" data-kp-reader-share>Link this moment</a>`,
    `</header>`,
    `<main class="kp-reader-layout">`,
    prose.tocHtml,
    prose.articleHtml,
    `</main>`,
    equationTemplate,
    `<script type="application/json" data-kp-hydration>${serializeKpReaderHydrationManifest(hydration)}</script>`,
    `<script type="module" src="/src/reader/app/exemplar-entry.ts"></script>`,
    "</body>",
    "</html>"
  ].join("\n");
  return createKpCompiledLessonArtifact({
    id: input.compiledId,
    version: "1",
    document: { kind: "lesson-document", id: document.id, version: document.version },
    html,
    tocHtml: prose.tocHtml,
    hydration
  });
}

function compileEquationExemplarTemplate(
  animation: KpAnimationAsset
): string {
  const objects = new Map(animation.bundle.objects.map((object) => [object.id, object]));
  const states = new Map(animation.bundle.objects.map((object) => [
    object.id,
    compileAnnotatedState(object)
  ]));
  const transitions = animation.transformations.map((transformation) => {
    const source = transformation.sourceObjectIds.map((id) => {
      if (!objects.has(id)) throw new Error(`missing equation source ${id}`);
      return states.get(id)!;
    }).join("\n");
    const target = transformation.targetObjectIds.map((id) => {
      if (!objects.has(id)) throw new Error(`missing equation target ${id}`);
      return states.get(id)!;
    }).join("\n");
    return [
      `<div class="kp-reader-equation-transition" data-kp-reader-transition="${attribute(transformation.id)}" hidden>`,
      `<div class="kp-reader-equation-fit-surface" data-kp-reader-fit-surface>`,
      `<div class="kp-reader-equation-measurement" data-kp-reader-equation-measurement="true" aria-hidden="true">`,
      `<div class="kp-reader-equation-native kp-reader-equation-native--source" data-kp-reader-native="source">${source}</div>`,
      `<div class="kp-reader-equation-native kp-reader-equation-native--target" data-kp-reader-native="target">${target}</div>`,
      `</div>`,
      `</div>`,
      `</div>`
    ].join("\n");
  });
  return [
    `<template data-kp-reader-exemplar-template>`,
    `<div class="kp-reader-equation-stage" data-kp-reader-equation-stage>`,
    `<div class="kp-reader-equation-stage-heading">`,
    `<span data-kp-reader-stage-kicker>Follow the symbols</span>`,
    `<label class="kp-reader-motion-control">`,
    `<span>Motion</span>`,
    `<select data-kp-reader-motion-preference aria-label="Motion preference">`,
    `<option value="system">System</option>`,
    `<option value="reduced">Reduced</option>`,
    `<option value="full">Full</option>`,
    `<option value="static">Static</option>`,
    `</select>`,
    `</label>`,
    `<output data-kp-reader-stage-status aria-live="polite">Read the equality</output>`,
    `</div>`,
    `<nav class="kp-reader-focus-stepper" data-kp-reader-focus-stepper aria-label="Explanation controls">`,
    `<div class="kp-reader-focus-stepper-row">`,
    `<button type="button" data-kp-reader-attention-previous aria-label="Previous explanation step">Back</button>`,
    `<output data-kp-reader-attention-status aria-live="polite">Read the equality</output>`,
    `<button type="button" data-kp-reader-attention-next aria-label="Next explanation step">Next</button>`,
    `</div>`,
    `<label class="kp-reader-focus-scrubber">`,
    `<span class="kp-reader-visually-hidden">Scrub explanation</span>`,
    `<input type="range" min="0" max="1000" step="1" value="0" data-kp-reader-attention-scrubber aria-label="Scrub explanation">`,
    `<span data-kp-reader-attention-count aria-hidden="true">Step 1 of 1</span>`,
    `</label>`,
    `</nav>`,
    `<div class="kp-reader-equation-viewport" data-kp-reader-equation-viewport>`,
    transitions.join("\n"),
    `<div class="kp-reader-equation-material-fit-surface" data-kp-reader-material-fit-surface>`,
    `<div class="kp-reader-equation-material" data-kp-reader-equation-material-layer="true"></div>`,
    `<span class="kp-reader-equation-annihilation-witness" data-kp-reader-annihilation-witness aria-hidden="true">${renderLatexToHtml("0", { displayMode: false })}</span>`,
    `<span class="kp-reader-equation-independent-zero-witness" data-kp-reader-independent-zero-witness aria-hidden="true">${renderLatexToHtml("+0", { displayMode: false })}</span>`,
    `</div>`,
    `</div>`,
    `<div class="kp-reader-equation-progress" aria-hidden="true"><span data-kp-reader-progress-bar></span></div>`,
    `<p class="kp-reader-equation-hint">Scroll to move the equation. Scroll back to rewind.</p>`,
    `</div>`,
    `</template>`
  ].join("\n");
}

function compileAnnotatedState(object: KpSemanticAssetObject): string {
  const annotated = createKpSolveXSelectorAnnotatedLatex({
    objectId: object.id,
    selectorIds: object.selectors.map((selector) => selector.id)
  });
  if (annotated === undefined) {
    throw new Error(`canonical equation object ${object.id} has no annotated LaTeX`);
  }
  let html = renderSelectorAnnotatedLatexToHtml(annotated);
  for (const annotation of annotated.annotations) {
    html = html.replaceAll(
      `data-kp-motion-id="${annotation.motionId}"`,
      `data-kp-reader-equation-anchor-id="anchor.${annotation.selectorId}" data-kp-reader-selector-id="${annotation.selectorId}"`
    );
  }
  return `<div class="kp-reader-equation-state" data-kp-reader-equation-state="${attribute(object.id)}">${html}</div>`;
}

function equationObjectSequence(
  objects: readonly KpSemanticAssetObject[],
  transformations: readonly {
    readonly sourceObjectIds: readonly string[];
    readonly targetObjectIds: readonly string[];
  }[]
): readonly KpSemanticAssetObject[] {
  const ids = [
    transformations[0]?.sourceObjectIds[0],
    ...transformations.map((transformation) => transformation.targetObjectIds[0])
  ];
  return ids.map((id) => {
    const object = objects.find((candidate) => candidate.id === id);
    if (object === undefined) throw new Error(`canonical equation object ${String(id)} is missing`);
    latexValue(object);
    return object;
  });
}

function latexValue(object: KpSemanticAssetObject): string {
  const value = object.value;
  if (typeof value !== "object" || value === null || !("latex" in value)
    || typeof value.latex !== "string") {
    throw new Error(`canonical equation object ${object.id} has no LaTeX value`);
  }
  return value.latex;
}

function attribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
