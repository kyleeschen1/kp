import type { CorrespondenceMap } from "../semantic/correspondence.ts";
import type {
  KpDerivativePowerRuleSemanticRoles
} from "../semantic/derivative-power-rule-semantics.ts";
import type { KpOrganicPathVariant } from "./organic-path-planner.ts";

export const kpDerivativePowerPhaseIds = [
  "orient-exponent",
  "reflow-continuants",
  "branch-exponent",
  "drop-coefficient",
  "decrement-successor",
  "settle-derivative",
  "release-derivative-focus"
] as const;

export type KpDerivativePowerPhaseId =
  (typeof kpDerivativePowerPhaseIds)[number];

export interface KpDerivativePowerChoreographyPlan {
  readonly kind: "derivative-power-choreography-plan";
  readonly id: string;
  readonly correspondenceMapId: string;
  readonly phaseIds: readonly KpDerivativePowerPhaseId[];
  readonly operatorSelectorIds: readonly string[];
  readonly base: {
    readonly sourceSelectorId: string;
    readonly targetSelectorId: string;
  };
  readonly exponent: {
    readonly sourceSelectorId: string;
    readonly coefficientSelectorId: string;
    readonly successorSelectorId: string;
    readonly sourceMinimumScale: number;
    readonly coefficientPathVariant: KpOrganicPathVariant;
    readonly successorPathVariant: KpOrganicPathVariant;
  };
}

export interface KpDerivativePowerChoreographyFrame {
  readonly kind: "derivative-power-choreography-frame";
  readonly planId: string;
  readonly direction: "forward" | "rewind";
  readonly progress: number;
  readonly semanticProgress: number;
  readonly phases: Readonly<Record<KpDerivativePowerPhaseId, number>>;
  readonly focus: {
    readonly exponentEmphasis: number;
    readonly shadowOpacity: number;
  };
  readonly operator: {
    readonly opacity: number;
    readonly removalProgress: number;
  };
  readonly base: {
    readonly reflowProgress: number;
    readonly sourceOpacity: number;
    readonly targetOpacity: number;
  };
  readonly exponentSource: {
    readonly opacity: number;
    readonly scale: number;
  };
  readonly coefficient: {
    readonly opacity: number;
    readonly scale: number;
    readonly pathProgress: number;
    readonly pathVariant: KpOrganicPathVariant;
  };
  readonly successorExponent: {
    readonly opacity: number;
    readonly scale: number;
    readonly pathProgress: number;
    readonly decrementProgress: number;
    readonly pathVariant: KpOrganicPathVariant;
  };
  readonly settlementProgress: number;
}

export function compileKpDerivativePowerChoreography(input: {
  readonly id: string;
  readonly semanticRoles: KpDerivativePowerRuleSemanticRoles;
  readonly correspondenceMap: CorrespondenceMap;
  readonly sourceMinimumScale?: number | undefined;
}): KpDerivativePowerChoreographyPlan {
  if (input.id.trim() === "") {
    throw new Error("Derivative power choreography id must not be empty.");
  }
  const sourceMinimumScale = input.sourceMinimumScale ?? 0.7;
  if (!(sourceMinimumScale > 0 && sourceMinimumScale <= 1)) {
    throw new Error(
      "Derivative power sourceMinimumScale must be greater than zero and at most one."
    );
  }
  const record = (id: string) => input.correspondenceMap.records.find(
    (candidate) => candidate.id === id
  );
  const operator = record("derivative-operator-consumed");
  const variable = record("differentiation-variable-consumed");
  const base = record("base-persists");
  const exponent = record("exponent-branches");
  if (
    operator?.relation !== "removal" ||
    variable?.relation !== "removal" ||
    base?.relation !== "identity" ||
    exponent?.relation !== "fan-out" ||
    base.sourceSelectorIds.length !== 1 ||
    base.targetSelectorIds.length !== 1 ||
    exponent.sourceSelectorIds.length !== 1 ||
    exponent.targetSelectorIds.length !== 2
  ) {
    throw new Error(
      "Derivative power choreography requires operator removal, base persistence, and exponent fan-out lineage."
    );
  }
  const coefficientRole = input.semanticRoles.targetRoles.find(
    (role) => role.id === "target.coefficient"
  );
  const successorRole = input.semanticRoles.targetRoles.find(
    (role) => role.id === "target.exponent"
  );
  if (
    coefficientRole?.operation !== "transmit" ||
    successorRole?.operation !== "decrement" ||
    !exponent.targetSelectorIds.includes(coefficientRole.selectorId) ||
    !exponent.targetSelectorIds.includes(successorRole.selectorId)
  ) {
    throw new Error(
      "Derivative power exponent branches must identify coefficient transmission and exponent decrement."
    );
  }

  return {
    kind: "derivative-power-choreography-plan",
    id: input.id,
    correspondenceMapId: input.correspondenceMap.id,
    phaseIds: [...kpDerivativePowerPhaseIds],
    operatorSelectorIds: [
      ...operator.sourceSelectorIds,
      ...variable.sourceSelectorIds
    ],
    base: {
      sourceSelectorId: base.sourceSelectorIds[0]!,
      targetSelectorId: base.targetSelectorIds[0]!
    },
    exponent: {
      sourceSelectorId: exponent.sourceSelectorIds[0]!,
      coefficientSelectorId: coefficientRole.selectorId,
      successorSelectorId: successorRole.selectorId,
      sourceMinimumScale,
      coefficientPathVariant: "arc-below",
      successorPathVariant: "arc-above"
    }
  };
}

