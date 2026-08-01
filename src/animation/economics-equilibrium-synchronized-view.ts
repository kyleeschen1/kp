import type { ExactRationalDto } from "../../protocols/public-api.ts";
import type {
  KpEconomicsEquilibriumRuntimeFrame
} from "./economics-equilibrium-runtime-frame.ts";

export interface KpEconomicsEquilibriumSynchronizedView {
  readonly id: string;
  readonly frameId: string;
  readonly equations: {
    readonly supplyLatex: string;
    readonly demandLatex: string;
    readonly equilibriumLatex: string;
  };
  readonly narrative: {
    readonly id: string;
    readonly text: string;
    readonly claimIds: readonly string[];
  };
  readonly nonvisualSummary: string;
}

export const kpEconomicsDynamicDisplayDecimals = 2;

export function createKpEconomicsEquilibriumSynchronizedView(
  frame: KpEconomicsEquilibriumRuntimeFrame
): KpEconomicsEquilibriumSynchronizedView {
  const semantic = frame.semanticFrame;
  const supplyLatex = linearLatex({
    intercept: semantic.supply.priceIntercept,
    slope: semantic.supply.priceChangePerQuantity,
    direction: "plus"
  });
  const exactDemandLatex = linearLatex({
    intercept: semantic.demand.priceInterceptCurrent,
    slope: semantic.demand.priceChangePerQuantity,
    direction: "minus"
  });
  const relation = kpEconomicsDynamicDisplayRelation(frame.stage);
  const demandLatex = dynamicLinearLatex({
    intercept: semantic.demand.priceInterceptCurrent,
    slope: semantic.demand.priceChangePerQuantity,
    direction: "minus",
    relation
  });
  const equilibriumLatex =
    `E = (Q, P) ${relation} (` +
    `${formatKpEconomicsDynamicDisplay(semantic.equilibrium.quantity)}, ` +
    `${formatKpEconomicsDynamicDisplay(semantic.equilibrium.price)})`;
  const narrative = narrativeFor(frame);
  const equilibriumSpoken =
    `quantity ${exactSpoken(semantic.equilibrium.quantity)} and ` +
    `price ${exactSpoken(semantic.equilibrium.price)}`;

  return Object.freeze({
    id: `synchronized-view.${frame.id}`,
    frameId: frame.id,
    equations: Object.freeze({ supplyLatex, demandLatex, equilibriumLatex }),
    narrative,
    nonvisualSummary:
      `Quantity Q is horizontal and price P is vertical. ` +
      `Supply is ${equationSpoken(supplyLatex)}. ` +
      `Demand is ${equationSpoken(exactDemandLatex)}. ` +
      `The current equilibrium is ${equilibriumSpoken}. ${narrative.text}`
  });
}

export function kpEconomicsDynamicDisplayRelation(
  stage: KpEconomicsEquilibriumRuntimeFrame["stage"]
): "=" | "\\approx" {
  return stage === "shift" ? "\\approx" : "=";
}

export function formatKpEconomicsDynamicDisplay(
  value: ExactRationalDto
): string {
  // Moving readouts need stable visual dimensions; semantic frames and the
  // nonvisual description retain the exact rational value behind this view.
  const numeric = Number(value.numerator) / Number(value.denominator);
  return numeric.toFixed(kpEconomicsDynamicDisplayDecimals);
}

function narrativeFor(
  frame: KpEconomicsEquilibriumRuntimeFrame
): KpEconomicsEquilibriumSynchronizedView["narrative"] {
  const semantic = frame.semanticFrame;
  switch (frame.stage) {
    case "establish":
      return Object.freeze({
        id: "narrative.economics.establish-equilibrium",
        text:
          `Supply and demand initially clear at Q = ` +
          `${exactSpoken(semantic.equilibrium.quantity)} and P = ` +
          `${exactSpoken(semantic.equilibrium.price)}.`,
        claimIds: Object.freeze([
          "claim.economics.supply-fixed",
          "claim.economics.market-clears"
        ])
      });
    case "shift":
      return Object.freeze({
        id: "narrative.economics.shift-demand",
        text:
          `The demand intercept rises toward ` +
          `${exactSpoken(semantic.demand.priceInterceptAfter)}. Demand and the exact ` +
          `intersection move up and right while supply stays fixed.`,
        claimIds: Object.freeze([
          "claim.economics.supply-fixed",
          "claim.economics.demand-intercept-shift",
          "claim.economics.market-clears"
        ])
      });
    case "handoff":
      return Object.freeze({
        id: "narrative.economics.handoff-equilibrium",
        text:
          `The new intersection takes the equilibrium role; supplied and ` +
          `demanded quantity remain equal there.`,
        claimIds: Object.freeze([
          "claim.economics.demand-intercept-shift",
          "claim.economics.market-clears",
          "claim.economics.equilibrium-handoff"
        ])
      });
    case "settle":
      return Object.freeze({
        id: "narrative.economics.settle-equilibrium",
        text:
          `The higher demand intercept settles at a new equilibrium with ` +
          `greater quantity and a higher price.`,
        claimIds: Object.freeze([
          "claim.economics.market-clears",
          "claim.economics.equilibrium-change"
        ])
      });
  }
}

function linearLatex(input: {
  readonly intercept: ExactRationalDto;
  readonly slope: ExactRationalDto;
  readonly direction: "plus" | "minus";
}): string {
  const slope = exactLatex(input.slope);
  const quantityTerm = slope === "1" ? "Q" : `${slope}Q`;
  return `P = ${exactLatex(input.intercept)} ${
    input.direction === "plus" ? "+" : "-"
  } ${quantityTerm}`;
}

function dynamicLinearLatex(input: {
  readonly intercept: ExactRationalDto;
  readonly slope: ExactRationalDto;
  readonly direction: "plus" | "minus";
  readonly relation: "=" | "\\approx";
}): string {
  const slope = exactLatex(input.slope);
  const quantityTerm = slope === "1" ? "Q" : `${slope}Q`;
  return `P ${input.relation} ${
    formatKpEconomicsDynamicDisplay(input.intercept)
  } ${input.direction === "plus" ? "+" : "-"} ${quantityTerm}`;
}

function exactLatex(value: ExactRationalDto): string {
  return value.denominator === "1"
    ? value.numerator
    : `\\frac{${value.numerator}}{${value.denominator}}`;
}

function exactSpoken(value: ExactRationalDto): string {
  return value.denominator === "1"
    ? value.numerator
    : `${value.numerator} over ${value.denominator}`;
}

function equationSpoken(latex: string): string {
  return latex.replaceAll("=", "equals").replaceAll("+", "plus").replaceAll("-", "minus");
}
