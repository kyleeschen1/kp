import type {
  KpFissionFusionFrame,
  KpFissionFusionPlan
} from "./fission-fusion.ts";
import { kpFissionFusionRuntime } from "./fission-fusion-runtime.ts";
import { createKpSemanticLineageGraph } from "../semantic/semantic-lineage-graph.ts";
import {
  compileKpCompoundTargetDeclarations,
  type KpPresentationGroupContract
} from "./presentation-group-continuity.ts";

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

export const kpLessonCanonicalDistributionMotionProfile = {
  leader: {
    start: 0,
    end: 1,
    arcPx: -8
  },
  follower: {
    start: 0.42,
    end: 1,
    revealEnd: 0.12,
    arcPx: -12
  },
  settlement: {
    cohesionLock: 0.72,
    nativeReady: 0.94
  }
} as const;

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
  }[];
  readonly groupingArtifactIds: readonly string[];
  readonly phaseIds: readonly KpDistributionChoreographyPhaseId[];
  readonly sourceMinimumScale: number;
  readonly productGroups: readonly KpPresentationGroupContract[];
  readonly fissionPlan: KpFissionFusionPlan;
}

export interface KpDistributionChoreographyFrame {
  readonly kind: "distribution-choreography-frame";
  readonly planId: string;
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

export function compileKpDistributionChoreography(input: {
  readonly id: string;
  readonly sourceFactorId: string;
  readonly factorCopyIds: readonly string[];
  readonly addendPairs: KpDistributionChoreographyPlan["addendPairs"];
  readonly connectorPairs: KpDistributionChoreographyPlan["connectorPairs"];
  readonly groupingArtifactIds: readonly string[];
  readonly sourceMinimumScale?: number | undefined;
}): KpDistributionChoreographyPlan {
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
  if (input.groupingArtifactIds.length === 0) {
    throw new Error("Distribution choreography requires explicit grouping artifacts.");
  }
  const sourceMinimumScale = input.sourceMinimumScale ?? 0.82;
  if (!(sourceMinimumScale > 0 && sourceMinimumScale <= 1)) {
    throw new Error("Distribution source minimum scale must be greater than zero and at most one.");
  }
  const fissionPlan = kpFissionFusionRuntime().compile({
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
  return {
    kind: "distribution-choreography-plan",
    id: input.id,
    sourceFactorId: input.sourceFactorId,
    factorCopyIds: [...input.factorCopyIds],
    addendPairs: input.addendPairs.map((pair) => ({ ...pair })),
    connectorPairs: input.connectorPairs.map((pair) => ({ ...pair })),
    groupingArtifactIds: [...input.groupingArtifactIds],
    phaseIds: [...kpDistributionChoreographyPhaseIds],
    sourceMinimumScale,
    productGroups,
    fissionPlan
  };
}

export function sampleKpDistributionChoreography(input: {
  readonly plan: KpDistributionChoreographyPlan;
  readonly progress: number;
}): KpDistributionChoreographyFrame {
  const progress = clamp01(input.progress);
  const fission = kpFissionFusionRuntime().sample({
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
  // A small preview shift anchors attention; the topology-changing reflow waits
  // until grouping removal makes enough horizontal room for the products.
  const rawAddendReflowProgress =
    0.18 * intervalProgress(progress, 0.08, 0.28) +
    0.82 * intervalProgress(progress, 0.52, 0.78);
  const rawFactorLeaderProgress = intervalProgress(
    progress,
    kpLessonCanonicalDistributionMotionProfile.leader.start,
    kpLessonCanonicalDistributionMotionProfile.leader.end
  );
  const productSettlementProgress = intervalProgress(
    progress,
    kpLessonCanonicalDistributionMotionProfile.settlement.cohesionLock,
    kpLessonCanonicalDistributionMotionProfile.settlement.nativeReady
  );
  const addendReflowProgress = settleAfterCohesionLock({
    progress,
    current: rawAddendReflowProgress,
    valueAtLock:
      0.18 * intervalProgress(
        kpLessonCanonicalDistributionMotionProfile.settlement.cohesionLock,
        0.08,
        0.28
      ) +
      0.82 * intervalProgress(
        kpLessonCanonicalDistributionMotionProfile.settlement.cohesionLock,
        0.52,
        0.78
      ),
    settlementProgress: productSettlementProgress
  });
  const factorLeaderProgress = settleAfterCohesionLock({
    progress,
    current: rawFactorLeaderProgress,
    valueAtLock: intervalProgress(
      kpLessonCanonicalDistributionMotionProfile.settlement.cohesionLock,
      kpLessonCanonicalDistributionMotionProfile.leader.start,
      kpLessonCanonicalDistributionMotionProfile.leader.end
    ),
    settlementProgress: productSettlementProgress
  });
  const factorFollowerProgress = intervalProgress(
    factorLeaderProgress,
    kpLessonCanonicalDistributionMotionProfile.follower.start,
    kpLessonCanonicalDistributionMotionProfile.follower.end
  );
  const factorFollowerOpacity = intervalProgress(
    factorFollowerProgress,
    0,
    kpLessonCanonicalDistributionMotionProfile.follower.revealEnd
  );
  return {
    kind: "distribution-choreography-frame",
    planId: input.plan.id,
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

function settleAfterCohesionLock(input: {
  readonly progress: number;
  readonly current: number;
  readonly valueAtLock: number;
  readonly settlementProgress: number;
}): number {
  if (
    input.progress <=
    kpLessonCanonicalDistributionMotionProfile.settlement.cohesionLock
  ) {
    return input.current;
  }
  return input.valueAtLock +
    (1 - input.valueAtLock) * input.settlementProgress;
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
