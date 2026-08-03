import { renderLatexToHtml } from "../../rendering/katex-adapter.ts";
import {
  kpEconomicsVerificationGroups
} from "./economics-demand-shift-verification.ts";

export function renderKpEconomicsVerificationSurface(): string {
  return `<div class="kp-economics-verification" data-kp-economics-verification data-kp-math-renderer="static-katex-html">
    ${kpEconomicsVerificationGroups.map((verificationGroup) => `
      <section class="kp-economics-verification__group" data-kp-economics-verification-group="${verificationGroup.id}" data-kp-economics-verification-targets="${verificationGroup.targetIds.join(" ")}">
        <p>${verificationGroup.label}</p>
        <div class="kp-economics-verification__math">
          ${verificationGroup.latex.map((latex) =>
            `<span data-kp-latex="${escapeHtml(latex)}">${renderLatexToHtml(
              latex,
              { displayMode: false, output: "htmlAndMathml" }
            )}</span>`
          ).join("")}
        </div>
      </section>
    `).join("")}
  </div>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
