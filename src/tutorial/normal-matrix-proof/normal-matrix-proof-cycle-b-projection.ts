import {
  findKpNormalMatrixProofCheckpoint,
  projectKpNormalMatrixProofClock,
  type KpNormalMatrixProofCheckpointId
} from "../../semantic/normal-matrix-proof-checkpoints.ts";
import type { KpNormalMatrixProofObjectPath } from
  "../../semantic/normal-matrix-proof-semantics.ts";
import {
  kpNormalMatrixProofAttentionCycleB,
  projectKpNormalMatrixProofAttentionCycleBPhase
} from "./normal-matrix-proof-attention-cycle-b.ts";
import type { KpNormalMatrixProofAttentionPhaseKind } from
  "./normal-matrix-proof-attention-cycle-a.ts";

export interface KpNormalMatrixProofCycleBProjection {
  readonly timeMs: number;
  readonly active: boolean;
  readonly checkpointId: KpNormalMatrixProofCheckpointId;
  readonly phaseKind?: KpNormalMatrixProofAttentionPhaseKind | undefined;
  readonly phaseProgress: number;
  readonly matchedProgress: number;
  readonly zeroNormProgress: number;
  readonly remainderZeroProgress: number;
  readonly recursiveProgress: number;
  readonly targetPaths: readonly KpNormalMatrixProofObjectPath[];
  readonly contextPaths: readonly KpNormalMatrixProofObjectPath[];
}

const entry = findKpNormalMatrixProofCheckpoint(
  kpNormalMatrixProofAttentionCycleB.entryCheckpointId
);
const settled = findKpNormalMatrixProofCheckpoint(
  kpNormalMatrixProofAttentionCycleB.settledCheckpointId
);

const phaseWindows = Object.freeze([
  { kind: "orient", start: 0, end: 0.18 },
  { kind: "act", start: 0.18, end: 0.5 },
  { kind: "settle", start: 0.5, end: 0.72 },
  { kind: "inspect", start: 0.72, end: 1 }
] as const);

export function projectKpNormalMatrixProofCycleB(
  requestedTimeMs: number
): KpNormalMatrixProofCycleBProjection {
  const clock = projectKpNormalMatrixProofClock(requestedTimeMs);
  const active = clock.timeMs >= entry.timeMs && clock.timeMs < settled.timeMs;
  if (!active) return inactive(clock.timeMs, clock.from.id);

  const cycleProgress = (clock.timeMs - entry.timeMs) /
    (settled.timeMs - entry.timeMs);
  const window = phaseWindows.find(({ start, end }) =>
    cycleProgress >= start && cycleProgress < end
  )!;
  const phaseProgress = unitProgress(cycleProgress, window.start, window.end);
  const attention = projectKpNormalMatrixProofAttentionCycleBPhase(window.kind);
  const paths = projectIntentPaths(attention.intents);
  const actProgress = window.kind === "orient"
    ? 0
    : window.kind === "act"
      ? phaseProgress
      : 1;
  const inspectProgress = window.kind === "inspect" ? phaseProgress : 0;

  return Object.freeze({
    timeMs: clock.timeMs,
    active: true,
    checkpointId: window.kind === "settle"
      ? "remainder-zero"
      : window.kind === "inspect"
        ? "recursion"
        : "norm-equation",
    phaseKind: window.kind,
    phaseProgress,
    matchedProgress: stagger(actProgress, 0, 0.34),
    zeroNormProgress: stagger(actProgress, 0.22, 0.76),
    // Reserve the tail of act for a completed handoff before native settlement.
    remainderZeroProgress: stagger(actProgress, 0.56, 0.94),
    recursiveProgress: eased(inspectProgress),
    targetPaths: Object.freeze(paths.targets),
    contextPaths: Object.freeze(paths.context)
  });
}

function inactive(
  timeMs: number,
  checkpointId: KpNormalMatrixProofCheckpointId
): KpNormalMatrixProofCycleBProjection {
  return Object.freeze({
    timeMs,
    active: false,
    checkpointId,
    phaseProgress: 0,
    matchedProgress: timeMs >= entry.timeMs ? 1 : 0,
    zeroNormProgress: timeMs >= entry.timeMs ? 1 : 0,
    remainderZeroProgress: timeMs >= entry.timeMs ? 1 : 0,
    recursiveProgress: timeMs >= settled.timeMs ? 1 : 0,
    targetPaths: Object.freeze([]),
    contextPaths: Object.freeze([])
  });
}

function projectIntentPaths(
  intents: ReturnType<typeof projectKpNormalMatrixProofAttentionCycleBPhase>["intents"]
): {
  readonly targets: KpNormalMatrixProofObjectPath[];
  readonly context: KpNormalMatrixProofObjectPath[];
} {
  const targets = new Set<KpNormalMatrixProofObjectPath>();
  const context = new Set<KpNormalMatrixProofObjectPath>();
  for (const intent of intents) {
    switch (intent.kind) {
      case "notice":
      case "predict":
      case "question":
      case "reveal":
        intent.targetEntityIds.forEach((id) => targets.add(asPath(id)));
        break;
      case "compare":
        [...intent.leftEntityIds, ...intent.rightEntityIds].forEach(
          (id) => targets.add(asPath(id))
        );
        break;
      case "transmit":
        [...intent.sourceEntityIds, ...intent.targetEntityIds].forEach(
          (id) => targets.add(asPath(id))
        );
        break;
      case "supporting-context":
        intent.contextEntityIds.forEach((id) => context.add(asPath(id)));
        break;
    }
  }
  return { targets: [...targets], context: [...context] };
}

function asPath(value: string): KpNormalMatrixProofObjectPath {
  return value as KpNormalMatrixProofObjectPath;
}

function stagger(value: number, start: number, end: number): number {
  return eased(unitProgress(value, start, end));
}

function unitProgress(value: number, start: number, end: number): number {
  return Math.max(0, Math.min(1, (value - start) / (end - start)));
}

function eased(value: number): number {
  return value * value * (3 - 2 * value);
}
