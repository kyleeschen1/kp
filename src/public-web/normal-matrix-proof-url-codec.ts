import { defineKpReaderUrlStateCodec, composeKpReaderUrlStateCodecs } from
  "../reader/runtime/url-state-codec.ts";
import {
  kpNormalMatrixProofCheckpointIds,
  type KpNormalMatrixProofCheckpointId
} from "../semantic/normal-matrix-proof-checkpoints.ts";
import {
  readKpNormalMatrixProofEvidenceMode,
  writeKpNormalMatrixProofEvidenceMode,
  type KpNormalMatrixProofEvidenceMode
} from "./normal-matrix-proof-evidence-mode.ts";

export interface KpNormalMatrixProofUrlState {
  readonly checkpoint: KpNormalMatrixProofCheckpointId;
  readonly evidence: KpNormalMatrixProofEvidenceMode;
}

const defaultCheckpoint = kpNormalMatrixProofCheckpointIds[0];
const checkpointIds = new Set<string>(kpNormalMatrixProofCheckpointIds);

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

const codec = composeKpReaderUrlStateCodecs({
  checkpoint: checkpointCodec,
  evidence: evidenceCodec
});

export function decodeKpNormalMatrixProofUrl(
  input: string | URL
): KpNormalMatrixProofUrlState {
  return codec.read(input);
}

export function encodeKpNormalMatrixProofUrl(
  baseUrl: string | URL,
  state: KpNormalMatrixProofUrlState
): string {
  return codec.write(baseUrl, state);
}

export function canonicalizeKpNormalMatrixProofUrl(
  input: string | URL
): string {
  return encodeKpNormalMatrixProofUrl(input, decodeKpNormalMatrixProofUrl(input));
}
