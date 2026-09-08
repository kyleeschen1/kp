import type { BinaryTree } from "../../../domains/probability/binary-probability-trace.ts";
import type { KpNormalizedRational } from "../../../domains/math/exact-rational.ts";
import { encodeKpHtmlText as escape } from "../../rendering/html-output-encoding.ts";
import { sampleBayesTree, type BayesTreePlan, type BayesTreeFrame } from "./tree-frame.ts";

export const formatBayesMass = (mass: KpNormalizedRational) => mass.denominator === 1n ? String(mass.numerator) : `${mass.numerator}/${mass.denominator}`;
const jointLabel = (mass: KpNormalizedRational) => 100n % mass.denominator === 0n ? `${mass.numerator * (100n / mass.denominator)}/100` : formatBayesMass(mass);
const path = (x1: number, y1: number, x2: number, y2: number) => `M${x1},${y1} L${x2},${y2}`;
const eventName = (axis: number, occurs: boolean) => `${occurs ? "" : "¬"}${axis === 0 ? "A" : "B"}`;
const draw = (d: string, role: string) => `<path d="${d}" data-bayes-edge="${role}" pathLength="1" vector-effect="non-scaling-stroke"/>`;

function renderBranches(tree: BinaryTree, side: "initial" | "reordered") {
  return `<g data-bayes-branches="${side}" visibility="hidden">${tree.branches.map((branch, index) => {
    const y = 120 + index * 180;
    return `<g data-bayes-occurrence="${escape(branch.occurrenceId)}">
      ${draw(path(90, 210, 215, y), "first")}
      <text x="260" y="${y - 4}" text-anchor="middle">${eventName(tree.first, branch.event.occurs)}</text>
      <text class="bayes-probability" x="260" y="${y + 24}" text-anchor="middle">${formatBayesMass(branch.mass)}</text>
      <g data-bayes-second>${branch.status === "unreachable" ? `<text x="375" y="${y}">unreachable</text>` : branch.leaves.map((leaf, leafIndex) => {
        const targetY = 75 + (index * 2 + leafIndex) * 90;
        return `<g data-bayes-occurrence="${escape(leaf.occurrenceId)}">${draw(path(305, y, 447, targetY), "second")}
          <text class="bayes-probability" x="375" y="${(y + targetY) / 2 - 10}" text-anchor="middle">${eventName(tree.second, leaf.outcome.values[tree.second])} · ${formatBayesMass(leaf.conditional)}</text></g>`;
      }).join("")}</g></g>`;
  }).join("")}</g>`;
}

export function renderBayesTreeSvg(plan: BayesTreePlan) {
  return `<svg class="bayes-tree" viewBox="0 0 720 405" role="img" aria-labelledby="bayes-tree-title bayes-tree-description">
    <title id="bayes-tree-title">Build, gather, condition, and reorder the same joint distribution</title>
    <desc id="bayes-tree-description">Whole population. A denotes ${escape(plan.trace.model.events[0].label)}; B denotes ${escape(plan.trace.model.events[1].label)}. Joint probabilities: ${plan.trace.model.outcomes.map(outcome => `${outcome.key}: ${formatBayesMass(outcome.mass)}`).join(", ")}.</desc>
    <g aria-hidden="true">
      ${renderBranches(plan.initial, "initial")}${renderBranches(plan.reordered, "reordered")}
      <g data-bayes-root transform="translate(350 210)"><circle r="29"/><text text-anchor="middle" y="9">Ω</text><text class="bayes-probability" text-anchor="middle" y="58">1</text></g>
      <g data-bayes-reference visibility="hidden"><rect x="443" y="37" width="194" height="171" rx="12"/><text x="540" y="25" text-anchor="middle">B</text></g>
      <g data-bayes-marginal visibility="hidden"><text x="255" y="171" text-anchor="middle">P(B)</text><text x="255" y="207" text-anchor="middle">${jointLabel(plan.query.denominator)}</text><text class="bayes-small" x="255" y="242" text-anchor="middle">sum the B outcomes</text></g>
      ${plan.trace.model.outcomes.map(outcome => `<g data-bayes-outcome="${escape(outcome.id)}" visibility="hidden">
        <rect x="-85" y="-28" width="170" height="58" rx="9"/>
        <text text-anchor="middle" y="-3">${eventName(0, outcome.values[0])} ∩ ${eventName(1, outcome.values[1])}</text>
        <text class="bayes-probability" text-anchor="middle" y="23">${jointLabel(outcome.mass)}</text>
      </g>`).join("")}
    </g></svg>`;
}

