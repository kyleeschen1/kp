import type { KpAnimationAsset } from "../../animation/asset.ts";
import type { KpSemanticAssetObject } from "../../semantic/asset.ts";
import {
  renderLatexToHtml,
  renderSelectorAnnotatedLatexToHtml
} from "../../rendering/katex-adapter.ts";
import type { KpSelectorAnnotatedLatex } from "../../rendering/selector-annotated-latex.ts";
import type { KpReaderEquationPresentationCapability } from "../document/public-api.ts";
import { resolveKpReaderEquationPresentationProfile } from "../document/public-api.ts";
import { compileKpReaderPageShell } from "./reader-page-shell.ts";
import {
  compileKpAnimationTransformationPhaseCohorts
} from "../../animation/transformation-phase-cohorts.ts";

export interface KpEquationExemplarPageInput {
  readonly animation: KpAnimationAsset;
  readonly title: string;
  readonly description: string;
  readonly documentId: string;
  readonly documentVersion: string;
  readonly lessonVariant: string;
  readonly readerControls?: "foldable-distribution-v1" | undefined;
  readonly modeLink: { readonly href: string; readonly label: string };
  readonly tocHtml: string;
  readonly articleHtml: string;
  readonly hydrationJson: string;
  readonly equationPresentation: KpReaderEquationPresentationCapability;
  readonly presentationAnimations?: readonly KpAnimationAsset[] | undefined;
  readonly showEquationProfileControl?: boolean | undefined;
  readonly annotateState: (
    state: KpSemanticAssetObject
  ) => KpSelectorAnnotatedLatex | undefined;
}

export function compileKpEquationExemplarPage(
  input: KpEquationExemplarPageInput
): string {
  const template = compileKpEquationExemplarTemplate(input.animation, input.annotateState, {
      presentationAnimations: input.presentationAnimations,
      equationPresentation: input.equationPresentation,
      showEquationProfileControl: input.showEquationProfileControl
      ,
      readerControls: input.readerControls
  });
  return compileKpReaderPageShell({
    title: input.title,
    description: input.description,
    stylesheetHref: "/src/reader/app/exemplar.css",
    bodyAttributes: [
      { name: "data-kp-reader", value: "semantic-document" },
      { name: "data-kp-reader-document-id", value: input.documentId },
      { name: "data-kp-reader-document-version", value: input.documentVersion },
      { name: "data-kp-reader-lesson-variant", value: input.lessonVariant },
      { name: "data-kp-reader-equation-profile-default", value: input.equationPresentation.defaultProfileId },
      { name: "data-kp-reader-equation-profiles", value: input.equationPresentation.profileIds.join(",") }
    ],
    modeLink: input.modeLink,
    shareLink: {
      href: `#${input.documentId}`,
      label: "Link this moment",
      dataAttribute: "data-kp-reader-share"
    },
    tocHtml: input.tocHtml,
    articleHtml: input.articleHtml,
    afterMainHtml: [template],
    hydration: { dataAttribute: "data-kp-hydration", json: input.hydrationJson },
    entryScriptSrc: "/src/reader/app/exemplar-entry.ts"
  });
}