export function sampleKpDerivativePowerChoreography(input: {
  readonly plan: KpDerivativePowerChoreographyPlan;
  readonly progress: number;
  readonly direction?: "forward" | "rewind" | undefined;
}): KpDerivativePowerChoreographyFrame {
  const progress = clamp01(input.progress);
  const direction = input.direction ?? "forward";
  const p = roundProgress(direction === "forward" ? progress : 1 - progress);
  const phases: Readonly<Record<KpDerivativePowerPhaseId, number>> = {
    "orient-exponent": phaseProgress(p, 0, 0.18),
    "reflow-continuants": phaseProgress(p, 0.12, 0.34),
    "branch-exponent": phaseProgress(p, 0.28, 0.44),
    "drop-coefficient": phaseProgress(p, 0.36, 0.72),
    "decrement-successor": phaseProgress(p, 0.44, 0.76),
    "settle-derivative": phaseProgress(p, 0.74, 0.92),
    "release-derivative-focus": phaseProgress(p, 0.88, 1)
  };
  const branch = phases["branch-exponent"];
  const coefficient = phases["drop-coefficient"];
  const successor = phases["decrement-successor"];
  const settle = phases["settle-derivative"];
  const focusRelease = phases["release-derivative-focus"];
  const sourceScale = interpolate(
    1,
    input.plan.exponent.sourceMinimumScale,
    branch
  );

  return {
    kind: "derivative-power-choreography-frame",
    planId: input.plan.id,
    direction,
    progress,
    semanticProgress: p,
    phases,
    focus: {
      exponentEmphasis: phases["orient-exponent"] * (1 - focusRelease),
      shadowOpacity: 0.24 * phases["orient-exponent"] * (1 - focusRelease)
    },
    operator: {
      opacity: 1 - settle,
      removalProgress: settle
    },
    base: {
      reflowProgress: phases["reflow-continuants"],
      sourceOpacity: 1 - settle,
      targetOpacity: settle
    },
    // The source remains nonzero through transit so both descendants have an
    // intelligible material origin instead of popping in independently.
    exponentSource: {
      opacity: 1 - settle,
      scale: sourceScale
    },
    coefficient: {
      opacity: branch,
      scale: interpolate(input.plan.exponent.sourceMinimumScale, 1, coefficient),
      pathProgress: coefficient,
      pathVariant: input.plan.exponent.coefficientPathVariant
    },
    successorExponent: {
      opacity: branch,
      scale: interpolate(input.plan.exponent.sourceMinimumScale, 1, successor),
      pathProgress: successor,
      decrementProgress: successor,
      pathVariant: input.plan.exponent.successorPathVariant
    },
    settlementProgress: settle
  };
}

function phaseProgress(progress: number, start: number, end: number): number {
  const local = clamp01((progress - start) / (end - start));
  return local * local * (3 - 2 * local);
}

function interpolate(from: number, to: number, progress: number): number {
  return from + ((to - from) * progress);
}

function roundProgress(value: number): number {
  return Math.round(value * 1_000_000_000_000) / 1_000_000_000_000;
}

function clamp01(value: number): number {
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
}
