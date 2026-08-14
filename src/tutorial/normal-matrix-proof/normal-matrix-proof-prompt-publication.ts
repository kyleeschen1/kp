import {
  escapeKpTutorialHtmlAttribute as escapeAttribute,
  escapeKpTutorialHtmlText as escapeText
} from "../generated-html-escaping.ts";
import { kpNormalMatrixProofPublicPath } from
  "../../public-web/normal-matrix-proof-public-route.ts";
import { createKpNormalMatrixProofPromptProjections } from
  "./normal-matrix-proof-prompt-projection.ts";

export function renderKpNormalMatrixProofPromptSurfaceHtml(): string {
  const prompts = createKpNormalMatrixProofPromptProjections(
    new URL(kpNormalMatrixProofPublicPath, "https://kinetic.press")
  );
  return [
    `<section class="kp-normal-proof-review" data-kp-normal-proof-review aria-labelledby="kp-normal-proof-review-title">`,
    `<h3 id="kp-normal-proof-review-title">Recover the proof</h3>`,
    `<p>Try an answer from memory, then reveal it. Each link returns to the exact proof state.</p>`,
    `<div class="kp-normal-proof-review__prompts">`,
    prompts.map((prompt) => [
      `<details id="review-${escapeAttribute(prompt.id)}" data-kp-normal-proof-prompt="${escapeAttribute(prompt.id)}">`,
      `<summary>${escapeText(prompt.question)}</summary>`,
      `<p>${escapeText(prompt.answer)}</p>`,
      `<p class="kp-normal-proof-review__links">`,
      `<a data-kp-normal-proof-review-link href="${escapeAttribute(prompt.promptUrl)}">Show this state</a>`,
      `<a data-kp-normal-proof-review-link href="${escapeAttribute(prompt.returnUrl)}">Return to proof context</a>`,
      `</p>`,
      `</details>`
    ].join("")).join(""),
    `</div>`,
    `</section>`
  ].join("");
}
