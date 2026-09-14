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
    <div class="energy-derivation-controls" data-derivation-controls hidden>
      <button type="button" data-derivation-trace>Trace these steps</button>
      <span data-derivation-navigation hidden><button type="button" data-derivation-previous>Previous</button>
      <button type="button" data-derivation-next>Next</button><button type="button" data-derivation-replay>Replay move</button>
      <button type="button" data-derivation-read>Show all steps</button></span>
      <output data-derivation-count aria-live="polite"></output>
    </div>
    <p data-derivation-status role="status" hidden></p>
    <div class="energy-derivation-workspace">
    <div class="energy-derivation-chain">
      <ol class="energy-derivation-history">${momentumEnergyDerivationStates.map((latex, i) => `<li data-derivation-row="${i}">
        <span class="energy-derivation-row-marker" aria-hidden="true">${i + 1}</span>
        <div class="energy-derivation-equation">${math(latex)}</div>
      </li>`).join("")}</ol>
      <div class="energy-derivation-stage" data-derivation-stage hidden></div>
      <svg class="energy-derivation-pointer" data-derivation-pointer aria-hidden="true" hidden><path fill="none" stroke="currentColor"/><circle r="3" fill="currentColor"/></svg>
    </div>
    <aside class="energy-derivation-reason energy-derivation-active-cue" data-derivation-cue aria-label="Current step explanation" hidden></aside>
    </div>
    <p class="energy-derivation-key" data-derivation-key hidden>Numbered rows show the route. Muted rows are upcoming; completed rows remain for reference.</p>
    <div class="energy-derivation-scrub" data-derivation-scrub hidden>
      <label>Inspect the whole derivation <input type="range" min="0" max="${compiled.moves.length}" step="any" value="0" aria-label="Whole derivation progress"></label>
      <div class="energy-derivation-checkpoints" role="group" aria-label="Equation checkpoints">${momentumEnergyDerivationStates.map((_, i) => `<button type="button" data-derivation-checkpoint="${i}" aria-label="Go to equation ${i + 1}${i === 0 ? ', starting point' : `, ${i} completed moves`}">${i === 0 ? "Start" : `Eq. ${i + 1}`}</button>`).join("")}</div>
    </div>
    <div data-derivation-notes>${compiled.moves.map(move => `<details class="energy-derivation-note"><summary>${move.title}</summary><div data-derivation-reason="${move.index}">${html(move.cue)}<details><summary>Why is this allowed?</summary>${html(move.why)}</details></div></details>`).join("")}</div>
    ${compiled.moves.map(move => `<template data-derivation-template="${move.index}"><div class="energy-derivation-endpoint" data-derivation-source>${math(move.annotated[0]!)}</div><div class="energy-derivation-endpoint" data-derivation-target>${math(move.annotated[1]!)}</div><div data-kp-editor-equation-material-layer></div></template>`).join("")}
  </div>`;
  return html(markdown.slice(0, match.index)) + trace + html(markdown.slice(match.index + match[0].length));
}
