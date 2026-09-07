import {
  isKpCompiledEquationTransitObligationsV2,
  type KpCompiledEquationTransitObligationsV2
} from "../domain-ir/equation-transit-obligations-v2.ts";
import type { KpEquationLayoutRect } from "./equation-layout-types.ts";
import {
  sampleKpEquationMotionTrackPaintRect,
  type KpEquationCollisionTrack,
  type KpEquationProtectedTransitCompilation
} from "./equation-motion-path-planner.ts";

export interface KpEquationMeasuredPaintOwnerV2 {
  readonly occurrenceId: string;
  readonly semanticEntityId: string;
  readonly paintAtomIds: readonly string[];
}

export interface KpEquationMeasuredPaintOwnershipSnapshotV2 {
  readonly kind: "equation-measured-paint-ownership-snapshot-v2";
  readonly lifecycle: "renderer-session-ephemeral";
  readonly measurementIdentity: {
    readonly revision: number;
    readonly coordinateSpaceId: string;
  };
  readonly sourceOwners: readonly KpEquationMeasuredPaintOwnerV2[];
  readonly targetOwners: readonly KpEquationMeasuredPaintOwnerV2[];
}

export interface KpEquationMeasuredRouteBindingV2 {
  readonly recordId: string;
  readonly trackIds: readonly string[];
  readonly sourceOccurrenceIds: readonly string[];
  readonly targetOccurrenceIds: readonly string[];
}

export interface KpEquationMeasuredBoundaryBindingV2 {
  readonly boundaryIntentId: string;
  readonly protectedTrackIds: readonly string[];
}

export interface KpEquationMeasuredArrivalBindingV2 {
  readonly arrivalId: string;
  readonly targetOccurrenceIds: readonly string[];
}

export interface KpEquationMeasuredRouteCertificateV2 {
  readonly kind: "equation-measured-route-certificate-v2";
  readonly lifecycle: "renderer-session-ephemeral";
  readonly transitionId: string;
  readonly measurementIdentity: {
    readonly revision: number;
    readonly coordinateSpaceId: string;
  };
  readonly protectedTransit:
    KpEquationProtectedTransitCompilation<KpEquationCollisionTrack>["certificate"];
  readonly tracks: readonly KpEquationCollisionTrack[];
  readonly proofs: {
    readonly relationClearance: readonly {
      readonly boundaryIntentId: string;
      readonly movingTrackIds: readonly string[];
      readonly protectedTrackIds: readonly string[];
    }[];
    readonly collisionAvoidance: "dense-measured-paint-audit";
    readonly endpointSettlement: readonly {
      readonly trackId: string;
      readonly sourceRect: KpEquationLayoutRect;
      readonly targetRect: KpEquationLayoutRect;
    }[];
    readonly paintOwnership: "one-occurrence-per-required-endpoint";
  };
  readonly toJSON: () => never;
}

type KpEquationMeasuredRouteDiagnosticCodeV2 =
  | "route.uncompiled-obligations"
  | "route.unknown-transition"
  | "route.measurement-mismatch"
  | "route.incomplete-binding"
  | "route.unknown-track"
  | "route.boundary-unprotected"
  | "route.endpoint-unsettled"
  | "route.paint-ownership";

interface KpEquationMeasuredRouteDiagnosticV2 {
  readonly code: KpEquationMeasuredRouteDiagnosticCodeV2;
  readonly message: string;
}

export type KpEquationMeasuredRouteCertificationV2 =
  | {
      readonly status: "certified";
      readonly certificate: KpEquationMeasuredRouteCertificateV2;
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "repair-required";
      readonly diagnostics: readonly KpEquationMeasuredRouteDiagnosticV2[];
    };

const certifiedRoutes = new WeakSet<object>();

