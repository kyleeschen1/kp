import type {
  KpFissionFusionFrame,
  KpFissionFusionPlan
} from "./fission-fusion.ts";
import {
  kpFissionFusionCapability,
  type KpFissionFusionCapability
} from "./fission-fusion-capability.ts";
import { createKpSemanticLineageGraph } from "../semantic/semantic-lineage-graph.ts";
import {
  compileKpCompoundTargetDeclarations,
  type KpPresentationGroupContract
} from "./presentation-group-continuity.ts";
import {
  sampleKpLessonCanonicalDistributionMotion
} from "./distribution-motion-profile.ts";
import {
  isKpCompiledSemanticMotionChoreography,
  sampleKpSemanticMotionChoreography,
  type KpCompiledSemanticMotionChoreography
} from "../domain-ir/public-api.ts";
export {
  kpLessonCanonicalDistributionMotionProfile,
  sampleKpLessonCanonicalDistributionMotion
} from "./distribution-motion-profile.ts";
export type {
  KpLessonCanonicalDistributionMotionFrame
} from "./distribution-motion-profile.ts";

export const kpDistributionChoreographyPhaseIds = [
  "focus-factor",
  "reflow-addends",
  "branch-factor-copies",
  "transit-factor-copies",
  "remove-grouping",
  "settle-products",
  "release-factor-focus"
] as const;

export type KpDistributionChoreographyPhaseId =
  typeof kpDistributionChoreographyPhaseIds[number];

export type KpDistributionConnectorMotionConstraint =
  "follow-products-on-math-axis";

export interface KpDistributionConnectorMotionDelta {
  readonly x: number;
  readonly y: number;
}

export interface KpDistributionChoreographyPlan {
  readonly kind: "distribution-choreography-plan";
  readonly id: string;
  readonly sourceFactorId: string;
  readonly factorCopyIds: readonly string[];
  readonly addendPairs: readonly {
    readonly sourceId: string;
    readonly targetId: string;
    readonly semanticIndex: number;
  }[];
  readonly connectorPairs: readonly {
    readonly sourceId: string;
    readonly targetId: string;
    readonly semanticIndex: number;
    readonly motionConstraint: KpDistributionConnectorMotionConstraint;
  }[];
  readonly operatorGroups: readonly {
    readonly id: string;
    readonly semanticIndex: number;
    readonly sourceId: string;
    readonly targetId: string;
    readonly leftProductGroupId: string;
    readonly rightProductGroupId: string;
    readonly motionConstraint: KpDistributionConnectorMotionConstraint;
  }[];
  readonly groupingArtifactIds: readonly string[];
  readonly phaseIds: readonly KpDistributionChoreographyPhaseId[];
  readonly sourceMinimumScale: number;
  readonly productGroups: readonly KpPresentationGroupContract[];
  readonly fissionPlan: KpFissionFusionPlan;
  readonly semanticMotion?: KpCompiledSemanticMotionChoreography | undefined;
}

export interface KpDistributionChoreographyFrame {
  readonly kind: "distribution-choreography-frame";
  readonly planId: string;
  readonly semanticMotionChoreographyId?: string | undefined;
  readonly progress: number;
  readonly phases: Readonly<Record<KpDistributionChoreographyPhaseId, number>>;
  readonly focusStrength: number;
  readonly productSettlementProgress: number;
  readonly addendReflowProgress: number;
  readonly groupingOpacity: number;
  readonly fission: KpFissionFusionFrame;
  readonly sourceFactor: {
    readonly opacity: number;
    readonly scale: number;
    readonly pathProgress: number;
  };
  readonly factorCopies: readonly {
    readonly entityId: string;
    readonly semanticIndex: number;
    readonly opacity: number;
    readonly scale: number;
    readonly pathProgress: number;
  }[];
}

export interface KpDistributionChoreographyDependencies {
  readonly fissionFusion: KpFissionFusionCapability;
}

export interface KpDistributionChoreographyInput {
  readonly id: string;
  readonly sourceFactorId: string;
  readonly factorCopyIds: readonly string[];
  readonly addendPairs: KpDistributionChoreographyPlan["addendPairs"];
  readonly connectorPairs: readonly {
    readonly sourceId: string;
    readonly targetId: string;
    readonly semanticIndex: number;
    readonly motionConstraint?: KpDistributionConnectorMotionConstraint | undefined;
  }[];
  readonly groupingArtifactIds: readonly string[];
  readonly sourceMinimumScale?: number | undefined;
  readonly semanticMotion?: KpCompiledSemanticMotionChoreography | undefined;
}

const defaultDependencies: KpDistributionChoreographyDependencies =
  Object.freeze({ fissionFusion: kpFissionFusionCapability });

