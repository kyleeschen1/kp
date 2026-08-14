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
import { kpNormalMatrixProofAttentionScene } from
  "./normal-matrix-proof-attention-scene.ts";

export const kpNormalMatrixProofAttentionPhaseKinds = Object.freeze([
  "orient",
  "act",
  "settle",
  "inspect"
] as const);

export type KpNormalMatrixProofAttentionPhaseKind =
  typeof kpNormalMatrixProofAttentionPhaseKinds[number];

export interface KpNormalMatrixProofAttentionPhase {
  readonly id: string;
  readonly kind: KpNormalMatrixProofAttentionPhaseKind;
  readonly intentIds: readonly string[];
  readonly transformationPaths:
    readonly KpNormalMatrixProofTransformationPath[];
}

export interface KpNormalMatrixProofAttentionCycleA {
  readonly id: "attention.normal-proof.cycle-a";
  readonly entryCheckpointId: "eigenbasis";
  readonly settledCheckpointId: "norm-equation";
  readonly salience: KpAnimationSaliencePlan;
  readonly phases: readonly KpNormalMatrixProofAttentionPhase[];
}

export interface KpNormalMatrixProofAttentionPhaseProjection {
  readonly cycleId: KpNormalMatrixProofAttentionCycleA["id"];
  readonly phase: KpNormalMatrixProofAttentionPhase;
  readonly intents: readonly KpAnimationSalienceIntent[];
}

const intents = Object.freeze([
  notice(
    "notice-first-row",
    ["matrix/eigenvalue", "matrix/row-remainder"],
    "Notice the eigenvalue and row remainder that form the first row."
  ),
  notice(
    "notice-first-column",
    ["matrix/eigenvalue", "matrix/zero-column"],
    "Notice the eigenvalue and zeros that form the first column."
  ),
  transmit(
    "transmit-first-row",
    ["matrix/eigenvalue", "matrix/row-remainder"],
    ["product-left/first-entry"],
    "Carry the first-row contributions into the top-left entry of M M dagger."
  ),
  transmit(
    "transmit-first-column",
    ["matrix/eigenvalue", "matrix/zero-column"],
    ["product-right/first-entry"],
    "Carry the first-column contributions into the top-left entry of M dagger M."
  ),
  compare(
    "compare-first-entries",
    ["product-left/first-entry"],
    ["product-right/first-entry"],
    "Compare the two top-left entries equated by normality."
  ),
  notice(
    "notice-unmatched-remainder",
    ["matrix/row-remainder", "inference/norm-equality"],
    "Notice that the squared norm of the row remainder is the unmatched contribution."
  ),
  supportingContext(
    "hold-governing-context",
    ["matrix", "normality"],
    [
      "notice-first-row",
      "notice-first-column",
      "transmit-first-row",
      "transmit-first-column",
      "compare-first-entries",
      "notice-unmatched-remainder"
    ],
    "Keep the same matrix and its full normality relation readable throughout."
  )
] satisfies readonly KpAnimationSalienceIntent[]);

export const kpNormalMatrixProofAttentionCycleA:
  KpNormalMatrixProofAttentionCycleA = Object.freeze({
    id: "attention.normal-proof.cycle-a",
    entryCheckpointId: "eigenbasis",
    settledCheckpointId: "norm-equation",
    salience: createKpAnimationSaliencePlan({
      id: "salience.normal-proof.cycle-a",
      intents,
      scenes: [kpNormalMatrixProofAttentionScene]
    }),
    phases: Object.freeze([
      phase("cycle-a.orient", "orient", [
        "notice-first-row",
        "notice-first-column",
        "hold-governing-context"
      ]),
      phase("cycle-a.act", "act", [
        "transmit-first-row",
        "transmit-first-column",
        "hold-governing-context"
      ], ["interpret-left-first-entry", "interpret-right-first-entry"]),
      phase("cycle-a.settle", "settle", [
        "compare-first-entries",
        "hold-governing-context"
      ], ["compare-first-entries"]),
      phase("cycle-a.inspect", "inspect", [
        "compare-first-entries",
        "notice-unmatched-remainder",
        "hold-governing-context"
      ])
    ])
  });

export function projectKpNormalMatrixProofAttentionCycleAPhase(
  kind: KpNormalMatrixProofAttentionPhaseKind
): KpNormalMatrixProofAttentionPhaseProjection {
  const phase = kpNormalMatrixProofAttentionCycleA.phases.find(
    (candidate) => candidate.kind === kind
  );
  if (phase === undefined) throw new Error(`Unknown cycle A attention phase ${kind}.`);
  const intentsById = new Map(
    kpNormalMatrixProofAttentionCycleA.salience.intents.map((intent) => [
      intent.id,
      intent
    ])
  );
  return Object.freeze({
    cycleId: kpNormalMatrixProofAttentionCycleA.id,
    phase,
    intents: Object.freeze(phase.intentIds.map((intentId) => {
      const intent = intentsById.get(intentId);
      if (intent === undefined) {
        throw new Error(`Cycle A phase ${phase.id} references unknown intent ${intentId}.`);
      }
      return intent;
    }))
  });
}

function notice(
  id: string,
  targetEntityIds: readonly KpNormalMatrixProofObjectPath[],
  summary: string
): KpAnimationSalienceIntent {
  return { id, kind: "notice", targetEntityIds, summary };
}

function transmit(
  id: string,
  sourceEntityIds: readonly KpNormalMatrixProofObjectPath[],
  targetEntityIds: readonly KpNormalMatrixProofObjectPath[],
  summary: string
): KpAnimationSalienceIntent {
  return { id, kind: "transmit", sourceEntityIds, targetEntityIds, summary };
}

function compare(
  id: string,
  leftEntityIds: readonly KpNormalMatrixProofObjectPath[],
  rightEntityIds: readonly KpNormalMatrixProofObjectPath[],
  summary: string
): KpAnimationSalienceIntent {
  return { id, kind: "compare", leftEntityIds, rightEntityIds, summary };
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

export function checkKpNormalMatrixProofAttentionCycleA(): readonly string[] {
  const issues: string[] = [];
  const intentIds = new Set(
    kpNormalMatrixProofAttentionCycleA.salience.intents.map(({ id }) => id)
  );
  const transformationPaths = new Set(kpNormalMatrixProofTransformationPaths);
  kpNormalMatrixProofAttentionCycleA.phases.forEach((candidate, index) => {
    if (candidate.kind !== kpNormalMatrixProofAttentionPhaseKinds[index]) {
      issues.push(`Cycle A phase ${index} must be ${kpNormalMatrixProofAttentionPhaseKinds[index]}.`);
    }
    for (const intentId of candidate.intentIds) {
      if (!intentIds.has(intentId)) {
        issues.push(`Cycle A phase ${candidate.id} references unknown intent ${intentId}.`);
      }
    }
    for (const path of candidate.transformationPaths) {
      if (!transformationPaths.has(path)) {
        issues.push(`Cycle A phase ${candidate.id} references unknown transformation ${path}.`);
      }
    }
  });
  return Object.freeze(issues);
}
