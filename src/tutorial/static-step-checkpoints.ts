import type {
  KpParentTimeline,
  KpParentTimelineTrack
} from "./parent-timeline.ts";
import type { KpTutorialStaticStepCheckpoint } from "./static-step-artifact.ts";

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
