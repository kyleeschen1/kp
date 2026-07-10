import type { KpAnimationSampler } from "../animation/kernel.ts";
import {
  findEquationAnimationCatalogEntry,
  type EquationAnimationCatalogEntry,
  type EquationAnimationId
} from "../editor/equation-animation-catalog.ts";
import { createEquationMotionPlan } from "../rendering/equation-motion-plan.ts";
import {
  createEquationMotionSampler,
  type EquationMotionFrame,
  type EquationMotionSampler
} from "../rendering/equation-motion-sampler.ts";
import type {
  KpTutorialCardFrame,
  KpTutorialCardFrameSampler
} from "./card-frame-sampler.ts";
import type { KpTutorialCardPanelTimelineBindingFrame } from "./layout-timeline-binding.ts";

export interface KpTutorialEquationFrameAdapter
  extends KpAnimationSampler<KpTutorialEquationFrame> {
  readonly panelId: string;
  readonly animationId: EquationAnimationId;
  readonly animation: EquationAnimationCatalogEntry;
  readonly transitionTrackIds: readonly string[];
  sample(progress: number): KpTutorialEquationFrame;
}

export interface KpTutorialEquationFrame {
  readonly panelId: string;
  readonly animationId: EquationAnimationId;
  readonly progress: number;
  readonly cardProgress: number;
  readonly transitionIndex: number;
  readonly transitionTrackId: string;
  readonly transitionProgress: number;
  readonly equationFrame: EquationMotionFrame;
}

export function createKpTutorialEquationFrameAdapter(
  cardSampler: KpTutorialCardFrameSampler
): KpTutorialEquationFrameAdapter {
  const panelBinding = cardSampler.binding.panels.find(
    (panel) => panel.role === "equation" && panel.target.kind === "equation-animation"
  );

  if (panelBinding === undefined || panelBinding.target.kind !== "equation-animation") {
    throw new Error(
      `Tutorial card ${cardSampler.manifestId} does not define an equation animation panel.`
    );
  }

  const animation = findEquationAnimationCatalogEntry(panelBinding.target.id);
  const transitionTrackIds = panelBinding.trackIds.filter((trackId) =>
    trackId.includes(".transformation.")
  );
  const transitionSamplers = animation.transitions.map((transition) =>
    createEquationMotionSampler(createEquationMotionPlan(transition))
  );

  return {
    panelId: panelBinding.panelId,
    animationId: animation.id,
    animation,
    transitionTrackIds,
    sample(progress) {
      return sampleKpTutorialEquationFrame({
        animation,
        cardFrame: cardSampler.sample(progress),
        panelId: panelBinding.panelId,
        transitionSamplers,
        transitionTrackIds
      });
    }
  };
}

interface SampleKpTutorialEquationFrameInput {
  readonly animation: EquationAnimationCatalogEntry;
  readonly cardFrame: KpTutorialCardFrame;
  readonly panelId: string;
  readonly transitionSamplers: readonly EquationMotionSampler[];
  readonly transitionTrackIds: readonly string[];
}

function sampleKpTutorialEquationFrame(
  input: SampleKpTutorialEquationFrameInput
): KpTutorialEquationFrame {
  const panelFrame = findEquationPanelFrame(input.cardFrame, input.panelId);
  const selectedTrack = selectActiveTransitionTrack(
    panelFrame,
    input.transitionTrackIds
  );
  const transitionIndex = input.transitionTrackIds.indexOf(
    selectedTrack.trackId
  );
  const transitionSampler = input.transitionSamplers[transitionIndex];

  if (transitionSampler === undefined) {
    throw new Error(
      `Equation animation ${input.animation.id} does not have transition ${transitionIndex}.`
    );
  }

  return {
    panelId: input.panelId,
    animationId: input.animation.id,
    progress: input.cardFrame.progress,
    cardProgress: input.cardFrame.progress,
    transitionIndex,
    transitionTrackId: selectedTrack.trackId,
    transitionProgress: selectedTrack.localProgress,
    equationFrame: transitionSampler.sample(selectedTrack.localProgress)
  };
}

function findEquationPanelFrame(
  cardFrame: KpTutorialCardFrame,
  panelId: string
): KpTutorialCardPanelTimelineBindingFrame {
  const panelFrame = cardFrame.bindingFrame.panels.find(
    (panel) => panel.panelId === panelId
  );

  if (panelFrame === undefined) {
    throw new Error(
      `Card frame for ${cardFrame.manifestId} does not include equation panel ${panelId}.`
    );
  }

  return panelFrame;
}

function selectActiveTransitionTrack(
  panelFrame: KpTutorialCardPanelTimelineBindingFrame,
  transitionTrackIds: readonly string[]
): KpTutorialCardPanelTimelineBindingFrame["tracks"][number] {
  const transitionTrackFrames = transitionTrackIds
    .map((trackId) =>
      panelFrame.tracks.find((candidate) => candidate.trackId === trackId)
    )
    .filter(
      (
        trackFrame
      ): trackFrame is KpTutorialCardPanelTimelineBindingFrame["tracks"][number] =>
        trackFrame !== undefined
    );
  const activeTrackFrames = transitionTrackFrames.filter(
    (trackFrame) => trackFrame.active
  );

  return (
    activeTrackFrames.find((trackFrame) => trackFrame.localProgress < 1) ??
    activeTrackFrames[activeTrackFrames.length - 1] ??
    transitionTrackFrames[0] ??
    missingTransitionTrack(panelFrame.panelId)
  );
}

function missingTransitionTrack(
  panelId: string
): KpTutorialCardPanelTimelineBindingFrame["tracks"][number] {
  throw new Error(`Equation panel ${panelId} has no transformation tracks.`);
}
