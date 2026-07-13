import {
  describeKpAnimationAssetTransformationTree,
  type KpAnimationAsset
} from "../animation/asset.ts";
import type {
  KpParentTimeline,
  KpParentTimelineTrack
} from "./parent-timeline.ts";
import type {
  KpTutorialStaticStepAuthoredMarker,
  KpTutorialStaticStepCheckpoint
} from "./static-step-artifact.ts";

export function selectKpTutorialStaticStepCheckpoints(
  timeline: KpParentTimeline
): readonly KpTutorialStaticStepCheckpoint[] {
  return [
    createInitialCheckpoint(timeline),
    ...[...timeline.tracks]
      .filter(isTransformationTrack)
      .sort((left, right) => left.order - right.order)
      .map((track) => createTransformationCheckpoint(timeline, track))
  ];
}

export function selectKpAnimationStaticStepCheckpoints(
  animation: KpAnimationAsset
): readonly KpTutorialStaticStepCheckpoint[] {
  const description = describeKpAnimationAssetTransformationTree(animation);
  const timelineId = animation.timeline?.id ?? animation.id;
  const phaseCount = description.forwardPhases.length;
  const beatCount = animation.timeline?.beatCount ?? description.forwardPhases.length;
  const annotationById = new Map(
    description.annotations.map((annotation) => [annotation.id, annotation])
  );
  const transformationTitleById = new Map(
    animation.transformations.map((transformation) => [
      transformation.id,
      transformation.title
    ])
  );

  return [
    {
      id: `step.${animation.id}.start`,
      label: "Start",
      progress: 0,
      beat: 0,
      timelineId,
      summary: "Initial animation asset state."
    },
    ...description.forwardPhases.map((phase, index) => {
      const phaseNumber = index + 1;
      const progress = phaseNumber / phaseCount;
      const label = phase.nodeIds
        .map((nodeId) => transformationTitleById.get(nodeId) ?? nodeId)
        .join(", ");
      const markers = animationCheckpointMarkers(phase, annotationById);

      return {
        id: `step.${phase.nodeIds[0] ?? phase.id}`,
        label,
        progress,
        beat: (beatCount * phaseNumber) / phaseCount,
        timelineId,
        summary: label,
        ...(markers.length === 0 ? {} : { markers })
      };
    })
  ];
}

function createInitialCheckpoint(
  timeline: KpParentTimeline
): KpTutorialStaticStepCheckpoint {
  return {
    id: `step.${timeline.id}.start`,
    label: "Start",
    progress: 0,
    beat: 0,
    timelineId: timeline.id,
    summary: "Initial tutorial card state."
  };
}

function animationCheckpointMarkers(
  phase: ReturnType<typeof describeKpAnimationAssetTransformationTree>["forwardPhases"][number],
  annotationById: ReadonlyMap<
    string,
    ReturnType<typeof describeKpAnimationAssetTransformationTree>["annotations"][number]
  >
): readonly KpTutorialStaticStepAuthoredMarker[] {
  return [
    ...phase.annotationIdsByPlacement.before,
    ...phase.annotationIdsByPlacement.during,
    ...phase.annotationIdsByPlacement.after
  ].flatMap((annotationId) => {
    const annotation = annotationById.get(annotationId);

    if (annotation === undefined) {
      return [];
    }

    return [
      {
        id: annotation.id,
        kind: annotation.kind === "focus" ? "focus" : "annotation",
        label: annotation.summary ?? `${annotation.kind} ${annotation.placement}`,
        targetId: annotation.targetNodeId,
        ...(annotation.summary === undefined
          ? {}
          : { summary: annotation.summary })
      }
    ];
  });
}

function isTransformationTrack(track: KpParentTimelineTrack): boolean {
  return track.kind === "transformation";
}

function createTransformationCheckpoint(
  timeline: KpParentTimeline,
  track: KpParentTimelineTrack
): KpTutorialStaticStepCheckpoint {
  const label = track.summary ?? track.targetId;

  return {
    id: `step.${track.targetId}`,
    label,
    progress: track.endProgress,
    beat: track.endBeat,
    timelineId: timeline.id,
    ...(track.summary === undefined ? {} : { summary: track.summary })
  };
}
