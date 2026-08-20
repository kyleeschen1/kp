import {
  projectKpNativeKatexSemanticPaintRelations,
  type KpNativeKatexPaintMeasuredSceneTrack,
  type KpNativeKatexSemanticPaintRelation
} from "./native-katex-base-scene-plan.ts";
import {
  compileKpCanonicalNativeKatexScenePlan,
  createKpCanonicalNativeKatexSceneSession,
  type KpCanonicalNativeKatexSceneSession,
  type KpNativeKatexSceneOwnershipFrame
} from "./native-katex-scene-compositor.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";
import {
  createKpNativeKatexTrackProjection
} from "./native-katex-track-projection.ts";
import {
  invalidateKpNativeKatexMotionPath
} from "./native-katex-paint-geometry.ts";
import type {
  KpExponentialNativeEndpoint
} from "./exponential-homomorphism-native-endpoints.ts";
import {
  isKpExponentialHomomorphismCorrespondenceAuthority,
  type KpExponentialHomomorphismCorrespondenceAuthority
} from "../semantic/exponential-homomorphism-correspondence.ts";
import {
  classifyKpNormalizedPowerApplicationSurface,
  resolveKpHomomorphicApplicationHandoff,
  type KpHomomorphicTargetTopology
} from "../animation/homomorphic-application-handoff-taxonomy.ts";

export interface KpExponentialHomomorphismTransitProfile {
  readonly id: "timing.exponential-homomorphism.product.v6";
  readonly baseHandoff: Readonly<{
    topology: "native-scale-carrier-fission";
    sourceExit: "retain-native-carrier";
    targetEntry: "full-size-follower-peel";
  }>;
  readonly homomorphicResolution: Readonly<{
    topology: "carrier-fission-with-connector-release";
    path: "direct-horizontal";
    anchorOrdinal: 0;
    anchorSettlement: Readonly<{ start: number; end: number }>;
    outwardTransit: Readonly<{ start: number; end: number }>;
    connectorContraction: Readonly<{ start: number; end: number }>;
    connectorRelease: Readonly<{ start: number; end: number }>;
    carrierFission: Readonly<{ start: number; end: number }>;
    carrierFollowerReveal: Readonly<{ start: number; end: number }>;
  }>;
  readonly connectorPointScale: number;
  readonly terminalSettlementFraction: number;
}

export const kpExponentialHomomorphismTransitProfile = Object.freeze({
  id: "timing.exponential-homomorphism.product.v6" as const,
  baseHandoff: Object.freeze({
    topology: "native-scale-carrier-fission" as const,
    sourceExit: "retain-native-carrier" as const,
    targetEntry: "full-size-follower-peel" as const
  }),
  homomorphicResolution: Object.freeze({
    topology: "carrier-fission-with-connector-release" as const,
    path: "direct-horizontal" as const,
    anchorOrdinal: 0 as const,
    anchorSettlement: Object.freeze({ start: 0.16, end: 0.22 }),
    outwardTransit: Object.freeze({ start: 0.16, end: 0.3 }),
    connectorContraction: Object.freeze({ start: 0.16, end: 0.24 }),
    connectorRelease: Object.freeze({ start: 0.16, end: 0.3 }),
    carrierFission: Object.freeze({ start: 0.16, end: 0.3 }),
    carrierFollowerReveal: Object.freeze({ start: 0.16, end: 0.22 })
  }),
  connectorPointScale: 0.1,
  terminalSettlementFraction: 0.04
} satisfies KpExponentialHomomorphismTransitProfile);
export interface KpExponentialHomomorphismTransitSession {
  readonly kind: "kp-exponential-homomorphism-transit-session";
  readonly lifecycle: "renderer-session";
  readonly authorityId: string;
  readonly canonical: KpCanonicalNativeKatexSceneSession;
  readonly apply: (progress: number) => KpNativeKatexSceneOwnershipFrame;
  readonly retire: (
    reason?: "surface-disposed" | "measurement-invalidated"
  ) => void;
}

