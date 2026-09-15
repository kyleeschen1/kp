import katex from "katex";
import { checkMomentumEnergyDerivation, momentumEnergyDerivationSource, momentumEnergyDerivationStates, momentumEnergyDerivationView, type EnergyDerivationDetail } from "../../../domains/public-api.ts";
import { compileMomentumEnergyDerivation } from "../../authoring/momentum-energy-derivation-authoring.ts";
import { compileKpArticleMarkdownFragmentHtml as html } from "../../article/kp-article-static-html.ts";

export function renderEnergyDerivationPassage(markdown: string, publicationRevision: string) {
  const match = /\$\$\\begin\{aligned\}([\s\S]*?)\\end\{aligned\}\$\$/.exec(markdown);
  if (!match || match.index === undefined) throw new Error("Energy derivation requires its source-owned aligned chain");
  const normalize = (s: string) => s.replaceAll(/\s|&|\\left|\\right/g, "").replaceAll(String.raw`\frac12`, String.raw`\frac{1}{2}`);
  const states = match[1]!.trim().replace(/\.$/, "").split(String.raw`\\`).map(s => {
    const value = normalize(s); return value.startsWith("=") ? `K${value}` : value;
  });
  if (states.length !== 4 || states.some((s, i) => s !== normalize(momentumEnergyDerivationStates[i]!)))
    throw new Error("Energy derivation source changed: repair the bounded semantic binding before publication");
  const checked = checkMomentumEnergyDerivation(momentumEnergyDerivationSource);
  if (checked.status !== "checked") throw new Error(checked.code);
  const math = (latex: string) => katex.renderToString(latex, { displayMode: true, throwOnError: true, strict: "ignore",
    trust: context => context.command === "\\htmlData" });
  function renderTrace(detail: EnergyDerivationDetail): string {
  if (checked.status !== "checked") throw new Error("Missing checked derivation");
  const compiled = compileMomentumEnergyDerivation(checked.model, detail);
  const view = momentumEnergyDerivationView(checked.model, detail);
  // The first destination keeps the substitution's compound fragment identity
  // for record/inspection correspondence. Later moves retain their own templates.
  return `<div class="energy-derivation" data-energy-derivation data-derivation-detail="${detail}" data-derivation-revision="${publicationRevision}${detail === "coarse" ? "" : ":mass-refinement.v1"}">
    <p data-derivation-status role="status" hidden></p>
    <div class="energy-derivation-workspace">
    <div class="energy-derivation-chain">
      <ol class="energy-derivation-history">${view.states.map((_, i) => `<li data-derivation-row="${i}">
        <span class="energy-derivation-row-marker" aria-hidden="true">${i + 1}</span>
        <div class="energy-derivation-equation">${math(i === 1 ? compiled.moves[0]!.annotated[1]! : compiled.moves[i]?.annotated[0] ?? compiled.moves.at(-1)!.annotated[1]!)}</div>
        ${i < compiled.moves.length ? `<div class="energy-derivation-interleave energy-derivation-reason" data-derivation-interleave="${i}" aria-label="Transition from equation ${i + 1} to ${i + 2}"><div class="energy-derivation-interleave-text"><strong>${compiled.moves[i]!.title}</strong>${html(compiled.moves[i]!.cue)}<details><summary>Why is this allowed?</summary>${html(compiled.moves[i]!.why)}</details>${i === 2 ? (detail === "coarse" ? `<details data-refinement-static><summary>Smaller cancellation steps</summary>${momentumEnergyDerivationView(checked.model, "mass-refinement").states.slice(3, 5).map(math).join("")}<p>Expose the denominator factors, cancel one nonzero mass pair, then collect the factor 2.</p></details><div class="energy-derivation-actions"><button type="button" data-refinement-expand hidden>Inspect smaller steps</button></div>` : `<div class="energy-derivation-actions"><button type="button" data-refinement-collapse hidden>Return to compact step</button></div>`) : ""}</div></div>` : ""}
      </li>`).join("")}</ol>
      <div class="energy-derivation-rail" data-derivation-rail aria-hidden="true" hidden>${view.states.map(() => `<span></span>`).join("")}</div>
      <div class="energy-derivation-stage" data-derivation-stage hidden></div>
      <div class="energy-derivation-scope" data-derivation-scope hidden>
        <button type="button" data-derivation-handle role="slider" aria-orientation="vertical" aria-label="Derivation lens" aria-valuemin="0" aria-valuemax="${compiled.moves.length}" aria-valuenow="0" title="Drag to follow the derivation"><span aria-hidden="true">↕</span></button>
      </div>
    </div>
    </div>
    <p class="energy-derivation-key" data-derivation-hint hidden>Drag the handle down to follow the derivation; up to retrace it.</p>
    <div class="energy-derivation-transport" data-derivation-transport hidden>
      <div class="energy-derivation-actions" role="group" aria-label="Transition playback">
        <button type="button" data-derivation-previous aria-label="Previous transition">‹ Previous</button>
        <button type="button" data-derivation-next aria-label="Next transition">Next ›</button>
      </div>
    </div>
    <template data-derivation-recall-template><details data-derivation-recall><summary>Recall the momentum definition</summary>${html(String.raw`From the earlier definition, $\mathbf p=m\mathbf v$. Since $m>0$, we may divide by mass to obtain $\mathbf v=\mathbf p/m$.`)}<a href="#momentum-definition">Visit the original definition</a></details></template>
    ${compiled.moves.map(move => `<template data-derivation-template="${move.index}" data-transition-id="${move.id}"><div class="energy-derivation-endpoint" data-derivation-source>${math(move.annotated[0]!)}</div><div class="energy-derivation-endpoint" data-derivation-target>${math(move.annotated[1]!)}</div><div data-kp-editor-equation-material-layer></div></template>`).join("")}
    ${detail === "coarse" ? `<template data-refinement-view>${renderTrace("mass-refinement")}</template>` : ""}
  </div>`;
  }
  return html(markdown.slice(0, match.index)) + renderTrace("coarse") + html(markdown.slice(match.index + match[0].length));
}