/** Bind once; every sample updates the same four leaf owners. Never reconstruct
 * correspondence from DOM order or replace a live tree with innerHTML. */
export function mountBayesTreeSvg(host: HTMLElement, plan: BayesTreePlan) {
  const svg = host.querySelector<SVGSVGElement>("svg.bayes-tree")!;
  const root = svg.querySelector<SVGGElement>("[data-bayes-root]")!;
  const initial = svg.querySelector<SVGGElement>('[data-bayes-branches="initial"]')!;
  const reordered = svg.querySelector<SVGGElement>('[data-bayes-branches="reordered"]')!;
  const reference = svg.querySelector<SVGGElement>("[data-bayes-reference]")!;
  const marginal = svg.querySelector<SVGGElement>("[data-bayes-marginal]")!;
  const occurrences = Array.from(svg.querySelectorAll<SVGGElement>("[data-bayes-occurrence]"));
  const leaves = new Map(Array.from(svg.querySelectorAll<SVGGElement>("[data-bayes-outcome]")).map(node => [node.dataset["bayesOutcome"]!, node]));
  if (leaves.size !== 4 || plan.trace.model.outcomes.some(outcome => !leaves.has(outcome.id))) throw new Error("Bayes SVG must retain exactly one owner per joint outcome.");
  const presence = (node: SVGElement, value: number) => { node.setAttribute("visibility", value === 0 ? "hidden" : "visible"); node.style.opacity = String(value); };
  const branchFrame = (node: SVGGElement, first: number, second: number) => {
    presence(node, first);
    node.querySelectorAll<SVGPathElement>('[data-bayes-edge="first"]').forEach(edge => { edge.style.strokeDasharray = "1"; edge.style.strokeDashoffset = String(1 - first); });
    node.querySelectorAll<SVGGElement>("[data-bayes-second]").forEach(group => presence(group, second));
    node.querySelectorAll<SVGPathElement>('[data-bayes-edge="second"]').forEach(edge => { edge.style.strokeDasharray = "1"; edge.style.strokeDashoffset = String(1 - second); });
  };
  const paint = (frame: BayesTreeFrame) => {
    const salience = new Map(frame.hierarchy.map(entity => [entity.id, entity.salience]));
    root.dataset["bayesSalience"] = salience.get(plan.rootId)!;
    marginal.dataset["bayesSalience"] = salience.get(plan.marginalId)!;
    for (const occurrence of occurrences) occurrence.dataset["bayesSalience"] = salience.get(occurrence.dataset["bayesOccurrence"]!) ?? "context";
    root.setAttribute("transform", `translate(${frame.rootX} 210)`);
    branchFrame(initial, frame.branchPresence, frame.secondBranchPresence);
    branchFrame(reordered, frame.targetPresence, frame.targetPresence);
    presence(reference, frame.gather); presence(marginal, frame.gather);
    reference.style.setProperty("--bayes-reference-strength", String(frame.conditioned));
    for (const leaf of frame.leaves) {
      const node = leaves.get(leaf.id)!;
      node.setAttribute("transform", `translate(${leaf.x} ${leaf.y})`); presence(node, leaf.presence);
      node.dataset["bayesMembership"] = leaf.inReferencePopulation ? "included" : "excluded";
      node.style.setProperty("--bayes-context", String(leaf.context));
      node.dataset["bayesSalience"] = salience.get(leaf.id)!;
    }
    svg.dataset["bayesReferencePopulation"] = frame.referencePopulationId;
    svg.dataset["bayesIntent"] = frame.intentId;
  };
  paint(sampleBayesTree(plan, 0));
  return { paint };
}