export function projectKpExponentialHomomorphismNativePaintRelations(
  authority: KpExponentialHomomorphismCorrespondenceAuthority,
  targetTopology: KpHomomorphicTargetTopology = "lateral-product"
): readonly KpNativeKatexSemanticPaintRelation[] {
  assertAuthority(authority);
  const sourcePayloadIds = ids(authority, "source", "exponent-payload");
  const targetPayloadIds = ids(authority, "target", "exponent-payload");
  const sourceBaseIds = ids(authority, "source", "base");
  const targetBaseIds = ids(authority, "target", "base");
  const targetConnectorIds = ids(
    authority,
    "target",
    "combination-connector"
  );
  const groups: Array<{
    readonly id: string;
    readonly kind: "one-to-one" | "one-to-many" | "introduction";
    readonly sourceEntityIds: readonly string[];
    readonly targetEntityIds: readonly string[];
  }> = [];
  for (const record of authority.correspondenceMap.records) {
    if (
      record.sourceSelectorIds.every((id) => sourcePayloadIds.has(id)) &&
      record.targetSelectorIds.every((id) => targetPayloadIds.has(id))
    ) {
      groups.push({
        id: record.id,
        kind: "one-to-one" as const,
        sourceEntityIds: record.sourceSelectorIds,
        targetEntityIds: record.targetSelectorIds
      });
      continue;
    }
    if (
      record.sourceSelectorIds.length === 1 &&
      record.sourceSelectorIds.every((id) => sourceBaseIds.has(id)) &&
      record.targetSelectorIds.length >= 2 &&
      record.targetSelectorIds.every((id) => targetBaseIds.has(id))
    ) {
      groups.push({
        id: record.id,
        kind: "one-to-many" as const,
        sourceEntityIds: record.sourceSelectorIds,
        targetEntityIds: record.targetSelectorIds
      });
    }
  }
  if (targetTopology === "vertical-quotient") {
    for (const targetConnectorId of targetConnectorIds) {
      groups.push({
        id: `paint.${authority.id}.target-quotient-connector`,
        kind: "introduction",
        sourceEntityIds: [],
        targetEntityIds: [targetConnectorId]
      });
    }
  }
  const expectedRelationCount = sourcePayloadIds.size + 1 +
    (targetTopology === "vertical-quotient" ? targetConnectorIds.size : 0);
  if (groups.length !== expectedRelationCount) {
    throw new Error(
      "Exponential transit requires every payload continuant and one base fission."
    );
  }
  return projectKpNativeKatexSemanticPaintRelations({ groups });
}

export function compileKpExponentialHomomorphismTransitPlan(input: {
  readonly authority: KpExponentialHomomorphismCorrespondenceAuthority;
  readonly sourceEndpoint: KpExponentialNativeEndpoint;
  readonly targetEndpoint: KpExponentialNativeEndpoint;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly targetTopology?: KpHomomorphicTargetTopology | undefined;
}) {
  assertTransitInput(input);
  const targetTopology = input.targetTopology ?? "lateral-product";
  const handoff = resolveKpHomomorphicApplicationHandoff({
    surface: classifyKpNormalizedPowerApplicationSurface(
      input.authority.source
    ),
    targetTopology
  });
  if (handoff.visualHandoff !== "carrier-fission") {
    throw new Error(
      "A normalized shared-base power must select carrier fission."
    );
  }
  return compileKpCanonicalNativeKatexScenePlan({
    source: input.source,
    target: input.target,
    relations: projectKpExponentialHomomorphismNativePaintRelations(
      input.authority,
      targetTopology
    ),
    copyFanOutRouting: false,
    endpointDwellFraction:
      kpExponentialHomomorphismTransitProfile.terminalSettlementFraction,
    trackProjection: createKpExponentialHomomorphismTrackProjection(
      input.authority,
      targetTopology
    )
  });
}

