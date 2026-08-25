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
  "preview-rule-template",
  "bind-rule-template",
  "resolve-rule-syntax",
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
    readonly argumentSemanticEntityId: string;
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
  readonly ruleTemplateApplication: {
    readonly kind: "antiderivative-rule-template-instantiation";
    readonly lawRefId: "law.calculus.integral.power-rule";
    readonly scaffoldSemanticEntityIds: readonly string[];
    readonly fixedSyntaxGroups: readonly [
      {
        readonly role: "numerator-successor";
        readonly selectorIds: readonly [string, string];
      },
      {
        readonly role: "denominator-successor";
        readonly selectorIds: readonly [string, string];
      }
    ];
    readonly closureSelectorIds: readonly string[];
    readonly bindingRelations: readonly [
      {
        readonly relation: "persist";
        readonly sourceSelectorId: string;
        readonly targetSelectorIds: readonly [string];
      },
      {
        readonly relation: "fan-out";
        readonly sourceSelectorId: string;
        readonly targetSelectorIds: readonly [string, string];
      }
    ];
  };
  readonly fractionStructure: {
    readonly targetSemanticEntityId: string;
    readonly lifecycle: "introduction";
  };
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
  readonly ruleTemplateApplication: {
    readonly traceRole: "absent" | "prospective" | "live";
    readonly receiverFocus: number;
    readonly vacancyPresence: number;
    readonly previewPresence: number;
    readonly scaffoldPresence: number;
    readonly bindingProgress: number;
    readonly receiverSettlementProgress: number;
    readonly syntaxPresence: number;
    readonly syntaxResolutionProgress: number;
    readonly closurePresence: number;
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
  const powerRuleLaw = expansionTransformation.lawRefs?.find((reference) =>
    reference.id === "law.calculus.integral.power-rule" &&
    reference.level === "strict"
  );
  if (powerRuleLaw === undefined) {
    throw new Error(
      `Animation ${animation.id} lacks its strict antiderivative power-rule law.`
    );
  }
  return compileKpAntiderivativePowerChoreography({
    id: `motion.${expansionTransformation.id}`,
    semanticRoles,
    correspondenceMap: expansionTransformation.correspondenceMap,
    lawRefId: "law.calculus.integral.power-rule"
  });
}

