import type { ExactRationalDto } from "../../protocols/public-api.ts";
import type {
  KpConstantForceWorkEnergyRuntimeFrame
} from "./constant-force-work-energy-runtime-frame.ts";
import {
  formatKpDimensionalContinuityDynamicDisplay,
  kpDimensionalContinuityDynamicDisplayRelation
} from "./dimensional-continuity-dynamic-display.ts";

export interface KpConstantForceWorkEnergySynchronizedView {
  readonly id: string;
  readonly frameId: string;
  readonly equations: {
    readonly forceLatex: string;
    readonly workLatex: string;
    readonly energyLatex: string;
    readonly unitLatex: string;
  };
  readonly narrative: {
    readonly id: string;
    readonly text: string;
    readonly claimIds: readonly string[];
  };
  readonly nonvisualSummary: string;
}

export function createKpConstantForceWorkEnergySynchronizedView(
  frame: KpConstantForceWorkEnergyRuntimeFrame
): KpConstantForceWorkEnergySynchronizedView {
  const state = frame.semanticFrame.state;
  const relation = kpDimensionalContinuityDynamicDisplayRelation(
    frame.stage === "accumulate"
  );
  const forceLatex =
    `F_x = ${exactLatex(state.netForceMagnitude)}\\,\\mathrm{N}`;
  const workLatex =
    `W_{\\mathrm{net}} = F_x\\Delta x ${relation} ` +
    `${formatKpDimensionalContinuityDynamicDisplay(state.accumulatedWork)}\\,\\mathrm{J}`;
  const energyLatex =
    `K = K_0 + W_{\\mathrm{net}} ${relation} ` +
    `${formatKpDimensionalContinuityDynamicDisplay(state.kineticEnergy)}\\,\\mathrm{J}`;
  const unitLatex = "\\mathrm{N}\\!\\cdot\\!\\mathrm{m}=\\mathrm{J}";
  const narrative = narrativeFor(frame);

  return Object.freeze({
    id: `synchronized-view.${frame.id}`,
    frameId: frame.id,
    equations: Object.freeze({
      forceLatex,
      workLatex,
      energyLatex,
      unitLatex
    }),
    narrative,
    nonvisualSummary:
      `Position x is horizontal in meters and horizontal net force F_x is ` +
      `vertical in newtons. The net force is ` +
      `${quantitySpoken(state.netForceMagnitude, "newton")}. The current ` +
      `displacement is ${quantitySpoken(state.displacement, "meter")}. ` +
      `The exact accumulated work is ` +
      `${quantitySpoken(state.accumulatedWork, "joule")}, exactly equal to ` +
      `the kinetic-energy change, so kinetic energy is ` +
      `${quantitySpoken(state.kineticEnergy, "joule")}. ${narrative.text}`
  });
}

function narrativeFor(
  frame: KpConstantForceWorkEnergyRuntimeFrame
): KpConstantForceWorkEnergySynchronizedView["narrative"] {
  const state = frame.semanticFrame.state;
  switch (frame.stage) {
    case "establish":
      return Object.freeze({
        id: "narrative.physics.establish-force",
        text:
          `The object begins with ` +
          `${quantitySpoken(state.kineticEnergy, "joule")} of kinetic energy. ` +
          `A constant rightward net force is parallel to its displacement.`,
        claimIds: Object.freeze([
          "claim.physics.force-constant",
          "claim.physics.force-parallel-displacement"
        ])
      });
    case "accumulate":
      return Object.freeze({
        id: "narrative.physics.accumulate-work",
        text:
          `As displacement grows, the rectangle under the constant-force ` +
          `line grows by the same exact amount as net work and kinetic energy.`,
        claimIds: Object.freeze([
          "claim.physics.force-constant",
          "claim.physics.graph-area-is-work",
          "claim.physics.work-equals-energy-change"
        ])
      });
    case "connect":
      return Object.freeze({
        id: "narrative.physics.connect-energy",
        text:
          `The completed force-position area is ` +
          `${quantitySpoken(state.accumulatedWork, "joule")}. Newton-meters ` +
          `and joules carry the same SI dimension.`,
        claimIds: Object.freeze([
          "claim.physics.graph-area-is-work",
          "claim.physics.newton-meter-is-joule",
          "claim.physics.work-equals-energy-change"
        ])
      });
    case "settle":
      return Object.freeze({
        id: "narrative.physics.settle-theorem",
        text:
          `Net work equals the exact kinetic-energy change, so the object ` +
          `settles at ${quantitySpoken(state.kineticEnergy, "joule")}.`,
        claimIds: Object.freeze([
          "claim.physics.work-equals-energy-change",
          "claim.physics.final-energy"
        ])
      });
  }
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

function quantitySpoken(value: ExactRationalDto, unit: string): string {
  const singular = value.numerator === value.denominator;
  return `${exactSpoken(value)} ${unit}${singular ? "" : "s"}`;
}
