import {
  isKpCompiledSemanticMotionChoreography,
  type KpCompiledSemanticMotionChoreography,
  type KpSemanticMotionTrack
} from "../domain-ir/public-api.ts";
import type { SelectorCorrespondenceRecord } from "../semantic/correspondence.ts";
import {
  planKpEquationMotionPathBetweenPoints,
  type KpEquationMotionPathVariantId
} from "./equation-motion-path-planner.ts";
import {
  createKpNativeKatexTrackProjection,
  type KpNativeKatexTrackProjection
} from "./native-katex-track-projection.ts";

export function createKpNativeKatexSemanticMotionTrackProjection(
  choreography: KpCompiledSemanticMotionChoreography,
  policy: KpNativeKatexSemanticMotionProjectionPolicy = {}
): KpNativeKatexTrackProjection {
  if (!isKpCompiledSemanticMotionChoreography(choreography)) {
    throw new Error(
      "Semantic track projection requires original choreography authority."
    );
  }
  const records = choreography.resolution.precedence.structure.lifecycle
    .provenance.endpointFrontier.request.operation.correspondenceMap.records;
  const semanticTrackByRecordId = semanticTracksByRecord(choreography.tracks);

  return createKpNativeKatexTrackProjection({
    id: `track-projection.${choreography.id}`,
    project(input) {
      const sourceEntities = new Map(input.source.atoms.map((atom) => [
        atom.id,
        atom.semanticEntityId
      ]));
      const targetEntities = new Map(input.target.atoms.map((atom) => [
        atom.id,
        atom.semanticEntityId
      ]));
      return Object.freeze(input.tracks.map((track) => {
        const sourceEntityId = track.sourceAtomId === undefined
          ? undefined
          : sourceEntities.get(track.sourceAtomId);
        const targetEntityId = track.targetAtomId === undefined
          ? undefined
          : targetEntities.get(track.targetAtomId);
        const record = matchingRecord(
          records,
          track.lifecycle,
          sourceEntityId,
          targetEntityId
        );
        if (record === undefined) return track;
        const semanticTrack = semanticTrackByRecordId.get(record.id);
        if (semanticTrack === undefined) {
          throw new Error(
            `Paint-bearing correspondence ${record.id} lacks a semantic track.`
          );
        }
        const sample = (progress: number) => sampleTrack(
          semanticTrack,
          progress
        );
        const route =
          (targetEntityId === undefined
            ? undefined
            : policy.routeByTargetEntityId?.[targetEntityId]) ??
          (sourceEntityId === undefined
            ? undefined
            : policy.routeBySourceEntityId?.[sourceEntityId]) ??
          policy.routeByCorrespondenceRecordId?.[record.id];
        if (
          route?.clearanceInInkHeights !== undefined &&
          (!Number.isFinite(route.clearanceInInkHeights) ||
            route.clearanceInInkHeights <= 0)
        ) {
          throw new Error(
            `Semantic route ${record.id} requires positive ink-height clearance.`
          );
        }
        if (
          route?.emergence === "branch-from-source" &&
          track.lifecycle !== "split"
        ) {
          throw new Error(
            `Semantic route ${record.id} can emerge from source only for split paint.`
          );
        }
        const branchOpacitySample = (progress: number) =>
          smoothstep(clamp01((sample(progress) - 0.2) / 0.8));
        return Object.freeze({
          ...track,
          semanticMotionUnitId: record.id,
          timingGroupId: semanticTrack.eventId,
          opacityScheduleAuthority: "semantic-choreography" as const,
          sampleProgress: sample,
          ...(route?.emergence === "branch-from-source"
            ? { samplePaintPresence: branchOpacitySample }
            : {}),
          ...(route?.intentionalContactGroupId === undefined
            ? {}
            : {
                intentionalContactGroupId:
                  route.intentionalContactGroupId
              }),
          ...(route === undefined
            ? {}
            : {
                motionPath: planKpEquationMotionPathBetweenPoints({
                  id: `semantic-route.${record.id}.${track.id}`,
                  relationRecordId: record.id,
                  start: rectCenter(track.startPaintRect ?? track.startRect),
                  end: rectCenter(track.endPaintRect ?? track.endRect),
                  variants: [route.variant],
                  preferredVariant: route.variant,
                  ...(route.clearanceInInkHeights === undefined
                    ? {}
                    : {
                        clearance: Math.max(
                          track.startPaintRect?.height ?? track.startRect.height,
                          track.endPaintRect?.height ?? track.endRect.height
                        ) * route.clearanceInInkHeights
                      })
                }).selected,
                motionPathSampling: "planned-curve" as const
              }),
          ...(track.lifecycle === "introduce" || track.lifecycle === "eliminate"
            ? { sampleOpacityProgress: sample }
            : {})
        });
      }));
    }
  });
}

