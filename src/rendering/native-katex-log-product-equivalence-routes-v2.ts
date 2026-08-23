import {
  isKpCompiledEquationPresentationPlanV2,
  type KpCompiledEquationPresentationPlanV2
} from "../domain-ir/equation-presentation-plan-v2.ts";
import {
  isKpCompiledLogProductEquivalenceOccurrencesV2,
  type KpCompiledLogProductEquivalenceOccurrencesV2
} from "../domain-ir/log-product-equivalence-occurrences-v2.ts";
import type {
  KpLogProductEquivalenceDomainPayloadV2
} from "../semantic/log-product-equivalence-frame.ts";
import type {
  KpNativeKatexFunctionWrapAdaptationCertificate
} from "./native-katex-function-wrap-reception.ts";
import type {
  KpNativeKatexPaintMeasuredSceneTrack
} from "./native-katex-base-scene-plan.ts";
import type {
  KpEquationProtectedTransitCertificate
} from "./equation-motion-path-planner.ts";
import {
  planKpEquationMotionPathBetweenPoints,
  sampleKpEquationMotionTrackPaintRect,
  type KpEquationMotionPathVariantId
} from "./equation-motion-path-planner.ts";
import type { KpEquationLayoutRect } from "./equation-layout-plan.ts";
import {
  invalidateKpNativeKatexMotionPath,
  measureKpNativeKatexSubtreePaintRect
} from "./native-katex-paint-geometry.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";

const KP_LOG_EQUIVALENCE_ROUTE_SAMPLE_COUNT = 72;
const KP_LOG_EQUIVALENCE_ROUTE_CLEARANCE_FACTORS =
  [0.75, 1, 1.25, 1.5, 2, 2.5, 2.75, 3, 3.5] as const;
const KP_LOG_EQUIVALENCE_PAINT_CONTACT_TOLERANCE_PX = 0.5;
const KP_LOG_EQUIVALENCE_SYNC_TOLERANCE = 1 / 1_024;

export interface KpLogProductEquivalenceRouteEvidenceV2 {
  readonly kind: "log-product-equivalence-route-evidence-v2";
  readonly lifecycle: "renderer-session-ephemeral";
  readonly presentationPlanId: string;
  readonly transitionId: string;
  readonly measurementIdentity: {
    readonly revision: number;
    readonly coordinateSpaceId: string;
  };
  readonly equalityOccurrenceId: string;
  readonly equalityPaintRect: KpEquationLayoutRect;
  readonly routeBindings: readonly {
    readonly recordId: string;
    readonly sourceEntityId: string;
    readonly targetEntityId: string;
    readonly trackId: string;
    readonly variant: "arc-above" | "arc-below";
  }[];
  readonly targetArrivalId: string;
  readonly toJSON: () => never;
}

export interface KpLogProductEquivalenceRouteCertificateV2 {
  readonly kind: "log-product-equivalence-route-certificate-v2";
  readonly lifecycle: "renderer-session-ephemeral";
  readonly presentationPlanId: string;
  readonly transitionId: string;
  readonly measurementIdentity:
    KpLogProductEquivalenceRouteEvidenceV2["measurementIdentity"];
  readonly routedTrackIds: readonly string[];
  readonly variants: readonly ("arc-above" | "arc-below")[];
  readonly protectedTransit: KpEquationProtectedTransitCertificate;
  readonly proofs: {
    readonly equalityClearance: "dense-measured-paint-audit";
    readonly endpointSettlement: "native-measured-endpoints";
    readonly wrapperArrival: "canonical-function-wrap-reception";
    readonly connectorArrival: "synchronized-with-derived-operators";
    readonly concealment: "no-backing-plate";
  };
  readonly toJSON: () => never;
}

const routeEvidence = new WeakSet<object>();
const routeCertificates = new WeakSet<object>();

/**
 * The semantic plan names the equality boundary; only this renderer-session
 * adapter may turn its measured ink into physical routes.
 */
