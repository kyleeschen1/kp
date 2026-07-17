import type {
  AnnotatedMotionToken,
  KpMeasuredEquationTransitionGeometry,
  KpMeasuredEquationTransitionRelationGeometry
} from "./equation-motion-dom.ts";
import {
  sampleKpEquationEnclosureChoreography,
  type KpEquationEnclosureChoreographyFrame
} from "./equation-enclosure-choreography.ts";
import {
  compileKpCopyFanOutChoreography,
  sampleKpCopyFanOutChoreography,
  type KpCopyFanOutChoreographyFrame
} from "../animation/copy-fan-out-choreography.ts";
import { createKpSemanticLineageGraph } from "../semantic/semantic-lineage-graph.ts";
import {
  planKpEquationMotionPathBetweenPoints,
  sampleKpEquationMotionPath,
  type KpEquationMotionPathCandidate,
  type KpEquationMotionPathVariantId
} from "./equation-motion-path-planner.ts";
import type { KpOrganicPathVariant } from "../animation/organic-path-planner.ts";
import {
  sampleKpEquationRepresentationalSuccession,
  type KpEquationRepresentationalSuccessionFrame
} from "./equation-representational-succession.ts";
import {
  sampleKpEquationLinearRearrangementFrame,
  sampleKpEquationLinearRearrangementRelation,
  type KpEquationLinearRearrangementFrame
} from "./equation-linear-rearrangement.ts";
import {
  sampleKpDotProductTraversalProgress,
  sampleKpEquationDotProductRelation,
  type KpDotProductTraversalProgressFrame
} from "./equation-dot-product-traversal.ts";
import {
  sampleKpDerivativePowerChoreography,
  type KpDerivativePowerChoreographyFrame,
  type KpDerivativePowerChoreographyPlan
} from "../animation/derivative-power-choreography.ts";
import {
  compileKpDistributionChoreography,
  sampleKpDistributionChoreography,
  type KpDistributionChoreographyFrame,
  type KpDistributionChoreographyPlan
} from "../animation/distribution-choreography.ts";

