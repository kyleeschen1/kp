import type {
  KpAnimationSampler,
  KpSampledAnimationFrame
} from "../animation/kernel.ts";
import {
  createKpTutorialCardStaticStepArtifact,
  validateKpTutorialCardStaticStepArtifact,
  type KpTutorialCardStaticStepArtifact,
  type KpTutorialStaticStepArtifactDiagnostic,
  type KpTutorialStaticStepCheckpoint
} from "./static-step-artifact.ts";

export interface KpTutorialStaticStepSequenceFrame<
  TFrame extends KpSampledAnimationFrame = KpSampledAnimationFrame
> {
  readonly checkpointId: string;
  readonly label: string;
  readonly progress: number;
  readonly beat: number;
  readonly timelineId: string;
  readonly frame: TFrame;
}

export interface KpTutorialCardStaticStepSequence<
  TFrame extends KpSampledAnimationFrame = KpSampledAnimationFrame
> extends KpTutorialCardStaticStepArtifact {
  readonly steps: readonly KpTutorialStaticStepSequenceFrame<TFrame>[];
  readonly diagnostics: readonly KpTutorialStaticStepArtifactDiagnostic[];
}

export interface RenderKpTutorialCardStaticStepSequenceInput<
  TFrame extends KpSampledAnimationFrame = KpSampledAnimationFrame
> {
  readonly artifact: KpTutorialCardStaticStepArtifact["artifact"];
  readonly checkpoints: readonly KpTutorialStaticStepCheckpoint[];
  readonly sampler: KpAnimationSampler<TFrame>;
}

export function renderKpTutorialCardStaticStepSequence<
  TFrame extends KpSampledAnimationFrame
>(
  input: RenderKpTutorialCardStaticStepSequenceInput<TFrame>
): KpTutorialCardStaticStepSequence<TFrame> {
  const staticStepArtifact = createKpTutorialCardStaticStepArtifact({
    artifact: {
      ...input.artifact,
      status: "renderable"
    },
    checkpoints: input.checkpoints
  });

  return {
    ...staticStepArtifact,
    steps: staticStepArtifact.checkpoints.map((checkpoint) =>
      renderStepFrame(input.sampler, checkpoint)
    ),
    diagnostics: validateKpTutorialCardStaticStepArtifact(staticStepArtifact)
  };
}

function renderStepFrame<TFrame extends KpSampledAnimationFrame>(
  sampler: KpAnimationSampler<TFrame>,
  checkpoint: KpTutorialStaticStepCheckpoint
): KpTutorialStaticStepSequenceFrame<TFrame> {
  return {
    checkpointId: checkpoint.id,
    label: checkpoint.label,
    progress: checkpoint.progress,
    beat: checkpoint.beat,
    timelineId: checkpoint.timelineId,
    frame: sampler.sample(checkpoint.progress)
  };
}