export function createKpExponentialHomomorphismTransitSession(input: {
  readonly authority: KpExponentialHomomorphismCorrespondenceAuthority;
  readonly sourceEndpoint: KpExponentialNativeEndpoint;
  readonly targetEndpoint: KpExponentialNativeEndpoint;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly targetTopology?: KpHomomorphicTargetTopology | undefined;
}): KpExponentialHomomorphismTransitSession {
  const canonical = createKpCanonicalNativeKatexSceneSession(
    compileKpExponentialHomomorphismTransitPlan(input)
  );
  let retired = false;
  return Object.freeze({
    kind: "kp-exponential-homomorphism-transit-session" as const,
    lifecycle: "renderer-session" as const,
    authorityId: input.authority.id,
    canonical,
    apply(progress: number) {
      if (retired) {
        throw new Error("Cannot apply a retired exponential transit session.");
      }
      return canonical.session.apply(bounded(progress));
    },
    retire(
      reason: "surface-disposed" | "measurement-invalidated" =
        "surface-disposed"
    ) {
      if (retired) return;
      retired = true;
      canonical.session.retire({
        kind: "native-katex-paint-preserving-retirement",
        reason,
        structuralSuccession: "retire-preserving-paint"
      });
    }
  });
}

function createKpExponentialHomomorphismTrackProjection(
  authority: KpExponentialHomomorphismCorrespondenceAuthority,
  targetTopology: KpHomomorphicTargetTopology
) {
  const sourcePayloadIds = ids(authority, "source", "exponent-payload");
  const targetPayloadIds = ids(authority, "target", "exponent-payload");
  const sourceBaseIds = ids(authority, "source", "base");
  const targetBaseIds = ids(authority, "target", "base");
  const sourceConnectorIds = ids(
    authority,
    "source",
    "combination-connector"
  );
  const targetConnectorIds = ids(
    authority,
    "target",
    "combination-connector"
  );
  const anchorPayloadTargetId = authority.occurrences.find((occurrence) =>
    occurrence.endpoint === "target" &&
    occurrence.role === "exponent-payload" &&
    occurrence.ordinal ===
      kpExponentialHomomorphismTransitProfile.homomorphicResolution
        .anchorOrdinal
  )?.id;
  const persistentCarrierTargetId = authority.occurrences.find((occurrence) =>
    occurrence.endpoint === "target" && occurrence.role === "base" &&
    occurrence.ordinal === 0
  )?.id;
  if (persistentCarrierTargetId === undefined) {
    throw new Error(
      "Exponential carrier fission requires one ordered persistent branch."
    );
  }
  if (anchorPayloadTargetId === undefined) {
    throw new Error(
      "Exponential carrier fission requires one ordered payload anchor."
    );
  }
  const homomorphicResolutionTimingGroupId =
    `timing.${authority.id}.homomorphic-resolution`;
  const homomorphicResolutionMotionUnitId =
    `motion-unit.${authority.id}.homomorphic-resolution`;
  return createKpNativeKatexTrackProjection({
    id: `track-projection.${authority.id}.power-crossover`,
    project({ tracks, source, target }) {
      const sourceEntities = new Map(source.atoms.map((atom) => [
        atom.id,
        atom.semanticEntityId
      ]));
      const targetEntities = new Map(target.atoms.map((atom) => [
        atom.id,
        atom.semanticEntityId
      ]));
      return Object.freeze(tracks.map((track) => {
        const sourceEntityId = sourceEntities.get(track.sourceAtomId ?? "");
        const targetEntityId = targetEntities.get(track.targetAtomId ?? "");
        if (
          track.lifecycle === "persist" &&
          sourceEntityId !== undefined &&
          targetEntityId !== undefined &&
          sourcePayloadIds.has(sourceEntityId) &&
          targetPayloadIds.has(targetEntityId)
        ) {
          const transitWindow = targetEntityId === anchorPayloadTargetId
            ? kpExponentialHomomorphismTransitProfile.homomorphicResolution
              .anchorSettlement
            : kpExponentialHomomorphismTransitProfile.homomorphicResolution
              .outwardTransit;
          return Object.freeze({
            ...track,
            timingGroupId: homomorphicResolutionTimingGroupId,
            semanticMotionUnitId: homomorphicResolutionMotionUnitId,
            ...(targetTopology === "lateral-product"
              ? { motionAxisConstraint: "horizontal" as const }
              : {}),
            // Same-plane continuants take the shortest direct path. The first
            // operand settles quickly so a few pixels never become a slow crawl.
            sampleProgress: sampleWindow(transitWindow),
            motionMetrics: true as const
          });
        }
        if (
          track.lifecycle === "split" &&
          sourceEntityId !== undefined &&
          targetEntityId !== undefined &&
          sourceBaseIds.has(sourceEntityId) &&
          targetBaseIds.has(targetEntityId)
        ) {
          return Object.freeze({
            ...track,
            timingGroupId: homomorphicResolutionTimingGroupId,
            semanticMotionUnitId: homomorphicResolutionMotionUnitId,
            routingCohortId: `route.${authority.id}.base-fission`,
            routingMemberId: targetEntityId,
            ...(targetTopology === "lateral-product"
              ? { motionAxisConstraint: "horizontal" as const }
              : {}),
            sampleProgress: sampleWindow(
              kpExponentialHomomorphismTransitProfile.homomorphicResolution
                .carrierFission
            ),
            samplePaintPresence:
              targetEntityId === persistentCarrierTargetId
                ? samplePersistentCarrierPresence
                : sampleWindow(
                    kpExponentialHomomorphismTransitProfile
                      .homomorphicResolution
                      .carrierFollowerReveal
                  ),
            opacityScheduleAuthority: "semantic-choreography" as const,
            motionMetrics: true as const
          });
        }
        if (
          track.lifecycle === "eliminate" &&
          sourceEntityId !== undefined &&
          sourceConnectorIds.has(sourceEntityId)
        ) {
          return stationaryCompressedRelease(
            track,
            kpExponentialHomomorphismTransitProfile.homomorphicResolution
              .connectorContraction,
            kpExponentialHomomorphismTransitProfile.homomorphicResolution
              .connectorRelease,
            homomorphicResolutionTimingGroupId,
            homomorphicResolutionMotionUnitId
          );
        }
        if (
          track.lifecycle === "introduce" &&
          targetEntityId !== undefined &&
          targetConnectorIds.has(targetEntityId)
        ) {
          const reveal = sampleWindow(
            kpExponentialHomomorphismTransitProfile.homomorphicResolution
              .connectorRelease
          );
          return Object.freeze({
            ...track,
            timingGroupId: homomorphicResolutionTimingGroupId,
            semanticMotionUnitId: homomorphicResolutionMotionUnitId,
            sampleProgress: reveal,
            sampleOpacityProgress: reveal,
            sampleMaterialScale: (progress: number) =>
              kpExponentialHomomorphismTransitProfile.connectorPointScale +
              (1 - kpExponentialHomomorphismTransitProfile.connectorPointScale) *
                reveal(progress),
            opacityScheduleAuthority: "semantic-choreography" as const
          });
        }
        return track;
      }));
    }
  });
}

