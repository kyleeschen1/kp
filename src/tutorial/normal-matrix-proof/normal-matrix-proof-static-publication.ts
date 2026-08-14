import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import {
  kpNormalMatrixProofCheckpoints,
  type KpNormalMatrixProofCheckpointId
} from "../../semantic/normal-matrix-proof-checkpoints.ts";
import type { KpNormalMatrixProofArticleCompilation } from
  "./normal-matrix-proof-article-compiler.ts";

const checkpointLatex: Readonly<Record<KpNormalMatrixProofCheckpointId, string>> =
  Object.freeze({
    statement: String.raw`MM^{\dagger}=M^{\dagger}M`,
    "row-column-norms": String.raw`(MM^{\dagger})_{11}=\|\operatorname{row}_1(M)\|^2,\qquad(M^{\dagger}M)_{11}=\|\operatorname{col}_1(M)\|^2`,
    eigenbasis: String.raw`M=\begin{bmatrix}\lambda&r\\0&B\end{bmatrix}`,
    "norm-equation": String.raw`|\lambda|^2+\|r\|^2=|\lambda|^2`,
    "remainder-zero": String.raw`\|r\|^2=0\Longrightarrow r=0,\qquad M=\lambda\oplus B`,
    recursion: String.raw`M=\lambda\oplus B,\qquad BB^{\dagger}=B^{\dagger}B`
  });

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
    const image = new RegExp(
      `<img src="${escapeRegExp(asset.assetPath)}"[^>]*>`,
      "gu"
    );
    const rendered = [
      `<div class="kp-normal-proof-static-scene"`,
      ` data-kp-normal-proof-static-checkpoint="${escapeAttribute(checkpoint.id)}"`,
      checkpoint.id === "statement" ? ` data-kp-normal-proof-stage-fallback` : "",
      ` aria-label="${escapeAttribute(checkpoint.accessibleDescription)}">`,
      `<div class="kp-normal-proof-static-scene__math">`,
      renderLatexToHtml(checkpointLatex[checkpoint.id], {
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
