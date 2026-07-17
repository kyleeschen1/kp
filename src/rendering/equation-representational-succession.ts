import type {
  AnnotatedMotionToken,
  KpMeasuredEquationTransitionRelationGeometry
} from "./equation-motion-dom.ts";
import {
  planKpMotionField
} from "../animation/motion-field.ts";
import {
  planKpOrganicPath,
  sampleKpOrganicPath,
  type KpOrganicPathPoint,
  type KpOrganicPathVariant
} from "../animation/organic-path-planner.ts";
import {
  createKpMaterialJunctionPlan,
  sampleKpMaterialJunction,
  type KpMaterialJunctionPlan,
  type KpMaterialJunctionPathFamily
} from "../animation/material-junction.ts";

const radicalMaterialJunctionPlanCache = new WeakMap<
  KpMeasuredEquationTransitionRelationGeometry,
  KpMaterialJunctionPlan
>();

export interface KpEquationRepresentationalSuccessionFrame {
  readonly kind: "opposite-corner-seed";
  readonly progress: number;
  readonly continuantReflowProgress: number;
  readonly sourceGatherProgress: number;
  readonly sourceVisibility: number;
  readonly settleProgress: number;
  readonly bundlePoint: KpOrganicPathPoint;
  readonly materialJunctionPlanId?: string | undefined;
  readonly allRequiredSourcesReady?: boolean | undefined;
  readonly targetRecognizable?: boolean | undefined;
}

export interface KpEquationRepresentationalSuccessionToken {
  readonly motionId: string;
  readonly side: "source" | "target";
  readonly opacity: number;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly pathVariant: KpOrganicPathVariant;
}

export function sampleKpEquationRepresentationalSuccession(input: {
  readonly relation: KpMeasuredEquationTransitionRelationGeometry;
  readonly fragmentRelations?:
    readonly KpMeasuredEquationTransitionRelationGeometry[] | undefined;
  readonly sourceTokens: readonly AnnotatedMotionToken[];
  readonly targetTokens: readonly AnnotatedMotionToken[];
  readonly progress: number;
}): {
  readonly frame: KpEquationRepresentationalSuccessionFrame;
  readonly tokens: readonly KpEquationRepresentationalSuccessionToken[];
} {
  if (input.relation.source === undefined || input.relation.target === undefined) {
    throw new Error("Representational succession requires source and target geometry.");
  }
  if ((input.fragmentRelations?.length ?? 0) > 0) {
    return sampleFragmentCornerTransfer({
      relation: input.relation,
      fragmentRelations: input.fragmentRelations!,
      sourceTokens: input.sourceTokens,
      targetTokens: input.targetTokens,
      progress: input.progress
    });
  }
  const p = clamp01(input.progress);
  const sourceCenter = rectCenter(input.relation.source.bounds);
  const targetCenter = rectCenter(input.relation.target.bounds);
  const bundlePoint = oppositeCorner(
    input.relation.target.bounds,
    sourceCenter
  );
  const sourceGatherProgress = intervalProgress(p, 0.32, 0.58);
  const sourceVisibility = 1 - intervalProgress(p, 0.58, 0.78);
  const motionField = planKpMotionField({
    id: `${input.relation.recordId}.representation-field`,
    groupEntityIds: input.relation.source.selectorIds,
    purpose: "representational-succession",
    sourceRegion: "upper-right",
    targetRegion: "center",
    readingDirection: "left-to-right",
    cohesion: {
      anchorEntityIds: [input.relation.source.selectorIds[0]!],
      maximumSeparation: 0.32,
      maximumStaggerSpan: 0.18,
      preserveTokenOrder: true,
      maximumCrossings: 0,
      minimumVisibleMaterial: 0.18,
      exactTargetRegrouping: true
    }
  });
  const sourceFrames = input.sourceTokens.map((token) => {
    const start = tokenCenter(token);
    const path = planKpOrganicPath({
      id: `${input.relation.recordId}.${token.motionId}`,
      motionField,
      sourceAnchor: start,
      targetAnchor: targetCenter,
      targetBounds: input.relation.target!.bounds,
      // One relation-level corner keeps numerator, rule, and denominator
      // material from selecting contradictory vertical reconciliation points.
      reconciliationAnchor: bundlePoint,
      readingContext: {
        direction: "left-to-right",
        baselineY: targetCenter.y
      },
      canonicalRequirement: {
        motifId: "radical.rewrite-power-as-root",
        requiredPathFamily: "opposite-corner",
        requireOppositeCornerReconciliation: true
      }
    });
    const reconciliationProgress =
      path.selected.geometry.kind === "opposite-corner-reconciliation"
        ? path.selected.geometry.reconciliationProgress
        : 1;
    const point = sampleKpOrganicPath(
      path.selected,
      sourceGatherProgress * reconciliationProgress
    );
    return {
      motionId: token.motionId,
      side: "source" as const,
      opacity: p === 1 ? 0 : sourceVisibility,
      x: point.x - start.x,
      y: point.y - start.y,
      scale: 1 - sourceGatherProgress * 0.22,
      pathVariant: path.selected.variant
    };
  });
  const maximumTargetDistance = Math.max(
    1,
    ...input.targetTokens.map((token) =>
      distance(bundlePoint, tokenCenter(token))
    )
  );
  const targetFrames = input.targetTokens.map((token) => {
    const destination = tokenCenter(token);
    const farSideRank = input.targetTokens.length === 1
      ? 0
      : distance(bundlePoint, destination) / maximumTargetDistance;
    const unfold = intervalProgress(
      p,
      0.42 + farSideRank * 0.12,
      0.82
    );
    const control = {
      x: bundlePoint.x + (destination.x - bundlePoint.x) * 0.42,
      y: Math.min(bundlePoint.y, destination.y) - 8 * farSideRank
    };
    const point = quadratic(bundlePoint, control, destination, unfold);
    return {
      motionId: token.motionId,
      side: "target" as const,
      opacity: p === 1 ? 1 : unfold,
      x: point.x - destination.x,
      y: point.y - destination.y,
      scale: 0.72 + unfold * 0.28,
      pathVariant: "diagonal-arc-above" as const
    };
  });
  return {
    frame: {
      kind: "opposite-corner-seed",
      progress: p,
      continuantReflowProgress: intervalProgress(p, 0.12, 0.32),
      sourceGatherProgress,
      sourceVisibility,
      settleProgress: intervalProgress(p, 0.78, 0.92),
      bundlePoint
    },
    tokens: [...sourceFrames, ...targetFrames]
  };
}

