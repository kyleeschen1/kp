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

export interface KpExponentialHomomorphismTransitProfile {
  readonly id: "timing.exponential-homomorphism.product.v3";
  readonly baseHandoff: Readonly<{
    topology: "matched-dissolve-to-derived-successors";
    sourceExit: "collapse-to-point";
    targetEntry: "expand-from-point";
  }>;
  readonly sourceStructureContraction: Readonly<{
    start: number;
    end: number;
  }>;
  readonly sourceStructureRelease: Readonly<{ start: number; end: number }>;
  readonly payloadTransit: Readonly<{ start: number; end: number }>;
  readonly hiddenSuccessorRelocation: Readonly<{
    start: number;
    end: number;
  }>;
  readonly targetBasePresence: Readonly<{ start: number; end: number }>;
  readonly targetBaseExpansion: Readonly<{ start: number; end: number }>;
  readonly pointScale: number;
  readonly terminalSettlementFraction: number;
}

export const kpExponentialHomomorphismTransitProfile = Object.freeze({
  id: "timing.exponential-homomorphism.product.v3" as const,
  baseHandoff: Object.freeze({
    topology: "matched-dissolve-to-derived-successors" as const,
    sourceExit: "collapse-to-point" as const,
    targetEntry: "expand-from-point" as const
  }),
  sourceStructureContraction: Object.freeze({ start: 0.18, end: 0.28 }),
  sourceStructureRelease: Object.freeze({ start: 0.24, end: 0.32 }),
  payloadTransit: Object.freeze({ start: 0.2, end: 0.44 }),
  hiddenSuccessorRelocation: Object.freeze({ start: 0.32, end: 0.48 }),
  targetBasePresence: Object.freeze({ start: 0.54, end: 0.62 }),
  targetBaseExpansion: Object.freeze({ start: 0.55, end: 0.64 }),
  pointScale: 0.04,
  terminalSettlementFraction: 0.04
} satisfies KpExponentialHomomorphismTransitProfile);
const sampleSourceStructureContraction = sampleWindow(
  kpExponentialHomomorphismTransitProfile.sourceStructureContraction
);
const sampleSourceStructureRelease = sampleWindow(
  kpExponentialHomomorphismTransitProfile.sourceStructureRelease
);
const sampleTargetBasePresence = sampleWindow(
  kpExponentialHomomorphismTransitProfile.targetBasePresence
);
const sampleTargetBaseExpansion = sampleWindow(
  kpExponentialHomomorphismTransitProfile.targetBaseExpansion
);

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
  authority: KpExponentialHomomorphismCorrespondenceAuthority
): readonly KpNativeKatexSemanticPaintRelation[] {
  assertAuthority(authority);
  const sourcePayloadIds = ids(authority, "source", "exponent-payload");
  const targetPayloadIds = ids(authority, "target", "exponent-payload");
  const sourceBaseIds = ids(authority, "source", "base");
  const targetBaseIds = ids(authority, "target", "base");
  const groups: Array<{
    readonly id: string;
    readonly kind: "one-to-one" | "one-to-many";
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
  if (groups.length !== sourcePayloadIds.size + 1) {
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
}) {
  assertTransitInput(input);
  return compileKpCanonicalNativeKatexScenePlan({
    source: input.source,
    target: input.target,
    relations: projectKpExponentialHomomorphismNativePaintRelations(
      input.authority
    ),
    copyFanOutRouting: false,
    endpointDwellFraction:
      kpExponentialHomomorphismTransitProfile.terminalSettlementFraction,
    trackProjection: createKpExponentialHomomorphismTrackProjection(
      input.authority
    )
  });
}

export function createKpExponentialHomomorphismTransitSession(input: {
  readonly authority: KpExponentialHomomorphismCorrespondenceAuthority;
  readonly sourceEndpoint: KpExponentialNativeEndpoint;
  readonly targetEndpoint: KpExponentialNativeEndpoint;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
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
  authority: KpExponentialHomomorphismCorrespondenceAuthority
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
  const sourceCarrierTargetId = authority.occurrences.find((occurrence) =>
    occurrence.endpoint === "target" && occurrence.role === "base" &&
    occurrence.ordinal === 0
  )?.id;
  if (sourceCarrierTargetId === undefined) {
    throw new Error(
      "Exponential matched dissolve requires an ordered target base carrier."
    );
  }
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
          return Object.freeze({
            ...track,
            timingGroupId: `timing.${authority.id}.payload-transit`,
            semanticMotionUnitId: `motion-unit.${authority.id}.payloads`,
            motionAxisConstraint: "horizontal" as const,
            sampleProgress: sampleWindow(
              kpExponentialHomomorphismTransitProfile.payloadTransit
            ),
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
            timingGroupId: `timing.${authority.id}.base-fission`,
            semanticMotionUnitId: `motion-unit.${authority.id}.base-fission`,
            routingCohortId: `route.${authority.id}.base-fission`,
            routingMemberId: targetEntityId,
            motionAxisConstraint: "horizontal" as const,
            sampleProgress: sampleWindow(
              kpExponentialHomomorphismTransitProfile
                .hiddenSuccessorRelocation
            ),
            // Only one material owner depicts the source occurrence. Both
            // derived successors reappear at their own measured target centers.
            samplePaintPresence: targetEntityId === sourceCarrierTargetId
              ? sampleSourceCarrierPresence
              : sampleTargetBasePresence,
            sampleMaterialScale: sampleDerivedBaseMatchedDissolveScale,
            motionMetrics: true as const
          });
        }
        if (
          track.lifecycle === "eliminate" &&
          sourceEntityId !== undefined &&
          sourceConnectorIds.has(sourceEntityId)
        ) {
          return stationaryMatchedRelease(
            track,
            kpExponentialHomomorphismTransitProfile
              .sourceStructureContraction,
            kpExponentialHomomorphismTransitProfile.sourceStructureRelease
          );
        }
        return track;
      }));
    }
  });
}

function stationaryMatchedRelease(
  track: Extract<KpNativeKatexPaintMeasuredSceneTrack, {
    readonly lifecycle: "eliminate";
  }>,
  contractionWindow: Readonly<{ start: number; end: number }>,
  releaseWindow: Readonly<{ start: number; end: number }>
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
    timingGroupId: "timing.exponential-homomorphism.connector-release",
    sampleProgress: sampleRelease,
    sampleOpacityProgress: sampleRelease,
    sampleMaterialScale: (progress: number) =>
      1 - (1 - kpExponentialHomomorphismTransitProfile.pointScale) *
        sampleContraction(progress),
    opacityScheduleAuthority: "semantic-choreography" as const
  });
}

function sampleSourceCarrierPresence(progress: number): number {
  return Math.max(
    1 - sampleSourceStructureRelease(progress),
    sampleTargetBasePresence(progress)
  );
}

function sampleDerivedBaseMatchedDissolveScale(progress: number): number {
  const contracted = 1 -
    (1 - kpExponentialHomomorphismTransitProfile.pointScale) *
    sampleSourceStructureContraction(progress);
  const expanded = kpExponentialHomomorphismTransitProfile.pointScale +
    (1 - kpExponentialHomomorphismTransitProfile.pointScale) *
    sampleTargetBaseExpansion(progress);
  return progress <
      kpExponentialHomomorphismTransitProfile.targetBaseExpansion.start
    ? contracted
    : expanded;
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
