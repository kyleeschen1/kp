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

export interface KpEquationRepresentationalSuccessionFrame {
  readonly kind: "opposite-corner-seed";
  readonly progress: number;
  readonly continuantReflowProgress: number;
  readonly sourceGatherProgress: number;
  readonly sourceVisibility: number;
  readonly settleProgress: number;
  readonly bundlePoint: KpOrganicPathPoint;
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
  const targetCenter = rectCenter(input.relation.target.bounds);
  const sourceByMotionId = new Map(
    input.sourceTokens.map((token) => [token.motionId, token])
  );
  const orderedSources = [...input.sourceTokens].sort(
    (left, right) =>
      distance(tokenCenter(right), targetCenter) -
      distance(tokenCenter(left), targetCenter)
  );
  const rankByMotionId = new Map(
    orderedSources.map((token, index) => [token.motionId, index])
  );
  const maximumRank = Math.max(1, orderedSources.length - 1);
  const corners = new Map<string, KpOrganicPathPoint>();
  const cornerFor = (
    relation: KpMeasuredEquationTransitionRelationGeometry,
    source: AnnotatedMotionToken | undefined
  ): KpOrganicPathPoint => {
    const key = relation.recordId;
    const cached = corners.get(key);
    if (cached !== undefined) return cached;
    const base = oppositeCorner(
      relation.target?.bounds ?? input.relation.target!.bounds,
      source === undefined
        ? rectCenter(input.relation.source!.bounds)
        : tokenCenter(source)
    );
    const rank = source === undefined
      ? maximumRank
      : rankByMotionId.get(source.motionId) ?? 0;
    const corner = {
      x: base.x + (rank - maximumRank / 2) * 3,
      y: base.y + (rank % 2 === 0 ? -1 : 1) * (2 + rank)
    };
    corners.set(key, corner);
    return corner;
  };

  const sourceFrames = input.sourceTokens.map((token) => {
    const relation = input.fragmentRelations.find((candidate) =>
      candidate.source?.motionIds.includes(token.motionId)
    );
    const rank = rankByMotionId.get(token.motionId) ?? 0;
    const stagger = rank * 0.025;
    const start = tokenCenter(token);
    const corner = relation === undefined
      ? oppositeCorner(input.relation.target!.bounds, start)
      : cornerFor(relation, token);
    const travel = intervalProgress(p, 0.3 + stagger, 0.58 + stagger);
    const control = {
      x: start.x + (corner.x - start.x) * 0.52,
      y: Math.min(start.y, corner.y) - 8 - rank * 2
    };
    const point = quadratic(start, control, corner, travel);
    const handoff = intervalProgress(p, 0.58 + stagger, 0.72 + stagger);
    return {
      motionId: token.motionId,
      side: "source" as const,
      opacity: p === 1 ? 0 : 1 - handoff,
      x: point.x - start.x,
      y: point.y - start.y,
      scale: 1 - travel * 0.18,
      pathVariant: "opposite-corner" as const
    };
  });
  const targetFrames = input.targetTokens.map((token, targetIndex) => {
    const relation = input.fragmentRelations.find((candidate) =>
      candidate.target?.motionIds.includes(token.motionId)
    );
    const sourceMotionId = relation?.source?.motionIds[0];
    const source = sourceMotionId === undefined
      ? undefined
      : sourceByMotionId.get(sourceMotionId);
    const rank = source === undefined
      ? targetIndex
      : rankByMotionId.get(source.motionId) ?? targetIndex;
    const stagger = rank * 0.025;
    const destination = tokenCenter(token);
    const corner = relation === undefined
      ? oppositeCorner(input.relation.target!.bounds, rectCenter(input.relation.source!.bounds))
      : cornerFor(relation, source);
    // Fragment paths finish before native settlement begins so the exact
    // KaTeX radical crossfades only after every structural anchor is still.
    const unfold = intervalProgress(p, 0.56 + stagger, 0.82 + stagger);
    const handoff = intervalProgress(p, 0.58 + stagger, 0.72 + stagger);
    const pathVariant = targetIndex % 2 === 0
      ? "diagonal-arc-above" as const
      : "diagonal-arc-below" as const;
    const control = {
      x: corner.x + (destination.x - corner.x) * 0.46,
      y: pathVariant === "diagonal-arc-above"
        ? Math.min(corner.y, destination.y) - 10 - rank
        : Math.max(corner.y, destination.y) + 8 + rank
    };
    const point = quadratic(corner, control, destination, unfold);
    return {
      motionId: token.motionId,
      side: "target" as const,
      opacity: p === 1 ? 1 : handoff,
      x: point.x - destination.x,
      y: point.y - destination.y,
      scale: 0.82 + unfold * 0.18,
      pathVariant
    };
  });
  const cornerPoints = [...corners.values()];
  const bundlePoint = cornerPoints.length === 0
    ? oppositeCorner(
        input.relation.target.bounds,
        rectCenter(input.relation.source.bounds)
      )
    : {
        x: cornerPoints.reduce((sum, point) => sum + point.x, 0) /
          cornerPoints.length,
        y: cornerPoints.reduce((sum, point) => sum + point.y, 0) /
          cornerPoints.length
      };
  return {
    frame: {
      kind: "opposite-corner-seed",
      progress: p,
      continuantReflowProgress: intervalProgress(p, 0.12, 0.32),
      sourceGatherProgress: intervalProgress(p, 0.3, 0.63),
      sourceVisibility: 1 - intervalProgress(p, 0.58, 0.78),
      settleProgress: intervalProgress(p, 0.78, 0.94),
      bundlePoint
    },
    tokens: [...sourceFrames, ...targetFrames]
  };
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
