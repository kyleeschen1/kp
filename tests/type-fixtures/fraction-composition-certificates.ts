import type {
  KpVerifiedOpaqueFractionDistribution
} from "../../src/semantic/fraction-fan-out-fixture.ts";

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

void fabricatedDistribution;
