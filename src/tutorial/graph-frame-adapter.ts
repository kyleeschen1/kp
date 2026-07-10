import type { KpAnimationSampler } from "../animation/kernel.ts";
import {
  createGraphSurfaceModeMotionPlan,
  createGraphSurfaceModeSampler,
  createGraphSurfaceModeTransition,
  type GraphSurfaceMorphFrame,
  type GraphSurfaceModeSampler
} from "../rendering/graph-transitions.ts";
import {
  createDefaultGraph3DScene,
  type Graph3DObject,
  type Graph3DSurfaceMode,
  type GraphSceneObject
} from "../semantic/graph.ts";
import type {
  KpTutorialCardFrame,
  KpTutorialCardFrameSampler
} from "./card-frame-sampler.ts";
import type { KpTutorialCardPanelTimelineBindingFrame } from "./layout-timeline-binding.ts";

export interface KpTutorialGraphFrameAdapterOptions {
  readonly scene?: readonly GraphSceneObject[] | undefined;
}

export interface KpTutorialGraphFrameAdapter
  extends KpAnimationSampler<KpTutorialGraphFrame> {
  readonly panelId: string;
  readonly graphId: string;
  readonly surfaceMode: Graph3DSurfaceMode;
  readonly graph: Graph3DObject;
  sample(progress: number): KpTutorialGraphFrame;
}

export interface KpTutorialGraphFrame {
  readonly panelId: string;
  readonly graphId: string;
  readonly surfaceMode: Graph3DSurfaceMode;
  readonly progress: number;
  readonly cardProgress: number;
  readonly graphProgress: number;
  readonly graphTrackId: string;
  readonly graphFrame: GraphSurfaceMorphFrame;
}

export function createKpTutorialGraphFrameAdapter(
  cardSampler: KpTutorialCardFrameSampler,
  options: KpTutorialGraphFrameAdapterOptions = {}
): KpTutorialGraphFrameAdapter {
  const panelBinding = cardSampler.binding.panels.find(
    (panel) => panel.role === "graph" && panel.target.kind === "graph-surface-mode"
  );

  if (panelBinding === undefined || panelBinding.target.kind !== "graph-surface-mode") {
    throw new Error(
      `Tutorial card ${cardSampler.manifestId} does not define a graph surface panel.`
    );
  }

  const panelId = panelBinding.panelId;
  const graphId = panelBinding.target.id;
  const surfaceMode = panelBinding.target.surfaceMode as Graph3DSurfaceMode;
  const scene = options.scene ?? createDefaultGraph3DScene();
  const graph = findGraph3D(scene, graphId);
  const transition = createGraphSurfaceModeTransition(
    scene,
    graph,
    graph.surfaceMode,
    surfaceMode
  );
  const plan = createGraphSurfaceModeMotionPlan(graph, transition);
  const graphSampler = createGraphSurfaceModeSampler(transition, {
    planId: plan.id,
    timelineId: cardSampler.parentTimeline.id
  });

  return {
    panelId,
    graphId: graph.id,
    surfaceMode,
    graph,
    sample(progress) {
      return sampleKpTutorialGraphFrame({
        cardFrame: cardSampler.sample(progress),
        graphId: graph.id,
        graphSampler,
        panelId,
        surfaceMode
      });
    }
  };
}

interface SampleKpTutorialGraphFrameInput {
  readonly cardFrame: KpTutorialCardFrame;
  readonly graphId: string;
  readonly graphSampler: GraphSurfaceModeSampler;
  readonly panelId: string;
  readonly surfaceMode: Graph3DSurfaceMode;
}

function sampleKpTutorialGraphFrame(
  input: SampleKpTutorialGraphFrameInput
): KpTutorialGraphFrame {
  const panelFrame = findGraphPanelFrame(input.cardFrame, input.panelId);
  const graphTrack = selectGraphTrack(panelFrame, input.graphId);
  const graphFrame = input.graphSampler.sample(graphTrack.localProgress);

  return {
    panelId: input.panelId,
    graphId: input.graphId,
    surfaceMode: input.surfaceMode,
    progress: input.cardFrame.progress,
    cardProgress: input.cardFrame.progress,
    graphProgress: graphTrack.localProgress,
    graphTrackId: graphTrack.trackId,
    graphFrame
  };
}

function findGraph3D(
  scene: readonly GraphSceneObject[],
  graphId: string
): Graph3DObject {
  const graph = scene.find(
    (object): object is Graph3DObject =>
      object.type === "graph-3d" && object.id === graphId
  );

  if (graph === undefined) {
    throw new Error(`Graph scene does not include graph-3d ${graphId}.`);
  }

  return graph;
}

function findGraphPanelFrame(
  cardFrame: KpTutorialCardFrame,
  panelId: string
): KpTutorialCardPanelTimelineBindingFrame {
  const panelFrame = cardFrame.bindingFrame.panels.find(
    (panel) => panel.panelId === panelId
  );

  if (panelFrame === undefined) {
    throw new Error(
      `Card frame for ${cardFrame.manifestId} does not include graph panel ${panelId}.`
    );
  }

  return panelFrame;
}

function selectGraphTrack(
  panelFrame: KpTutorialCardPanelTimelineBindingFrame,
  graphId: string
): KpTutorialCardPanelTimelineBindingFrame["tracks"][number] {
  const graphTrack = panelFrame.tracks.find(
    (track) => track.kind === "semantic-object" && track.targetId === graphId
  );

  if (graphTrack === undefined) {
    throw new Error(
      `Graph panel ${panelFrame.panelId} has no semantic graph track for ${graphId}.`
    );
  }

  return graphTrack;
}