export function routeKpNativeKatexLogProductEquivalenceV2(input: {
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly relationElement: HTMLElement;
  readonly presentationPlan:
    KpCompiledEquationPresentationPlanV2<
      KpLogProductEquivalenceDomainPayloadV2
    >;
  readonly occurrences: KpCompiledLogProductEquivalenceOccurrencesV2;
}): Readonly<{
  tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  evidence: KpLogProductEquivalenceRouteEvidenceV2;
}> {
  const resolved = resolveAuthority(input);
  const equalityPaintRect = measureNativeRelationInk(
    input.source.stage,
    input.relationElement
  );
  const sourceByAtom = new Map(input.source.atoms.map((atom) =>
    [atom.id, atom] as const));
  const targetByAtom = new Map(input.target.atoms.map((atom) =>
    [atom.id, atom] as const));
  const recordsById = new Map(
    resolved.transition.transit.transitRecords.map((record) =>
      [record.recordId, record] as const)
  );
  const selectedTracks = new Map<string, {
    readonly recordId: string;
    readonly sourceEntityId: string;
    readonly targetEntityId: string;
    readonly variant: "arc-above" | "arc-below";
  }>();

  resolved.payload.factorContinuityRecordIds.forEach((recordId, index) => {
    const record = recordsById.get(recordId);
    const sourceEntityId = record?.sourceEntityIds[0];
    const targetEntityId = record?.targetEntityIds[0];
    if (
      record === undefined ||
      !record.boundaryIntentIds.includes(resolved.boundary.id) ||
      sourceEntityId === undefined ||
      targetEntityId === undefined
    ) {
      throw new Error(
        `Log equivalence factor route ${recordId} lacks boundary authority.`
      );
    }
    const matches = input.tracks.filter((track) => {
      const sourceEntity = track.sourceAtomId === undefined
        ? undefined
        : sourceByAtom.get(track.sourceAtomId)?.semanticEntityId;
      const targetEntity = track.targetAtomId === undefined
        ? undefined
        : targetByAtom.get(track.targetAtomId)?.semanticEntityId;
      return track.lifecycle === "persist" &&
        sourceEntity === sourceEntityId && targetEntity === targetEntityId;
    });
    if (matches.length !== 1) {
      throw new Error(
        `Log equivalence route ${recordId} requires one measured continuant track.`
      );
    }
    const preferred = index % 2 === 0 ? "arc-above" : "arc-below";
    selectedTracks.set(matches[0]!.id, {
      recordId,
      sourceEntityId,
      targetEntityId,
      variant: preferred
    });
  });

  const tracks = Object.freeze(input.tracks.map((track) => {
    const binding = selectedTracks.get(track.id);
    if (binding === undefined) return track;
    const start = center(track.startPaintRect);
    const end = center(track.endPaintRect);
    const moverRadius = Math.max(
      track.startPaintRect.width,
      track.startPaintRect.height,
      track.endPaintRect.width,
      track.endPaintRect.height
    ) / 2;
    const baseClearance = equalityPaintRect.height + moverRadius;
    let selected:
      ReturnType<typeof planKpEquationMotionPathBetweenPoints>["selected"] |
      undefined;
    const withoutPath = removeHorizontalAxisConstraint(
      invalidateKpNativeKatexMotionPath(track)
    );
    for (const factor of KP_LOG_EQUIVALENCE_ROUTE_CLEARANCE_FACTORS) {
      const plan = planKpEquationMotionPathBetweenPoints({
        id: `route.log-product-equivalence.${binding.recordId}`,
        relationRecordId: binding.recordId,
        start,
        end,
        obstacles: [equalityPaintRect],
        moverRadius,
        sampleCount: KP_LOG_EQUIVALENCE_ROUTE_SAMPLE_COUNT,
        variants: [binding.variant],
        preferredVariant: binding.variant,
        clearance: baseClearance * factor
      });
      const trial = Object.freeze({
        ...withoutPath,
        motionPath: plan.selected,
        motionPathSampling: "planned-curve" as const
      }) as KpNativeKatexPaintMeasuredSceneTrack;
      // The generic planner uses a conservative bounding circle. Native ink
      // may legitimately touch the equality's reading-side edge at its final
      // endpoint, so final authority is the dense measured-paint audit.
      if (routeClearsEquality(trial, equalityPaintRect)) {
        selected = plan.selected;
        break;
      }
    }
    if (selected === undefined) {
      throw new Error(
        `Measured route ${binding.recordId} cannot clear the equality ink.`
      );
    }
    return Object.freeze({
      ...withoutPath,
      motionPath: selected,
      motionPathSampling: "planned-curve" as const
    }) as KpNativeKatexPaintMeasuredSceneTrack;
  }));
  const evidenceValue = Object.freeze({
    kind: "log-product-equivalence-route-evidence-v2" as const,
    lifecycle: "renderer-session-ephemeral" as const,
    presentationPlanId: input.presentationPlan.id,
    transitionId: resolved.transition.id,
    measurementIdentity: Object.freeze({
      revision: input.source.fontRevision,
      coordinateSpaceId: sharedViewportKey(input.source, input.target)
    }),
    equalityOccurrenceId: input.occurrences.equality.id,
    equalityPaintRect: Object.freeze({ ...equalityPaintRect }),
    routeBindings: Object.freeze([...selectedTracks].map(
      ([trackId, binding]) => Object.freeze({ ...binding, trackId })
    )),
    targetArrivalId: resolved.arrival.id,
    toJSON(): never {
      throw new Error("Measured log-equivalence routes cannot enter durable state.");
    }
  });
  routeEvidence.add(evidenceValue);
  return Object.freeze({ tracks, evidence: evidenceValue });
}

