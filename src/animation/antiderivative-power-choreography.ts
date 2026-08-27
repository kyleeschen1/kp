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
  "match-rule-pattern",
  "bind-rule-metavariables",
  "reveal-rule-template",
  "instantiate-rule-result",
  "commit-rule-rewrite",
  "settle-expanded-rule"
] as const);

export type KpAntiderivativePowerPhaseId =
  (typeof kpAntiderivativePowerPhaseIds)[number];

// Keep this renderer-facing shape named: the app's Oxc transform and
// TypeScript do not parse line-broken chained indexed access types identically.
export interface KpAntiderivativeRuleInstructionalProjection {
  readonly patternLatex: string;
  readonly replacementTemplateLatex: string;
  readonly bindingLatex: string;
  readonly metavariables: readonly ["n"];
}

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
    readonly patternLatex: string;
    readonly replacementTemplateLatex: string;
    readonly bindingLatex: string;
    readonly instantiatedResultLatex: string;
    readonly instructionalProjection: KpAntiderivativeRuleInstructionalProjection;
    readonly metavariableBindings: readonly [
      {
        readonly metavariable: "u";
        readonly value: string;
        readonly sourceSelectorIds: readonly [string, string];
      },
      {
        readonly metavariable: "n";
        readonly value: string;
        readonly sourceSelectorIds: readonly [string];
      }
    ];
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
    readonly panelPresence: number;
    readonly matchProgress: number;
    readonly matchPresence: number;
    readonly metavariableBindingsPresence: number;
    readonly rulePreviewPresence: number;
    readonly rulePreviewWithdrawalProgress: number;
    readonly patternProjectionPresence: number;
    readonly patternProjectionProgress: number;
    readonly instantiatedResultPresence: number;
    readonly templateRevealProgress: number;
    readonly templateSlotPresence: number;
    readonly instantiationProgress: number;
    readonly rewriteCommitProgress: number;
    readonly sourcePresence: number;
    readonly targetPresence: number;
    readonly vacancyPresence: number;
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
  const baseRole = sourceRole("source.integrand-base");
  const integrationVariableRole = sourceRole("source.integration-variable");
  const exponentRole = sourceRole("source.integrand-exponent");
  const baseLabel = String(baseRole.label);
  const exponentLabel = String(exponentRole.label);
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
      patternLatex: String.raw`\int u^n\,du`,
      replacementTemplateLatex: String.raw`\frac{u^{n+1}}{n+1}+C`,
      bindingLatex:
        String.raw`u\mapsto ${baseLabel},\qquad n\mapsto ${exponentLabel}`,
      instantiatedResultLatex:
        String.raw`\frac{${baseLabel}^{${exponentLabel}+1}}{${exponentLabel}+1}+C`,
      // The verified rule retains both metavariables. This introductory
      // projection specializes the ambient integration variable so attention
      // can stay on the exponent slot that teaches the reusable structure.
      instructionalProjection: Object.freeze({
        patternLatex:
          String.raw`\int ${baseLabel}^n\,d${integrationVariableRole.label}`,
        replacementTemplateLatex:
          String.raw`\frac{${baseLabel}^{n+1}}{n+1}+C`,
        bindingLatex: String.raw`n\mapsto ${exponentLabel}`,
        metavariables: Object.freeze(["n"] as const)
      }),
      metavariableBindings: Object.freeze([
        Object.freeze({
          metavariable: "u" as const,
          value: baseLabel,
          sourceSelectorIds: Object.freeze([
            baseRole.selectorId,
            integrationVariableRole.selectorId
          ] as const)
        }),
        Object.freeze({
          metavariable: "n" as const,
          value: exponentLabel,
          sourceSelectorIds: Object.freeze([
            exponentRole.selectorId
          ] as const)
        })
      ] as const),
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
    "notice-operator-scope": phaseProgress(semanticProgress, 0.02, 0.12),
    "withdraw-operator": phaseProgress(semanticProgress, 0.56, 0.64),
    "rewrite-power-rule": phaseProgress(semanticProgress, 0.14, 0.96),
    "match-rule-pattern": phaseProgress(semanticProgress, 0.14, 0.34),
    "bind-rule-metavariables": phaseProgress(semanticProgress, 0.3, 0.46),
    "reveal-rule-template": phaseProgress(semanticProgress, 0.48, 0.62),
    "instantiate-rule-result": phaseProgress(semanticProgress, 0.62, 0.76),
    "commit-rule-rewrite": phaseProgress(semanticProgress, 0.78, 0.94),
    "settle-expanded-rule": phaseProgress(semanticProgress, 0.9, 1)
  };
  const notice = phases["notice-operator-scope"];
  const withdrawal = phases["withdraw-operator"];
  const focusRelease = phaseProgress(semanticProgress, 0.64, 0.72);
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
 * Rule application keeps recognition, binding, instantiation, and rewrite
 * distinct. In particular, binding is not computation, and the instantiated
 * result exists prospectively before it becomes the live expression.
 */
