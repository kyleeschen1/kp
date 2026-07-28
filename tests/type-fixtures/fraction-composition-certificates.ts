import type {
  KpVerifiedOpaqueFractionDistribution
} from "../../src/semantic/fraction-fan-out-fixture.ts";
import type {
  KpVerifiedFractionDistributedSumComposition
} from "../../src/semantic/fraction-distributed-sum-composition.ts";
import type {
  KpVerifiedFractionNumeratorNormalization
} from "../../src/semantic/fraction-numerator-normalization.ts";
import type {
  KpVerifiedFractionFactoringRewrite
} from "../../src/semantic/fraction-reverse-factoring.ts";
import type {
  KpVerifiedFractionSolveTrace
} from "../../src/semantic/fraction-solve-macro.ts";

// @ts-expect-error Only the semantic verifier can mint whole-fraction distribution proof.
const fabricatedDistribution: KpVerifiedOpaqueFractionDistribution = {
  schemaVersion: "kp.verified-opaque-fraction-distribution.v1",
  lawId: "kp.algebra.distribute.v1",
  sourceRootId: "source",
  targetRootId: "target",
  commonFactorId: "source.factor",
  copiedFactorIds: ["target.factor.0", "target.factor.1"],
  denominatorIds: [
    "source.factor.denominator",
    "target.factor.0.denominator",
    "target.factor.1.denominator"
  ],
  denominatorValue: 3
};

// @ts-expect-error Schedule code cannot fabricate a semantic normalization result.
const fabricatedNormalization: KpVerifiedFractionNumeratorNormalization = {
  schemaVersion: "kp.verified-fraction-numerator-normalization.v1",
  fanOutProof: fabricatedDistribution,
  branchOrder: ["term.x", "term.6"],
  targetRootIds: ["target.x", "target.6"],
  schedulePolicies: ["parallel", "sequential"]
};

// @ts-expect-error Layout or renderer code cannot fabricate ordered composition proof.
const fabricatedComposition: KpVerifiedFractionDistributedSumComposition = {
  schemaVersion: "kp.verified-fraction-distributed-sum-composition.v1",
  normalizationProof: fabricatedNormalization,
  branchOrder: ["term.x", "term.6"],
  composedRootId: "target.sum",
  targetTermIds: ["target.x", "target.6"]
};

// @ts-expect-error Factoring proof is available only through inverse semantic verification.
const fabricatedFactoring: KpVerifiedFractionFactoringRewrite = {
  schemaVersion: "kp.verified-fraction-factoring-rewrite.v1",
  lawId: "kp.algebra.factor.v1",
  reverseLawId: "kp.algebra.distribute.v1",
  sourceRootId: "distributed",
  targetRootId: "factored",
  lineage: []
};

// @ts-expect-error Product code cannot label an arbitrary equation list as a verified solve.
const fabricatedSolve: KpVerifiedFractionSolveTrace = {
  schemaVersion: "kp.verified-fraction-solve-trace.v1",
  compositionProof: fabricatedComposition,
  reverseFactoringProof: fabricatedFactoring,
  stateCount: 14,
  stepCount: 13,
  stateIds: [],
  stepIds: [],
  adjacency: [],
  solution: { numerator: "9", denominator: "1" }
};

void [
  fabricatedDistribution,
  fabricatedNormalization,
  fabricatedComposition,
  fabricatedFactoring,
  fabricatedSolve
];