function routeClearsEquality(
  track: KpNativeKatexPaintMeasuredSceneTrack,
  equalityPaintRect: KpEquationLayoutRect
): boolean {
  for (let index = 0; index <= KP_LOG_EQUIVALENCE_ROUTE_SAMPLE_COUNT;
    index += 1) {
    if (overlaps(
      sampleKpEquationMotionTrackPaintRect(
        track,
        index / KP_LOG_EQUIVALENCE_ROUTE_SAMPLE_COUNT
      ),
      equalityPaintRect,
      KP_LOG_EQUIVALENCE_PAINT_CONTACT_TOLERANCE_PX
    )) return false;
  }
  return true;
}

export function certifyKpNativeKatexLogProductEquivalenceRoutesV2(input: {
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly protectedTransit: KpEquationProtectedTransitCertificate;
  readonly evidence: KpLogProductEquivalenceRouteEvidenceV2;
  readonly functionWrap:
    KpNativeKatexFunctionWrapAdaptationCertificate;
  readonly presentationPlan:
    KpCompiledEquationPresentationPlanV2<
      KpLogProductEquivalenceDomainPayloadV2
    >;
}): KpLogProductEquivalenceRouteCertificateV2 {
  if (!routeEvidence.has(input.evidence) ||
      !isKpCompiledEquationPresentationPlanV2(input.presentationPlan) ||
      input.evidence.presentationPlanId !== input.presentationPlan.id) {
    throw new Error(
      "Log equivalence certification requires nominal route and presentation authority."
    );
  }
  const tracksById = new Map(input.tracks.map((track) => [track.id, track]));
  const routed = input.evidence.routeBindings.map((binding) => {
    const track = tracksById.get(binding.trackId);
    if (track === undefined || track.motionPath === undefined ||
        !isRelationArc(track.motionPath.variant)) {
      throw new Error(
        `Protected transit lost relation route ${binding.trackId}.`
      );
    }
    for (let index = 0; index <= KP_LOG_EQUIVALENCE_ROUTE_SAMPLE_COUNT;
      index += 1) {
      const rect = sampleKpEquationMotionTrackPaintRect(
        track,
        index / KP_LOG_EQUIVALENCE_ROUTE_SAMPLE_COUNT
      );
      if (overlaps(rect, input.evidence.equalityPaintRect,
        KP_LOG_EQUIVALENCE_PAINT_CONTACT_TOLERANCE_PX)) {
        throw new Error(
          `Protected transit ${binding.trackId} crosses equality paint.`
        );
      }
    }
    return track;
  });
  certifyTargetArrivals(input);
  const certificate = Object.freeze({
    kind: "log-product-equivalence-route-certificate-v2" as const,
    lifecycle: "renderer-session-ephemeral" as const,
    presentationPlanId: input.presentationPlan.id,
    transitionId: input.evidence.transitionId,
    measurementIdentity: input.evidence.measurementIdentity,
    routedTrackIds: Object.freeze(routed.map(({ id }) => id)),
    variants: Object.freeze(routed.map(({ motionPath }) =>
      motionPath!.variant as "arc-above" | "arc-below")),
    protectedTransit: input.protectedTransit,
    proofs: Object.freeze({
      equalityClearance: "dense-measured-paint-audit" as const,
      endpointSettlement: "native-measured-endpoints" as const,
      wrapperArrival: "canonical-function-wrap-reception" as const,
      connectorArrival: "synchronized-with-derived-operators" as const,
      concealment: "no-backing-plate" as const
    }),
    toJSON(): never {
      throw new Error(
        "Certified log-equivalence routes cannot enter durable state."
      );
    }
  });
  routeCertificates.add(certificate);
  return certificate;
}