export function sampleKpAntiderivativeRuleTemplateApplication(
  rewriteProgress: number
): KpAntiderivativePowerChoreographyFrame["ruleTemplateApplication"] {
  const progress = clamp01(rewriteProgress);
  const rulePreviewRevealProgress = phaseProgress(progress, 0, 0.06);
  const rulePreviewWithdrawalProgress = phaseProgress(progress, 0.22, 0.3);
  const rulePreviewPresence = roundProgress(
    rulePreviewRevealProgress * (1 - rulePreviewWithdrawalProgress)
  );
  const patternProjectionProgress = phaseProgress(progress, 0.22, 0.36);
  const patternProjectionPresence = roundProgress(
    phaseProgress(progress, 0.2, 0.26) *
      (1 - phaseProgress(progress, 0.47, 0.53))
  );
  const matchProgress = phaseProgress(progress, 0.31, 0.39);
  const matchPresence = roundProgress(
    matchProgress * (1 - phaseProgress(progress, 0.47, 0.53))
  );
  const binding = phaseProgress(progress, 0.43, 0.51);
  const instructionWithdrawalProgress = phaseProgress(progress, 0.88, 0.94);
  const metavariableBindingsPresence = roundProgress(
    binding * (1 - instructionWithdrawalProgress)
  );
  const templateRevealProgress = phaseProgress(progress, 0.61, 0.69);
  const instantiationProgress = phaseProgress(progress, 0.78, 0.86);
  const rewriteCommitProgress = phaseProgress(progress, 0.95, 0.995);
  const sourcePresence = roundProgress(
    1 - phaseProgress(progress, 0.57, 0.67)
  );
  const targetPresence = templateRevealProgress;
  const templateSlotPresence = roundProgress(
    targetPresence * (1 - instantiationProgress)
  );
  const receiverSettlement = rewriteCommitProgress;
  const syntaxResolution = rewriteCommitProgress;
  const instantiatedResultPresence = instantiationProgress;
  const panelPresence = roundProgress(Math.max(
    rulePreviewPresence,
    patternProjectionPresence,
    matchPresence,
    metavariableBindingsPresence
  ));
  const receiverFocus = roundProgress(
    Math.max(
      rulePreviewPresence,
      patternProjectionPresence,
      matchPresence,
      metavariableBindingsPresence
    ) *
      (1 - syntaxResolution)
  );
  // A slot is semantic, but a box is not. The renderer may annotate the
  // matched source without introducing vacant rules or duplicate equations.
  const vacancyPresence = 0;
  const scaffoldPresence = templateRevealProgress;
  const syntaxPresence = templateRevealProgress;
  const closurePresence = templateRevealProgress;
  return Object.freeze({
    traceRole: rewriteCommitProgress >= 1
      ? "live" as const
      : rulePreviewPresence > 0 || patternProjectionPresence > 0 ||
          matchProgress > 0 ||
          instantiationProgress > 0
        ? "prospective" as const
        : "absent" as const,
    receiverFocus,
    panelPresence,
    matchProgress,
    matchPresence,
    metavariableBindingsPresence,
    rulePreviewPresence,
    rulePreviewWithdrawalProgress,
    patternProjectionPresence,
    patternProjectionProgress,
    instantiatedResultPresence,
    templateRevealProgress,
    templateSlotPresence,
    instantiationProgress,
    rewriteCommitProgress,
    sourcePresence,
    targetPresence,
    vacancyPresence,
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
