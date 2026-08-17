import {
  kpCanonicalFunctionWrapMotionProfile,
  type KpFunctionWrapReceptionPlan
} from "../animation/function-wrap-motif.ts";
import { kpCanonicalEquationMotionVocabulary } from "../domain-ir/equation-motion-vocabulary.ts";
import type {
  KpNativeKatexPaintMeasuredSceneTrack
} from "./native-katex-scene-compositor.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";

export const kpNativeKatexFunctionWrapReceptionStyle = Object.freeze({
  initialScale:
    kpCanonicalFunctionWrapMotionProfile.enclosureReception.initialScale,
  outwardOffsetInNativeHeights: 0.42
});

export type KpNativeKatexFunctionWrapReceptionMotion =
  | "canonical-scale-settle"
  | "horizontal-squeeze";

const kpNativeKatexHorizontalSqueezeReceptionStyle = Object.freeze({
  initialScale: 1,
  outwardOffsetInNativeHeights: 0.85,
  opacityCompletionFraction: 0.42
});

export interface KpNativeKatexFunctionWrapAdaptationCertificate {
  readonly schemaVersion: "kp.native-katex-function-wrap-certificate.v1";
  readonly motifId: KpFunctionWrapReceptionPlan["motifId"];
  readonly rendererCapabilityId:
    typeof kpCanonicalEquationMotionVocabulary.rendererCapabilities.nativeKatexV1;
  readonly direction: "forward" | "rewind";
  readonly nativeEndpoint: "source" | "target";
  readonly timingGroupId: string;
  readonly matchedEnclosureEntityIds: readonly string[];
  readonly synchronization: "all-enclosures-together";
  readonly settlement: "native-measured-endpoint";
}

export interface KpNativeKatexFunctionWrapAdaptation {
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly certificate: KpNativeKatexFunctionWrapAdaptationCertificate;
}

/**
 * Native KaTeX owns the physical expression of enclosure reception. The plan
 * supplies semantic leading/trailing roles, so this adapter never guesses
 * from glyph text, selector suffixes, or DOM order.
 */
export function applyKpNativeKatexFunctionWrapReception(input: {
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly plan: KpFunctionWrapReceptionPlan;
  readonly entryWindow: { readonly start: number; readonly end: number };
  readonly presenceWindow?: {
    readonly start: number;
    readonly end: number;
  } | undefined;
  readonly motion?: KpNativeKatexFunctionWrapReceptionMotion | undefined;
}): readonly KpNativeKatexPaintMeasuredSceneTrack[] {
  return adaptKpNativeKatexFunctionWrapReception(input).tracks;
}

