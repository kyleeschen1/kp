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
import {
  compileKpDistributionChoreography,
  sampleKpDistributionChoreography
} from "../src/animation/distribution-choreography.ts";
import {
  compileKpFactoringChoreography,
  sampleKpFactoringChoreography
} from "../src/animation/factoring-choreography.ts";

test("fission and fusion are exposed as one immutable explicit capability", () => {
  const capability: KpFissionFusionCapability = kpFissionFusionCapability;

  assert.equal(Object.isFrozen(capability), true);
  assert.equal(capability.compile, compileKpFissionFusionPlan);
  assert.equal(capability.sample, sampleKpFissionFusion);
  assert.deepEqual(Object.keys(capability).sort(), ["compile", "sample"]);
});

test("distribution and factoring delegate lineage work through the injected capability", () => {
  let compileCalls = 0;
  let sampleCalls = 0;
  const dependency = {
    fissionFusion: {
      compile(input: Parameters<KpFissionFusionCapability["compile"]>[0]) {
        compileCalls += 1;
        return kpFissionFusionCapability.compile(input);
      },
      sample(input: Parameters<KpFissionFusionCapability["sample"]>[0]) {
        sampleCalls += 1;
        return kpFissionFusionCapability.sample(input);
      }
    }
  };
  const distribution = compileKpDistributionChoreography({
    id: "distribution.injected",
    sourceFactorId: "source.factor",
    factorCopyIds: ["target.factor.0", "target.factor.1"],
    addendPairs: [
      { sourceId: "source.term.0", targetId: "target.term.0", semanticIndex: 0 },
      { sourceId: "source.term.1", targetId: "target.term.1", semanticIndex: 1 }
    ],
    connectorPairs: [{
      sourceId: "source.connector",
      targetId: "target.connector",
      semanticIndex: 0
    }],
    groupingArtifactIds: ["source.left-paren", "source.right-paren"]
  }, dependency);
  sampleKpDistributionChoreography({ plan: distribution, progress: 0.5 }, dependency);

  const factoring = compileKpFactoringChoreography({
    id: "factoring.injected",
    factorCopyIds: ["source.factor.0", "source.factor.1"],
    commonFactorId: "target.factor",
    addendPairs: [
      { sourceId: "source.term.0", targetId: "target.term.0", semanticIndex: 0 },
      { sourceId: "source.term.1", targetId: "target.term.1", semanticIndex: 1 }
    ],
    connectorPairs: [{
      sourceId: "source.connector",
      targetId: "target.connector",
      semanticIndex: 0
    }],
    groupingArtifactIds: ["target.left-paren", "target.right-paren"]
  }, dependency);
  sampleKpFactoringChoreography({ plan: factoring, progress: 0.5 }, dependency);

  assert.equal(compileCalls, 2);
  assert.equal(sampleCalls, 2);
});
