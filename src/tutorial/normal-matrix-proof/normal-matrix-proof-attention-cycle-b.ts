import {
  createKpAnimationSaliencePlan,
  type KpAnimationSalienceIntent,
  type KpAnimationSaliencePlan
} from "../../animation/salience-plan.ts";
import {
  kpNormalMatrixProofTransformationPaths,
  type KpNormalMatrixProofTransformationPath
} from "../../semantic/normal-matrix-proof-operations.ts";
import type { KpNormalMatrixProofObjectPath } from
  "../../semantic/normal-matrix-proof-semantics.ts";
import {
  kpNormalMatrixProofAttentionPhaseKinds,
  type KpNormalMatrixProofAttentionPhase,
  type KpNormalMatrixProofAttentionPhaseKind
} from "./normal-matrix-proof-attention-cycle-a.ts";
import { kpNormalMatrixProofAttentionScene } from
  "./normal-matrix-proof-attention-scene.ts";

export interface KpNormalMatrixProofAttentionCycleB {
  readonly id: "attention.normal-proof.cycle-b";
  readonly entryCheckpointId: "norm-equation";
  readonly settledCheckpointId: "recursion";
  readonly salience: KpAnimationSaliencePlan;
  readonly phases: readonly KpNormalMatrixProofAttentionPhase[];
}

export interface KpNormalMatrixProofAttentionCycleBProjection {
  readonly cycleId: KpNormalMatrixProofAttentionCycleB["id"];
  readonly phase: KpNormalMatrixProofAttentionPhase;
  readonly intents: readonly KpAnimationSalienceIntent[];
}

const intents = Object.freeze([
  predict(
    "predict-remainder",
    ["matrix/row-remainder", "inference/norm-equality"],
    "What must a nonnegative squared norm be if adding it changes nothing?",
    "Hold the equality and invite the learner to predict the row remainder."
  ),
  compare(
    "compare-matched-contributions",
    ["product-left/first-entry"],
    ["product-right/first-entry"],
    "Match the absolute-lambda-squared contribution on both sides."
  ),
  notice(
    "notice-unmatched-squared-norm",
    ["matrix/row-remainder", "inference/norm-equality"],
    "Isolate the remaining nonnegative squared norm without changing the equation."
  ),
  transmit(
    "derive-zero-remainder",
    ["inference/norm-equality", "matrix/row-remainder"],
    ["inference/remainder-zero"],
    "Use the zero-norm inference to conclude that the row remainder itself is zero."
  ),
  reveal(
    "reveal-zero-norm",
    ["inference/norm-equality"],
    "disclosure.normal-proof.row-norm-zero",
    "Reveal that the squared norm of the row remainder is zero."
  ),
  reveal(
    "reveal-zero-remainder",
    ["inference/remainder-zero"],
    "disclosure.normal-proof.remainder-zero",
    "Reveal the mathematical conclusion r equals zero."
  ),
  reveal(
    "reveal-block-diagonal",
    ["matrix", "matrix/block-diagonal"],
    "disclosure.normal-proof.block-diagonal",
    "Settle the same matrix as the direct sum of lambda and B."
  ),
  notice(
    "notice-recursive-block",
    ["matrix/lower-block", "proof/recursive-subproblem"],
    "Focus the smaller lower block as the recursive subproblem."
  ),
  transmit(
    "transmit-normality-to-lower-block",
    ["normality", "matrix/block-diagonal", "matrix/lower-block"],
    ["proof/recursive-subproblem"],
    "Restrict the governing normality relation to the lower block."
  ),
  supportingContext(
    "hold-proof-continuity",
    ["matrix", "normality", "matrix/eigenvalue"],
    [
      "predict-remainder",
      "compare-matched-contributions",
      "notice-unmatched-squared-norm",
      "derive-zero-remainder",
      "reveal-zero-norm",
      "reveal-zero-remainder",
      "reveal-block-diagonal",
      "notice-recursive-block",
      "transmit-normality-to-lower-block"
    ],
    "Keep the same matrix, eigenvalue, and governing normality relation readable."
  )
] satisfies readonly KpAnimationSalienceIntent[]);

export const kpNormalMatrixProofAttentionCycleB:
  KpNormalMatrixProofAttentionCycleB = Object.freeze({
    id: "attention.normal-proof.cycle-b",
    entryCheckpointId: "norm-equation",
    settledCheckpointId: "recursion",
    salience: createKpAnimationSaliencePlan({
      id: "salience.normal-proof.cycle-b",
      intents,
      scenes: [kpNormalMatrixProofAttentionScene]
    }),
    phases: Object.freeze([
      phase("cycle-b.orient", "orient", [
        "predict-remainder",
        "hold-proof-continuity"
      ]),
      phase("cycle-b.act", "act", [
        "compare-matched-contributions",
        "notice-unmatched-squared-norm",
        "derive-zero-remainder",
        "hold-proof-continuity"
      ], ["force-row-remainder-zero"]),
      phase("cycle-b.settle", "settle", [
        "reveal-zero-norm",
        "reveal-zero-remainder",
        "reveal-block-diagonal",
        "hold-proof-continuity"
      ], ["force-row-remainder-zero"]),
      phase("cycle-b.inspect", "inspect", [
        "notice-recursive-block",
        "transmit-normality-to-lower-block",
        "hold-proof-continuity"
      ], ["restrict-normality-to-lower-block"])
    ])
  });

