import katex from "katex";
import { compileKpArticleMarkdownFragmentHtml as html } from "../../article/kp-article-static-html.ts";
import { physicalTime, sampleMomentumEnergy, momentumEnergyPowerRelation, type CheckedMomentumEnergy } from "../../../domains/physics/momentum-energy.ts";
import { renderMomentumEnergySvg } from "./momentum-energy-figure.ts";
import { renderPhysicsReadout } from "./physics-readout.ts";
import { powerTerms, type PowerTerm } from "./power-correspondence.ts";
import { renderKpFocusDeckAnnotation } from "../focus-deck-annotation.ts";

const math = (latex: string) => katex.renderToString(latex, { throwOnError: true, strict: "ignore" });
const entity = (term: PowerTerm, view: string) => `data-power-entity="physics.power.${term}.${view}"`;

export function renderPowerCorrespondencePassage(markdown: string, models: readonly CheckedMomentumEnergy[]) {
  const sections = markdown.split(/^### /m), intro = sections.shift()!;
  if (sections.length !== powerTerms.length || sections.some((section, i) => !section.startsWith(`${powerTerms[i]!.title}\n`)))
    throw new Error("physics.power.correspondence-source: preserve the three named meanings or repair their semantic binding");
  if (models.length !== 2 || models.filter(model => model.source.episode === "straight").length !== 1 || models.some(model => model.source.massKg !== 1))
    throw new Error("physics.power.correspondence-fixtures: the source explanation requires both unit-mass fixtures");
  const termButton = (id: PowerTerm) => {
    const term = powerTerms.find(t => t.id === id)!;
    return `<button type="button" data-power-term="${id}" ${entity(id, "symbol")} aria-label="${term.title}" aria-pressed="false" disabled>${math(term.latex)}</button>`;
  };
  const sketches = models.map(model => {
    const episode = model.source.episode;
    const time = physicalTime(episode === "straight" ? 1 : Math.PI / 4);
    const frame = sampleMomentumEnergy(model, time), relation = momentumEnergyPowerRelation(frame);
    if (relation.kind !== "moving") throw new Error("Power comparison requires a nonzero velocity");
    const bind = (attribute: string, term: PowerTerm) => `${attribute}="" ${entity(term, episode)}`;
    const svg = renderMomentumEnergySvg(model, time, { showEnergy: false })
      .replace('data-momentum=""', bind("data-momentum", "speed"))
      .replace('data-force=""', bind("data-force", "force"))
      .replace('data-right-angle=""', bind("data-right-angle", "force"));
    const n = (term: PowerTerm, id: "speed" | "forceAlongMotion" | "power", value: number) =>
      `<span ${entity(term, episode)}>${renderPhysicsReadout(id, value)}</span>`;
    const heading = episode === "straight" ? "Parallel: energy increases" : "Perpendicular: energy stays constant";
    return `<figure data-power-case="${episode}"><figcaption>${renderKpFocusDeckAnnotation({ entityId: `physics.power.${episode}.claim`, text: heading, role: "support" })}</figcaption>
      ${svg}<div class="power-case-reading" data-kp-focus-deck-type="support">${n("speed", "speed", frame.speed)} × ${n("force", "forceAlongMotion", relation.forceAlongMotion)} = ${n("energy", "power", frame.power)}</div></figure>`;
  }).join("");
  return `<details class="power-correspondence kp-focus-deck" data-power-correspondence>
    <summary>Why does only force along velocity matter?</summary>
    ${html(intro.replace(/^## .+\n/, ""))}
    <div class="power-correspondence-mode" data-power-modes hidden role="group" aria-label="Explanation view">
      <button type="button" data-power-mode="static" aria-pressed="true">Read together</button>
      <button type="button" data-power-mode="inspect" aria-pressed="false">Inspect connections</button>
    </div>
    <p class="power-correspondence-equation">${termButton("energy")} = ${termButton("speed")} × ${termButton("force")}</p>
    <p data-power-instruction hidden>Select a term to connect its meaning to both sketches. Return to “Read together” to compare with the complete explanation.</p>
    <div class="power-correspondence-reasons">${sections.map((section, i) => {
      const term = powerTerms[i]!;
      return `<section id="power-correspondence-${term.id}" data-power-reason="${term.id}" ${entity(term.id, "meaning")}>${html(`### ${section}`)}</section>`;
    }).join("")}</div>
    <div class="power-correspondence-sketches">${sketches}</div>
    <p class="power-correspondence-key">Blue: momentum, along velocity. Brown: net force. Arrow lengths use separate scales. W means joules per second.</p>
    <details class="power-transfer"><summary>Check your reading: what if force points opposite velocity?</summary>
      <p>The signed component is negative. Speed is positive, so their product is negative: kinetic energy decreases.</p></details>
    <button type="button" data-power-close hidden>Return to the argument</button>
  </details>`;
}
