import type {
  KpEditorAnimationPlayerState
} from "./animation-player-state.ts";

export const KP_EDITOR_ANIMATION_DIAGNOSTICS_INTERVAL_MS = 100;

export type KpEditorAnimationDiagnosticsPublishReason =
  | "initial"
  | "semantic-change"
  | "explicit-control"
  | "cadence"
  | "clock-reset"
  | "deferred";

export interface KpEditorAnimationDiagnosticsCadenceState {
  readonly lastPublishedAtMs: number;
  readonly semanticSignature: string;
  readonly publishCount: number;
}

export interface KpEditorAnimationDiagnosticsCadenceDecision {
  readonly publish: boolean;
  readonly reason: KpEditorAnimationDiagnosticsPublishReason;
  readonly state: KpEditorAnimationDiagnosticsCadenceState | undefined;
}

export function decideKpEditorAnimationDiagnosticsCadence(input: {
  readonly state: KpEditorAnimationPlayerState;
  readonly nowMs: number;
  readonly revisionKey?: string | undefined;
  readonly previous?: KpEditorAnimationDiagnosticsCadenceState | undefined;
  readonly minimumIntervalMs?: number | undefined;
}): KpEditorAnimationDiagnosticsCadenceDecision {
  const nowMs = normalizeTimestamp(input.nowMs);
  const semanticSignature = kpEditorAnimationDiagnosticsSemanticSignature(
    input.state,
    input.revisionKey
  );
  const previous = input.previous;
  const minimumIntervalMs = normalizeInterval(input.minimumIntervalMs);

  if (previous === undefined) {
    return publishDecision("initial", nowMs, semanticSignature, 1);
  }
  if (previous.semanticSignature !== semanticSignature) {
    return publishDecision(
      "semantic-change",
      nowMs,
      semanticSignature,
      previous.publishCount + 1
    );
  }
  if (input.state.playbackStatus !== "playing") {
    return publishDecision(
      "explicit-control",
      nowMs,
      semanticSignature,
      previous.publishCount + 1
    );
  }
  if (nowMs < previous.lastPublishedAtMs) {
    return publishDecision(
      "clock-reset",
      nowMs,
      semanticSignature,
      previous.publishCount + 1
    );
  }
  if (nowMs - previous.lastPublishedAtMs >= minimumIntervalMs) {
    return publishDecision(
      "cadence",
      nowMs,
      semanticSignature,
      previous.publishCount + 1
    );
  }

  return { publish: false, reason: "deferred", state: previous };
}

export function kpEditorAnimationDiagnosticsSemanticSignature(
  state: KpEditorAnimationPlayerState,
  revisionKey = ""
): string {
  const frame = state.runtimeFrame;
  const runtimeDiagnostics = [
    ...frame.phaseDiagnostics,
    ...frame.selectorDiagnostics,
    ...frame.childDiagnostics
  ].map((diagnostic) => `${diagnostic.code}:${diagnostic.path}`);
  const lawDiagnostics = frame.diagnostics.map(
    (diagnostic) => `${diagnostic.path}:${diagnostic.message}`
  );

  // Progress is intentionally absent. It is the high-frequency value governed
  // by cadence; phase, ownership, active targets, and diagnostics remain
  // immediate semantic invalidation boundaries.
  return JSON.stringify([
    state.animationId,
    state.playbackStatus,
    state.direction,
    frame.phase.phaseId,
    frame.activeTransformationIds,
    frame.activeRenderTargets.map((target) => target.id),
    frame.selectorFrames.map((selector) => selector.id),
    frame.childFrames.map((child) => `${child.renderTargetId}:${child.frame.phase.phaseId}`),
    runtimeDiagnostics,
    lawDiagnostics,
    revisionKey
  ]);
}

function publishDecision(
  reason: Exclude<KpEditorAnimationDiagnosticsPublishReason, "deferred">,
  lastPublishedAtMs: number,
  semanticSignature: string,
  publishCount: number
): KpEditorAnimationDiagnosticsCadenceDecision {
  return {
    publish: true,
    reason,
    state: { lastPublishedAtMs, semanticSignature, publishCount }
  };
}

function normalizeTimestamp(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function normalizeInterval(value: number | undefined): number {
  return value === undefined || !Number.isFinite(value) || value < 0
    ? KP_EDITOR_ANIMATION_DIAGNOSTICS_INTERVAL_MS
    : value;
}
