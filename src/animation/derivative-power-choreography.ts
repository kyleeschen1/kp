import type { CorrespondenceMap } from "../semantic/correspondence.ts";
import { createKpSemanticLineageGraph } from "../semantic/semantic-lineage-graph.ts";
import type {
  KpDerivativePowerRuleSemanticRoles
} from "../semantic/derivative-power-rule-semantics.ts";
import {
  resolveKpDerivativePowerRuleSemanticRoles
} from "../semantic/derivative-power-rule-semantics.ts";
import type { KpAnimationAsset } from "./asset.ts";
import {
  compileKpChoreographyPlan,
  type KpCompiledChoreographyPlan
} from "./choreography-compiler.ts";
import {
  compileKpChoreographyTimeline,
  type KpChoreographyTimeline
} from "./choreography-timeline.ts";
import type { KpChoreographyVocabulary } from "./choreography-vocabulary.ts";
import {
  compileKpFocusProfile,
  type KpFocusProfilePlan
} from "./focus-profile.ts";
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
    readonly coefficientPathVariant: "arc-below";
    readonly successorPathVariant: "arc-above";
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

export interface KpDerivativePowerRuleChoreography {
  readonly plan: KpCompiledChoreographyPlan;
  readonly timeline: KpChoreographyTimeline;
  readonly focus: KpFocusProfilePlan;
  readonly motion: KpDerivativePowerChoreographyPlan;
}

