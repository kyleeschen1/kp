import katex from "katex";
import { checkMomentumEnergyDerivation, momentumEnergyDerivationSource, momentumEnergyDerivationStates } from "../../../domains/public-api.ts";
import { compileMomentumEnergyDerivation } from "../../authoring/momentum-energy-derivation-authoring.ts";
import { compileKpArticleMarkdownFragmentHtml as html } from "../../article/kp-article-static-html.ts";

export function renderEnergyDerivationPassage(markdown: string) {
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
  const compiled = compileMomentumEnergyDerivation(checked.model);
  const math = (latex: string) => katex.renderToString(latex, { displayMode: true, throwOnError: true, strict: "ignore",
    trust: context => context.command === "\\htmlData" });
  const trace = `<div class="energy-derivation" data-energy-derivation>
    <p data-derivation-status role="status" hidden></p>
    <div class="energy-derivation-workspace">
    <div class="energy-derivation-chain">
      <ol class="energy-derivation-history">${momentumEnergyDerivationStates.map((_, i) => `<li data-derivation-row="${i}">
        <span class="energy-derivation-row-marker" aria-hidden="true">${i + 1}</span>
        <div class="energy-derivation-equation">${math(compiled.moves[i]?.annotated[0] ?? compiled.moves.at(-1)!.annotated[1]!)}</div>
      </li>`).join("")}</ol>
      <div class="energy-derivation-stage" data-derivation-stage hidden></div>
      <div class="energy-derivation-scope" data-derivation-scope hidden>
        <button type="button" data-derivation-handle role="slider" aria-orientation="vertical" aria-label="Derivation lens" aria-valuemin="0" aria-valuemax="${compiled.moves.length}" aria-valuenow="0" title="Drag to follow the derivation"><span aria-hidden="true">↕</span></button>
      </div>
    </div>
    <aside class="energy-derivation-reason energy-derivation-active-cue" data-derivation-cue aria-label="Current transition explanation" hidden>
      <div data-derivation-cue-body></div>
    </aside>
    </div>
    <p class="energy-derivation-key" data-derivation-hint hidden>Drag the handle down to follow the derivation; up to retrace it.</p>
    <div class="energy-derivation-transport" data-derivation-transport hidden>
      <div class="energy-derivation-actions" role="group" aria-label="Transition playback">
        <button type="button" data-derivation-previous aria-label="Previous transition">‹ Previous</button>
        <button type="button" data-derivation-next aria-label="Next transition">Next ›</button>
      </div>
    </div>
    <div data-derivation-notes>${compiled.moves.map(move => `<details class="energy-derivation-note"><summary>${move.title}</summary><div data-derivation-reason="${move.index}">${html(move.cue)}<details><summary>Why is this allowed?</summary>${html(move.why)}</details></div></details>`).join("")}</div>
    ${compiled.moves.map(move => `<template data-derivation-template="${move.index}"><div class="energy-derivation-endpoint" data-derivation-source>${math(move.annotated[0]!)}</div><div class="energy-derivation-endpoint" data-derivation-target>${math(move.annotated[1]!)}</div><div data-kp-editor-equation-material-layer></div></template>`).join("")}
  </div>`;
  return html(markdown.slice(0, match.index)) + trace + html(markdown.slice(match.index + match[0].length));
}
