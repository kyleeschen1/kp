import type { KpTutorialFrameSequenceArtifact } from "./frame-sequence-artifact.ts";

export interface KpTutorialFrameSequenceRewindCheck {
  readonly id: string;
  readonly sequenceId: string;
  readonly deterministic: boolean;
  readonly forwardFrameIds: readonly string[];
  readonly expectedRewindFrameIds: readonly string[];
  readonly actualRewindFrameIds: readonly string[];
  readonly diagnostics: readonly KpTutorialFrameSequenceRewindDiagnostic[];
}

export interface KpTutorialFrameSequenceRewindDiagnostic {
  readonly path: string;
  readonly message: string;
}

export function validateKpTutorialFrameSequenceRewind(
  sequence: KpTutorialFrameSequenceArtifact
): KpTutorialFrameSequenceRewindCheck {
  const forwardFrameIds = sequence.frames.map((frame) => frame.id);
  const expectedRewindFrameIds = [...forwardFrameIds].reverse();
  const actualRewindFrameIds = [...sequence.rewindFrameIds];
  const deterministic = idsEqual(
    actualRewindFrameIds,
    expectedRewindFrameIds
  );

  return {
    id: `rewind-check.${sequence.id}`,
    sequenceId: sequence.id,
    deterministic,
    forwardFrameIds,
    expectedRewindFrameIds,
    actualRewindFrameIds,
    diagnostics: deterministic
      ? []
      : [
          {
            path: "rewindFrameIds",
            message:
              "Frame sequence rewind ids must equal forward frame ids in exact reverse order."
          }
        ]
  };
}

function idsEqual(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}