export function adaptKpNativeKatexFunctionWrapReception(input: {
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly plan: KpFunctionWrapReceptionPlan;
  readonly entryWindow: { readonly start: number; readonly end: number };
  readonly presenceWindow?: {
    readonly start: number;
    readonly end: number;
  } | undefined;
  readonly motion?: KpNativeKatexFunctionWrapReceptionMotion | undefined;
}): KpNativeKatexFunctionWrapAdaptation {
  if (input.plan.motifId !== kpCanonicalEquationMotionVocabulary.motifs.functionWrapV1) {
    throw new Error(`Native KaTeX function-wrap adapter rejects motif ${input.plan.motifId}.`);
  }
  if (
    !Number.isFinite(input.entryWindow.start) ||
    !Number.isFinite(input.entryWindow.end) ||
    input.entryWindow.start < 0 ||
    input.entryWindow.end > 1 ||
    input.entryWindow.start >= input.entryWindow.end
  ) {
    throw new Error("Native KaTeX function-wrap entry window must be ordered within unit progress.");
  }
  if (
    input.presenceWindow !== undefined &&
    (
      !Number.isFinite(input.presenceWindow.start) ||
      !Number.isFinite(input.presenceWindow.end) ||
      input.presenceWindow.start < 0 ||
      input.presenceWindow.end > input.entryWindow.start ||
      input.presenceWindow.start >= input.presenceWindow.end
    )
  ) {
    throw new Error(
      "Native KaTeX function-wrap presence must resolve before entry motion begins."
    );
  }
  const endpoint = input.plan.direction === "forward"
    ? input.target
    : input.source;
  const expectedLifecycle = input.plan.direction === "forward"
    ? "introduce" as const
    : "eliminate" as const;
  const entityByAtomId = new Map(endpoint.atoms.map((atom) => [
    atom.id,
    atom.semanticEntityId
  ]));
  const roleByEntityId = new Map(input.plan.branches.flatMap((branch) =>
    branch.enclosureEntityRoles.map((role) => [
      role.entityId,
      role.side
    ] as const)
  ));
  const matched = new Set<string>();
  const motion = input.motion ?? "canonical-scale-settle";
  const sample = (progress: number) => smoothWindow(
    progress,
    input.entryWindow.start,
    input.entryWindow.end
  );
  const sampleOpacity = input.presenceWindow !== undefined
    ? (progress: number) => smoothWindow(
        progress,
        input.presenceWindow!.start,
        input.presenceWindow!.end
      )
    : motion === "horizontal-squeeze"
    ? (progress: number) => smoothWindow(
        progress,
        input.entryWindow.start,
        input.entryWindow.start +
          (input.entryWindow.end - input.entryWindow.start) *
            kpNativeKatexHorizontalSqueezeReceptionStyle
              .opacityCompletionFraction
      )
    : sample;
  const tracks = input.tracks.map((track) => {
    const atomId = input.plan.direction === "forward"
      ? track.targetAtomId
      : track.sourceAtomId;
    const entityId = atomId === undefined
      ? undefined
      : entityByAtomId.get(atomId);
    const side = entityId === undefined
      ? undefined
      : roleByEntityId.get(entityId);
    if (side === undefined || track.lifecycle !== expectedLifecycle) {
      return track;
    }
    matched.add(entityId!);
    const nativeLayoutRect = input.plan.direction === "forward"
      ? track.endRect
      : track.startRect;
    const nativePaintRect = input.plan.direction === "forward"
      ? track.endPaintRect ?? track.endRect
      : track.startPaintRect ?? track.startRect;
    const receptionStyle = motion === "horizontal-squeeze"
      ? kpNativeKatexHorizontalSqueezeReceptionStyle
      : kpNativeKatexFunctionWrapReceptionStyle;
    const receptivePaintRect = outsideReceptionRect(
      nativePaintRect,
      side,
      receptionStyle
    );
    // Generic introduction tracks may carry a vertical entry offset. The
    // squeeze treatment owns a horizontal enclosure approach, so its layout
    // box must share the native baseline instead of inheriting that fallback.
    const receptiveLayoutRect = motion === "horizontal-squeeze"
      ? horizontallyOffsetRect(
          nativeLayoutRect,
          nativePaintRect.height * receptionStyle.outwardOffsetInNativeHeights,
          side
        )
      : undefined;
    return Object.freeze({
      ...track,
      ...(input.plan.direction === "forward"
        ? {
            ...(receptiveLayoutRect === undefined
              ? {}
              : {
                  startRect: receptiveLayoutRect,
                  endRect: Object.freeze({ ...nativeLayoutRect })
                }),
            startPaintRect: receptivePaintRect,
            endPaintRect: Object.freeze({ ...nativePaintRect })
          }
        : {
            ...(receptiveLayoutRect === undefined
              ? {}
              : {
                  startRect: Object.freeze({ ...nativeLayoutRect }),
                  endRect: receptiveLayoutRect
                }),
            startPaintRect: Object.freeze({ ...nativePaintRect }),
            endPaintRect: receptivePaintRect
          }),
      timingGroupId: input.plan.id,
      opacityScheduleAuthority: "semantic-choreography" as const,
      sampleProgress: sample,
      sampleOpacityProgress: sampleOpacity,
      ...(motion === "horizontal-squeeze"
        ? { motionAxisConstraint: "horizontal" as const }
        : {})
    });
  });
  const missing = [...roleByEntityId.keys()].filter((id) => !matched.has(id));
  if (missing.length > 0) {
    throw new Error(
      `Function-wrap reception ${input.plan.id} lacks native enclosure paint: ${missing.join(", ")}.`
    );
  }
  const frozenTracks = Object.freeze(tracks);
  return Object.freeze({
    tracks: frozenTracks,
    certificate: Object.freeze({
      schemaVersion: "kp.native-katex-function-wrap-certificate.v1" as const,
      motifId: input.plan.motifId,
      rendererCapabilityId:
        kpCanonicalEquationMotionVocabulary.rendererCapabilities.nativeKatexV1,
      direction: input.plan.direction,
      nativeEndpoint: input.plan.direction === "forward" ? "target" : "source",
      timingGroupId: input.plan.id,
      matchedEnclosureEntityIds: Object.freeze([...matched]),
      synchronization: input.plan.synchronization,
      settlement: "native-measured-endpoint" as const
    })
  });
}

export const kpNativeKatexFunctionWrapAdapterDefinition = Object.freeze({
  schemaVersion: "kp.native-katex-function-wrap-adapter.v1" as const,
  id: kpCanonicalEquationMotionVocabulary.rendererCapabilities.nativeKatexV1,
  motifId: kpCanonicalEquationMotionVocabulary.motifs.functionWrapV1,
  adapt: adaptKpNativeKatexFunctionWrapReception
});

function outsideReceptionRect(
  nativeRect: KpNativeKatexPaintMeasuredSceneTrack["startRect"],
  side: "leading" | "trailing",
  style: {
    readonly initialScale: number;
    readonly outwardOffsetInNativeHeights: number;
  }
): KpNativeKatexPaintMeasuredSceneTrack["startRect"] {
  const scale = style.initialScale;
  const width = nativeRect.width * scale;
  const height = nativeRect.height * scale;
  const outward =
    nativeRect.height *
    style.outwardOffsetInNativeHeights *
    (side === "leading" ? -1 : 1);
  const centerX = nativeRect.left + nativeRect.width / 2 + outward;
  const centerY = nativeRect.top + nativeRect.height / 2;
  return Object.freeze({
    left: centerX - width / 2,
    top: centerY - height / 2,
    width,
    height
  });
}

function horizontallyOffsetRect(
  nativeRect: KpNativeKatexPaintMeasuredSceneTrack["startRect"],
  outwardOffset: number,
  side: "leading" | "trailing"
): KpNativeKatexPaintMeasuredSceneTrack["startRect"] {
  return Object.freeze({
    ...nativeRect,
    left: nativeRect.left + outwardOffset * (side === "leading" ? -1 : 1)
  });
}

function smoothWindow(progress: number, start: number, end: number): number {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  const local = (progress - start) / (end - start);
  return local * local * (3 - 2 * local);
}
