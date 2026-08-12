import assert from "node:assert/strict";
import test from "node:test";
import {
  createKpAlgebraAnimationPack
} from "../src/animation/catalog-packs/algebra.ts";
import {
  createKpAlgebraChoreographyCapabilities
} from "../src/animation/algebra-choreography-capabilities.ts";
import {
  kpFissionFusionCapability
} from "../src/animation/fission-fusion-capability.ts";
import {
  loadKpAnimationAsset
} from "../src/animation/catalog-loader.ts";

test("the algebra pack carries immutable runtime capabilities beside serializable assets", async () => {
  const pack = createKpAlgebraAnimationPack();
  assert.equal(Object.isFrozen(pack), true);
  assert.equal(Object.isFrozen(pack.catalog), true);
  assert.equal(Object.isFrozen(pack.runtimeCapabilities), true);
  assert.equal(pack.catalog.length, 9);
  assert.equal(
    typeof pack.runtimeCapabilities.distributionChoreography?.compile,
    "function"
  );
  assert.equal(
    typeof pack.runtimeCapabilities.factoringChoreography?.sample,
    "function"
  );
  assert.equal(
    pack.runtimeCapabilities.canonicalReverseChoreography
      ?.planForTransformationType("distributeMultiplication")
      ?.choreographyKind,
    "fusion"
  );
  assert.equal("runtimeCapabilities" in pack.catalog[0]!, false);

  const loaded = await loadKpAnimationAsset(
    "animation.generated.distribution.expand-a-sum"
  );
  assert.equal(
    loaded.runtimeCapabilities,
    pack.runtimeCapabilities
  );
});

test("algebra capability construction closes over the supplied fission/fusion value", () => {
  let compileCalls = 0;
  const capabilities = createKpAlgebraChoreographyCapabilities({
    fissionFusion: {
      compile(input) {
        compileCalls += 1;
        return kpFissionFusionCapability.compile(input);
      },
      sample: kpFissionFusionCapability.sample
    }
  });

  capabilities.distributionChoreography.compile({
    id: "distribution.pack-injected",
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
  });

  assert.equal(compileCalls, 1);
});
