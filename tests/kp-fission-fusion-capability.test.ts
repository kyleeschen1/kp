import assert from "node:assert/strict";
import test from "node:test";
import {
  kpFissionFusionCapability,
  type KpFissionFusionCapability
} from "../src/animation/fission-fusion-capability.ts";
import {
  compileKpFissionFusionPlan,
  sampleKpFissionFusion
} from "../src/animation/fission-fusion.ts";

test("fission and fusion are exposed as one immutable explicit capability", () => {
  const capability: KpFissionFusionCapability = kpFissionFusionCapability;

  assert.equal(Object.isFrozen(capability), true);
  assert.equal(capability.compile, compileKpFissionFusionPlan);
  assert.equal(capability.sample, sampleKpFissionFusion);
  assert.deepEqual(Object.keys(capability).sort(), ["compile", "sample"]);
});