function sampleFragmentCornerTransfer(input: {
  readonly relation: KpMeasuredEquationTransitionRelationGeometry;
  readonly fragmentRelations:
    readonly KpMeasuredEquationTransitionRelationGeometry[];
  readonly sourceTokens: readonly AnnotatedMotionToken[];
  readonly targetTokens: readonly AnnotatedMotionToken[];
  readonly progress: number;
}): {
  readonly frame: KpEquationRepresentationalSuccessionFrame;
  readonly tokens: readonly KpEquationRepresentationalSuccessionToken[];
} {
  if (input.relation.source === undefined || input.relation.target === undefined) {
    throw new Error("Fragment corner transfer requires aggregate geometry.");
  }
  const p = clamp01(input.progress);
  const cacheKey = input.fragmentRelations[0];
  if (cacheKey === undefined) {
    throw new Error("Fragment corner transfer requires semantic fragment lineage.");
  }
  let plan = radicalMaterialJunctionPlanCache.get(cacheKey);
  if (plan === undefined) {
    plan = createRadicalMaterialJunctionPlan(input);
    // A measured relation object changes whenever geometry is explicitly
    // replanned, so it is a safe identity key without reading layout per frame.
    radicalMaterialJunctionPlanCache.set(cacheKey, plan);
  }
  const junction = sampleKpMaterialJunction({ plan, progress: p });
  const sourceFrames = junction.sources.map((source) => ({
    motionId: source.annotationId,
    side: "source" as const,
    opacity: p === 1 ? 0 : source.pose.opacity,
    x: source.pose.x,
    y: source.pose.y,
    scale: source.pose.scale,
    pathVariant: materialPathVariant(source.pathFamily, "source")
  }));
  const targetFrames = junction.targets.map((target) => ({
    motionId: target.annotationId,
    side: "target" as const,
    opacity: p === 1 ? 1 : target.materialPose.opacity,
    x: target.materialPose.x,
    y: target.materialPose.y,
    scale: target.materialPose.scale,
    pathVariant: materialPathVariant(target.pathFamily, "target")
  }));
  return {
    frame: {
      kind: "opposite-corner-seed",
      progress: p,
      continuantReflowProgress: intervalProgress(p, 0.12, 0.32),
      sourceGatherProgress: Math.min(
        ...junction.sources.map((source) => source.arrivalProgress)
      ),
      sourceVisibility: Math.min(
        ...junction.sources.map((source) => source.pose.opacity)
      ),
      settleProgress: intervalProgress(p, 0.82, 0.98),
      bundlePoint: plan.junction,
      materialJunctionPlanId: plan.id,
      allRequiredSourcesReady: junction.allRequiredSourcesReady,
      targetRecognizable: junction.targetRecognizable
    },
    tokens: [...sourceFrames, ...targetFrames]
  };
}