export interface KpEquationTokenMotionPose {
  readonly opacity: number;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

export interface KpEquationTokenMotionFrameToken {
  readonly motionId: string;
  readonly side: "source" | "target";
  readonly pose: KpEquationTokenMotionPose;
  readonly lineagePathId?: string | undefined;
  readonly lineageEdgeId?: string | undefined;
  readonly lineageBranchIndex?: number | undefined;
  readonly motionPathVariant?:
    KpEquationMotionPathVariantId | KpOrganicPathVariant | undefined;
}

export interface KpEquationTokenMotionFrame {
  readonly transitionId: string;
  readonly progress: number;
  readonly tokens: readonly KpEquationTokenMotionFrameToken[];
  readonly enclosureChoreography?: KpEquationEnclosureChoreographyFrame | undefined;
  readonly lineageChoreography?: KpCopyFanOutChoreographyFrame | undefined;
  readonly distributionChoreography?:
    KpDistributionChoreographyFrame | undefined;
  readonly representationalSuccession?:
    KpEquationRepresentationalSuccessionFrame | undefined;
  readonly linearRearrangement?:
    KpEquationLinearRearrangementFrame | undefined;
  readonly dotProductTraversal?:
    KpDotProductTraversalProgressFrame | undefined;
  readonly derivativePower?: KpDerivativePowerChoreographyFrame | undefined;
}

interface EnclosureChoreographyContext {
  readonly frame: KpEquationEnclosureChoreographyFrame;
  readonly persistentBounds: {
    readonly left: number;
    readonly width: number;
  };
  readonly enclosureMotionIds: ReadonlySet<string>;
}

interface LineageChoreographyContext {
  readonly kind: "copy-fan-out" | "merge-fan-in" | "substitute";
  readonly relationRecordId: string;
  readonly frame: KpCopyFanOutChoreographyFrame;
  readonly motionPathsByMotionId: KpMeasuredEquationTransitionGeometry["precomputedMotionPathsByMotionId"];
}

interface DistributionChoreographyContext {
  readonly plan: KpDistributionChoreographyPlan;
  readonly frame: KpDistributionChoreographyFrame;
  readonly factorRelationRecordId: string;
  readonly reflowRelationRecordIds: ReadonlySet<string>;
  readonly groupingRelationRecordIds: ReadonlySet<string>;
  readonly sourceFactorAnchorDelta: { readonly x: number; readonly y: number };
  readonly sourceFactorAnchorBounds: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
  readonly groupingReflowByMotionId: ReadonlyMap<
    string,
    { readonly x: number; readonly y: number }
  >;
  readonly motionPathsByMotionId:
    KpMeasuredEquationTransitionGeometry["precomputedMotionPathsByMotionId"];
}

interface RepresentationalSuccessionContext {
  readonly relationRecordIds: ReadonlySet<string>;
  readonly frame: KpEquationRepresentationalSuccessionFrame;
  readonly tokens: readonly KpEquationTokenMotionFrameToken[];
}

interface DerivativePowerChoreographyContext {
  readonly plan: KpDerivativePowerChoreographyPlan;
  readonly frame: KpDerivativePowerChoreographyFrame;
  readonly motionPathsByMotionId:
    KpMeasuredEquationTransitionGeometry["precomputedMotionPathsByMotionId"];
}

export function sampleKpEquationTokenMotion(
  geometry: KpMeasuredEquationTransitionGeometry,
  progress: number
): KpEquationTokenMotionFrame {
  const p = clamp01(progress);
  const tokens = new Map<string, KpEquationTokenMotionFrameToken>();
  const enclosureChoreography = createEnclosureChoreographyContext(geometry, p);
  const lineageChoreography = createLineageChoreographyContext(geometry, p);
  const distributionChoreography = createDistributionChoreographyContext(
    geometry,
    p
  );
  const representationalSuccession =
    createRepresentationalSuccessionContext(geometry, p);
  const linearRearrangement = geometry.linearRearrangementKind === undefined
    ? undefined
    : sampleKpEquationLinearRearrangementFrame(
        geometry.linearRearrangementKind,
        p
      );
  const dotProductTraversal = geometry.dotProductTraversalPlan === undefined
    ? undefined
    : sampleKpDotProductTraversalProgress({
        plan: geometry.dotProductTraversalPlan,
        progress: p
      });
  const derivativePower = createDerivativePowerChoreographyContext(
    geometry,
    p
  );
  for (const relation of geometry.relations) {
    for (const token of sampleRelation(
      geometry,
      relation,
      p,
      enclosureChoreography,
      lineageChoreography,
      distributionChoreography,
      representationalSuccession,
      linearRearrangement,
      dotProductTraversal,
      derivativePower
    )) {
      tokens.set(`${token.side}:${token.motionId}`, token);
    }
  }
  return {
    transitionId: geometry.transitionId,
    progress: p,
    tokens: [...tokens.values()],
    ...(enclosureChoreography === undefined
      ? {}
      : { enclosureChoreography: enclosureChoreography.frame }),
    ...(lineageChoreography === undefined
      ? {}
      : { lineageChoreography: lineageChoreography.frame }),
    ...(distributionChoreography === undefined
      ? {}
      : { distributionChoreography: distributionChoreography.frame }),
    ...(representationalSuccession === undefined
      ? {}
      : { representationalSuccession: representationalSuccession.frame }),
    ...(linearRearrangement === undefined
      ? {}
      : { linearRearrangement }),
    ...(dotProductTraversal === undefined
      ? {}
      : { dotProductTraversal }),
    ...(derivativePower === undefined
      ? {}
      : { derivativePower: derivativePower.frame })
  };
}

export function applyKpEquationTokenMotionFrame(
  geometry: KpMeasuredEquationTransitionGeometry,
  frame: KpEquationTokenMotionFrame
): void {
  const elements = new Map([
    ...geometry.sourceTokens.map((token) => [`source:${token.motionId}`, token.element] as const),
    ...geometry.targetTokens.map((token) => [`target:${token.motionId}`, token.element] as const)
  ]);
  for (const token of frame.tokens) {
    const element = elements.get(`${token.side}:${token.motionId}`);
    if (element === undefined) continue;
    element.style.opacity = String(token.pose.opacity);
    element.style.transform =
      `translate(${token.pose.x}px, ${token.pose.y}px) translateZ(var(--kp-focus-z, 0px)) scale(${token.pose.scale}) scale(var(--kp-focus-scale, 1))`;
    element.style.transformOrigin = "center center";
    if (token.lineagePathId === undefined) {
      delete element.dataset["kpEquationLineagePathId"];
      delete element.dataset["kpEquationLineageEdgeId"];
      delete element.dataset["kpEquationLineageBranchIndex"];
    } else {
      element.dataset["kpEquationLineagePathId"] = token.lineagePathId;
      element.dataset["kpEquationLineageEdgeId"] = token.lineageEdgeId ?? "";
      element.dataset["kpEquationLineageBranchIndex"] = String(
        token.lineageBranchIndex ?? 0
      );
    }
    if (token.motionPathVariant === undefined) {
      delete element.dataset["kpEquationMotionPathVariant"];
    } else {
      element.dataset["kpEquationMotionPathVariant"] = token.motionPathVariant ?? "direct";
    }
  }
}

function sampleRelation(
  geometry: KpMeasuredEquationTransitionGeometry,
  relation: KpMeasuredEquationTransitionRelationGeometry,
  progress: number,
  enclosureChoreography: EnclosureChoreographyContext | undefined,
  lineageChoreography: LineageChoreographyContext | undefined,
  distributionChoreography: DistributionChoreographyContext | undefined,
  representationalSuccession:
    RepresentationalSuccessionContext | undefined,
  linearRearrangement: KpEquationLinearRearrangementFrame | undefined,
  dotProductTraversal: KpDotProductTraversalProgressFrame | undefined,
  derivativePower: DerivativePowerChoreographyContext | undefined
): readonly KpEquationTokenMotionFrameToken[] {
  const sourceTokens = relationTokens(geometry.sourceTokens, relation.source?.motionIds ?? []);
  const targetTokens = relationTokens(geometry.targetTokens, relation.target?.motionIds ?? []);
  const eased = smoothstep(progress);
  const derivativeTokens = derivativePower === undefined
    ? undefined
    : sampleDerivativePowerRelation(
        relation,
        sourceTokens,
        targetTokens,
        derivativePower
      );
  if (derivativeTokens !== undefined) return derivativeTokens;
  const distributionTokens = distributionChoreography === undefined
    ? undefined
    : sampleDistributionRelation(
        relation,
        sourceTokens,
        targetTokens,
        progress,
        distributionChoreography
      );
  if (distributionTokens !== undefined) return distributionTokens;
  if (representationalSuccession?.relationRecordIds.has(relation.recordId)) {
    const sourceIds = new Set(relation.source?.motionIds ?? []);
    const targetIds = new Set(relation.target?.motionIds ?? []);
    return representationalSuccession.tokens.filter((token) =>
      token.side === "source"
        ? sourceIds.has(token.motionId)
        : targetIds.has(token.motionId)
    );
  }
  if (relation.recordId === lineageChoreography?.relationRecordId) {
    return sampleLineageRelation(
      relation,
      sourceTokens,
      targetTokens,
      lineageChoreography
    );
  }
  if (linearRearrangement !== undefined) {
    const sampled = sampleKpEquationLinearRearrangementRelation({
      relation,
      sourceTokens,
      targetTokens,
      progress,
      frame: linearRearrangement
    });
    if (sampled !== undefined) return sampled;
  }
  if (
    dotProductTraversal !== undefined &&
    geometry.dotProductTraversalPlan !== undefined &&
    relation.lifecycle === "merge"
  ) {
    return sampleKpEquationDotProductRelation({
      plan: geometry.dotProductTraversalPlan,
      frame: dotProductTraversal,
      relation,
      sourceTokens,
      targetTokens
    });
  }
  switch (relation.lifecycle) {
    case "persist":
    case "role-change":
      const travelProgress = relation.lifecycle === "role-change"
        ? representationalSuccession?.frame.continuantReflowProgress ??
          enclosureChoreography?.frame.persistentTravelProgress ??
          eased
        : eased;
      const relationPath =
        representationalSuccession === undefined
          ? undefined
          : geometry.precomputedRelationMotionPathsByRecordId?.[
              relation.recordId
            ];
      const travelPoint = relationPath === undefined
        ? undefined
        : sampleKpEquationMotionPath(relationPath, travelProgress);
      return [
        ...sourceTokens.map((token) => frameToken(token, "source", {
          opacity: progress === 1 ? 0 : 1,
          x: travelPoint === undefined || relationPath === undefined
            ? (relation.delta?.x ?? 0) * travelProgress
            : travelPoint.x - relationPath.start.x,
          y: travelPoint === undefined || relationPath === undefined
            ? (relation.delta?.y ?? 0) * travelProgress
            : travelPoint.y - relationPath.start.y,
          scale: 1 + ((averageScale(relation) - 1) * travelProgress)
        })),
        ...targetTokens.map((token) => frameToken(token, "target", {
          opacity: progress === 1 ? 1 : 0,
          x: 0,
          y: 0,
          scale: 1
        }))
      ];
    case "enter":
      if (lineageChoreography?.kind === "merge-fan-in") {
        const visibility = 1 - lineageChoreography.frame.phases["branch-descendants"];
        return targetTokens.map((token) => frameToken(token, "target", {
          opacity: visibility,
          x: 0,
          y: 4 * (1 - visibility),
          scale: 0.9 + 0.1 * visibility
        }));
      }
      if (enclosureChoreography?.frame.kind === "wrap") {
        return targetTokens.map((token) => sampleEnclosureArtifactToken(
          token,
          "target",
          enclosureChoreography
        ));
      }
      return targetTokens.map((token) => frameToken(token, "target", {
        opacity: eased,
        x: 0,
        y: 6 * (1 - eased),
        scale: 0.85 + 0.15 * eased
      }));
    case "exit":
      if (lineageChoreography?.kind === "copy-fan-out" || lineageChoreography?.kind === "substitute") {
        const visibility = 1 - lineageChoreography.frame.phases["arrive-descendants"];
        return sourceTokens.map((token) => frameToken(token, "source", {
          opacity: visibility,
          x: 0,
          y: 0,
          scale: 1 - 0.1 * (1 - visibility)
        }));
      }
      if (enclosureChoreography?.frame.kind === "unwrap") {
        return sourceTokens.map((token) => sampleEnclosureArtifactToken(
          token,
          "source",
          enclosureChoreography
        ));
      }
      return sourceTokens.map((token) => frameToken(token, "source", {
        opacity: 1 - eased,
        x: 0,
        y: 0,
        scale: 1 - 0.1 * eased
      }));
    case "cancel":
      return sourceTokens.map((token) => frameToken(token, "source", {
        opacity: 1 - eased,
        x: 0,
        y: relation.lifecycle === "cancel" ? -4 * eased : 0,
        scale: 1 - (relation.lifecycle === "cancel" ? 0.3 * eased : 0.1 * eased)
      }));
    case "merge": {
      const reveal = lateProgress(progress);
      return [
        ...sourceTokens.map((token) => frameToken(token, "source", {
          opacity: 1 - reveal,
          x: (relation.delta?.x ?? 0) * eased,
          y: (relation.delta?.y ?? 0) * eased,
          scale: 1 - 0.2 * eased
        })),
        ...targetTokens.map((token) => frameToken(token, "target", {
          opacity: reveal,
          x: 0,
          y: 0,
          scale: 0.85 + 0.15 * reveal
        }))
      ];
    }
    case "split": {
      const reveal = lateProgress(progress);
      return [
        ...sourceTokens.map((token) => frameToken(token, "source", {
          opacity: 1 - reveal,
          x: (relation.delta?.x ?? 0) * eased,
          y: (relation.delta?.y ?? 0) * eased,
          scale: 1
        })),
        ...targetTokens.map((token) => frameToken(token, "target", {
          opacity: reveal,
          x: -(relation.delta?.x ?? 0) * (1 - eased),
          y: -(relation.delta?.y ?? 0) * (1 - eased),
          scale: 0.85 + 0.15 * reveal
        }))
      ];
    }
    case "artifact":
      return [
        ...sourceTokens.map((token) => frameToken(token, "source", {
          opacity: 1 - eased, x: 0, y: 0, scale: 1
        })),
        ...targetTokens.map((token) => frameToken(token, "target", {
          opacity: eased, x: 0, y: 0, scale: 0.9 + 0.1 * eased
        }))
      ];
    case "focus":
      return [
        ...sourceTokens.map((token) => frameToken(token, "source", {
          opacity: 1, x: 0, y: 0, scale: 1 + 0.06 * Math.sin(Math.PI * progress)
        })),
        ...targetTokens.map((token) => frameToken(token, "target", {
          opacity: 1, x: 0, y: 0, scale: 1 + 0.06 * Math.sin(Math.PI * progress)
        }))
      ];
  }
}

function createRepresentationalSuccessionContext(
  geometry: KpMeasuredEquationTransitionGeometry,
  progress: number
): RepresentationalSuccessionContext | undefined {
  if (
    geometry.representationalSuccessionKind !== "opposite-corner-seed"
  ) {
    return undefined;
  }
  const mergedRelation = geometry.relations.find(
    (candidate) =>
      candidate.lifecycle === "merge" &&
      candidate.source !== undefined &&
      candidate.target !== undefined
  );
  const explicitFragmentRelations = geometry.relations.filter((candidate) =>
    relationContainsRadicalNotation(candidate)
  );
  const relation = mergedRelation ?? aggregateRadicalFragmentRelations(
    explicitFragmentRelations
  );
  if (relation === undefined) return undefined;
  const sampled = sampleKpEquationRepresentationalSuccession({
    relation,
    ...(mergedRelation === undefined
      ? { fragmentRelations: explicitFragmentRelations }
      : {}),
    sourceTokens: relationTokens(
      geometry.sourceTokens,
      relation.source!.motionIds
    ),
    targetTokens: relationTokens(
      geometry.targetTokens,
      relation.target!.motionIds
    ),
    progress
  });
  return {
    relationRecordIds: new Set(
      mergedRelation === undefined
        ? explicitFragmentRelations.map((candidate) => candidate.recordId)
        : [mergedRelation.recordId]
    ),
    frame: sampled.frame,
    tokens: sampled.tokens.map((token) => ({
      motionId: token.motionId,
      side: token.side,
      pose: {
        opacity: token.opacity,
        x: token.x,
        y: token.y,
        scale: token.scale
      },
      motionPathVariant: token.pathVariant
    }))
  };
}

function relationContainsRadicalNotation(
  relation: KpMeasuredEquationTransitionRelationGeometry
): boolean {
  return [
    ...(relation.source?.motionIds ?? []),
    ...(relation.target?.motionIds ?? [])
  ].some((motionId) =>
    motionId.includes(".exponent-") ||
    motionId.startsWith("exponent.") ||
    motionId.includes(".radical-hook") ||
    motionId.includes(".radical-overbar") ||
    motionId.startsWith("radical.") ||
    motionId.includes(".root-index") ||
    motionId.includes(".radicand-exponent")
  );
}

function aggregateRadicalFragmentRelations(
  relations: readonly KpMeasuredEquationTransitionRelationGeometry[]
): KpMeasuredEquationTransitionRelationGeometry | undefined {
  const sources = relations.flatMap((relation) =>
    relation.source === undefined ? [] : [relation.source]
  );
  const targets = relations.flatMap((relation) =>
    relation.target === undefined ? [] : [relation.target]
  );
  if (sources.length === 0 || targets.length === 0) return undefined;
  return {
    recordId: relations.map((relation) => relation.recordId).join("+"),
    lifecycle: "merge",
    source: {
      selectorIds: [...new Set(sources.flatMap((endpoint) => endpoint.selectorIds))],
      motionIds: [...new Set(sources.flatMap((endpoint) => endpoint.motionIds))],
      bounds: unionBounds(sources.map((endpoint) => endpoint.bounds))
    },
    target: {
      selectorIds: [...new Set(targets.flatMap((endpoint) => endpoint.selectorIds))],
      motionIds: [...new Set(targets.flatMap((endpoint) => endpoint.motionIds))],
      bounds: unionBounds(targets.map((endpoint) => endpoint.bounds))
    }
  };
}

function unionBounds(
  bounds: readonly {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  }[]
): { readonly left: number; readonly top: number; readonly width: number; readonly height: number } {
  const left = Math.min(...bounds.map((rect) => rect.left));
  const top = Math.min(...bounds.map((rect) => rect.top));
  const right = Math.max(...bounds.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...bounds.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

function createDistributionChoreographyContext(
  geometry: KpMeasuredEquationTransitionGeometry,
  progress: number
): DistributionChoreographyContext | undefined {
  if (geometry.distributionChoreographyKind !== "canonical-fan-out") {
    return undefined;
  }
  const factorRelation = geometry.relations.find(
    (relation) =>
      relation.lifecycle === "split" &&
      relation.source !== undefined &&
      relation.target !== undefined
  );
  const persistentRelations = geometry.relations.filter(
    (relation) =>
      relation.lifecycle === "persist" &&
      relation.source !== undefined &&
      relation.target !== undefined
  );
  const addendRelations = persistentRelations.filter((relation) =>
    relation.recordId.includes("term")
  );
  const connectorRelations = persistentRelations.filter(
    (relation) => !addendRelations.includes(relation)
  );
  const groupingRelations = geometry.relations.filter(
    (relation) => relation.lifecycle === "exit" && relation.source !== undefined
  );
  const sourceFactorId = factorRelation?.source?.selectorIds[0];
  if (
    factorRelation?.source === undefined ||
    factorRelation.target === undefined ||
    sourceFactorId === undefined
  ) {
    throw new Error("Canonical distribution geometry is missing factor fan-out.");
  }
  const plan = compileKpDistributionChoreography({
    id: `${geometry.transitionId}.distribution-choreography`,
    sourceFactorId,
    factorCopyIds: factorRelation.target.selectorIds,
    addendPairs: addendRelations.map((relation, semanticIndex) => ({
      sourceId: relation.source!.selectorIds[0]!,
      targetId: relation.target!.selectorIds[0]!,
      semanticIndex
    })),
    connectorPairs: connectorRelations.map((relation, semanticIndex) => ({
      sourceId: relation.source!.selectorIds[0]!,
      targetId: relation.target!.selectorIds[0]!,
      semanticIndex
    })),
    groupingArtifactIds: groupingRelations.flatMap(
      (relation) => relation.source?.selectorIds ?? []
    )
  });
  const sourceFactorBounds = factorRelation.source.bounds;
  const firstFactorMotionId = factorRelation.target.motionIds[0];
  const firstFactorBounds = geometry.targetTokens.find(
    (token) => token.motionId === firstFactorMotionId
  )?.localRect;
  if (firstFactorBounds === undefined) {
    throw new Error("Canonical distribution geometry is missing its first factor copy.");
  }
  const sourceFactorCenter = rectCenter(sourceFactorBounds);
  const firstFactorCenter = rectCenter(firstFactorBounds);
  const sourceFactorAnchorDelta = {
    x: firstFactorCenter.x - sourceFactorCenter.x,
    y: firstFactorCenter.y - sourceFactorCenter.y
  };
  const orderedAddends = [...addendRelations].sort(
    (left, right) => rectCenter(left.target!.bounds).x - rectCenter(right.target!.bounds).x
  );
  const groupingTokens = groupingRelations
    .flatMap((relation) => relation.source?.motionIds ?? [])
    .map((motionId) => geometry.sourceTokens.find((token) => token.motionId === motionId))
    .filter((token): token is AnnotatedMotionToken => token !== undefined)
    .sort((left, right) => rectCenter(left.localRect).x - rectCenter(right.localRect).x);
  const groupingReflowByMotionId = new Map(
    groupingTokens.map((token, index) => {
      const isLeftBoundary = index < groupingTokens.length / 2;
      const addendBounds = isLeftBoundary
        ? orderedAddends[0]!.target!.bounds
        : orderedAddends.at(-1)!.target!.bounds;
      const sourceCenter = rectCenter(token.localRect);
      const destinationCenter = {
        x: isLeftBoundary
          ? addendBounds.left - token.localRect.width / 2 - 1
          : addendBounds.left + addendBounds.width + token.localRect.width / 2 + 1,
        y: rectCenter(addendBounds).y
      };
      return [
        token.motionId,
        {
          x: destinationCenter.x - sourceCenter.x,
          y: destinationCenter.y - sourceCenter.y
        }
      ] as const;
    })
  );
  return {
    plan,
    frame: sampleKpDistributionChoreography({ plan, progress }),
    factorRelationRecordId: factorRelation.recordId,
    reflowRelationRecordIds: new Set(
      persistentRelations.map((relation) => relation.recordId)
    ),
    groupingRelationRecordIds: new Set(
      groupingRelations.map((relation) => relation.recordId)
    ),
    sourceFactorAnchorDelta,
    sourceFactorAnchorBounds: {
      left: sourceFactorBounds.left + sourceFactorAnchorDelta.x,
      top: sourceFactorBounds.top + sourceFactorAnchorDelta.y,
      width: sourceFactorBounds.width,
      height: sourceFactorBounds.height
    },
    groupingReflowByMotionId,
    motionPathsByMotionId: geometry.precomputedMotionPathsByMotionId
  };
}

function createLineageChoreographyContext(
  geometry: KpMeasuredEquationTransitionGeometry,
  progress: number
): LineageChoreographyContext | undefined {
  const kind = geometry.lineageChoreographyKind;
  const relation = geometry.relations.find((candidate) =>
    kind === "copy-fan-out" || kind === "substitute"
      ? candidate.lifecycle === "split" && candidate.source !== undefined && candidate.target !== undefined
      : kind === "merge-fan-in"
        ? candidate.lifecycle === "merge" && candidate.source !== undefined && candidate.target !== undefined
        : false
  );
  if (kind === undefined || relation?.source === undefined || relation.target === undefined) {
    return undefined;
  }

  const sourceEntityId = kind === "copy-fan-out" || kind === "substitute"
    ? relation.source.selectorIds[0]
    : relation.target.selectorIds[0];
  const descendantEntityIds = kind === "copy-fan-out" || kind === "substitute"
    ? relation.target.selectorIds
    : relation.source.selectorIds;
  if (sourceEntityId === undefined || descendantEntityIds.length < 1) return undefined;
  const lineageGraph = createKpSemanticLineageGraph({
    id: `${geometry.transitionId}.${relation.recordId}.lineage`,
    sourceEntityIds: [sourceEntityId],
    targetEntityIds: [...descendantEntityIds],
    edges: [{
      id: relation.recordId,
      relation: "split",
      sourceEntityIds: [sourceEntityId],
      targetEntityIds: [...descendantEntityIds],
      summary: `${relation.recordId} lineage choreography.`
    }]
  });
  const plan = compileKpCopyFanOutChoreography({
    id: `${geometry.transitionId}.${relation.recordId}.choreography`,
    lineageGraph,
    sourceEntityId
  });

  return {
    kind,
    relationRecordId: relation.recordId,
    frame: sampleKpCopyFanOutChoreography({
      plan,
      progress,
      direction: kind === "copy-fan-out" || kind === "substitute" ? "forward" : "rewind"
    }),
    motionPathsByMotionId: geometry.precomputedMotionPathsByMotionId
  };
}

function createDerivativePowerChoreographyContext(
  geometry: KpMeasuredEquationTransitionGeometry,
  progress: number
): DerivativePowerChoreographyContext | undefined {
  const plan = geometry.derivativePowerChoreographyPlan;
  if (plan === undefined) return undefined;
  return {
    plan,
    frame: sampleKpDerivativePowerChoreography({ plan, progress }),
    motionPathsByMotionId: geometry.precomputedMotionPathsByMotionId
  };
}

function sampleDerivativePowerRelation(
  relation: KpMeasuredEquationTransitionRelationGeometry,
  sourceTokens: readonly AnnotatedMotionToken[],
  targetTokens: readonly AnnotatedMotionToken[],
  context: DerivativePowerChoreographyContext
): readonly KpEquationTokenMotionFrameToken[] | undefined {
  if (context.plan.operatorSelectorIds.some((selectorId) =>
    relation.source?.selectorIds.includes(selectorId)
  )) {
    return sourceTokens.map((token) => frameToken(token, "source", {
      opacity: context.frame.operator.opacity,
      x: 0,
      y: -4 * context.frame.operator.removalProgress,
      scale: 1 - (0.04 * context.frame.operator.removalProgress)
    }));
  }
  if (relation.recordId === "base-persists") {
    const delta = relation.delta;
    return [
      ...sourceTokens.map((token) => frameToken(token, "source", {
        opacity: context.frame.base.sourceOpacity,
        x: (delta?.x ?? 0) * context.frame.base.reflowProgress,
        y: (delta?.y ?? 0) * context.frame.base.reflowProgress,
        scale: 1
      })),
      ...targetTokens.map((token) => frameToken(token, "target", {
        opacity: context.frame.base.targetOpacity,
        x: 0,
        y: 0,
        scale: 1
      }))
    ];
  }
  if (relation.recordId !== "exponent-branches") return undefined;
  if (relation.source === undefined || relation.target === undefined) return [];
  return [
    ...sourceTokens.map((token) => frameToken(token, "source", {
      opacity: context.frame.exponentSource.opacity,
      x: 0,
      y: 0,
      scale: context.frame.exponentSource.scale
    })),
    ...targetTokens.map((token) => {
      const motionIndex = relation.target!.motionIds.indexOf(token.motionId);
      const selectorId = relation.target!.selectorIds[motionIndex];
      const coefficient =
        selectorId === context.plan.exponent.coefficientSelectorId;
      const branch = coefficient
        ? context.frame.coefficient
        : context.frame.successorExponent;
      const path = lineagePathPose({
        origin: relation.source!.bounds,
        destination: token.localRect,
        pathProgress: branch.pathProgress,
        branchIndex: coefficient ? 0 : 1,
        opacity: branch.opacity,
        scale: branch.scale,
        precomputedPath: context.motionPathsByMotionId?.[token.motionId]
      });
      return {
        motionId: token.motionId,
        side: "target" as const,
        pose: path.pose,
        lineagePathId: `${context.plan.id}.path.${selectorId ?? motionIndex}`,
        lineageEdgeId: "exponent-branches",
        lineageBranchIndex: coefficient ? 0 : 1,
        motionPathVariant: path.variant
      };
    })
  ];
}

function sampleLineageRelation(
  relation: KpMeasuredEquationTransitionRelationGeometry,
  sourceTokens: readonly AnnotatedMotionToken[],
  targetTokens: readonly AnnotatedMotionToken[],
  context: LineageChoreographyContext
): readonly KpEquationTokenMotionFrameToken[] {
  if (relation.source === undefined || relation.target === undefined) return [];

  if (context.kind === "copy-fan-out" || context.kind === "substitute") {
    const origin = relation.source.bounds;
    const settle = context.frame.phases["settle-descendants"];
    return [
      ...sourceTokens.map((token) => frameToken(token, "source", {
        opacity: 1 - settle,
        x: 0,
        y: 0,
        scale: context.frame.source.scale
      })),
      ...targetTokens.map((token) => lineageFrameToken({
        token,
        side: "target",
        origin,
        selectorIds: relation.target!.selectorIds,
        motionIds: relation.target!.motionIds,
        context
      }))
    ];
  }

  const origin = relation.target.bounds;
  const sourceFrames = sourceTokens.map((token) => lineageFrameToken({
    token,
    side: "source",
    origin,
    selectorIds: relation.source!.selectorIds,
    motionIds: relation.source!.motionIds,
    context
  }));
  const descendantOpacity = Math.max(
    0,
    ...context.frame.descendants.map((descendant) => descendant.opacity)
  );
  return [
    ...sourceFrames,
    ...targetTokens.map((token) => frameToken(token, "target", {
      opacity: 1 - descendantOpacity,
      x: 0,
      y: 0,
      scale: context.frame.source.scale
    }))
  ];
}

function sampleDistributionRelation(
  relation: KpMeasuredEquationTransitionRelationGeometry,
  sourceTokens: readonly AnnotatedMotionToken[],
  targetTokens: readonly AnnotatedMotionToken[],
  progress: number,
  context: DistributionChoreographyContext
): readonly KpEquationTokenMotionFrameToken[] | undefined {
  if (
    relation.recordId === context.factorRelationRecordId &&
    relation.source !== undefined &&
    relation.target !== undefined
  ) {
    return [
      ...sourceTokens.map((token) => frameToken(token, "source", {
        opacity: context.frame.sourceFactor.opacity,
        x: context.sourceFactorAnchorDelta.x * context.frame.addendReflowProgress,
        y: context.sourceFactorAnchorDelta.y * context.frame.addendReflowProgress,
        scale: context.frame.sourceFactor.scale
      })),
      ...targetTokens.map((token) => {
        const motionIndex = relation.target!.motionIds.indexOf(token.motionId);
        const selectorId = relation.target!.selectorIds[motionIndex];
        const copy = context.frame.factorCopies.find(
          (candidate) => candidate.entityId === selectorId
        );
        if (copy === undefined) {
          throw new Error(`Missing distribution factor copy ${selectorId ?? token.motionId}.`);
        }
        const path = lineagePathPose({
          origin: {
            ...context.sourceFactorAnchorBounds,
            left: context.sourceFactorAnchorBounds.left -
              context.sourceFactorAnchorDelta.x * (1 - context.frame.addendReflowProgress),
            top: context.sourceFactorAnchorBounds.top -
              context.sourceFactorAnchorDelta.y * (1 - context.frame.addendReflowProgress)
          },
          destination: token.localRect,
          pathProgress: copy.pathProgress,
          branchIndex: copy.semanticIndex,
          opacity: copy.opacity,
          scale: copy.scale,
          precomputedPath: context.motionPathsByMotionId?.[token.motionId]
        });
        return {
          motionId: token.motionId,
          side: "target" as const,
          pose: path.pose,
          lineagePathId: `${context.plan.id}.factor-copy.${copy.semanticIndex}`,
          lineageEdgeId: relation.recordId,
          lineageBranchIndex: copy.semanticIndex,
          motionPathVariant: path.variant
        };
      })
    ];
  }
  if (context.reflowRelationRecordIds.has(relation.recordId)) {
    const reflow = context.frame.addendReflowProgress;
    return [
      ...sourceTokens.map((token) => frameToken(token, "source", {
        opacity: progress === 1 ? 0 : 1,
        x: (relation.delta?.x ?? 0) * reflow,
        y: (relation.delta?.y ?? 0) * reflow,
        scale: 1
      })),
      ...targetTokens.map((token) => frameToken(token, "target", {
        opacity: progress === 1 ? 1 : 0,
        x: 0,
        y: 0,
        scale: 1
      }))
    ];
  }
  if (context.groupingRelationRecordIds.has(relation.recordId)) {
    return sourceTokens.map((token) => {
      // Each delimiter follows its adjacent addend so the opening group remains legible.
      const reflow = context.groupingReflowByMotionId.get(token.motionId) ?? {
        x: 0,
        y: 0
      };
      return frameToken(token, "source", {
        opacity: context.frame.groupingOpacity,
        x: reflow.x * context.frame.addendReflowProgress,
        y: reflow.y * context.frame.addendReflowProgress,
        scale: 1
      });
    });
  }
  return undefined;
}

function lineageFrameToken(input: {
  readonly token: AnnotatedMotionToken;
  readonly side: "source" | "target";
  readonly origin: NonNullable<
    KpMeasuredEquationTransitionRelationGeometry["source"]
  >["bounds"];
  readonly selectorIds: readonly string[];
  readonly motionIds: readonly string[];
  readonly context: LineageChoreographyContext;
}): KpEquationTokenMotionFrameToken {
  const motionIndex = input.motionIds.indexOf(input.token.motionId);
  const selectorId = input.selectorIds[motionIndex];
  const descendant = input.context.frame.descendants.find(
    (candidate) => candidate.entityId === selectorId
  );
  if (descendant === undefined) {
    throw new Error(`Missing lineage descendant frame for motion token ${input.token.motionId}.`);
  }
  const path = lineagePathPose({
    origin: input.origin,
    destination: input.token.localRect,
    pathProgress: descendant.pathProgress,
    branchIndex: descendant.branchIndex,
    opacity: descendant.opacity,
    scale: descendant.scale,
    precomputedPath: input.context.motionPathsByMotionId?.[input.token.motionId]
  });
  return {
    motionId: input.token.motionId,
    side: input.side,
    pose: path.pose,
    lineagePathId: descendant.pathId,
    lineageEdgeId: descendant.lineageEdgeId,
    lineageBranchIndex: descendant.branchIndex,
    motionPathVariant: path.variant
  };
}

function lineagePathPose(input: {
  readonly origin: { readonly left: number; readonly top: number; readonly width: number; readonly height: number };
  readonly destination: { readonly left: number; readonly top: number; readonly width: number; readonly height: number };
  readonly pathProgress: number;
  readonly branchIndex: number;
  readonly opacity: number;
  readonly scale: number;
  readonly precomputedPath?: KpEquationMotionPathCandidate | undefined;
}): {
  readonly pose: KpEquationTokenMotionPose;
  readonly variant: KpEquationMotionPathVariantId;
} {
  const originCenter = rectCenter(input.origin);
  const destinationCenter = rectCenter(input.destination);
  const path = input.precomputedPath ?? planKpEquationMotionPathBetweenPoints({
    id: `lineage.branch.${input.branchIndex}`,
    start: originCenter,
    end: destinationCenter,
    variants: ["arc-above", "arc-below"],
    preferredVariant: input.branchIndex % 2 === 0 ? "arc-above" : "arc-below",
    clearance: 18 + input.branchIndex * 3,
    moverRadius: 0
  }).selected;
  const point = sampleKpEquationMotionPath(path, input.pathProgress);
  return {
    pose: {
      opacity: input.opacity,
      x: point.x - destinationCenter.x,
      y: point.y - destinationCenter.y,
      scale: input.scale
    },
    variant: path.variant
  };
}

function rectCenter(rect: {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}): { readonly x: number; readonly y: number } {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function createEnclosureChoreographyContext(
  geometry: KpMeasuredEquationTransitionGeometry,
  progress: number
): EnclosureChoreographyContext | undefined {
  const persistent = geometry.relations.find(
    (relation) => relation.lifecycle === "role-change" && relation.source !== undefined && relation.target !== undefined
  );
  const kind = geometry.enclosureChoreographyKind;
  if (persistent === undefined || kind === undefined) return undefined;

  const entering = geometry.relations.filter(
    (relation) => relation.lifecycle === "enter" && relation.target !== undefined
  );
  const exiting = geometry.relations.filter(
    (relation) => relation.lifecycle === "exit" && relation.source !== undefined
  );
  if (kind === "wrap" && entering.length === 0) return undefined;
  if (kind === "unwrap" && exiting.length === 0) return undefined;

  const persistentBounds = kind === "wrap"
    ? persistent.target!.bounds
    : persistent.source!.bounds;
  const artifactMotionIds = (kind === "wrap" ? entering : exiting).flatMap(
    (relation) => kind === "wrap"
      ? relation.target?.motionIds ?? []
      : relation.source?.motionIds ?? []
  );
  const artifactTokens = relationTokens(
    kind === "wrap" ? geometry.targetTokens : geometry.sourceTokens,
    artifactMotionIds
  );

  return {
    frame: sampleKpEquationEnclosureChoreography(kind, progress),
    persistentBounds,
    enclosureMotionIds: nearestEnclosureMotionIds(artifactTokens, persistentBounds)
  };
}

function nearestEnclosureMotionIds(
  tokens: readonly AnnotatedMotionToken[],
  persistentBounds: { readonly left: number; readonly width: number }
): ReadonlySet<string> {
  // The closest artifact on each side is the enclosure; farther artifacts such
  // as a function label use the later outer-artifact phase.
  const center = persistentBounds.left + persistentBounds.width / 2;
  const left = nearestToken(tokens.filter((token) => tokenCenterX(token) < center), center);
  const right = nearestToken(tokens.filter((token) => tokenCenterX(token) >= center), center);
  return new Set([left?.motionId, right?.motionId].filter(
    (motionId): motionId is string => motionId !== undefined
  ));
}

function nearestToken(
  tokens: readonly AnnotatedMotionToken[],
  center: number
): AnnotatedMotionToken | undefined {
  return [...tokens].sort(
    (left, right) => Math.abs(tokenCenterX(left) - center) - Math.abs(tokenCenterX(right) - center)
  )[0];
}

function sampleEnclosureArtifactToken(
  token: AnnotatedMotionToken,
  side: "source" | "target",
  context: EnclosureChoreographyContext
): KpEquationTokenMotionFrameToken {
  const isEnclosure = context.enclosureMotionIds.has(token.motionId);
  const visibility = isEnclosure
    ? context.frame.enclosureVisibility
    : context.frame.outerArtifactVisibility;
  const center = context.persistentBounds.left + context.persistentBounds.width / 2;
  const direction = tokenCenterX(token) < center ? -1 : 1;
  const travel = 1 - visibility;

  return frameToken(token, side, {
    opacity: visibility,
    x: direction * (isEnclosure ? 8 : 10) * travel,
    y: 0,
    scale: isEnclosure ? 1 : 0.35 + 0.65 * visibility
  });
}

function tokenCenterX(token: AnnotatedMotionToken): number {
  return token.localRect.left + token.localRect.width / 2;
}

function relationTokens(
  tokens: readonly AnnotatedMotionToken[],
  motionIds: readonly string[]
): readonly AnnotatedMotionToken[] {
  const ids = new Set(motionIds);
  return tokens.filter((token) => ids.has(token.motionId));
}

function frameToken(
  token: AnnotatedMotionToken,
  side: "source" | "target",
  pose: KpEquationTokenMotionPose
): KpEquationTokenMotionFrameToken {
  return { motionId: token.motionId, side, pose };
}

function averageScale(relation: KpMeasuredEquationTransitionRelationGeometry): number {
  if (relation.delta === undefined) return 1;
  return (relation.delta.scaleX + relation.delta.scaleY) / 2;
}

function lateProgress(progress: number): number {
  return smoothstep(clamp01((progress - 0.55) / 0.45));
}

function smoothstep(progress: number): number {
  return progress * progress * (3 - 2 * progress);
}

function clamp01(value: number): number {
  return Number.isNaN(value) ? 0 : Math.max(0, Math.min(1, value));
}