export function certifyKpEquationMeasuredRouteV2(input: {
  readonly obligations: KpCompiledEquationTransitObligationsV2;
  readonly transitionId: string;
  readonly protectedTransit:
    KpEquationProtectedTransitCompilation<KpEquationCollisionTrack>;
  readonly ownership: KpEquationMeasuredPaintOwnershipSnapshotV2;
  readonly routeBindings: readonly KpEquationMeasuredRouteBindingV2[];
  readonly boundaryBindings: readonly KpEquationMeasuredBoundaryBindingV2[];
  readonly arrivalBindings: readonly KpEquationMeasuredArrivalBindingV2[];
  readonly endpointTolerancePx?: number | undefined;
}): KpEquationMeasuredRouteCertificationV2 {
  if (!isKpCompiledEquationTransitObligationsV2(input.obligations)) {
    return repair("route.uncompiled-obligations",
      "Measured routes require compiled equation transit obligations.");
  }
  const transition = input.obligations.transitions.find(({ transitionId }) =>
    transitionId === input.transitionId);
  if (transition === undefined) {
    return repair("route.unknown-transition",
      `Unknown measured-route transition ${input.transitionId}.`);
  }
  const protectedIdentity = input.protectedTransit.certificate.measurementIdentity;
  if (protectedIdentity === undefined ||
      protectedIdentity.revision !== input.ownership.measurementIdentity.revision ||
      protectedIdentity.coordinateSpaceId !==
        input.ownership.measurementIdentity.coordinateSpaceId) {
    return repair("route.measurement-mismatch",
      "Route, collision, and paint evidence must share one measurement identity.");
  }

  const diagnostics: KpEquationMeasuredRouteDiagnosticV2[] = [];
  const tracksById = new Map(input.protectedTransit.tracks.map((track) =>
    [track.id, track]));
  const routesByRecord = uniqueMap(
    input.routeBindings,
    ({ recordId }) => recordId,
    "route record",
    diagnostics
  );
  const boundariesById = uniqueMap(
    input.boundaryBindings,
    ({ boundaryIntentId }) => boundaryIntentId,
    "boundary intent",
    diagnostics
  );
  const arrivalsById = uniqueMap(
    input.arrivalBindings,
    ({ arrivalId }) => arrivalId,
    "arrival",
    diagnostics
  );
  const sourceOwners = ownerMap(input.ownership.sourceOwners, "source", diagnostics);
  const targetOwners = ownerMap(input.ownership.targetOwners, "target", diagnostics);
  const requiredTrackIds = new Set<string>();

  transition.transitRecords.forEach((obligation) => {
    const binding = routesByRecord.get(obligation.recordId);
    if (binding === undefined || binding.trackIds.length === 0) {
      diagnostics.push({
        code: "route.incomplete-binding",
        message: `Transit record ${obligation.recordId} has no measured route binding.`
      });
      return;
    }
    binding.trackIds.forEach((trackId) => {
      requiredTrackIds.add(trackId);
      if (!tracksById.has(trackId)) diagnostics.push({
        code: "route.unknown-track",
        message: `Transit record ${obligation.recordId} references unknown track ${trackId}.`
      });
    });
    verifyOccurrenceEntities({
      occurrenceIds: binding.sourceOccurrenceIds,
      expectedEntityIds: obligation.sourceEntityIds,
      owners: sourceOwners,
      label: `source of ${obligation.recordId}`,
      diagnostics
    });
    verifyOccurrenceEntities({
      occurrenceIds: binding.targetOccurrenceIds,
      expectedEntityIds: obligation.targetEntityIds,
      owners: targetOwners,
      label: `target of ${obligation.recordId}`,
      diagnostics
    });
  });

  const relationClearance = transition.boundaries.map((boundary) => {
    const binding = boundariesById.get(boundary.id);
    const movingTrackIds = transition.transitRecords
      .filter(({ boundaryIntentIds }) => boundaryIntentIds.includes(boundary.id))
      .flatMap(({ recordId }) => routesByRecord.get(recordId)?.trackIds ?? []);
    if (binding === undefined || binding.protectedTrackIds.length === 0 ||
        movingTrackIds.length === 0) {
      diagnostics.push({
        code: "route.boundary-unprotected",
        message: `Semantic boundary ${boundary.id} lacks moving or protected paint.`
      });
    }
    const protectedTrackIds = binding?.protectedTrackIds ?? [];
    protectedTrackIds.forEach((trackId) => {
      if (!tracksById.has(trackId)) diagnostics.push({
        code: "route.unknown-track",
        message: `Semantic boundary ${boundary.id} references unknown track ${trackId}.`
      });
    });
    if (movingTrackIds.some((trackId) => protectedTrackIds.includes(trackId))) {
      diagnostics.push({
        code: "route.boundary-unprotected",
        message: `Semantic boundary ${boundary.id} cannot protect its moving track.`
      });
    }
    for (const movingId of movingTrackIds) {
      const moving = tracksById.get(movingId);
      if (moving === undefined) continue;
      for (const protectedId of protectedTrackIds) {
        const protectedTrack = tracksById.get(protectedId);
        if (protectedTrack === undefined) continue;
        if (
          moving.componentId === protectedTrack.componentId ||
          (
            moving.intentionalContactGroupId !== undefined &&
            moving.intentionalContactGroupId ===
              protectedTrack.intentionalContactGroupId
          ) ||
          moving.intentionalForegroundOcclusion !== undefined ||
          protectedTrack.intentionalForegroundOcclusion !== undefined
        ) {
          diagnostics.push({
            code: "route.boundary-unprotected",
            message:
              `Semantic boundary ${boundary.id} cannot use an overlap waiver ` +
              `between ${movingId} and ${protectedId}.`
          });
        }
      }
    }
    return Object.freeze({
      boundaryIntentId: boundary.id,
      movingTrackIds: Object.freeze([...movingTrackIds]),
      protectedTrackIds: Object.freeze([...protectedTrackIds])
    });
  });

  transition.arrivals.forEach((arrival) => {
    const binding = arrivalsById.get(arrival.id);
    if (binding === undefined) {
      diagnostics.push({
        code: "route.incomplete-binding",
        message: `Target arrival ${arrival.id} has no measured binding.`
      });
      return;
    }
    verifyOccurrenceEntities({
      occurrenceIds: binding.targetOccurrenceIds,
      expectedEntityIds: [
        ...arrival.targetEntityIds,
        ...arrival.connectorEntityIds
      ],
      owners: targetOwners,
      label: `arrival ${arrival.id}`,
      diagnostics
    });
  });

  const tolerance = input.endpointTolerancePx ?? 1 / 64;
  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new Error("Measured route endpoint tolerance must be non-negative.");
  }
  const endpointSettlement = [...requiredTrackIds].map((trackId) => {
    const track = tracksById.get(trackId)!;
    const sourceRect = sampleKpEquationMotionTrackPaintRect(track, 0);
    const targetRect = sampleKpEquationMotionTrackPaintRect(track, 1);
    const expectedSource = track.startPaintRect ?? track.startRect;
    const expectedTarget = track.endPaintRect ?? track.endRect;
    if (rectDelta(sourceRect, expectedSource) > tolerance ||
        rectDelta(targetRect, expectedTarget) > tolerance) {
      diagnostics.push({
        code: "route.endpoint-unsettled",
        message: `Track ${trackId} does not settle to its measured endpoints.`
      });
    }
    return Object.freeze({ trackId, sourceRect, targetRect });
  });

  if (diagnostics.length > 0) {
    return Object.freeze({
      status: "repair-required" as const,
      diagnostics: Object.freeze(diagnostics)
    });
  }
  const certificate = Object.freeze({
    kind: "equation-measured-route-certificate-v2" as const,
    lifecycle: "renderer-session-ephemeral" as const,
    transitionId: input.transitionId,
    measurementIdentity: Object.freeze({ ...protectedIdentity }),
    protectedTransit: input.protectedTransit.certificate,
    tracks: Object.freeze([...input.protectedTransit.tracks]),
    proofs: Object.freeze({
      relationClearance: Object.freeze(relationClearance),
      collisionAvoidance: "dense-measured-paint-audit" as const,
      endpointSettlement: Object.freeze(endpointSettlement),
      paintOwnership: "one-occurrence-per-required-endpoint" as const
    }),
    toJSON(): never {
      throw new Error("Measured route certificates cannot enter durable state.");
    }
  });
  certifiedRoutes.add(certificate);
  return Object.freeze({
    status: "certified" as const,
    certificate,
    diagnostics: Object.freeze([]) as readonly []
  });
}

