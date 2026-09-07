import type {
  KpSupplyTaxScrollScoreLabelRole,
  KpSupplyTaxScrollScoreStageLensV1
} from "./kinetic-figure-supply-tax-scroll-score-stage-lens.ts";

const curveRoleByClass = Object.freeze({
  "kp-supply-tax-graph__curve--demand": "demand",
  "kp-supply-tax-graph__curve--supply": "supply",
  "kp-supply-tax-graph__curve--taxed-supply": "taxed-supply"
} as const);

/**
 * Paint one sampled pedagogical lens without changing economic presence or
 * motion ownership. SVG structure remains the renderer boundary; the lens
 * only decides how much of already-authored evidence is perceptually present.
 */
export function projectKpSupplyTaxScrollScoreStageLensDom(input: {
  readonly root: HTMLElement;
  readonly lens: KpSupplyTaxScrollScoreStageLensV1;
}): void {
  input.root.dataset["kpScrollScoreStageLensFrom"] = input.lens.fromBeatSlug;
  input.root.dataset["kpScrollScoreStageLensTo"] = input.lens.toBeatSlug;
  input.root.dataset["kpScrollScoreStageLensProgress"] =
    input.lens.progress.toFixed(4);

  projectAxes(input.root, input.lens.axesStrength);
  projectCurves(input.root, input.lens);
  projectLabels(input.root, input.lens);
  projectBaselineEquilibrium(input.root,
    input.lens.baselineEquilibriumStrength);
  projectTaxedMarketMarks(input.root, input.lens);
  projectRegions(input.root, input.lens);
  projectFacts(input.root, input.lens);
}

function projectAxes(root: HTMLElement, strength: number): void {
  root.querySelectorAll<SVGElement>(
    ".kp-supply-tax-graph__axes line"
  ).forEach((element) => setPaintStrength(element, strength));
  root.querySelectorAll<SVGElement>(
    ".kp-supply-tax-graph__grid line"
  ).forEach((element) => setPaintStrength(element, strength * 0.18));
}

function projectCurves(
  root: HTMLElement,
  lens: KpSupplyTaxScrollScoreStageLensV1
): void {
  Object.entries(curveRoleByClass).forEach(([className, role]) => {
    const line = root.querySelector<SVGLineElement>(`.${className} > line`);
    if (line === null) throw new Error(`Missing Scroll Score curve ${role}.`);
    line.style.strokeOpacity = format(lens.curveStrengths[role]);
  });
}

function projectLabels(
  root: HTMLElement,
  lens: KpSupplyTaxScrollScoreStageLensV1
): void {
  root.querySelectorAll<SVGForeignObjectElement>(
    "[data-kp-supply-tax-math-label]"
  ).forEach((label) => {
    const role = label.dataset["kpSupplyTaxMathLabel"];
    if (role === undefined) {
      throw new Error("Scroll Score graph label requires a semantic role.");
    }
    const strength = role === "quantity-axis" || role === "price-axis"
      ? lens.axesStrength
      : isPrimaryLabelRole(role)
        ? lens.labelStrengths[role]
        : 0;
    setPaintStrength(label, strength);
  });
}

function projectBaselineEquilibrium(
  root: HTMLElement,
  strength: number
): void {
  root.querySelectorAll<SVGElement>(
    ".kp-supply-tax-graph__equilibrium > line, " +
    ".kp-supply-tax-graph__equilibrium > circle"
  ).forEach((element) => setPaintStrength(element, strength));
}

function projectTaxedMarketMarks(
  root: HTMLElement,
  lens: KpSupplyTaxScrollScoreStageLensV1
): void {
  root.querySelectorAll<SVGElement>(
    "[data-kp-supply-tax-market-mark]"
  ).forEach((element) => {
    const role = element.dataset["kpSupplyTaxMarketMark"];
    const strength = role === undefined
      ? 0
      : lens.marketMarkStrengths[
        role as keyof typeof lens.marketMarkStrengths
      ] ?? 0;
    setPaintStrength(element, strength);
  });
}

function projectRegions(
  root: HTMLElement,
  lens: KpSupplyTaxScrollScoreStageLensV1
): void {
  root.querySelectorAll<SVGPolygonElement>(
    ".kp-supply-tax-graph__region[data-kp-supply-tax-entity]"
  ).forEach((region) => {
    const id = region.dataset["kpSupplyTaxEntity"];
    const strength = id === undefined ? 0 : lens.regionStrengths[id] ?? 0;
    // The Scroll Score deliberately recalls old welfare before replacing it.
    // That disclosure is a local presence decision, so it must not be squared
    // by generic arrival opacity or erased by historical-ghost paint.
    region.style.fillOpacity = "1";
    region.style.strokeOpacity = "1";
    region.style.setProperty("--kp-supply-tax-historical-percent", "0%");
    setPaintStrength(region, strength);
    region.dataset["kpScrollScoreEvidencePresent"] = String(strength > 0);
  });
}

function projectFacts(
  root: HTMLElement,
  lens: KpSupplyTaxScrollScoreStageLensV1
): void {
  root.querySelectorAll<HTMLElement>(
    "[data-kp-scroll-score-stage-fact]"
  ).forEach((element) => {
    const id = element.dataset["kpScrollScoreStageFact"];
    const strength = id === undefined
      ? 0
      : lens.factStrengths[id as keyof typeof lens.factStrengths] ?? 0;
    element.style.setProperty("--kp-scroll-score-stage-fact-strength",
      format(strength));
    element.dataset["kpScrollScoreStageFactPresent"] = String(strength > 0);
  });
}

function setPaintStrength(element: SVGElement, strength: number): void {
  element.style.opacity = format(strength);
  element.style.visibility = strength > 0 ? "visible" : "hidden";
}

function isPrimaryLabelRole(
  value: string
): value is KpSupplyTaxScrollScoreLabelRole {
  return [
    "demand",
    "supply",
    "taxed-supply",
    "untaxed-equilibrium",
    "taxed-equilibrium",
    "consumer-price",
    "producer-price",
    "taxed-quantity",
    "tax-wedge"
  ].includes(value);
}

function format(value: number): string {
  return Math.max(0, Math.min(1, value)).toFixed(4);
}