function samplePersistentCarrierPresence(_progress: number): number {
  return 1;
}

function stationaryCompressedRelease(
  track: Extract<KpNativeKatexPaintMeasuredSceneTrack, {
    readonly lifecycle: "eliminate";
  }>,
  contractionWindow: Readonly<{ start: number; end: number }>,
  releaseWindow: Readonly<{ start: number; end: number }>,
  timingGroupId: string,
  semanticMotionUnitId: string
): KpNativeKatexPaintMeasuredSceneTrack {
  const fixed = invalidateKpNativeKatexMotionPath(track);
  const sampleContraction = sampleWindow(contractionWindow);
  const sampleRelease = sampleWindow(releaseWindow);
  return Object.freeze({
    ...fixed,
    startRect: Object.freeze({ ...track.startRect }),
    endRect: Object.freeze({ ...track.startRect }),
    startPaintRect: Object.freeze({ ...track.startPaintRect }),
    endPaintRect: Object.freeze({ ...track.startPaintRect }),
    // Connector retirement, payload separation, and carrier fission are one
    // semantic event: the homomorphism resolves into two complete branches.
    timingGroupId,
    semanticMotionUnitId,
    sampleProgress: sampleRelease,
    sampleOpacityProgress: sampleRelease,
    sampleMaterialScale: (progress: number) =>
      1 - (1 - kpExponentialHomomorphismTransitProfile.connectorPointScale) *
        sampleContraction(progress),
    opacityScheduleAuthority: "semantic-choreography" as const
  });
}

