import {
  kpNormalMatrixProofObjectPaths,
  type KpNormalMatrixProofObjectPath
} from "./normal-matrix-proof-semantics.ts";
import {
  kpNormalMatrixProofTransformationPaths,
  type KpNormalMatrixProofTransformationPath
} from "./normal-matrix-proof-operations.ts";

export const kpNormalMatrixProofCheckpointIds = Object.freeze([
  "statement",
  "row-column-norms",
  "eigenbasis",
  "norm-equation",
  "remainder-zero",
  "recursion"
] as const);

export type KpNormalMatrixProofCheckpointId =
  typeof kpNormalMatrixProofCheckpointIds[number];

export const kpNormalMatrixProofDurationMs = 12_000;

export interface KpNormalMatrixProofCheckpoint {
  readonly id: KpNormalMatrixProofCheckpointId;
  readonly label: string;
  readonly learnerQuestion: string;
  readonly accessibleDescription: string;
  readonly progressPermille: number;
  readonly timeMs: number;
  readonly primaryPath: KpNormalMatrixProofObjectPath;
  readonly visiblePaths: readonly KpNormalMatrixProofObjectPath[];
  readonly completedTransformationPaths:
    readonly KpNormalMatrixProofTransformationPath[];
}

export interface KpNormalMatrixProofClockProjection {
  readonly timeMs: number;
  readonly progress: number;
  readonly from: KpNormalMatrixProofCheckpoint;
  readonly to: KpNormalMatrixProofCheckpoint;
  readonly localProgress: number;
  readonly activeTransformationPaths:
    readonly KpNormalMatrixProofTransformationPath[];
}

const checkpointInputs = [
  {
    id: "statement",
    label: "The theorem",
    learnerQuestion: "What must be proved?",
    accessibleDescription:
      "A complex matrix M satisfies M M dagger equals M dagger M; the goal is a unitary diagonalization.",
    progressPermille: 0,
    primaryPath: "normality",
    visiblePaths: ["matrix", "normality"],
    completedTransformationPaths: []
  },
  {
    id: "row-column-norms",
    label: "Rows and columns become product entries",
    learnerQuestion: "What does each top-left entry measure?",
    accessibleDescription:
      "The top-left entry of M M dagger is the squared norm of the first row, while the top-left entry of M dagger M is the squared norm of the first column.",
    progressPermille: 200,
    primaryPath: "product-left/first-entry",
    visiblePaths: [
      "matrix",
      "normality",
      "product-left",
      "product-left/first-entry",
      "product-right",
      "product-right/first-entry"
    ],
    completedTransformationPaths: [
      "interpret-left-first-entry",
      "interpret-right-first-entry"
    ]
  },
  {
    id: "eigenbasis",
    label: "Choose the eigenvector-first basis",
    learnerQuestion: "Why is the first column sparse?",
    accessibleDescription:
      "In an orthonormal basis beginning with eigenvector v, M has blocks lambda and r in the first row, zeros below lambda, and lower block B.",
    progressPermille: 400,
    primaryPath: "matrix/zero-column",
    visiblePaths: [
      "matrix",
      "normality",
      "eigenbasis",
      "matrix/eigenvalue",
      "matrix/row-remainder",
      "matrix/zero-column",
      "matrix/lower-block"
    ],
    completedTransformationPaths: [
      "interpret-left-first-entry",
      "interpret-right-first-entry",
      "choose-eigenvector-first-basis"
    ]
  },
  {
    id: "norm-equation",
    label: "Compare the first entries",
    learnerQuestion: "Which contribution is unmatched?",
    accessibleDescription:
      "Normality gives absolute lambda squared plus norm r squared equals absolute lambda squared; norm r squared is the unmatched contribution.",
    progressPermille: 600,
    primaryPath: "inference/norm-equality",
    visiblePaths: [
      "matrix",
      "normality",
      "matrix/eigenvalue",
      "matrix/row-remainder",
      "product-left/first-entry",
      "product-right/first-entry",
      "inference/norm-equality"
    ],
    completedTransformationPaths: [
      "interpret-left-first-entry",
      "interpret-right-first-entry",
      "choose-eigenvector-first-basis",
      "compare-first-entries"
    ]
  },
  {
    id: "remainder-zero",
    label: "The row remainder vanishes",
    learnerQuestion: "What did normality force?",
    accessibleDescription:
      "The squared norm of r is zero, so r is zero and the same matrix M settles as the block direct sum of lambda and B.",
    progressPermille: 800,
    primaryPath: "inference/remainder-zero",
    visiblePaths: [
      "matrix",
      "normality",
      "matrix/eigenvalue",
      "matrix/lower-block",
      "inference/norm-equality",
      "inference/remainder-zero",
      "matrix/block-diagonal"
    ],
    completedTransformationPaths: [
      "interpret-left-first-entry",
      "interpret-right-first-entry",
      "choose-eigenvector-first-basis",
      "compare-first-entries",
      "force-row-remainder-zero"
    ]
  },
  {
    id: "recursion",
    label: "Repeat on the lower block",
    learnerQuestion: "Why can the argument repeat?",
    accessibleDescription:
      "The lower-right block equation is B B dagger equals B dagger B, so B is normal and the induction hypothesis applies.",
    progressPermille: 1_000,
    primaryPath: "proof/recursive-subproblem",
    visiblePaths: [
      "matrix",
      "normality",
      "matrix/eigenvalue",
      "matrix/lower-block",
      "matrix/block-diagonal",
      "proof/recursive-subproblem"
    ],
    completedTransformationPaths: [...kpNormalMatrixProofTransformationPaths]
  }
] as const;