function createRadicalMaterialJunctionPlan(input: {
  readonly relation: KpMeasuredEquationTransitionRelationGeometry;
  readonly fragmentRelations:
    readonly KpMeasuredEquationTransitionRelationGeometry[];
  readonly sourceTokens: readonly AnnotatedMotionToken[];
  readonly targetTokens: readonly AnnotatedMotionToken[];
}): KpMaterialJunctionPlan {
  if (input.relation.target === undefined) {
    throw new Error("Radical material junction requires target geometry.");
  }
  const targetCenter = rectCenter(input.relation.target.bounds);
  const orderedSources = [...input.sourceTokens].sort(
    (left, right) =>
      distance(tokenCenter(right), targetCenter) -
      distance(tokenCenter(left), targetCenter)
  );
  const rankByMotionId = new Map(
    orderedSources.map((token, index) => [token.motionId, index])
  );
  const sourceIds = new Set(input.sourceTokens.map((token) => token.motionId));
  const targetIds = new Set(input.targetTokens.map((token) => token.motionId));
  const targetPathFamilies = Object.fromEntries(
    input.targetTokens.map((token, index) => [
      token.motionId,
      index % 2 === 0 ? "arc-above" : "arc-below"
    ] satisfies [string, KpMaterialJunctionPathFamily])
  );
  return createKpMaterialJunctionPlan({
    id: `material-junction.${input.relation.recordId}`,
    ownershipMode: "fission-fusion",
    sourceAnnotations: input.sourceTokens.map((token) => ({
      id: token.motionId,
      semanticRole: "source-notation-fragment",
      selectorIds: [token.motionId],
      propagationRank: rankByMotionId.get(token.motionId) ?? 0
    })),
    targetAnnotations: input.targetTokens.map((token, index) => ({
      id: token.motionId,
      semanticRole: "target-notation-fragment",
      selectorIds: [token.motionId],
      propagationRank: index
    })),
    lineages: input.fragmentRelations.flatMap((relation) => {
      const sources = (relation.source?.motionIds ?? []).filter((id) =>
        sourceIds.has(id)
      );
      const targets = (relation.target?.motionIds ?? []).filter((id) =>
        targetIds.has(id)
      );
      if (sources.length === 0) return [];
      return [{
        id: relation.recordId,
        kind: targets.length === 0 ? "absorption" as const : "succession" as const,
        sourceAnnotationIds: sources,
        targetAnnotationIds: targets
      }];
    }),
    measurements: Object.fromEntries(
      [...input.sourceTokens, ...input.targetTokens].map((token) => [
        token.motionId,
        token.localRect
      ])
    ),
    anchorPolicy: "target-opposite-corner",
    pathFamily: "opposite-corner",
    targetPathFamilies,
    // The exemplar keeps every fragment legible while it changes notation;
    // shrinking remains token-local and never impersonates a whole-expression zoom.
    junctionScale: 0.82,
    sourceArrivalStart: 0.3,
    sourceArrivalEnd: 0.58,
    sourceRankStaggerSpan: 0.05,
    targetRankStaggerSpan: 0.08
  });
}

function materialPathVariant(
  family: KpMaterialJunctionPathFamily,
  side: "source" | "target"
): KpOrganicPathVariant {
  if (side === "source" || family === "opposite-corner") {
    return "opposite-corner";
  }
  return family === "arc-above"
    ? "diagonal-arc-above"
    : "diagonal-arc-below";
}

function oppositeCorner(
  bounds: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  },
  source: KpOrganicPathPoint
): KpOrganicPathPoint {
  const center = rectCenter(bounds);
  return {
    x: source.x >= center.x ? bounds.left : bounds.left + bounds.width,
    y: source.y <= center.y ? bounds.top + bounds.height : bounds.top
  };
}

function tokenCenter(token: AnnotatedMotionToken): KpOrganicPathPoint {
  return rectCenter(token.localRect);
}

function rectCenter(rect: {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}): KpOrganicPathPoint {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function quadratic(
  start: KpOrganicPathPoint,
  control: KpOrganicPathPoint,
  end: KpOrganicPathPoint,
  progress: number
): KpOrganicPathPoint {
  const remaining = 1 - progress;
  return {
    x:
      remaining * remaining * start.x +
      2 * remaining * progress * control.x +
      progress * progress * end.x,
    y:
      remaining * remaining * start.y +
      2 * remaining * progress * control.y +
      progress * progress * end.y
  };
}

function intervalProgress(progress: number, start: number, end: number): number {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  const local = (progress - start) / (end - start);
  return local * local * (3 - 2 * local);
}

function distance(left: KpOrganicPathPoint, right: KpOrganicPathPoint): number {
  return Math.hypot(right.x - left.x, right.y - left.y);
}

function clamp01(value: number): number {
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
}