export interface KpNativeKatexSemanticMotionProjectionPolicy {
  readonly routeByCorrespondenceRecordId?: KpNativeKatexSemanticRouteRegistry | undefined;
  readonly routeBySourceEntityId?: KpNativeKatexSemanticRouteRegistry | undefined;
  readonly routeByTargetEntityId?: KpNativeKatexSemanticRouteRegistry | undefined;
}

export type KpNativeKatexSemanticRouteRegistry = Readonly<
  Partial<Record<string, KpNativeKatexSemanticRoute>>
>;

export interface KpNativeKatexSemanticRoute {
  readonly variant: Extract<
    KpEquationMotionPathVariantId,
    "direct" | "arc-above" | "arc-below"
  >;
  readonly clearanceInInkHeights?: number | undefined;
  readonly intentionalContactGroupId?: string | undefined;
  readonly emergence?: "branch-from-source" | undefined;
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value);
}

function semanticTracksByRecord(
  tracks: readonly KpSemanticMotionTrack[]
): ReadonlyMap<string, KpSemanticMotionTrack> {
  const byRecord = new Map<string, KpSemanticMotionTrack>();
  for (const track of tracks) {
    for (const recordId of track.correspondenceRecordIds) {
      if (byRecord.has(recordId)) {
        throw new Error(
          `Semantic correspondence ${recordId} belongs to multiple schedule tracks.`
        );
      }
      byRecord.set(recordId, track);
    }
  }
  return byRecord;
}

function matchingRecord(
  records: readonly SelectorCorrespondenceRecord[],
  lifecycle: "persist" | "merge" | "split" | "introduce" | "eliminate" | "unsupported",
  sourceEntityId: string | undefined,
  targetEntityId: string | undefined
): SelectorCorrespondenceRecord | undefined {
  const matches = records.filter((record) => {
    if (lifecycle === "introduce") {
      return targetEntityId !== undefined &&
        record.targetSelectorIds.includes(targetEntityId);
    }
    if (lifecycle === "eliminate") {
      return sourceEntityId !== undefined &&
        record.sourceSelectorIds.includes(sourceEntityId);
    }
    return sourceEntityId !== undefined && targetEntityId !== undefined &&
      record.sourceSelectorIds.includes(sourceEntityId) &&
      record.targetSelectorIds.includes(targetEntityId);
  });
  if (matches.length > 1) {
    throw new Error(
      `Native paint track ambiguously matches ${matches.map(({ id }) => id).join(", ")}.`
    );
  }
  return matches[0];
}

function sampleTrack(track: KpSemanticMotionTrack, progress: number): number {
  if (progress <= track.window.start) return 0;
  if (progress >= track.window.end) return 1;
  const local = (progress - track.window.start) /
    (track.window.end - track.window.start);
  return track.interpolation === "linear"
    ? local
    : local * local * (3 - 2 * local);
}

function rectCenter(rect: {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}): { readonly x: number; readonly y: number } {
  return Object.freeze({
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  });
}