export function sampleKpCertifiedEquationRouteV2(input: {
  readonly certificate: KpEquationMeasuredRouteCertificateV2;
  readonly progress: number;
}): readonly {
  readonly trackId: string;
  readonly paintRect: KpEquationLayoutRect;
}[] {
  if (!certifiedRoutes.has(input.certificate)) {
    throw new Error("Equation route sampling requires a minted certificate.");
  }
  if (!Number.isFinite(input.progress) || input.progress < 0 ||
      input.progress > 1) {
    throw new Error("Certified route progress must be between zero and one.");
  }
  // Sampling is intentionally pure: all DOM reads ended before certification.
  return Object.freeze(input.certificate.tracks.map((track) => Object.freeze({
    trackId: track.id,
    paintRect: sampleKpEquationMotionTrackPaintRect(track, input.progress)
  })));
}

function ownerMap(
  owners: readonly KpEquationMeasuredPaintOwnerV2[],
  side: "source" | "target",
  diagnostics: KpEquationMeasuredRouteDiagnosticV2[]
): ReadonlyMap<string, KpEquationMeasuredPaintOwnerV2> {
  const result = new Map<string, KpEquationMeasuredPaintOwnerV2>();
  const atoms = new Set<string>();
  owners.forEach((owner) => {
    if (result.has(owner.occurrenceId) || owner.paintAtomIds.length === 0 ||
        owner.paintAtomIds.some((atomId) => atoms.has(atomId))) {
      diagnostics.push({
        code: "route.paint-ownership",
        message: `${side} occurrence ${owner.occurrenceId} lacks exclusive paint.`
      });
    }
    result.set(owner.occurrenceId, owner);
    owner.paintAtomIds.forEach((atomId) => atoms.add(atomId));
  });
  return result;
}

