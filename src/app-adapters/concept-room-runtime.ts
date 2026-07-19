import type { KpConceptRoomState } from "../kernel/public-api.ts";

import type { KpConceptRoomArtifactLike } from "./concept-room-artifact.ts";

export type KpConceptRoomDiagnosticCode =
  | "artifact-invalid"
  | "ask-unavailable"
  | "capability-unavailable"
  | "provider-unavailable"
  | "renderer-unavailable"
  | "projection-unavailable";

export class KpConceptRoomRuntimeError extends Error {
  readonly code: KpConceptRoomDiagnosticCode;

  constructor(code: KpConceptRoomDiagnosticCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "KpConceptRoomRuntimeError";
    this.code = code;
  }
}

export interface KpConceptRoomRuntimeSession {
  render(root: HTMLElement, state: KpConceptRoomState): Promise<void> | void;
  dispose(): void;
}

export interface KpConceptRoomRuntime {
  prepare(
    artifact: KpConceptRoomArtifactLike,
    options: { readonly signal: AbortSignal }
  ): Promise<KpConceptRoomRuntimeSession>;
}

export interface KpConceptRoomArtifactValidator {
  (artifact: unknown): Promise<KpConceptRoomArtifactLike>;
}
