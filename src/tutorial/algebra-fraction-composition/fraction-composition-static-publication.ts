import { renderLatexToHtml } from
  "../../rendering/katex-adapter.ts";
import {
  createKpFractionCompositionStaticStepExport
} from "../fraction-composition-static-step-export.ts";
import type {
  KpFractionCompositionArticleCompilation
} from "./fraction-composition-article-compiler.ts";

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
  let articleHtml = compilation.staticHtml.articleHtml;

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
    articleHtml = articleHtml.replace(
      image,
      asset.checkpointId === "factored"
        ? `<div data-kp-algebra-stage-host>${equationSvg}${checkpointNavigation}</div>`
        : equationSvg
    );
  }

  if (articleHtml.includes("./kp-static/")) {
    throw new Error("Static algebra publication left an asset unresolved.");
  }

  return `<main class="kp-algebra-article" data-kp-algebra-fraction-composition-publication>
    <aside class="kp-algebra-article__toc" aria-label="In this lesson">
      ${compilation.staticHtml.tocHtml}
    </aside>
    ${articleHtml}
  </main>`;
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