export function projectKpNormalMatrixProofAttentionCycleBPhase(
  kind: KpNormalMatrixProofAttentionPhaseKind
): KpNormalMatrixProofAttentionCycleBProjection {
  const phase = kpNormalMatrixProofAttentionCycleB.phases.find(
    (candidate) => candidate.kind === kind
  );
  if (phase === undefined) throw new Error(`Unknown cycle B attention phase ${kind}.`);
  const intentsById = new Map(
    kpNormalMatrixProofAttentionCycleB.salience.intents.map((intent) => [
      intent.id,
      intent
    ])
  );
  return Object.freeze({
    cycleId: kpNormalMatrixProofAttentionCycleB.id,
    phase,
    intents: Object.freeze(phase.intentIds.map((intentId) => {
      const intent = intentsById.get(intentId);
      if (intent === undefined) {
        throw new Error(`Cycle B phase ${phase.id} references unknown intent ${intentId}.`);
      }
      return intent;
    }))
  });
}

export function checkKpNormalMatrixProofAttentionCycleB(): readonly string[] {
  const issues: string[] = [];
  const intentIds = new Set(
    kpNormalMatrixProofAttentionCycleB.salience.intents.map(({ id }) => id)
  );
  const transformations = new Set(kpNormalMatrixProofTransformationPaths);
  kpNormalMatrixProofAttentionCycleB.phases.forEach((candidate, index) => {
    if (candidate.kind !== kpNormalMatrixProofAttentionPhaseKinds[index]) {
      issues.push(`Cycle B phase ${index} must be ${kpNormalMatrixProofAttentionPhaseKinds[index]}.`);
    }
    candidate.intentIds.forEach((intentId) => {
      if (!intentIds.has(intentId)) {
        issues.push(`Cycle B phase ${candidate.id} references unknown intent ${intentId}.`);
      }
    });
    candidate.transformationPaths.forEach((path) => {
      if (!transformations.has(path)) {
        issues.push(`Cycle B phase ${candidate.id} references unknown transformation ${path}.`);
      }
    });
  });
  const revealPhase = new Map(
    kpNormalMatrixProofAttentionCycleB.phases.flatMap((candidate) =>
      candidate.intentIds.map((intentId) => [intentId, candidate.kind] as const)
    )
  );
  if (revealPhase.get("predict-remainder") !== "orient") {
    issues.push("Cycle B must ask for the row-remainder prediction during orient.");
  }
  for (const revealId of [
    "reveal-zero-norm",
    "reveal-zero-remainder",
    "reveal-block-diagonal"
  ]) {
    if (revealPhase.get(revealId) === "orient") {
      issues.push(`Cycle B cannot reveal ${revealId} before prediction.`);
    }
  }
  return Object.freeze(issues);
}

function phase(
  id: string,
  kind: KpNormalMatrixProofAttentionPhaseKind,
  intentIds: readonly string[],
  transformationPaths: readonly KpNormalMatrixProofTransformationPath[] = []
): KpNormalMatrixProofAttentionPhase {
  return Object.freeze({
    id,
    kind,
    intentIds: Object.freeze([...intentIds]),
    transformationPaths: Object.freeze([...transformationPaths])
  });
}

function predict(
  id: string,
  targetEntityIds: readonly KpNormalMatrixProofObjectPath[],
  prompt: string,
  summary: string
): KpAnimationSalienceIntent {
  return { id, kind: "predict", targetEntityIds, prompt, summary };
}

function notice(
  id: string,
  targetEntityIds: readonly KpNormalMatrixProofObjectPath[],
  summary: string
): KpAnimationSalienceIntent {
  return { id, kind: "notice", targetEntityIds, summary };
}

function compare(
  id: string,
  leftEntityIds: readonly KpNormalMatrixProofObjectPath[],
  rightEntityIds: readonly KpNormalMatrixProofObjectPath[],
  summary: string
): KpAnimationSalienceIntent {
  return { id, kind: "compare", leftEntityIds, rightEntityIds, summary };
}

function transmit(
  id: string,
  sourceEntityIds: readonly KpNormalMatrixProofObjectPath[],
  targetEntityIds: readonly KpNormalMatrixProofObjectPath[],
  summary: string
): KpAnimationSalienceIntent {
  return { id, kind: "transmit", sourceEntityIds, targetEntityIds, summary };
}

function reveal(
  id: string,
  targetEntityIds: readonly KpNormalMatrixProofObjectPath[],
  disclosureId: string,
  summary: string
): KpAnimationSalienceIntent {
  return { id, kind: "reveal", targetEntityIds, disclosureId, summary };
}

function supportingContext(
  id: string,
  contextEntityIds: readonly KpNormalMatrixProofObjectPath[],
  supportsIntentIds: readonly string[],
  summary: string
): KpAnimationSalienceIntent {
  return {
    id,
    kind: "supporting-context",
    contextEntityIds,
    supportsIntentIds,
    summary
  };
}