export function compileKpEquationExemplarTemplate(
  animation: KpAnimationAsset,
  annotateState: KpEquationExemplarPageInput["annotateState"],
  options?: {
    readonly presentationAnimations?: readonly KpAnimationAsset[] | undefined;
    readonly equationPresentation?: KpReaderEquationPresentationCapability | undefined;
    readonly showEquationProfileControl?: boolean | undefined;
    readonly readerControls?: "foldable-distribution-v1" | undefined;
  }
): string {
  const animations = [animation, ...(options?.presentationAnimations ?? [])];
  const objects = new Map(animations.flatMap((candidate) =>
    candidate.bundle.objects.map((object) => [object.id, object] as const)
  ));
  const states = new Map([...objects.values()].map((object) => [
    object.id,
    compileAnnotatedState(object, annotateState)
  ]));
  const cohorts = [...new Map(animations.flatMap((candidate) =>
    compileKpAnimationTransformationPhaseCohorts(candidate).map((cohort) => [
      cohort.id,
      cohort
    ] as const)
  )).values()];
  const transitions = cohorts.map((cohort) => {
    const source = cohort.sourceObjectIds.map((id) => {
      if (!objects.has(id)) throw new Error(`missing equation source ${id}`);
      return states.get(id)!;
    }).join("\n");
    const target = cohort.targetObjectIds.map((id) => {
      if (!objects.has(id)) throw new Error(`missing equation target ${id}`);
      return states.get(id)!;
    }).join("\n");
    return [
      `<div class="kp-reader-equation-transition" data-kp-reader-transition="${attribute(cohort.id)}"${
        cohort.transformationIds.length > 1
          ? ` data-kp-reader-cohort-transformations="${attribute(cohort.transformationIds.join(","))}"`
          : ""
      }>`,
      `<div class="kp-reader-equation-fit-surface" data-kp-reader-fit-surface>`,
      `<div class="kp-reader-equation-measurement" data-kp-reader-equation-measurement aria-hidden="true">`,
      `<div class="kp-reader-equation-native" data-kp-reader-native="source">${source}</div>`,
      `<div class="kp-reader-equation-native" data-kp-reader-native="target">${target}</div>`,
      `</div>`,
      `</div>`,
      `</div>`
    ].join("");
  });
  return [
    `<template data-kp-reader-exemplar-template>`,
    `<div class="kp-reader-equation-stage" data-kp-reader-equation-stage>`,
    `<div class="kp-reader-equation-stage-heading">`,
    `<span data-kp-reader-stage-kicker>Follow the symbols</span>`,
    `<div class="kp-reader-equation-controls">`,
    options?.showEquationProfileControl === true && options.equationPresentation !== undefined
      ? profileControl(options.equationPresentation)
      : "",
    options?.readerControls === "foldable-distribution-v1"
      ? foldableDistributionControls()
      : "",
    `<label class="kp-reader-motion-control">`,
    `<span>Motion</span>`,
    `<select data-kp-reader-motion-preference aria-label="Motion preference">`,
    `<option value="system">System</option>`,
    `<option value="reduced">Reduced</option>`,
    `<option value="full">Full</option>`,
    `<option value="static">Static</option>`,
    `</select>`,
    `</label>`,
    `</div>`,
    `<output data-kp-reader-stage-status aria-live="polite">Read the equality</output>`,
    `</div>`,
    `<nav class="kp-reader-focus-stepper" data-kp-reader-focus-stepper aria-label="Explanation controls">`,
    `<div class="kp-reader-focus-stepper-row">`,
    `<button type="button" data-kp-reader-attention-previous aria-label="Previous explanation step">Back</button>`,
    `<output data-kp-reader-attention-status aria-live="polite">Read the equality</output>`,
    `<button type="button" data-kp-reader-attention-next aria-label="Next explanation step">Next</button>`,
    `</div>`,
    `<label class="kp-reader-focus-scrubber">`,
    `<input type="range" min="0" max="1000" step="1" value="0" data-kp-reader-attention-scrubber aria-label="Scrub explanation">`,
    `<span data-kp-reader-attention-count aria-hidden="true">Step 1 of 1</span>`,
    `</label>`,
    `</nav>`,
    `<div class="kp-reader-equation-viewport" data-kp-reader-equation-viewport>`,
    transitions.join("\n"),
    `<div class="kp-reader-equation-material-fit-surface" data-kp-reader-material-fit-surface>`,
    `<div class="kp-reader-equation-material" data-kp-reader-equation-material-layer></div>`,
    `<span class="kp-reader-equation-annihilation-witness" data-kp-reader-annihilation-witness aria-hidden="true">`,
    `<span data-kp-reader-identity-value="0">${renderLatexToHtml("0", { displayMode: false })}</span>`,
    `<span data-kp-reader-identity-value="1" hidden>${renderLatexToHtml("1", { displayMode: false })}</span>`,
    `</span>`,
    `<span class="kp-reader-equation-independent-zero-witness" data-kp-reader-independent-zero-witness aria-hidden="true">${renderLatexToHtml("+0", { displayMode: false })}</span>`,
    `</div>`,
    `</div>`,
    `<div class="kp-reader-equation-progress" aria-hidden="true"><span data-kp-reader-progress-bar></span></div>`,
    `<p class="kp-reader-equation-hint">Scroll to move the equation. Scroll back to rewind.</p>`,
    `</div>`,
    `</template>`
  ].join("");
}

function foldableDistributionControls(): string {
  return [
    `<label class="kp-reader-fold-control">`,
    `<span>Detail</span>`,
    `<select data-kp-reader-fold-mode aria-label="Evaluation detail">`,
    `<option value="automatic">Automatic</option>`,
    `<option value="expanded">Expanded</option>`,
    `<option value="collapsed">Collapsed</option>`,
    `<option value="pinned">Pinned</option>`,
    `</select>`,
    `</label>`,
    `<div class="kp-reader-fold-drills" role="group" aria-label="Pinned evaluation details">`,
    `<button type="button" data-kp-reader-fold-node="evaluation.foldable-distribution.distribute" aria-pressed="false">Distribution</button>`,
    `<button type="button" data-kp-reader-fold-node="evaluation.foldable-distribution.evaluate-products" aria-pressed="false">Products</button>`,
    `</div>`,
    `<output class="kp-reader-fold-status" data-kp-reader-fold-status aria-live="polite">Detail follows the available space</output>`
  ].join("\n");
}

function profileControl(
  capability: KpReaderEquationPresentationCapability
): string {
  return [
    `<label class="kp-reader-profile-control">`,
    `<span>View</span>`,
    `<select data-kp-reader-equation-profile-control aria-label="Equation explanation view">`,
    ...capability.profileIds.map((id) => {
      const profile = resolveKpReaderEquationPresentationProfile(id);
      return `<option value="${attribute(profile.id)}">${attribute(profile.label)}</option>`;
    }),
    `</select>`,
    `</label>`
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
