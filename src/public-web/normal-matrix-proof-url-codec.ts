import { defineKpReaderUrlStateCodec, composeKpReaderUrlStateCodecs } from
  "../reader/runtime/url-state-codec.ts";
import {
  kpNormalMatrixProofCheckpointIds,
  type KpNormalMatrixProofCheckpointId
} from "../semantic/normal-matrix-proof-checkpoints.ts";
import {
  kpNormalMatrixProofPromptIds,
  type KpNormalMatrixProofPromptId
} from "../semantic/normal-matrix-proof-prompt-ids.ts";
import {
  readKpNormalMatrixProofEvidenceMode,
  writeKpNormalMatrixProofEvidenceMode,
  type KpNormalMatrixProofEvidenceMode
} from "./normal-matrix-proof-evidence-mode.ts";

export interface KpNormalMatrixProofUrlState {
  readonly checkpoint: KpNormalMatrixProofCheckpointId;
  readonly evidence: KpNormalMatrixProofEvidenceMode;
  readonly review?: KpNormalMatrixProofPromptId;
}

const defaultCheckpoint = kpNormalMatrixProofCheckpointIds[0];
const checkpointIds = new Set<string>(kpNormalMatrixProofCheckpointIds);
const promptIds = new Set<string>(kpNormalMatrixProofPromptIds);

const checkpointCodec = defineKpReaderUrlStateCodec({
  parameters: ["checkpoint"] as const,
  read: (parameters: URLSearchParams): KpNormalMatrixProofCheckpointId => {
    const checkpoint = parameters.get("checkpoint");
    return checkpoint !== null && checkpointIds.has(checkpoint)
      ? checkpoint as KpNormalMatrixProofCheckpointId
      : defaultCheckpoint;
  },
  write: (
    parameters: URLSearchParams,
    checkpoint: KpNormalMatrixProofCheckpointId
  ): void => {
    if (checkpoint !== defaultCheckpoint) parameters.set("checkpoint", checkpoint);
  }
});

const evidenceCodec = defineKpReaderUrlStateCodec({
  parameters: ["evidence"] as const,
  read: readKpNormalMatrixProofEvidenceMode,
  write: writeKpNormalMatrixProofEvidenceMode
});

const reviewCodec = defineKpReaderUrlStateCodec({
  parameters: ["review"] as const,
  read: (parameters: URLSearchParams): KpNormalMatrixProofPromptId | undefined => {
    const review = parameters.get("review");
    return review !== null && promptIds.has(review)
      ? review as KpNormalMatrixProofPromptId
      : undefined;
  },
  write: (
    parameters: URLSearchParams,
    review: KpNormalMatrixProofPromptId | undefined
  ): void => {
    if (review !== undefined) parameters.set("review", review);
  }
});

const codec = composeKpReaderUrlStateCodecs({
  checkpoint: checkpointCodec,
  evidence: evidenceCodec,
  review: reviewCodec
});

export function decodeKpNormalMatrixProofUrl(
  input: string | URL
): KpNormalMatrixProofUrlState {
  const state = codec.read(input);
  return {
    checkpoint: state.checkpoint,
    evidence: state.evidence,
    ...(state.review === undefined ? {} : { review: state.review })
  };
}

export function encodeKpNormalMatrixProofUrl(
  baseUrl: string | URL,
  state: KpNormalMatrixProofUrlState
): string {
  return codec.write(baseUrl, { ...state, review: state.review });
}

export function canonicalizeKpNormalMatrixProofUrl(
  input: string | URL
): string {
  return encodeKpNormalMatrixProofUrl(input, decodeKpNormalMatrixProofUrl(input));
}
