import type { KpAnimationAsset } from "../../animation/asset.ts";
import type { KpSemanticAssetObject } from "../../semantic/asset.ts";
import {
  renderLatexToHtml,
  renderSelectorAnnotatedLatexToHtml
} from "../../rendering/katex-adapter.ts";
import type { KpSelectorAnnotatedLatex } from "../../rendering/selector-annotated-latex.ts";

export interface KpEquationExemplarPageInput {
  readonly animation: KpAnimationAsset;
  readonly title: string;
  readonly description: string;
  readonly documentId: string;
  readonly documentVersion: string;
  readonly lessonVariant: string;
  readonly modeLink: { readonly href: string; readonly label: string };
  readonly tocHtml: string;
  readonly articleHtml: string;
  readonly hydrationJson: string;
  readonly annotateState: (
    state: KpSemanticAssetObject
  ) => KpSelectorAnnotatedLatex | undefined;
}

export function compileKpEquationExemplarPage(
  input: KpEquationExemplarPageInput
): string {
  return [
    "<!doctype html>",
    `<html lang="en">`,
    "<head>",
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    `<title>${attribute(input.title)}</title>`,
    `<meta name="description" content="${attribute(input.description)}">`,
    `<link rel="stylesheet" href="/src/reader/app/exemplar.css">`,
    "</head>",
    `<body data-kp-reader="semantic-document" data-kp-reader-document-id="${attribute(input.documentId)}" data-kp-reader-document-version="${attribute(input.documentVersion)}" data-kp-reader-lesson-variant="${attribute(input.lessonVariant)}">`,
    `<header class="kp-reader-masthead">`,
    `<a class="kp-reader-wordmark" href="/">Kinetic Press</a>`,
    `<span class="kp-reader-tagline">See concepts move</span>`,
    `<a class="kp-reader-mode" href="${input.modeLink.href}">${attribute(input.modeLink.label)}</a>`,
    `<a class="kp-reader-share" href="#${attribute(input.documentId)}" data-kp-reader-share>Link this moment</a>`,
    `</header>`,
    `<main class="kp-reader-layout">`,
    input.tocHtml,
    input.articleHtml,
    `</main>`,
    compileKpEquationExemplarTemplate(input.animation, input.annotateState),
    `<script type="application/json" data-kp-hydration>${input.hydrationJson}</script>`,
    `<script type="module" src="/src/reader/app/exemplar-entry.ts"></script>`,
    "</body>",
    "</html>"
  ].join("\n");
}

export function compileKpEquationExemplarTemplate(
  animation: KpAnimationAsset,
  annotateState: KpEquationExemplarPageInput["annotateState"]
): string {
  const objects = new Map(animation.bundle.objects.map((object) => [object.id, object]));
  const states = new Map(animation.bundle.objects.map((object) => [
    object.id,
    compileAnnotatedState(object, annotateState)
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

function compileAnnotatedState(
  object: KpSemanticAssetObject,
  annotateState: KpEquationExemplarPageInput["annotateState"]
): string {
  const annotated = annotateState(object);
  if (annotated === undefined) {
    throw new Error(`equation object ${object.id} has no annotated LaTeX`);
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

function attribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