export const kpNormalMatrixProofCheckpoints:
  readonly KpNormalMatrixProofCheckpoint[] = Object.freeze(
    checkpointInputs.map((input) => Object.freeze({
      ...input,
      timeMs: Math.round(
        kpNormalMatrixProofDurationMs * input.progressPermille / 1_000
      ),
      visiblePaths: Object.freeze([...input.visiblePaths]),
      completedTransformationPaths: Object.freeze([
        ...input.completedTransformationPaths
      ])
    }))
  );

export function findKpNormalMatrixProofCheckpoint(
  id: KpNormalMatrixProofCheckpointId
): KpNormalMatrixProofCheckpoint {
  const checkpoint = kpNormalMatrixProofCheckpoints.find(
    (candidate) => candidate.id === id
  );
  if (checkpoint === undefined) throw new Error(`Unknown normal-proof checkpoint ${id}.`);
  return checkpoint;
}

export function kpNormalMatrixProofCheckpointTimeMs(
  id: KpNormalMatrixProofCheckpointId
): number {
  return findKpNormalMatrixProofCheckpoint(id).timeMs;
}

export function projectKpNormalMatrixProofClock(
  requestedTimeMs: number
): KpNormalMatrixProofClockProjection {
  const timeMs = clampFinite(requestedTimeMs, 0, kpNormalMatrixProofDurationMs);
  let fromIndex = 0;
  for (let index = 1; index < kpNormalMatrixProofCheckpoints.length; index += 1) {
    if (kpNormalMatrixProofCheckpoints[index]!.timeMs > timeMs) break;
    fromIndex = index;
  }
  const toIndex = Math.min(fromIndex + 1, kpNormalMatrixProofCheckpoints.length - 1);
  const from = kpNormalMatrixProofCheckpoints[fromIndex]!;
  const to = kpNormalMatrixProofCheckpoints[toIndex]!;
  const intervalMs = to.timeMs - from.timeMs;
  const localProgress = intervalMs === 0 ? 0 : (timeMs - from.timeMs) / intervalMs;
  const activeTransformationPaths = to.completedTransformationPaths.filter(
    (path) => !from.completedTransformationPaths.includes(path)
  );

  return Object.freeze({
    timeMs,
    progress: timeMs / kpNormalMatrixProofDurationMs,
    from,
    to,
    localProgress,
    activeTransformationPaths: Object.freeze(activeTransformationPaths)
  });
}

export function checkKpNormalMatrixProofCheckpoints(): readonly string[] {
  const issues: string[] = [];
  const knownPaths = new Set(kpNormalMatrixProofObjectPaths);
  const knownTransformations = new Set(kpNormalMatrixProofTransformationPaths);

  kpNormalMatrixProofCheckpoints.forEach((checkpoint, index) => {
    if (checkpoint.id !== kpNormalMatrixProofCheckpointIds[index]) {
      issues.push(`Checkpoint ${index} does not preserve the authored order.`);
    }
    if (
      checkpoint.progressPermille < 0 ||
      checkpoint.progressPermille > 1_000 ||
      (index > 0 && checkpoint.progressPermille <=
        kpNormalMatrixProofCheckpoints[index - 1]!.progressPermille)
    ) {
      issues.push(`Checkpoint ${checkpoint.id} has invalid clock progress.`);
    }
    if (!checkpoint.visiblePaths.includes(checkpoint.primaryPath)) {
      issues.push(`Checkpoint ${checkpoint.id} must expose its primary semantic path.`);
    }
    for (const path of checkpoint.visiblePaths) {
      if (!knownPaths.has(path)) {
        issues.push(`Checkpoint ${checkpoint.id} references unknown path ${path}.`);
      }
    }
    for (const path of checkpoint.completedTransformationPaths) {
      if (!knownTransformations.has(path)) {
        issues.push(`Checkpoint ${checkpoint.id} references unknown transformation ${path}.`);
      }
    }
  });
  if (kpNormalMatrixProofCheckpoints[0]?.timeMs !== 0) {
    issues.push("The first checkpoint must own time zero.");
  }
  if (kpNormalMatrixProofCheckpoints.at(-1)?.timeMs !== kpNormalMatrixProofDurationMs) {
    issues.push("The final checkpoint must own the timeline endpoint.");
  }
  return Object.freeze(issues);
}

function clampFinite(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) throw new Error("Normal-proof time must be finite.");
  return Math.min(maximum, Math.max(minimum, value));
}