function verifyOccurrenceEntities(input: {
  readonly occurrenceIds: readonly string[];
  readonly expectedEntityIds: readonly string[];
  readonly owners: ReadonlyMap<string, KpEquationMeasuredPaintOwnerV2>;
  readonly label: string;
  readonly diagnostics: KpEquationMeasuredRouteDiagnosticV2[];
}): void {
  const actual = input.occurrenceIds.map((id) =>
    input.owners.get(id)?.semanticEntityId).filter((id): id is string =>
    id !== undefined);
  if (actual.length !== input.occurrenceIds.length ||
      !sameSet(actual, input.expectedEntityIds)) {
    input.diagnostics.push({
      code: "route.paint-ownership",
      message: `Measured paint ownership does not cover ${input.label}.`
    });
  }
}

function uniqueMap<T>(
  values: readonly T[],
  id: (value: T) => string,
  label: string,
  diagnostics: KpEquationMeasuredRouteDiagnosticV2[]
): ReadonlyMap<string, T> {
  const result = new Map<string, T>();
  values.forEach((value) => {
    const key = id(value);
    if (result.has(key)) diagnostics.push({
      code: "route.incomplete-binding",
      message: `Measured ${label} ${key} is duplicated.`
    });
    result.set(key, value);
  });
  return result;
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length &&
    left.every((value) => right.includes(value));
}

function rectDelta(left: KpEquationLayoutRect, right: KpEquationLayoutRect): number {
  return Math.max(
    Math.abs(left.left - right.left),
    Math.abs(left.top - right.top),
    Math.abs(left.width - right.width),
    Math.abs(left.height - right.height)
  );
}

function repair(
  code: KpEquationMeasuredRouteDiagnosticCodeV2,
  message: string
): KpEquationMeasuredRouteCertificationV2 {
  return Object.freeze({
    status: "repair-required" as const,
    diagnostics: Object.freeze([{ code, message }])
  });
}
