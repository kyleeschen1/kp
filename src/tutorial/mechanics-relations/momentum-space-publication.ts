import { compileKpArticleMarkdownFragmentHtml as html } from "../../article/kp-article-static-html.ts";
import { physicalTime, sampleMomentumEnergy, type CheckedMomentumEnergy, type PhysicsVector } from "../../../domains/physics/momentum-energy.ts";
import { renderPhysicsReadout } from "./physics-readout.ts";

const headings = ["Read distance as energy", "Push outward", "Turn without moving outward"];

/** A static projection of checked momentum samples. Coordinates are momentum,
 * never particle position; force arrows indicate the tangent dp/dt. */
export function renderMomentumSpacePassage(markdown: string, models: readonly CheckedMomentumEnergy[]) {
  const [intro, ...sections] = markdown.split(/^### /m);
  if (sections.length !== headings.length || sections.some((s, i) => !s.startsWith(`${headings[i]}\n`)))
    throw new Error("physics.momentum-space.source: preserve the three storyboard meanings");
  const straight = models.find(m => m.source.episode === "straight");
  const turning = models.find(m => m.source.episode === "turning");
  if (models.length !== 2 || !straight || !turning || models.some(m => m.source.massKg !== 1))
    throw new Error("physics.momentum-space.fixtures: requires both checked unit-mass fixtures");
  const sample = (model: CheckedMomentumEnergy, t: number) => sampleMomentumEnergy(model, physicalTime(t));
  const start = sample(straight, .5), end = sample(straight, 1);
  const turn = [0, Math.PI / 4, Math.PI / 2].map(t => sample(turning, t));
  const xy = (p: PhysicsVector) => ({ x: 120 + 45 * p.x, y: 120 - 45 * p.y });
  const arrow = (a: PhysicsVector, b: PhysicsVector, role: "momentum" | "force", dashed = false) => {
    const from = xy(a), to = xy(b), angle = Math.atan2(to.y - from.y, to.x - from.x);
    const wing = (offset: number) => `${to.x - 7 * Math.cos(angle + offset)},${to.y - 7 * Math.sin(angle + offset)}`;
    return `<g class="momentum-space-${role}"><path d="M${from.x},${from.y} L${to.x},${to.y}" ${dashed ? 'stroke-dasharray="4 4"' : ""}/><path d="M${wing(.45)} L${to.x},${to.y} L${wing(-.45)}"/></g>`;
  };
  const origin = { x: 0, y: 0 };
  const svg = (index: number) => {
    const frames = index === 2 ? turn : index === 1 ? [start, end] : [start];
    const vectors = frames.map((f, i) => arrow(origin, f.momentum, "momentum", i < frames.length - 1)).join("");
    const current = frames.at(-1)!;
    // Force has its own display scale: its direction is a rate, not a finite step.
    const force = index === 0 ? "" : arrow(current.momentum, {
      x: current.momentum.x + .5 * current.force.x,
      y: current.momentum.y + .5 * current.force.y
    }, "force");
    const arc = index === 2 ? `<path class="momentum-space-trace" d="${Array.from({ length: 33 }, (_, i) => {
      const p = xy(sample(turning, i * Math.PI / 64).momentum);
      return `${i ? "L" : "M"}${p.x},${p.y}`;
    }).join(" ")}"/>` : "";
    return `<svg viewBox="0 0 285 235" role="img" aria-label="${headings[index]}. ${index === 2 ? "Momentum turns through a quarter circle at constant radius; force is tangent at its endpoint." : index === 1 ? "Momentum length grows from one to two; force points outward." : "Momentum ends on the inner of two concentric energy circles."}">
      <g class="momentum-space-grid"><path d="M15 120H268 M120 220V15"/><circle cx="120" cy="120" r="45"/><circle cx="120" cy="120" r="90"/></g>
      ${arc}${vectors}${force}<circle cx="120" cy="120" r="2.5" fill="currentColor"/>
      ${frames.map(f => { const p = xy(f.momentum); return `<circle cx="${p.x}" cy="${p.y}" r="3" fill="currentColor"/>`; }).join("")}
    </svg>`;
  };
  return `<div class="momentum-space" data-momentum-space>${html(intro ?? "")}
    <p class="momentum-space-key">Blue arrows: momentum. Dashed arrows: earlier samples. Brown arrows: force at the final sample, on a separate scale. Horizontal and vertical axes measure momentum components.</p>
    <div class="momentum-space-story">${sections.map((section, i) => `<figure><figcaption>${html(`### ${section}`)}</figcaption>${svg(i)}
      <p class="momentum-space-reading">${i === 0 ? "Inner circle: " : "Energy: "}${renderPhysicsReadout("kineticEnergy", start.kineticEnergy)}${i === 0 ? " · Outer: " : i === 1 ? " → " : " → "}${renderPhysicsReadout("kineticEnergy", i === 2 ? turn.at(-1)!.kineticEnergy : end.kineticEnergy)}</p></figure>`).join("")}</div>
  </div>`;
}
