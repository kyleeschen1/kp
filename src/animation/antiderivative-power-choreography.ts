import type { KpAnimationAsset } from "./asset.ts";
import type { CorrespondenceMap } from "../semantic/correspondence.ts";
import {
  resolveKpAntiderivativePowerRuleSemanticRoles,
  type KpAntiderivativePowerRuleSemanticRoles
} from "../semantic/antiderivative-power-rule-semantics.ts";

export const kpAntiderivativePowerPhaseIds = Object.freeze([
  "notice-operator-scope",
  "withdraw-operator",
  "rewrite-power-rule",
  "settle-expanded-rule"
] as const);

export type KpAntiderivativePowerPhaseId =
  (typeof kpAntiderivativePowerPhaseIds)[number];

export interface KpAntiderivativePowerChoreographyPlan {
  readonly kind: "antiderivative-power-choreography-plan";
  readonly id: string;
  readonly correspondenceMapId: string;
  readonly phaseIds: readonly KpAntiderivativePowerPhaseId[];
  readonly operatorApplication: {
    readonly kind: "antiderivative-operator-application";
    readonly operatorSelectorIds: readonly string[];
    readonly argumentSelectorIds: readonly string[];
    readonly consumesOperator: true;
    readonly withdrawal: "opacity-only";
  };
  readonly persistentBase: {
    readonly sourceSelectorId: string;
    readonly targetSelectorId: string;
  };
  readonly exponentBranch: {
    readonly sourceSelectorId: string;
    readonly targetSelectorIds: readonly [string, string];
  };
  readonly introducedSelectorIds: readonly string[];
}

export interface KpAntiderivativePowerChoreographyFrame {
  readonly kind: "antiderivative-power-choreography-frame";
  readonly planId: string;
  readonly direction: "forward" | "rewind";
  readonly progress: number;
  readonly semanticProgress: number;
  readonly phases: Readonly<Record<KpAntiderivativePowerPhaseId, number>>;
  readonly focus: {
    readonly operatorApplication: number;
    readonly integrandScope: number;
  };
  readonly operator: {
    readonly opacity: number;
    readonly removalProgress: number;
  };
  readonly rewriteProgress: number;
  readonly settlementProgress: number;
}

export function createKpAntiderivativePowerChoreography(
  animation: KpAnimationAsset
): KpAntiderivativePowerChoreographyPlan {
  const expansionTransformation = animation.transformations.find(
    ({ transformType }) => transformType === "applyAntiderivativePowerRule"
  );
  const resolutionTransformation = animation.transformations.find(
    ({ transformType }) => transformType === "simplifyAntiderivativePowerRule"
  );
  if (
    expansionTransformation?.correspondenceMap === undefined ||
    resolutionTransformation === undefined
  ) {
    throw new Error(
      `Animation ${animation.id} lacks its governed antiderivative sequence.`
    );
  }
  const semanticRoles = resolveKpAntiderivativePowerRuleSemanticRoles({
    expansionTransformation,
    resolutionTransformation,
    bundle: animation.bundle
  });
  return compileKpAntiderivativePowerChoreography({
    id: `motion.${expansionTransformation.id}`,
    semanticRoles,
    correspondenceMap: expansionTransformation.correspondenceMap
  });
}

