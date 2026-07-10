import type {
  KpSynchronizedPanelLayoutSample,
  KpSynchronizedPanelTarget
} from "../layout/synchronized-panel.ts";
import type { KpTutorialCardRuntimeContext } from "./card-runtime.ts";
import type {
  KpParentTimeline,
  KpParentTimelineFrame,
  KpParentTimelineTrackFrame
} from "./parent-timeline.ts";

export interface CreateKpTutorialCardLayoutTimelineBindingInput {
  readonly context: KpTutorialCardRuntimeContext;
  readonly parentTimeline: KpParentTimeline;
  readonly layout: KpSynchronizedPanelLayoutSample;
}

export interface KpTutorialCardLayoutTimelineBinding {
  readonly id: string;
  readonly manifestId: string;
  readonly layoutId: string;
  readonly rootLayoutId: string;
  readonly timelineId: string;
  readonly sharedClockId: string;
  readonly panels: readonly KpTutorialCardPanelTimelineBinding[];
  readonly panelsById: ReadonlyMap<string, KpTutorialCardPanelTimelineBinding>;
  readonly controls: readonly KpTutorialCardControlTimelineBinding[];
  readonly diagnostics: readonly KpTutorialCardLayoutTimelineBindingDiagnostic[];
}

export interface KpTutorialCardPanelTimelineBinding {
  readonly panelId: string;
  readonly role: "equation" | "graph";
  readonly target: KpSynchronizedPanelTarget;
  readonly trackIds: readonly string[];
}

export interface KpTutorialCardControlTimelineBinding {
  readonly controlId: string;
  readonly kind: string;
  readonly boundTimelineId: string;
}

export interface KpTutorialCardLayoutTimelineBindingDiagnostic {
  readonly path: string;
  readonly message: string;
}

export interface KpTutorialCardLayoutTimelineBindingFrame {
  readonly bindingId: string;
  readonly layoutId: string;
  readonly timelineId: string;
  readonly progress: number;
  readonly beat: number;
  readonly panels: readonly KpTutorialCardPanelTimelineBindingFrame[];
  readonly controls: readonly KpTutorialCardControlTimelineBindingFrame[];
}

export interface KpTutorialCardPanelTimelineBindingFrame {
  readonly panelId: string;
  readonly role: "equation" | "graph";
  readonly target: KpSynchronizedPanelTarget;
  readonly progress: number;
  readonly activeTrackIds: readonly string[];
  readonly tracks: readonly KpTutorialCardPanelTrackFrame[];
}

export interface KpTutorialCardPanelTrackFrame {
  readonly trackId: string;
  readonly kind: KpParentTimelineTrackFrame["kind"];
  readonly targetId: string;
  readonly active: boolean;
  readonly localProgress: number;
}

export interface KpTutorialCardControlTimelineBindingFrame {
  readonly controlId: string;
  readonly kind: string;
  readonly boundProgress: number;
  readonly boundBeat: number;
}

export function createKpTutorialCardLayoutTimelineBinding(
  input: CreateKpTutorialCardLayoutTimelineBindingInput
): KpTutorialCardLayoutTimelineBinding {
  const diagnostics: KpTutorialCardLayoutTimelineBindingDiagnostic[] = [];
  const panels = input.layout.panels.map((panel, index) => {
    const trackIds = selectTrackIdsForPanel(input, panel.target);

    if (trackIds.length === 0) {
      diagnostics.push({
        path: `layout.panels[${index}].target`,
        message: `Panel ${panel.id} target ${panel.target.id} has no parent timeline tracks.`
      });
    }

    return {
      panelId: panel.id,
      role: panel.role,
      target: { ...panel.target },
      trackIds
    };
  });

  if (input.layout.id !== input.context.rootLayout?.id) {
    diagnostics.push({
      path: "layout.id",
      message: `Layout ${input.layout.id} does not match manifest root layout ${input.context.rootLayout?.id ?? "<missing>"}.`
    });
  }

  if (input.layout.sharedClockId !== input.parentTimeline.clockId) {
    diagnostics.push({
      path: "layout.sharedClockId",
      message: `Layout clock ${input.layout.sharedClockId} does not match parent timeline clock ${input.parentTimeline.clockId ?? "<missing>"}.`
    });
  }

  return {
    id: `${input.context.manifestId}.layout-timeline-binding`,
    manifestId: input.context.manifestId,
    layoutId: input.layout.id,
    rootLayoutId: input.layout.rootLayoutId,
    timelineId: input.parentTimeline.id,
    sharedClockId: input.layout.sharedClockId,
    panels,
    panelsById: new Map(panels.map((panel) => [panel.panelId, panel])),
    controls: input.layout.controls.map((control) => ({
      controlId: control.id,
      kind: control.kind,
      boundTimelineId: input.parentTimeline.id
    })),
    diagnostics
  };
}

