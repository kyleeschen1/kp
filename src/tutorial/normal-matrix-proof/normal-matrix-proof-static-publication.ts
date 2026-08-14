import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import {
  kpNormalMatrixProofCheckpoints
} from "../../semantic/normal-matrix-proof-checkpoints.ts";
import type { KpNormalMatrixProofArticleCompilation } from
  "./normal-matrix-proof-article-compiler.ts";
import {
  findKpNormalMatrixProofSettledScene,
  renderKpNormalMatrixProofSettledStageHtml
} from "./normal-matrix-proof-settled-scenes.ts";

/**
 * Resolve portable SVG requests into build-rendered native math so the
 * no-JavaScript article never depends on an enhancement bundle or missing asset.
 */
export function renderKpNormalMatrixProofStaticPublication(
  compilation: KpNormalMatrixProofArticleCompilation
): string {
  let articleHtml = compilation.staticHtml.articleHtml;

  for (const asset of compilation.staticHtml.assets) {
    const checkpoint = kpNormalMatrixProofCheckpoints.find(
      ({ id }) => id === asset.checkpointId
    );
    if (checkpoint === undefined) {
      throw new Error(`Static normal-proof checkpoint ${asset.checkpointId} lacks endpoint truth.`);
    }
    const scene = findKpNormalMatrixProofSettledScene(checkpoint.id);
    const image = new RegExp(
      `<img src="${escapeRegExp(asset.assetPath)}"[^>]*>`,
      "gu"
    );
    const rendered = checkpoint.id === "statement"
      ? renderKpNormalMatrixProofSettledStageHtml()
      : [
          `<div class="kp-normal-proof-static-scene"`,
          ` data-kp-normal-proof-static-checkpoint="${escapeAttribute(checkpoint.id)}"`,
          ` aria-label="${escapeAttribute(checkpoint.accessibleDescription)}">`,
          `<div class="kp-normal-proof-static-scene__math">`,
          renderLatexToHtml(scene.combinedLatex, {
            displayMode: true,
            output: "htmlAndMathml"
          }),
          `</div>`,
          `</div>`
        ].join("");
    articleHtml = articleHtml.replace(image, rendered);
  }

  if (articleHtml.includes("./kp-static/")) {
    throw new Error("Static normal-proof publication left an asset unresolved.");
  }
  return [
    `<main class="kp-normal-proof-article" data-kp-normal-proof-publication>`,
    `<aside class="kp-normal-proof-article__toc" aria-label="In this proof">`,
    compilation.staticHtml.tocHtml,
    `</aside>`,
    articleHtml,
    `</main>`
  ].join("\n");
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
