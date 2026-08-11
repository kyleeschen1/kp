import { renderLatexToHtml } from
  "../../rendering/katex-adapter.ts";
import {
  createKpFractionCompositionStaticStepExport
} from "../fraction-composition-static-step-export.ts";
import {
  compileKpEquationExemplarTemplate
} from "../../reader/compiler/equation-exemplar-page.ts";
import {
  fractionCompositionDescriptor
} from "../../reader/app/equation-lesson-descriptors/fraction-composition.ts";
import {
  kpReaderEquationPresentationCapability
} from "../../reader/document/equation-presentation.ts";
import {
  createKpFractionCompositionSelectorAnnotatedLatex
} from "../../rendering/fraction-composition-selector-annotated-latex.ts";
import {
  kpFractionCompositionArticleTransitionBindings
} from "../../article/vignettes/fraction-composition-vignette.ts";
import type {
  KpFractionCompositionArticleCompilation
} from "./fraction-composition-article-compiler.ts";
import {
  createKpFractionCompositionAttentionMatrix,
  type KpFractionCompositionAttentionBeat
} from "./fraction-composition-attention-matrix.ts";

/**
 * The static article asks for immutable image assets, while this first-party
 * route can preserve native KaTeX directly. Resolve both from the same
 * certified endpoint export so static and interactive readers cannot disagree.
 */
export function renderKpFractionCompositionStaticPublication(
  compilation: KpFractionCompositionArticleCompilation
): string {
  const endpointSequence = createKpFractionCompositionStaticStepExport();
  const checkpointNavigation = renderCheckpointNavigation(compilation);
  const motionRangeByCheckpoint = new Map<string, string>(
    kpFractionCompositionArticleTransitionBindings.map(
      ({ path, to }) => [to, path] as const
    )
  );
  let articleHtml = compilation.staticHtml.articleHtml;

  for (const motion of compilation.article.document.blocks) {
    if (motion.kind !== "motion" || motion.transition.kind !== "run") continue;
    const range = motion.transition.path.slice(
      motion.transition.path.lastIndexOf("/") + 1
    );
    articleHtml = articleHtml.replace(
      `<a id="${escapeAttribute(motion.id)}">`,
      `<a id="${escapeAttribute(motion.id)}" data-kp-algebra-motion-range="${escapeAttribute(range)}">`
    );
  }

  for (const asset of compilation.staticHtml.assets) {
    const step = endpointSequence.steps.find(({ frame }) =>
      frame.state.objectId.endsWith(`.${asset.checkpointId}`)
    );
    if (step === undefined) {
      throw new Error(
        `Static algebra checkpoint ${asset.checkpointId} lacks a canonical endpoint.`
      );
    }
    const image = new RegExp(
      `<img src="${escapeRegExp(asset.assetPath)}"[^>]*>`,
      "u"
    );
    const equationSvg = [
      `<svg class="kp-algebra-article__equation-stage"`,
      asset.checkpointId === "factored"
        ? ` data-kp-algebra-stage-fallback`
        : "",
      ` data-kp-algebra-static-checkpoint="${escapeAttribute(asset.checkpointId)}"`,
      ` viewBox="0 0 640 180" role="img"`,
      ` aria-label="${escapeAttribute(step.frame.state.accessibilityLabel)}">`,
      `<foreignObject x="20" y="20" width="600" height="140">`,
      `<div xmlns="http://www.w3.org/1999/xhtml" class="kp-algebra-article__equation">`,
      renderLatexToHtml(step.frame.state.latex, {
        displayMode: true,
        output: "htmlAndMathml"
      }),
      `</div></foreignObject></svg>`
    ].join("");
    const motionRange = motionRangeByCheckpoint.get(asset.checkpointId);
    const equationProjection = motionRange === undefined
      ? equationSvg
      : [
          `<div data-kp-algebra-motion-slot="${escapeAttribute(motionRange)}">`,
          equationSvg,
          `</div>`
        ].join("");
    articleHtml = articleHtml.replace(
      image,
      asset.checkpointId === "factored"
        ? `<div data-kp-algebra-stage-host>${equationProjection}${checkpointNavigation}</div>`
        : equationProjection
    );
  }

  if (articleHtml.includes("./kp-static/")) {
    throw new Error("Static algebra publication left an asset unresolved.");
  }

  const canonicalTemplate = compileKpEquationExemplarTemplate(
    fractionCompositionDescriptor.createAnimation(),
    (state) => createKpFractionCompositionSelectorAnnotatedLatex(state.id),
    {
      equationPresentation: kpReaderEquationPresentationCapability,
      readerControls: "fraction-composition-v1"
    }
  );

  return `<main class="kp-algebra-article" data-kp-algebra-fraction-composition-publication>
    <aside class="kp-algebra-article__toc" aria-label="In this lesson">
      ${compilation.staticHtml.tocHtml}
    </aside>
    ${renderAttentionStage(compilation)}
    ${articleHtml}
    ${canonicalTemplate}
  </main>`;
}