export function isKpLogProductEquivalenceRouteCertificateV2(
  value: unknown
): value is KpLogProductEquivalenceRouteCertificateV2 {
  return typeof value === "object" && value !== null &&
    routeCertificates.has(value);
}

function resolveAuthority(input: {
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly relationElement: HTMLElement;
  readonly presentationPlan:
    KpCompiledEquationPresentationPlanV2<
      KpLogProductEquivalenceDomainPayloadV2
    >;
  readonly occurrences: KpCompiledLogProductEquivalenceOccurrencesV2;
}) {
  if (!isKpCompiledEquationPresentationPlanV2(input.presentationPlan) ||
      !isKpCompiledLogProductEquivalenceOccurrencesV2(input.occurrences)) {
    throw new Error("Log equivalence routing requires compiled v2 authority.");
  }
  if (input.source.stage !== input.target.stage ||
      input.source.fontRevision !== input.target.fontRevision ||
      sharedViewportKey(input.source, input.target) === "") {
    throw new Error("Log equivalence routes require one settled measurement.");
  }
  if (input.relationElement.dataset["kpStateRetentionOccurrenceId"] !==
      input.occurrences.equality.id) {
    throw new Error("Measured equality paint belongs to another occurrence.");
  }
  const transition = input.presentationPlan.transitions.find(({ id }) =>
    id === input.occurrences.transitionId);
  const payload = transition?.domainPayloads[0];
  if (transition === undefined ||
      payload?.kind !== "equation-domain.log-product-equivalence.v2" ||
      transition.transit.boundaries.length !== 1 ||
      transition.transit.arrivals.length !== 1) {
    throw new Error("Log equivalence plan lacks one boundary and arrival.");
  }
  return {
    transition,
    payload,
    boundary: transition.transit.boundaries[0]!,
    arrival: transition.transit.arrivals[0]!
  };
}

function sharedViewportKey(
  source: KpNativeKatexRenderedSceneObservation,
  target: KpNativeKatexRenderedSceneObservation
): string {
  const sourceKey = source.viewportKey.replace(/^source:/u, "");
  const targetKey = target.viewportKey.replace(/^target:/u, "");
  return sourceKey === targetKey ? sourceKey : "";
}

function measureNativeRelationInk(
  stage: HTMLElement,
  relation: HTMLElement
): KpEquationLayoutRect {
  const previousTransform = relation.style.transform;
  relation.style.transform = "none";
  try {
    const rect = measureKpNativeKatexSubtreePaintRect(stage, relation);
    if (rect === undefined || rect.width <= 0 || rect.height <= 0) {
      throw new Error("The equality occurrence has no measurable native ink.");
    }
    return rect;
  } finally {
    relation.style.transform = previousTransform;
  }
}