export function compileKpAntiderivativePowerChoreography(input: {
  readonly id: string;
  readonly semanticRoles: KpAntiderivativePowerRuleSemanticRoles;
  readonly correspondenceMap: CorrespondenceMap;
}): KpAntiderivativePowerChoreographyPlan {
  if (input.id.trim() === "") {
    throw new Error("Antiderivative power choreography id must not be empty.");
  }
  const record = (id: string) => input.correspondenceMap.records.find(
    (candidate) => candidate.id === id
  );
  const integral = record("integral-operator-consumed");
  const differential = record("differential-symbol-consumed");
  const variable = record("integration-variable-consumed");
  const base = record("integrand-base-persists");
  const exponent = record("source-exponent-branches");
  const introductions = [
    record("numerator-increment-introduced"),
    record("denominator-increment-introduced"),
    record("integration-connector-introduced"),
    record("integration-constant-introduced")
  ];
  if (
    integral?.relation !== "removal" ||
    differential?.relation !== "removal" ||
    variable?.relation !== "removal" ||
    base?.relation !== "identity" ||
    exponent?.relation !== "fan-out" ||
    base.sourceSelectorIds.length !== 1 ||
    base.targetSelectorIds.length !== 1 ||
    exponent.sourceSelectorIds.length !== 1 ||
    exponent.targetSelectorIds.length !== 2 ||
    introductions.some((candidate) =>
      candidate?.relation !== "introduction" ||
      candidate.targetSelectorIds.length !== 1)
  ) {
    throw new Error(
      "Antiderivative choreography requires operator removal, base persistence, exponent fan-out, and four governed introductions."
    );
  }
  const role = (
    id: KpAntiderivativePowerRuleSemanticRoles["sourceRoles"][number]["id"]
  ): string => {
    const found = input.semanticRoles.sourceRoles.find((candidate) =>
      candidate.id === id
    );
    if (found === undefined) {
      throw new Error(`Antiderivative choreography lacks source role ${id}.`);
    }
    return found.selectorId;
  };
  return Object.freeze({
    kind: "antiderivative-power-choreography-plan" as const,
    id: input.id,
    correspondenceMapId: input.correspondenceMap.id,
    phaseIds: kpAntiderivativePowerPhaseIds,
    operatorApplication: Object.freeze({
      kind: "antiderivative-operator-application" as const,
      operatorSelectorIds: Object.freeze([
        ...integral.sourceSelectorIds,
        ...differential.sourceSelectorIds,
        ...variable.sourceSelectorIds
      ]),
      argumentSelectorIds: Object.freeze([
        role("source.integrand-base"),
        role("source.integrand-exponent")
      ]),
      consumesOperator: true as const,
      withdrawal: "opacity-only" as const
    }),
    persistentBase: Object.freeze({
      sourceSelectorId: base.sourceSelectorIds[0]!,
      targetSelectorId: base.targetSelectorIds[0]!
    }),
    exponentBranch: Object.freeze({
      sourceSelectorId: exponent.sourceSelectorIds[0]!,
      targetSelectorIds: Object.freeze([
        exponent.targetSelectorIds[0]!,
        exponent.targetSelectorIds[1]!
      ] as const)
    }),
    introducedSelectorIds: Object.freeze(introductions.map((candidate) =>
      candidate!.targetSelectorIds[0]!
    ))
  });
}

export function sampleKpAntiderivativePowerChoreography(input: {
  readonly plan: KpAntiderivativePowerChoreographyPlan;
  readonly progress: number;
  readonly direction?: "forward" | "rewind" | undefined;
}): KpAntiderivativePowerChoreographyFrame {
  const progress = clamp01(input.progress);
  const direction = input.direction ?? "forward";
  const semanticProgress = roundProgress(
    direction === "forward" ? progress : 1 - progress
  );
  const phases: Readonly<Record<KpAntiderivativePowerPhaseId, number>> = {
    "notice-operator-scope": phaseProgress(semanticProgress, 0.04, 0.16),
    "withdraw-operator": phaseProgress(semanticProgress, 0.18, 0.32),
    "rewrite-power-rule": phaseProgress(semanticProgress, 0.34, 0.86),
    "settle-expanded-rule": phaseProgress(semanticProgress, 0.82, 1)
  };
  const notice = phases["notice-operator-scope"];
  const withdrawal = phases["withdraw-operator"];
  const focusRelease = phaseProgress(semanticProgress, 0.72, 0.94);
  return Object.freeze({
    kind: "antiderivative-power-choreography-frame" as const,
    planId: input.plan.id,
    direction,
    progress,
    semanticProgress,
    phases: Object.freeze(phases),
    focus: Object.freeze({
      operatorApplication: roundProgress(notice * (1 - withdrawal)),
      integrandScope: roundProgress(notice * (1 - focusRelease))
    }),
    operator: Object.freeze({
      opacity: roundProgress(1 - withdrawal),
      removalProgress: withdrawal
    }),
    rewriteProgress: phases["rewrite-power-rule"],
    settlementProgress: phases["settle-expanded-rule"]
  });
}

function phaseProgress(
  progress: number,
  start: number,
  end: number
): number {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  return roundProgress((progress - start) / (end - start));
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function roundProgress(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
