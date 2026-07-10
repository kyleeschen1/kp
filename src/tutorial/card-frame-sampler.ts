import type { KpAnimationSampler } from "../animation/kernel.ts";
import {
  createLinearSolveSynchronizedPanelLayoutSample,
  sampleSynchronizedPanelLayoutFrame,
  type KpSynchronizedPanelLayoutFrame,
  type KpSynchronizedPanelLayoutSample
} from "../layout/synchronized-panel.ts";
import {
  createKpTutorialCardManifest,
  createLinearSolveTutorialCardManifest,
  type KpTutorialCardManifest,
  type KpTutorialManifestDiagnostic
} from "./card-manifest.ts";
import {
  createKpTutorialCardLayoutTimelineBinding,
  sampleKpTutorialCardLayoutTimelineBindingFrame,
  type KpTutorialCardLayoutTimelineBinding,
  type KpTutorialCardLayoutTimelineBindingDiagnostic,
  type KpTutorialCardLayoutTimelineBindingFrame
} from "./layout-timeline-binding.ts";
import {
  createKpParentTimelineFromRuntimeContext,
  sampleKpParentTimeline,
  type KpParentTimeline,
  type KpParentTimelineFrame
} from "./parent-timeline.ts";
import {
  createKpTutorialCardRuntimeContext,
  type KpTutorialCardRuntimeContext
} from "./card-runtime.ts";

export interface CreateKpTutorialCardFrameSamplerInput {
  readonly manifest: KpTutorialCardManifest;
  readonly layout: KpSynchronizedPanelLayoutSample;
}

export interface KpTutorialCardFrameSampler
  extends KpAnimationSampler<KpTutorialCardFrame> {
  readonly manifestId: string;
  readonly context: KpTutorialCardRuntimeContext;
  readonly parentTimeline: KpParentTimeline;
  readonly binding: KpTutorialCardLayoutTimelineBinding;
  readonly diagnostics: readonly KpTutorialCardFrameSamplerDiagnostic[];
}

export type KpTutorialCardFrameSamplerDiagnostic =
  | KpTutorialManifestDiagnostic
  | KpTutorialCardLayoutTimelineBindingDiagnostic;

export interface KpTutorialCardFrame {
  readonly manifestId: string;
  readonly progress: number;
  readonly parentTimelineFrame: KpParentTimelineFrame;
  readonly layoutFrame: KpSynchronizedPanelLayoutFrame;
  readonly bindingFrame: KpTutorialCardLayoutTimelineBindingFrame;
  readonly diagnostics: readonly KpTutorialCardFrameSamplerDiagnostic[];
}

export function createKpTutorialCardFrameSampler(
  input: CreateKpTutorialCardFrameSamplerInput
): KpTutorialCardFrameSampler {
  const manifest = createKpTutorialCardManifest(input.manifest);
  const context = createKpTutorialCardRuntimeContext(manifest);
  const parentTimeline = createKpParentTimelineFromRuntimeContext(context);
  const binding = createKpTutorialCardLayoutTimelineBinding({
    context,
    parentTimeline,
    layout: input.layout
  });
  const diagnostics = [...context.diagnostics, ...binding.diagnostics];

  return {
    manifestId: context.manifestId,
    context,
    parentTimeline,
    binding,
    diagnostics,
    sample(progress) {
      const parentTimelineFrame = sampleKpParentTimeline(
        parentTimeline,
        progress
      );
      const layoutFrame = sampleSynchronizedPanelLayoutFrame(
        input.layout,
        parentTimelineFrame.progress
      );
      const bindingFrame = sampleKpTutorialCardLayoutTimelineBindingFrame(
        binding,
        parentTimelineFrame
      );

      return {
        manifestId: context.manifestId,
        progress: parentTimelineFrame.progress,
        parentTimelineFrame,
        layoutFrame,
        bindingFrame,
        diagnostics
      };
    }
  };
}

export function createLinearSolveTutorialCardFrameSampler(): KpTutorialCardFrameSampler {
  return createKpTutorialCardFrameSampler({
    manifest: createLinearSolveTutorialCardManifest(),
    layout: createLinearSolveSynchronizedPanelLayoutSample()
  });
}
