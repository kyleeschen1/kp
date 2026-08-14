import {
  findKpNormalMatrixProofCheckpoint,
  projectKpNormalMatrixProofClock,
  type KpNormalMatrixProofCheckpointId
} from "../../semantic/normal-matrix-proof-checkpoints.ts";
import type { KpNormalMatrixProofObjectPath } from
  "../../semantic/normal-matrix-proof-semantics.ts";
import {
  kpNormalMatrixProofAttentionCycleA,
  projectKpNormalMatrixProofAttentionCycleAPhase,
  type KpNormalMatrixProofAttentionPhaseKind
} from "./normal-matrix-proof-attention-cycle-a.ts";

export interface KpNormalMatrixProofCycleATransmissionProjection {
  readonly id: "first-row" | "first-column";
  readonly sourcePaths: readonly KpNormalMatrixProofObjectPath[];
  readonly targetPath:
    | "product-left/first-entry"
    | "product-right/first-entry";
  readonly progress: number;
  readonly handoffComplete: boolean;
}

export interface KpNormalMatrixProofCycleAProjection {
  readonly timeMs: number;
  readonly active: boolean;
  readonly checkpointId: KpNormalMatrixProofCheckpointId;
  readonly phaseKind?: KpNormalMatrixProofAttentionPhaseKind | undefined;
  readonly phaseProgress: number;
  readonly transmissions:
    readonly KpNormalMatrixProofCycleATransmissionProjection[];
  readonly equationProgress: number;
  readonly targetPaths: readonly KpNormalMatrixProofObjectPath[];
  readonly contextPaths: readonly KpNormalMatrixProofObjectPath[];
}

const entry = findKpNormalMatrixProofCheckpoint(
  kpNormalMatrixProofAttentionCycleA.entryCheckpointId
);
const settled = findKpNormalMatrixProofCheckpoint(
  kpNormalMatrixProofAttentionCycleA.settledCheckpointId
);

const phaseWindows = Object.freeze([
  { kind: "orient", start: 0, end: 0.16 },
  { kind: "act", start: 0.16, end: 0.68 },
  { kind: "settle", start: 0.68, end: 0.88 },
  { kind: "inspect", start: 0.88, end: 1 }
] as const);

export function projectKpNormalMatrixProofCycleA(
  requestedTimeMs: number
): KpNormalMatrixProofCycleAProjection {
  const clock = projectKpNormalMatrixProofClock(requestedTimeMs);
  const active = clock.timeMs >= entry.timeMs && clock.timeMs < settled.timeMs;
  if (!active) {
    return Object.freeze({
      timeMs: clock.timeMs,
      active: false,
      checkpointId: clock.from.id,
      phaseProgress: 0,
      transmissions: Object.freeze([]),
      equationProgress: clock.timeMs >= settled.timeMs ? 1 : 0,
      targetPaths: Object.freeze([]),
      contextPaths: Object.freeze([])
    });
  }

  const cycleProgress = (clock.timeMs - entry.timeMs) /
    (settled.timeMs - entry.timeMs);
  const window = phaseWindows.find(({ start, end }) =>
    cycleProgress >= start && cycleProgress < end
  )!;
  const phaseProgress = unitProgress(cycleProgress, window.start, window.end);
  const attention = projectKpNormalMatrixProofAttentionCycleAPhase(window.kind);
  const paths = projectIntentPaths(attention.intents);
  const actProgress = window.kind === "orient"
    ? 0
    : window.kind === "act"
      ? phaseProgress
      : 1;
  const equationProgress = window.kind === "settle"
    ? eased(phaseProgress)
    : window.kind === "inspect"
      ? 1
      : 0;

  return Object.freeze({
    timeMs: clock.timeMs,
    active: true,
    checkpointId: window.kind === "orient"
      ? "eigenbasis"
      : window.kind === "inspect"
        ? "norm-equation"
        : "row-column-norms",
    phaseKind: window.kind,
    phaseProgress,
    transmissions: Object.freeze([
      transmission(
        "first-row",
        ["matrix/eigenvalue", "matrix/row-remainder"],
        "product-left/first-entry",
        stagger(actProgress, 0, 0.62)
      ),
      transmission(
        "first-column",
        ["matrix/eigenvalue", "matrix/zero-column"],
        "product-right/first-entry",
        stagger(actProgress, 0.38, 1)
      )
    ]),
    equationProgress,
    targetPaths: Object.freeze(paths.targets),
    contextPaths: Object.freeze(paths.context)
  });
}

function transmission(
  id: KpNormalMatrixProofCycleATransmissionProjection["id"],
  sourcePaths: readonly KpNormalMatrixProofObjectPath[],
  targetPath: KpNormalMatrixProofCycleATransmissionProjection["targetPath"],
  progress: number
): KpNormalMatrixProofCycleATransmissionProjection {
  return Object.freeze({
    id,
    sourcePaths: Object.freeze([...sourcePaths]),
    targetPath,
    progress,
    handoffComplete: progress >= 1
  });
}

function projectIntentPaths(
  intents: ReturnType<typeof projectKpNormalMatrixProofAttentionCycleAPhase>["intents"]
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
        intent.targetEntityIds.forEach((id) => targets.add(asProofPath(id)));
        break;
      case "compare":
        [...intent.leftEntityIds, ...intent.rightEntityIds].forEach(
          (id) => targets.add(asProofPath(id))
        );
        break;
      case "transmit":
        [...intent.sourceEntityIds, ...intent.targetEntityIds].forEach(
          (id) => targets.add(asProofPath(id))
        );
        break;
      case "supporting-context":
        intent.contextEntityIds.forEach((id) => context.add(asProofPath(id)));
        break;
    }
  }
  return { targets: [...targets], context: [...context] };
}

function asProofPath(value: string): KpNormalMatrixProofObjectPath {
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