export function compileKpDistributionChoreography(
  input: KpDistributionChoreographyInput,
  dependencies: KpDistributionChoreographyDependencies = defaultDependencies
):
KpDistributionChoreographyPlan {
  if (input.factorCopyIds.length < 2) {
    throw new Error("Distribution choreography requires at least two factor copies.");
  }
  if (input.addendPairs.length !== input.factorCopyIds.length) {
    throw new Error("Distribution choreography requires one addend pair per factor copy.");
  }
  if (input.connectorPairs.length !== input.addendPairs.length - 1) {
    throw new Error("Distribution choreography requires one connector pair between addends.");
  }
  const semanticIndices = input.addendPairs.map((pair) => pair.semanticIndex);
  if (
    new Set(semanticIndices).size !== input.addendPairs.length ||
    semanticIndices.some(
      (semanticIndex) =>
        !Number.isInteger(semanticIndex) ||
        semanticIndex < 0 ||
        semanticIndex >= input.factorCopyIds.length
    )
  ) {
    throw new Error(
      "Distribution choreography requires one unique semantic index per product."
    );
  }
  const connectorIndices = input.connectorPairs.map(
    (pair) => pair.semanticIndex
  );
  if (
    new Set(connectorIndices).size !== input.connectorPairs.length ||
    connectorIndices.some(
      (semanticIndex) =>
        !Number.isInteger(semanticIndex) ||
        semanticIndex < 0 ||
        semanticIndex >= input.addendPairs.length - 1
    )
  ) {
    throw new Error(
      "Distribution choreography requires one unique semantic index per operator."
    );
  }
  if (input.groupingArtifactIds.length === 0) {
    throw new Error("Distribution choreography requires explicit grouping artifacts.");
  }
  if (
    input.semanticMotion !== undefined &&
    (
      !isKpCompiledSemanticMotionChoreography(input.semanticMotion) ||
      input.semanticMotion.recipeId !==
        "recipe.semantic-motion.distribution-fan-out.v1"
    )
  ) {
    throw new Error(
      "Distribution choreography requires matching semantic-motion compiler authority."
    );
  }
  const sourceMinimumScale = input.sourceMinimumScale ?? 0.82;
  if (!(sourceMinimumScale > 0 && sourceMinimumScale <= 1)) {
    throw new Error("Distribution source minimum scale must be greater than zero and at most one.");
  }
  const fissionPlan = dependencies.fissionFusion.compile({
    id: `${input.id}.factor-fission`,
    mode: "fission",
    lineageGraph: createKpSemanticLineageGraph({
      id: `${input.id}.factor-lineage`,
      sourceEntityIds: [input.sourceFactorId],
      targetEntityIds: [...input.factorCopyIds],
      edges: [{
        id: `${input.id}.factor-split`,
        relation: "split",
        sourceEntityIds: [input.sourceFactorId],
        targetEntityIds: [...input.factorCopyIds],
        summary: "Common factor splits across addends."
      }]
    }),
    semanticOrder: input.factorCopyIds,
    junctionScale: sourceMinimumScale
  });
  const productGroups = compileKpCompoundTargetDeclarations(
    input.addendPairs.map((addend) => ({
      id: `${input.id}.product.${addend.semanticIndex}`,
      nativeOwnerId: `${input.id}.native-product.${addend.semanticIndex}`,
      memberBindings: [
        {
          memberId: input.factorCopyIds[addend.semanticIndex]!,
          semanticEntityId: input.factorCopyIds[addend.semanticIndex]!,
          correspondenceOrder: 0
        },
        {
          memberId: addend.targetId,
          semanticEntityId: addend.targetId,
          correspondenceOrder: 1
        }
      ]
    }))
  ).map((declaration) => {
    if (declaration.kind !== "presentation-group") {
      throw new Error("Distributed products cannot use presentation exemptions.");
    }
    return declaration;
  });
  const operatorGroups = input.connectorPairs.map((operator) => ({
    id: `${input.id}.operator.${operator.semanticIndex}`,
    semanticIndex: operator.semanticIndex,
    sourceId: operator.sourceId,
    targetId: operator.targetId,
    leftProductGroupId:
      `${input.id}.product.${operator.semanticIndex}`,
    rightProductGroupId:
      `${input.id}.product.${operator.semanticIndex + 1}`,
    motionConstraint:
      operator.motionConstraint ?? "follow-products-on-math-axis"
  }));
  return {
    kind: "distribution-choreography-plan",
    id: input.id,
    sourceFactorId: input.sourceFactorId,
    factorCopyIds: [...input.factorCopyIds],
    addendPairs: input.addendPairs.map((pair) => ({ ...pair })),
    connectorPairs: input.connectorPairs.map((pair) => ({
      ...pair,
      motionConstraint:
        pair.motionConstraint ?? "follow-products-on-math-axis"
    })),
    operatorGroups,
    groupingArtifactIds: [...input.groupingArtifactIds],
    phaseIds: [...kpDistributionChoreographyPhaseIds],
    sourceMinimumScale,
    productGroups,
    fissionPlan,
    ...(input.semanticMotion === undefined
      ? {}
      : { semanticMotion: input.semanticMotion })
  };
}

