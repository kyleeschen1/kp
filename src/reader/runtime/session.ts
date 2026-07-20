import {
  createKpReaderArtifactRef,
  type KpReaderArtifactRef
} from "../document/public-api.ts";

export interface KpReaderLocation {
  readonly checkpointId?: string | undefined;
  readonly progressPermille?: number | undefined;
  readonly projectionId?: string | undefined;
  readonly focusRefs: readonly string[];
}

export interface KpReaderSessionSnapshot {
  readonly kind: "reader-session";
  readonly document: KpReaderArtifactRef<"lesson-document">;
  readonly location: KpReaderLocation;
  readonly reducedMotion: boolean;
}

export function createKpReaderSessionSnapshot(input: {
  readonly documentId: string;
  readonly documentVersion: string;
  readonly checkpointId?: string | undefined;
  readonly progressPermille?: number | undefined;
  readonly projectionId?: string | undefined;
  readonly focusRefs?: readonly string[] | undefined;
  readonly reducedMotion?: boolean | undefined;
}): KpReaderSessionSnapshot {
  if (
    input.progressPermille !== undefined
    && (!Number.isInteger(input.progressPermille)
      || input.progressPermille < 0
      || input.progressPermille > 1_000)
  ) {
    throw new Error("reader progress must be an integer from 0 through 1000.");
  }
  const focusRefs = uniqueNonEmpty(input.focusRefs ?? [], "focus ref");
  return {
    kind: "reader-session",
    document: createKpReaderArtifactRef({
      kind: "lesson-document",
      id: input.documentId,
      version: input.documentVersion
    }),
    location: {
      ...(input.checkpointId === undefined
        ? {}
        : { checkpointId: requireText(input.checkpointId, "checkpoint id") }),
      ...(input.progressPermille === undefined
        ? {}
        : { progressPermille: input.progressPermille }),
      ...(input.projectionId === undefined
        ? {}
        : { projectionId: requireText(input.projectionId, "projection id") }),
      focusRefs
    },
    reducedMotion: input.reducedMotion ?? false
  };
}

function uniqueNonEmpty(values: readonly string[], label: string): readonly string[] {
  return [...new Set(values.map((value) => requireText(value, label)))];
}

function requireText(value: string, label: string): string {
  const normalized = value.trim();
  if (normalized === "") throw new Error(`${label} must not be empty.`);
  return normalized;
}
