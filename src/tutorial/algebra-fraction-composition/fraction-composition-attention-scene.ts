import type {
  KpFractionCompositionAttentionBeat,
  KpFractionCompositionAttentionFraming,
  KpFractionCompositionAttentionMatrix
} from "./fraction-composition-attention-matrix.ts";

export interface KpFractionCompositionAttentionSceneSelection {
  readonly beatId: string;
  readonly rangeProgress?: number;
}

export interface KpFractionCompositionAttentionScene {
  readonly kind: "kp-fraction-composition-attention-scene";
  readonly beatId: string;
  readonly framing: KpFractionCompositionAttentionFraming;
  readonly passageMarkdown: string;
  readonly stageId: "solve";
  readonly primaryAddresses: readonly string[];
  readonly contextAddresses: readonly string[];
  readonly temporalRequest:
    | Readonly<{
        kind: "checkpoint-seek";
        checkpointPath: string;
        globalProgress: number;
      }>
    | Readonly<{
        kind: "range-seek";
        rangePath: string;
        rangeProgress: number;
        globalProgress: number;
      }>;
  readonly seekBehavior: "direct";
  readonly timelineAuthority: "none";
}

/**
 * Scene selection is a pure request against the canonical timeline. Calling
 * it out of order, in reverse, or after interruption cannot replay history.
 */
export function projectKpFractionCompositionAttentionScene(
  matrix: KpFractionCompositionAttentionMatrix,
  selection: KpFractionCompositionAttentionSceneSelection
): KpFractionCompositionAttentionScene {
  const beat = matrix.beats.find(({ id }) => id === selection.beatId);
  if (beat === undefined) {
    throw new Error(`Unknown fraction composition attention beat ${selection.beatId}.`);
  }
  return Object.freeze({
    kind: "kp-fraction-composition-attention-scene" as const,
    beatId: beat.id,
    framing: beat.framing,
    passageMarkdown: beat.passageMarkdown,
    stageId: beat.stageId,
    primaryAddresses: beat.primaryAddresses,
    contextAddresses: beat.contextAddresses,
    temporalRequest: temporalRequest(beat, selection.rangeProgress),
    seekBehavior: "direct" as const,
    timelineAuthority: beat.timelineAuthority
  });
}

function temporalRequest(
  beat: KpFractionCompositionAttentionBeat,
  rangeProgress: number | undefined
): KpFractionCompositionAttentionScene["temporalRequest"] {
  if (beat.anchor.kind === "checkpoint") {
    if (rangeProgress !== undefined) {
      throw new Error(`Checkpoint beat ${beat.id} does not accept range progress.`);
    }
    return Object.freeze({
      kind: "checkpoint-seek" as const,
      checkpointPath: beat.anchor.path,
      globalProgress: beat.anchor.progress
    });
  }
  const local = rangeProgress ?? 0;
  if (!Number.isFinite(local) || local < 0 || local > 1) {
    throw new Error("Attention-scene range progress must be between 0 and 1.");
  }
  return Object.freeze({
    kind: "range-seek" as const,
    rangePath: beat.anchor.path,
    rangeProgress: local,
    globalProgress:
      beat.anchor.start + (beat.anchor.end - beat.anchor.start) * local
  });
}