function certifyTargetArrivals(input: {
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly evidence: KpLogProductEquivalenceRouteEvidenceV2;
  readonly functionWrap:
    KpNativeKatexFunctionWrapAdaptationCertificate;
  readonly presentationPlan:
    KpCompiledEquationPresentationPlanV2<
      KpLogProductEquivalenceDomainPayloadV2
    >;
}): void {
  const transition = input.presentationPlan.transitions.find(({ id }) =>
    id === input.evidence.transitionId)!;
  const payload = transition.domainPayloads[0]!;
  const targetEntityByAtom = new Map(input.target.atoms.map((atom) =>
    [atom.id, atom.semanticEntityId] as const));
  const targetTracks = input.tracks.filter(({ targetAtomId }) =>
    targetAtomId !== undefined);
  const paintedWrapperIds = new Set(input.target.atoms
    .map(({ semanticEntityId }) => semanticEntityId)
    .filter((id) => payload.targetWrapperEntityIds.includes(id)));
  const arrivedWrapperIds = new Set(targetTracks
    .map(({ targetAtomId }) => targetEntityByAtom.get(targetAtomId!))
    .filter((id): id is string => id !== undefined &&
      paintedWrapperIds.has(id)));
  if ([...paintedWrapperIds].some((id) => !arrivedWrapperIds.has(id)) ||
      input.functionWrap.settlement !== "native-measured-endpoint") {
    throw new Error("Canonical function-wrap reception did not settle.");
  }
  const connectorTracks = targetTracks.filter(({ targetAtomId }) =>
    payload.connectorEntityIds.includes(targetEntityByAtom.get(targetAtomId!) ?? ""));
  const operatorTracks = targetTracks.filter(({ targetAtomId }) =>
    payload.targetOperatorEntityIds.includes(
      targetEntityByAtom.get(targetAtomId!) ?? ""
    ));
  if (connectorTracks.length === 0 || operatorTracks.length === 0) {
    throw new Error("Log equivalence target lacks operator/connector paint.");
  }
  const samples = [0, 0.25, 0.5, 0.75, 1] as const;
  for (const connector of connectorTracks) {
    for (const operator of operatorTracks) {
      for (const progress of samples) {
        const connectorPresence = connector.sampleOpacityProgress?.(progress) ??
          progress;
        const operatorPresence = operator.sampleOpacityProgress?.(progress) ??
          progress;
        if (Math.abs(connectorPresence - operatorPresence) >
            KP_LOG_EQUIVALENCE_SYNC_TOLERANCE) {
          throw new Error(
            "Connector arrival is not synchronized with derived operators."
          );
        }
        const connectorScale = connector.sampleMaterialScale?.(progress) ?? 1;
        const operatorScale = operator.sampleMaterialScale?.(progress) ?? 1;
        if (Math.abs(connectorScale - operatorScale) >
            KP_LOG_EQUIVALENCE_SYNC_TOLERANCE) {
          throw new Error(
            "Connector expansion is not synchronized with derived operators."
          );
        }
      }
    }
  }
}

function removeHorizontalAxisConstraint<Track extends {
  readonly motionAxisConstraint?: "horizontal" | undefined;
}>(track: Track): Omit<Track, "motionAxisConstraint"> {
  const { motionAxisConstraint: _axis, ...withoutAxis } = track;
  return withoutAxis;
}

function center(rect: KpEquationLayoutRect): { x: number; y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function overlaps(
  left: KpEquationLayoutRect,
  right: KpEquationLayoutRect,
  tolerance: number
): boolean {
  return left.left + left.width > right.left + tolerance &&
    right.left + right.width > left.left + tolerance &&
    left.top + left.height > right.top + tolerance &&
    right.top + right.height > left.top + tolerance;
}

function isRelationArc(
  variant: KpEquationMotionPathVariantId
): variant is "arc-above" | "arc-below" {
  return variant === "arc-above" || variant === "arc-below";
}