function renderAttentionStage(
  compilation: KpFractionCompositionArticleCompilation
): string {
  const matrix = createKpFractionCompositionAttentionMatrix(
    compilation.article.document
  );
  return [
    `<section class="kp-algebra-attention-stage"`,
    ` data-kp-algebra-attention-stage hidden`,
    ` aria-label="The equation remembers">`,
    `<div class="kp-algebra-attention-stage__visual"`,
    ` data-kp-algebra-attention-visual></div>`,
    `<div class="kp-algebra-attention-stage__passages"`,
    ` aria-live="polite" aria-atomic="true">`,
    matrix.beats.map((beat, index) => [
      `<div class="kp-algebra-attention-stage__passage"`,
      ` data-kp-algebra-attention-beat="${escapeAttribute(beat.id)}"`,
      ` data-kp-algebra-attention-index="${index}"`,
      beat.anchor.kind === "checkpoint"
        ? ` data-kp-algebra-attention-checkpoint="${escapeAttribute(beat.anchor.path)}"`
        : ` data-kp-algebra-attention-range="${escapeAttribute(beat.anchor.path)}"`,
      ` data-kp-algebra-attention-primary="${escapeAttribute(beat.primaryAddresses.join(" "))}"`,
      ` data-kp-algebra-attention-context="${escapeAttribute(beat.contextAddresses.join(" "))}"`,
      index === 0 ? `` : ` hidden`,
      `>${attentionCue(beat)}</div>`
    ].join("")).join(""),
    `</div>`,
    `<nav class="kp-algebra-attention-stage__controls"`,
    ` aria-label="Explanation steps">`,
    `<button type="button" data-kp-algebra-attention-action="back" disabled>Back</button>`,
    `<button type="button" data-kp-algebra-attention-action="continue">Continue</button>`,
    `</nav>`,
    `</section>`
  ].join("");
}

function attentionCue(beat: KpFractionCompositionAttentionBeat): string {
  const link = (address: string, label: string): string =>
    `<a href="#kp-ref:${escapeAttribute(address)}">${label}</a>`;
  const math = (latex: string): string =>
    `<span class="kp-article-math kp-article-math--inline">${renderLatexToHtml(latex, {
      displayMode: false,
      output: "htmlAndMathml"
    })}</span>`;
  const cues: Readonly<Record<string, string>> = Object.freeze({
    "read-scope": `The ${link("solve/factor", "factor")} multiplies the complete ${link("solve/grouped-sum", "grouped expression")} ${math("x+6")}.`,
    "distribute:motion": "Watch the outside factor distribute into both addends.",
    "evaluate-constant:motion": `Hold the ${link("solve/variable-fraction", "variable fraction")} still while the constant becomes ${math("4")}.`,
    "subtract-four:motion": `Subtract ${math("4")} from the ${link("solve/left-side", "left")} and ${link("solve/right-side", "right")} together.`,
    "clear-denominator:motion": `Multiply both sides by ${math("3")} and watch the ${link("solve/denominator", "denominator")} cancel.`,
    "divide-by-two:motion": `Divide both sides by the ${link("solve/coefficient", "coefficient")} ${math("2")}.`,
    "verify-solution": `Substituting ${math("9")} into the original equation returns ${math("10")}.`
  });
  const cue = cues[beat.id];
  if (cue === undefined) {
    throw new Error(`Fraction composition attention beat ${beat.id} lacks a cue.`);
  }
  return `<p>${cue}</p>`;
}

function renderCheckpointNavigation(
  compilation: KpFractionCompositionArticleCompilation
): string {
  const stage = compilation.stageManifests.find(({ stageId }) =>
    stageId === "solve"
  );
  if (stage === undefined) {
    throw new Error("Static algebra publication lacks the solve stage manifest.");
  }
  return [
    `<nav class="kp-algebra-article__checkpoint-navigation"`,
    ` data-kp-algebra-checkpoint-navigation aria-label="Equation checkpoints">`,
    stage.accessibility.checkpoints.map((checkpoint, index) => {
      const path = checkpoint.fullId.slice(checkpoint.fullId.lastIndexOf("/") + 1);
      return [
        `<a href="#kp-ref:solve/${escapeAttribute(path)}"`,
        ` data-kp-algebra-checkpoint-link="${escapeAttribute(path)}"`,
        index === 0 ? ` aria-current="step"` : "",
        `>${escapeHtml(checkpoint.label)}</a>`
      ].join("");
    }).join(""),
    `</nav>`
  ].join("");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtml(value: string): string {
  return escapeAttribute(value).replaceAll("'", "&#39;");
}
