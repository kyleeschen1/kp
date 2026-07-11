import type { KpTutorialGraphFrameAdapter } from "./graph-frame-adapter.ts";

export interface KpTutorialGraphParentTimelineDiagnosticInput {
  readonly adapter: KpTutorialGraphFrameAdapter;
  readonly timelineId: string;
  readonly sampleProgresses: readonly number[];
}

export interface KpTutorialGraphParentTimelineDiagnostic {
  readonly id: string;
  readonly panelId: string;
  readonly graphId: string;
  readonly timelineId: string;
  readonly samples: readonly KpTutorialGraphParentTimelineDiagnosticSample[];
  readonly diagnostics: readonly KpTutorialGraphParentTimelineDiagnosticIssue[];
}

export interface KpTutorialGraphParentTimelineDiagnosticSample {
  readonly requestedProgress: number;
  readonly parentTimelineId: string;
  readonly cardProgress: number;
  readonly graphProgress: number;
  readonly graphTrackActive: boolean;
  readonly graphTrackStartProgress: number;
  readonly graphTrackEndProgress: number;
  readonly graphTrackLocalProgress: number;
  readonly frameProgress: number;
  readonly graphFrameTimelineId: string | undefined;
  readonly graphTrackId: string;
  readonly graphFrameTimelineMatchesParent: boolean;
  readonly graphProgressMatchesCard: boolean;
  readonly frameProgressMatchesGraph: boolean;
}

export interface KpTutorialGraphParentTimelineDiagnosticIssue {
  readonly path: string;
  readonly message: string;
}

export function createKpTutorialGraphParentTimelineDiagnostic(
  input: KpTutorialGraphParentTimelineDiagnosticInput
): KpTutorialGraphParentTimelineDiagnostic {
  const samples = input.sampleProgresses.map((progress) =>
    sampleGraphTimeline(input.adapter, progress, input.timelineId)
  );
  const diagnostics = samples.flatMap((sample, index) =>
    diagnoseGraphTimelineSample(sample, index, input.timelineId)
  );

  return {
    id: `diagnostic.${input.adapter.panelId}.parent-timeline`,
    panelId: input.adapter.panelId,
    graphId: input.adapter.graphId,
    timelineId: input.timelineId,
    samples,
    diagnostics
  };
}

function sampleGraphTimeline(
  adapter: KpTutorialGraphFrameAdapter,
  requestedProgress: number,
  parentTimelineId: string
): KpTutorialGraphParentTimelineDiagnosticSample {
  const frame = adapter.sample(requestedProgress);
  const graphFrameTimelineMatchesParent =
    frame.graphFrame.timelineId === parentTimelineId;
  const graphProgressMatchesCard = near(
    frame.graphProgress,
    frame.cardProgress
  );
  const frameProgressMatchesGraph = near(
    frame.graphFrame.progress,
    frame.graphProgress
  );

  return {
    requestedProgress,
    parentTimelineId,
    cardProgress: frame.cardProgress,
    graphProgress: frame.graphProgress,
    graphTrackActive: frame.graphTrackActive,
    graphTrackStartProgress: frame.graphTrackStartProgress,
    graphTrackEndProgress: frame.graphTrackEndProgress,
    graphTrackLocalProgress: frame.graphTrackLocalProgress,
    frameProgress: frame.graphFrame.progress,
    graphFrameTimelineId: frame.graphFrame.timelineId,
    graphTrackId: frame.graphTrackId,
    graphFrameTimelineMatchesParent,
    graphProgressMatchesCard,
    frameProgressMatchesGraph
  };
}

function diagnoseGraphTimelineSample(
  sample: KpTutorialGraphParentTimelineDiagnosticSample,
  index: number,
  timelineId: string
): readonly KpTutorialGraphParentTimelineDiagnosticIssue[] {
  const diagnostics: KpTutorialGraphParentTimelineDiagnosticIssue[] = [];

  if (!sample.graphFrameTimelineMatchesParent) {
    diagnostics.push({
      path: `samples[${index}].graphFrame.timelineId`,
      message: `Graph frame timeline ${sample.graphFrameTimelineId ?? "<missing>"} does not match parent timeline ${timelineId}.`
    });
  }

  if (!sample.graphProgressMatchesCard) {
    diagnostics.push({
      path: `samples[${index}].graphProgress`,
      message: `Graph progress ${sample.graphProgress} does not match card progress ${sample.cardProgress}.`
    });
  }

  if (!sample.frameProgressMatchesGraph) {
    diagnostics.push({
      path: `samples[${index}].frameProgress`,
      message: `Graph frame progress ${sample.frameProgress} does not match graph progress ${sample.graphProgress}.`
    });
  }

  return diagnostics;
}

function near(left: number, right: number): boolean {
  return Math.abs(left - right) < 1e-9;
}