export function compileKpAntiderivativePowerChoreography(input: {
  readonly id: string;
  readonly semanticRoles: KpAntiderivativePowerRuleSemanticRoles;
  readonly correspondenceMap: CorrespondenceMap;
  readonly lawRefId: "law.calculus.integral.power-rule";
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
    record("numerator-successor-operator-introduced"),
    record("numerator-increment-introduced"),
    record("denominator-successor-operator-introduced"),
    record("denominator-increment-introduced"),
    record("integration-connector-introduced"),
    record("integration-constant-introduced")
  ];
  const [
    numeratorSuccessorOperator,
    numeratorIncrement,
    denominatorSuccessorOperator,
    denominatorIncrement,
    integrationConnector,
    integrationConstant
  ] = introductions;
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
      "Antiderivative choreography requires operator removal, base persistence, exponent fan-out, and six governed introductions."
    );
  }
  const sourceRole = (
    id: KpAntiderivativePowerRuleSemanticRoles["sourceRoles"][number]["id"]
  ): KpAntiderivativePowerRuleSemanticRoles["sourceRoles"][number] => {
    const found = input.semanticRoles.sourceRoles.find((candidate) =>
      candidate.id === id
    );
    if (found === undefined) {
      throw new Error(`Antiderivative choreography lacks source role ${id}.`);
    }
    return found;
  };
  const role = (
    id: KpAntiderivativePowerRuleSemanticRoles["sourceRoles"][number]["id"]
  ): string => sourceRole(id).selectorId;
  const group = (
    id: KpAntiderivativePowerRuleSemanticRoles["groups"][number]["id"]
  ): string => {
    const found = input.semanticRoles.groups.find((candidate) =>
      candidate.id === id
    );
    if (found === undefined) {
      throw new Error(`Antiderivative choreography lacks semantic group ${id}.`);
    }
    return found.semanticId;
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
      argumentSemanticEntityId: group("source.integrand-scope"),
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
    )),
    ruleTemplateApplication: Object.freeze({
      kind: "antiderivative-rule-template-instantiation" as const,
      lawRefId: input.lawRefId,
      scaffoldSemanticEntityIds: Object.freeze([
        group("expanded.exact-quotient")
      ]),
      fixedSyntaxGroups: Object.freeze([
        Object.freeze({
          role: "numerator-successor" as const,
          selectorIds: Object.freeze([
            numeratorSuccessorOperator!.targetSelectorIds[0]!,
            numeratorIncrement!.targetSelectorIds[0]!
          ] as const)
        }),
        Object.freeze({
          role: "denominator-successor" as const,
          selectorIds: Object.freeze([
            denominatorSuccessorOperator!.targetSelectorIds[0]!,
            denominatorIncrement!.targetSelectorIds[0]!
          ] as const)
        })
      ] as const),
      closureSelectorIds: Object.freeze([
        integrationConnector!.targetSelectorIds[0]!,
        integrationConstant!.targetSelectorIds[0]!
      ]),
      bindingRelations: Object.freeze([
        Object.freeze({
          relation: "persist" as const,
          sourceSelectorId: base.sourceSelectorIds[0]!,
          targetSelectorIds: Object.freeze([
            base.targetSelectorIds[0]!
          ] as const)
        }),
        Object.freeze({
          relation: "fan-out" as const,
          sourceSelectorId: exponent.sourceSelectorIds[0]!,
          targetSelectorIds: Object.freeze([
            exponent.targetSelectorIds[0]!,
            exponent.targetSelectorIds[1]!
          ] as const)
        })
      ] as const)
    }),
    fractionStructure: Object.freeze({
      targetSemanticEntityId: group("expanded.exact-quotient"),
      lifecycle: "introduction" as const
    })
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
    "notice-operator-scope": phaseProgress(semanticProgress, 0.04, 0.14),
    "withdraw-operator": phaseProgress(semanticProgress, 0.14, 0.25),
    "rewrite-power-rule": phaseProgress(semanticProgress, 0.27, 0.96),
    "preview-rule-template": phaseProgress(semanticProgress, 0.27, 0.5),
    "bind-rule-template": phaseProgress(semanticProgress, 0.52, 0.87),
    "resolve-rule-syntax": phaseProgress(semanticProgress, 0.87, 0.94),
    "settle-expanded-rule": phaseProgress(semanticProgress, 0.9, 1)
  };
  const notice = phases["notice-operator-scope"];
  const withdrawal = phases["withdraw-operator"];
  const focusRelease = phaseProgress(semanticProgress, 0.72, 0.94);
  const template = sampleKpAntiderivativeRuleTemplateApplication(
    phases["rewrite-power-rule"]
  );
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
    ruleTemplateApplication: template,
    rewriteProgress: phases["rewrite-power-rule"],
    settlementProgress: phases["settle-expanded-rule"]
  });
}

/**
 * Rule application needs a receiving structure before source material can
 * read as bound into it. This pure projection keeps that causal distinction
 * deterministic while leaving opacity, scale, and measured geometry to the
 * Native KaTeX presentation profile.
 */
export function sampleKpAntiderivativeRuleTemplateApplication(
  rewriteProgress: number
): KpAntiderivativePowerChoreographyFrame["ruleTemplateApplication"] {
  const progress = clamp01(rewriteProgress);
  const preview = phaseProgress(progress, 0, 0.22);
  const binding = phaseProgress(progress, 0.34, 0.62);
  const receiverSettlement = phaseProgress(progress, 0.72, 0.94);
  const syntaxResolution = phaseProgress(progress, 0.9, 0.98);
  // Binding and settlement are separate semantic beats: the learner first
  // sees material arrive in a prospective rule, then sees that populated
  // receiver become the live expanded expression.
  const receiverFocus = roundProgress(preview * (1 - syntaxResolution));
  const vacancyPresence = roundProgress(preview * (1 - binding));
  // A receiving template cannot be inferred from faint endpoint fragments.
  // Its fraction, successor syntax, and +C arrive as one legible structure;
  // color and vacancies distinguish prospective grammar from bound material.
  const scaffoldPresence = preview;
  const syntaxPresence = preview;
  const closurePresence = preview;
  return Object.freeze({
    traceRole: syntaxResolution >= 1
      ? "live" as const
      : preview > 0
        ? "prospective" as const
        : "absent" as const,
    receiverFocus,
    vacancyPresence,
    previewPresence: preview,
    scaffoldPresence,
    bindingProgress: binding,
    receiverSettlementProgress: receiverSettlement,
    syntaxPresence,
    syntaxResolutionProgress: syntaxResolution,
    closurePresence
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