function assertTransitInput(input: {
  readonly authority: KpExponentialHomomorphismCorrespondenceAuthority;
  readonly sourceEndpoint: KpExponentialNativeEndpoint;
  readonly targetEndpoint: KpExponentialNativeEndpoint;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): void {
  assertAuthority(input.authority);
  if (
    input.sourceEndpoint.authorityId !== input.authority.id ||
    input.targetEndpoint.authorityId !== input.authority.id ||
    input.sourceEndpoint.endpoint !== "source" ||
    input.targetEndpoint.endpoint !== "target" ||
    input.source.endpoint !== "source" ||
    input.target.endpoint !== "target" ||
    input.source.stage !== input.target.stage
  ) {
    throw new Error(
      "Exponential transit requires matching semantic, endpoint, and stage authority."
    );
  }
  assertPaintOccurrenceCoverage(input.authority, input.source);
  assertPaintOccurrenceCoverage(input.authority, input.target);
}

function assertPaintOccurrenceCoverage(
  authority: KpExponentialHomomorphismCorrespondenceAuthority,
  scene: KpNativeKatexRenderedSceneObservation
): void {
  const requiredRoles = scene.endpoint === "source"
    ? ["base", "exponent-payload", "combination-connector"] as const
    : authority.targetCombinationKind === "quotient"
      ? ["base", "exponent-payload", "combination-connector"] as const
      : ["base", "exponent-payload"] as const;
  const required = authority.occurrences.filter((occurrence) =>
    occurrence.endpoint === scene.endpoint &&
    requiredRoles.includes(occurrence.role as never)
  );
  const painted = new Set(scene.atoms.map(({ semanticEntityId }) =>
    semanticEntityId
  ));
  const missing = required.find(({ id }) => !painted.has(id));
  const admitted = new Set(required.map(({ id }) => id));
  const foreign = scene.atoms.find(({ semanticEntityId }) =>
    !admitted.has(semanticEntityId)
  );
  if (missing !== undefined || foreign !== undefined) {
    throw new Error(
      "Exponential transit endpoint paint does not close over semantic occurrences."
    );
  }
}

function ids(
  authority: KpExponentialHomomorphismCorrespondenceAuthority,
  endpoint: "source" | "target",
  role: "base" | "exponent-payload" | "combination-connector"
): ReadonlySet<string> {
  return new Set(authority.occurrences
    .filter((occurrence) =>
      occurrence.endpoint === endpoint && occurrence.role === role
    )
    .map(({ id }) => id));
}

function assertAuthority(
  authority: KpExponentialHomomorphismCorrespondenceAuthority
): void {
  if (!isKpExponentialHomomorphismCorrespondenceAuthority(authority)) {
    throw new Error(
      "Exponential transit requires minted correspondence authority."
    );
  }
}

function sampleWindow(
  window: Readonly<{ start: number; end: number }>
): (progress: number) => number {
  return (progress) => {
    const local = bounded((progress - window.start) /
      (window.end - window.start));
    return local * local * (3 - 2 * local);
  };
}

function bounded(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Exponential transit progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}
