import type {
  KpFactorCommonTermMotifBinding
} from "../../src/animation/factoring-motif-binding.ts";

const binding: KpFactorCommonTermMotifBinding = {
  kind: "factor-common-term-motif-binding",
  id: "binding.factor-x",
  operation: "factorCommonTerm",
  motif: "merge-fan-in",
  direction: "forward",
  relationRecordId: "relation.factor-x",
  lifecycle: "merge",
  factorCopyIds: ["source.x.0", "source.x.1"],
  commonFactorId: "target.x",
  contextCorrespondences: [],
  structuralArtifactIds: [],
  fusionPaintPolicy: "opaque-many-to-one",
  synchronization: "simultaneous",
  coefficientEvaluation: "deferred"
};

const fading: KpFactorCommonTermMotifBinding = {
  ...binding,
  // @ts-expect-error Factoring fusion has one opaque paint policy.
  fusionPaintPolicy: "fade"
};
const staggered: KpFactorCommonTermMotifBinding = {
  ...binding,
  // @ts-expect-error Every factor contributor joins one fusion cohort.
  synchronization: "staggered"
};
const evaluated: KpFactorCommonTermMotifBinding = {
  ...binding,
  // @ts-expect-error Coefficient evaluation is a separate semantic beat.
  coefficientEvaluation: "eager"
};
const oneContributor: KpFactorCommonTermMotifBinding = {
  ...binding,
  // @ts-expect-error Factoring requires at least two contributor selectors.
  factorCopyIds: ["source.x.0"]
};

void [binding, fading, staggered, evaluated, oneContributor];