export function createKpDerivativePowerRuleChoreography(
  animation: KpAnimationAsset
): KpDerivativePowerRuleChoreography {
  const transformation = animation.transformations.find(
    (candidate) =>
      candidate.transformType === "applyDerivativePowerRule" ||
      candidate.transformType === "derivativePowerRule"
  );
  if (transformation?.correspondenceMap === undefined) {
    throw new Error(
      `Animation ${animation.id} has no derivative power-rule correspondence.`
    );
  }
  const roles = resolveKpDerivativePowerRuleSemanticRoles({
    transformation,
    bundle: animation.bundle
  });
  const source = roleSelectors(roles.sourceRoles);
  const target = roleSelectors(roles.targetRoles);
  const baseContinuantId = `continuant.${transformation.id}.base`;
  const exponentLineageId = `lineage.${transformation.id}.exponent-branch`;
  const baseLineageId = `lineage.${transformation.id}.base`;
  const vocabulary: KpChoreographyVocabulary = {
    id: `vocabulary.${transformation.id}`,
    continuants: [{
      id: baseContinuantId,
      meaning: "The powered base persists while the derivative operator is consumed.",
      relation: "identity",
      source: { entityId: source.base, selectorIds: [source.base] },
      target: { entityId: target.base, selectorIds: [target.base] },
      identityAuthority: {
        kind: "correspondence",
        transformationId: transformation.id,
        correspondenceRecordId: "base-persists"
      }
    }],
    representationalLineages: [],
    objectConstancy: [{
      id: `constancy.${transformation.id}.base`,
      continuantId: baseContinuantId,
      mode: "continuous",
      preserveThrough: ["movement", "seek", "rewind", "renderer-handoff"]
    }],
    materialContinuity: [{
      id: `continuity.${transformation.id}.base`,
      mode: "continuant-motion",
      sourceEntityIds: [source.base],
      targetEntityIds: [target.base],
      authorityRef: { kind: "continuant", continuantId: baseContinuantId },
      summary: "The base remains opaque while reflowing into the result."
    }],
    motionClassifications: [
      {
        id: `motion.${transformation.id}.exponent-branch`,
        entityIds: [source.exponent, target.coefficient, target.exponent],
        motionClass: "meaningful",
        reason: "Branching the exponent communicates coefficient transmission and decrement."
      },
      {
        id: `motion.${transformation.id}.operator-consumption`,
        entityIds: [source.operator, source.variable],
        motionClass: "meaningful",
        reason: "Operator exit occurs only after its derivative action is legible."
      }
    ]
  };
  const lineage = createKpSemanticLineageGraph({
    id: `lineage.${transformation.id}`,
    sourceEntityIds: [
      source.operator,
      source.variable,
      source.base,
      source.exponent
    ],
    targetEntityIds: [target.coefficient, target.base, target.exponent],
    edges: [
      {
        id: baseLineageId,
        relation: "persist",
        sourceEntityIds: [source.base],
        targetEntityIds: [target.base],
        summary: "The base preserves identity through the derivative rule."
      },
      {
        id: exponentLineageId,
        relation: "split",
        sourceEntityIds: [source.exponent],
        targetEntityIds: [target.coefficient, target.exponent],
        summary: "The exponent supplies both the coefficient and decremented power."
      },
      {
        id: `lineage.${transformation.id}.operator-consumption`,
        relation: "removal",
        sourceEntityIds: [source.operator, source.variable],
        targetEntityIds: [],
        summary: "The derivative operator and variable leave after applying the rule."
      }
    ]
  });
  const sourceSalienceId = `salience.${transformation.id}.source-exponent`;
  const coefficientSalienceId = `salience.${transformation.id}.coefficient`;
  const successorSalienceId = `salience.${transformation.id}.successor`;
  const reunionSalienceId = `salience.${transformation.id}.result`;
  const coefficientTransferId = `salience.${transformation.id}.coefficient-transfer`;
  const successorTransferId = `salience.${transformation.id}.successor-transfer`;
  const branchGroupId = `salience.${transformation.id}.branch`;
  const compiled = compileKpChoreographyPlan({
    id: `choreography.${transformation.id}`,
    timelineRefId: animation.timeline?.id ?? `timeline.${animation.id}`,
    canonicalOperationId: "kp.calculus.derivative.power-rule",
    transformation,
    bundle: animation.bundle,
    vocabulary,
    lifecycle: {
      id: `lifecycle.${transformation.id}`,
      records: [
        {
          id: `lifecycle.${transformation.id}.base`,
          kind: "continuant",
          continuantId: baseContinuantId,
          sourceEntityIds: [source.base],
          targetEntityIds: [target.base],
          summary: "The base persists as one semantic continuant."
        },
        {
          id: `lifecycle.${transformation.id}.exponent-branch`,
          kind: "copy",
          operationId: "kp.calculus.derivative.power-rule",
          lineageEdgeId: exponentLineageId,
          sourceEntityIds: [source.exponent],
          targetEntityIds: [target.coefficient, target.exponent],
          summary: "The exponent branches into the rule's two semantic products."
        },
        {
          id: `lifecycle.${transformation.id}.operator-consumption`,
          kind: "elimination",
          cause: {
            kind: "consumption",
            authorityId: "kp.calculus.derivative.power-rule#operator"
          },
          sourceEntityIds: [source.operator, source.variable],
          targetEntityIds: [],
          summary: "Applying the derivative rule consumes its operator notation."
        }
      ]
    },
    lineage,
    salience: {
      id: `salience.${transformation.id}`,
      kind: "transferable-salience-graph",
      nodes: [
        { id: sourceSalienceId, entityIds: [source.exponent], role: "source", readinessThreshold: 0.2 },
        { id: coefficientSalienceId, entityIds: [target.coefficient], role: "travelling", readinessThreshold: 0.56 },
        { id: successorSalienceId, entityIds: [target.exponent], role: "travelling", readinessThreshold: 0.62 },
        { id: reunionSalienceId, entityIds: [target.coefficient, target.base, target.exponent], role: "reunification", readinessThreshold: 0.82 }
      ],
      edges: [
        {
          id: coefficientTransferId,
          sourceNodeId: sourceSalienceId,
          targetNodeId: coefficientSalienceId,
          lineageEdgeId: exponentLineageId,
          targetReadyAt: 0.56,
          sourceReleaseAt: 0.86,
          branchGroupId,
          branchWeight: 0.5
        },
        {
          id: successorTransferId,
          sourceNodeId: sourceSalienceId,
          targetNodeId: successorSalienceId,
          lineageEdgeId: exponentLineageId,
          targetReadyAt: 0.62,
          sourceReleaseAt: 0.86,
          branchGroupId,
          branchWeight: 0.5
        }
      ],
      branchGroups: [{
        id: branchGroupId,
        edgeIds: [coefficientTransferId, successorTransferId],
        reunificationNodeId: reunionSalienceId,
        reunifyAt: 0.8
      }]
    },
    traversal: {
      id: `traversal.${transformation.id}`,
      kind: "semantic-traversal-plan",
      policy: "symmetric",
      authorityId: "kp.calculus.derivative.power-rule",
      participants: [
        { id: `participant.${transformation.id}.source`, entityIds: [source.exponent], rank: 0, symmetryGroupId: "derivative-power" },
        { id: `participant.${transformation.id}.coefficient`, entityIds: [target.coefficient], rank: 1, symmetryGroupId: "derivative-power" },
        { id: `participant.${transformation.id}.successor`, entityIds: [target.exponent], rank: 1, symmetryGroupId: "derivative-power" },
        { id: `participant.${transformation.id}.result`, entityIds: [target.coefficient, target.base, target.exponent], rank: 2, symmetryGroupId: "derivative-power" }
      ],
      ranks: [
        { rank: 0, participantIds: [`participant.${transformation.id}.source`], presentation: "show" },
        { rank: 1, participantIds: [`participant.${transformation.id}.coefficient`, `participant.${transformation.id}.successor`], presentation: "show" },
        { rank: 2, participantIds: [`participant.${transformation.id}.result`], presentation: "show" }
      ],
      cascade: { adjacentOnly: true, nextRankReadinessThreshold: 0.6 }
    },
    layoutPlanId: `layout.${transformation.id}.measured`,
    motifIds: ["derivative-power"]
  });
  if (compiled.status !== "compiled") {
    throw new Error(
      `Derivative power-rule choreography failed: ${compiled.gaps[0]?.message ?? "unknown gap"}`
    );
  }
  return {
    plan: compiled.plan,
    timeline: compileKpChoreographyTimeline({
      id: `timeline.${transformation.id}.choreography`,
      plan: compiled.plan,
      focusReadinessThreshold: 0.58,
      recognitionDwell: 0.42,
      phaseWeights: {
        orient: 0.18,
        reflow: 0.16,
        act: 0.4,
        settle: 0.18,
        release: 0.08
      }
    }),
    focus: compileKpFocusProfile({
      id: `focus.${transformation.id}.source-exponent`,
      groupId: `group.${transformation.id}.source-exponent`,
      semanticEntityIds: [source.exponent],
      fragmentIds: [],
      profile: "elevated",
      strength: 0.55,
      contextDimming: 0.1,
      accessibilityMode: "full"
    }),
    motion: compileKpDerivativePowerChoreography({
      id: `motion.${transformation.id}`,
      semanticRoles: roles,
      correspondenceMap: transformation.correspondenceMap
    })
  };
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

function roleSelectors(
  roles: KpDerivativePowerRuleSemanticRoles["sourceRoles"] |
    KpDerivativePowerRuleSemanticRoles["targetRoles"]
): {
  readonly operator: string;
  readonly variable: string;
  readonly base: string;
  readonly exponent: string;
  readonly coefficient: string;
} {
  const selector = (suffix: string): string =>
    roles.find((role) => role.id.endsWith(suffix))?.selectorId ?? "";
  return {
    operator: selector("derivative-operator"),
    variable: selector("differentiation-variable"),
    base: selector("base"),
    exponent: selector("exponent"),
    coefficient: selector("coefficient")
  };
}