export function sampleKpTutorialCardLayoutTimelineBindingFrame(
  binding: KpTutorialCardLayoutTimelineBinding,
  parentFrame: KpParentTimelineFrame
): KpTutorialCardLayoutTimelineBindingFrame {
  const parentTracksById = new Map(
    parentFrame.tracks.map((track) => [track.trackId, track])
  );

  return {
    bindingId: binding.id,
    layoutId: binding.layoutId,
    timelineId: binding.timelineId,
    progress: parentFrame.progress,
    beat: parentFrame.beat,
    panels: binding.panels.map((panel) =>
      samplePanelBinding(panel, parentFrame.progress, parentTracksById)
    ),
    controls: binding.controls.map((control) => ({
      controlId: control.controlId,
      kind: control.kind,
      boundProgress: parentFrame.progress,
      boundBeat: parentFrame.beat
    }))
  };
}

function selectTrackIdsForPanel(
  input: CreateKpTutorialCardLayoutTimelineBindingInput,
  target: KpSynchronizedPanelTarget
): readonly string[] {
  switch (target.kind) {
    case "equation-animation":
      return [
        ...selectSemanticObjectTrackIdsByType(input, "equation"),
        ...input.parentTimeline.tracks
          .filter((track) => track.kind === "transformation")
          .map((track) => track.id)
      ];
    case "graph-surface-mode":
      return input.parentTimeline.tracks
        .filter(
          (track) =>
            track.kind === "semantic-object" && track.targetId === target.id
        )
        .map((track) => track.id);
  }
}

function selectSemanticObjectTrackIdsByType(
  input: CreateKpTutorialCardLayoutTimelineBindingInput,
  objectType: string
): readonly string[] {
  const matchingObjectIds = new Set(
    [...input.context.semanticObjectsById.values()]
      .filter((objectRef) => objectRef.objectType === objectType)
      .map((objectRef) => objectRef.objectId)
  );

  return input.parentTimeline.tracks
    .filter(
      (track) =>
        track.kind === "semantic-object" && matchingObjectIds.has(track.targetId)
    )
    .map((track) => track.id);
}

function samplePanelBinding(
  panel: KpTutorialCardPanelTimelineBinding,
  progress: number,
  parentTracksById: ReadonlyMap<string, KpParentTimelineTrackFrame>
): KpTutorialCardPanelTimelineBindingFrame {
  const tracks = panel.trackIds
    .map((trackId) => parentTracksById.get(trackId))
    .filter(
      (trackFrame): trackFrame is KpParentTimelineTrackFrame =>
        trackFrame !== undefined
    )
    .map((trackFrame) => ({
      trackId: trackFrame.trackId,
      kind: trackFrame.kind,
      targetId: trackFrame.targetId,
      active: trackFrame.active,
      localProgress: trackFrame.localProgress
    }));

  return {
    panelId: panel.panelId,
    role: panel.role,
    target: { ...panel.target },
    progress,
    activeTrackIds: tracks
      .filter((track) => track.active)
      .map((track) => track.trackId),
    tracks
  };
}