export function sampleKpDistributionChoreography(input: {
  readonly plan: KpDistributionChoreographyPlan;
  readonly progress: number;
}, dependencies: KpDistributionChoreographyDependencies = defaultDependencies):
KpDistributionChoreographyFrame {
  const progress = input.plan.semanticMotion === undefined
    ? clamp01(input.progress)
    : sampleKpSemanticMotionChoreography({
        choreography: input.plan.semanticMotion,
        progress: input.progress,
        direction: "forward"
      }).semanticProgress;
  const fission = dependencies.fissionFusion.sample({
    plan: input.plan.fissionPlan,
    progress
  });
  const phases = {
    "focus-factor": intervalProgress(progress, 0, 0.12),
    "reflow-addends": intervalProgress(progress, 0.08, 0.78),
    "branch-factor-copies": fission.phases["transfer-ownership"],
    "transit-factor-copies": fission.phases["transit-material"],
    "remove-grouping": intervalProgress(progress, 0.5, 0.72),
    "settle-products": intervalProgress(progress, 0.72, 0.94),
    "release-factor-focus": intervalProgress(progress, 0.72, 0.9)
  };
  const motion = sampleKpLessonCanonicalDistributionMotion(progress);
  const {
    leaderProgress: factorLeaderProgress,
    followerProgress: factorFollowerProgress,
    followerOpacity: factorFollowerOpacity,
    productSettlementProgress,
    addendReflowProgress
  } = motion;
  return {
    kind: "distribution-choreography-frame",
    planId: input.plan.id,
    ...(input.plan.semanticMotion === undefined
      ? {}
      : { semanticMotionChoreographyId: input.plan.semanticMotion.id }),
    progress,
    phases,
    focusStrength:
      phases["focus-factor"] * (1 - phases["release-factor-focus"]),
    productSettlementProgress,
    addendReflowProgress,
    groupingOpacity: 1 - phases["remove-grouping"],
    fission,
    sourceFactor: {
      // The lesson keeps one readable factor in continuous motion and lets the
      // second copy peel from it. Native target ownership still changes only at
      // the endpoint, so the card cannot flash two coincident glyphs mid-flight.
      opacity: progress === 1 ? 0 : 1,
      scale: 1,
      pathProgress: factorLeaderProgress
    },
    factorCopies: input.plan.factorCopyIds.map((entityId, semanticIndex) => {
      const material = fission.targets.find((target) => target.entityId === entityId);
      if (material === undefined) {
        throw new Error(`Missing distribution target ${entityId}.`);
      }
      return {
        entityId,
        semanticIndex,
        opacity:
          semanticIndex === 0
            ? progress === 1 ? 1 : 0
            : factorFollowerOpacity,
        scale: 1,
        pathProgress:
          semanticIndex === 0
            ? factorLeaderProgress
            : factorFollowerProgress
      };
    })
  };
}

/**
 * A persistent operator belongs to the expression's math axis, not to the
 * context-dependent center of either KaTeX wrapper that happens to contain it.
 */
export function constrainKpDistributionConnectorMotion(input: {
  readonly constraint: KpDistributionConnectorMotionConstraint;
  readonly measuredDelta: KpDistributionConnectorMotionDelta;
  readonly axisTolerancePx?: number | undefined;
}): KpDistributionConnectorMotionDelta {
  const { x, y } = input.measuredDelta;
  if (![x, y].every(Number.isFinite)) {
    throw new Error("Distribution connector motion requires finite geometry.");
  }
  const axisTolerancePx = input.axisTolerancePx ?? 0.75;
  if (!Number.isFinite(axisTolerancePx) || axisTolerancePx < 0) {
    throw new Error("Distribution connector axis tolerance must be non-negative.");
  }
  if (
    input.constraint === "follow-products-on-math-axis" &&
    Math.abs(y) > axisTolerancePx
  ) {
    throw new Error(
      `Distribution connector endpoints disagree on their math axis by ` +
      `${Math.abs(y).toFixed(3)}px.`
    );
  }
  return Object.freeze({ x, y: 0 });
}

function intervalProgress(progress: number, start: number, end: number): number {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  const local = (progress - start) / (end - start);
  return local * local * (3 - 2 * local);
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}
