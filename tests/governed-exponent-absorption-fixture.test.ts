import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  projectKpAnimationAsset,
  recomposeKpAnimationAsset
} from "../src/animation/asset-projections.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  createKpGovernedExponentAbsorptionFixture
} from "../src/authoring/canonical-animation-public-api.ts";
import {
  createKpGovernedExponentRadicalPromotionCandidate
} from "../src/authoring/governed-exponent-radical-promotion.ts";
import {
  compileKpReaderEquationMaterialPlan,
  projectKpReaderEquationRenderPlan
} from "../src/reader/renderers/public-api.ts";

test("existing governed unit-exponent trace compiles into the v2 construction", () => {
  const fixture = createKpGovernedExponentAbsorptionFixture();
  const predecessor = createKpGovernedExponentRadicalPromotionCandidate()
    .recordedProviderResponses.find(
      ({ id }) => id === fixture.predecessorRequestId
    );
  const operation = fixture.compilation.construction.operations[0]!;
  const evidence = fixture.compilation.mathematicalVerification.operations[0]!;

  assert.ok(predecessor);
  assert.equal(predecessor.operationIntent.operationId,
    "kp.algebra.unwrap-unit-exponent");
  assert.equal(predecessor.source.sourceId, fixture.request.source.sourceId);
  assert.equal(predecessor.source.revisionId, fixture.request.source.revisionId);
  assert.equal(operation.transformationId,
    "transform.generated.exponent.square-as-product.unwrap-unit-exponent");
  assert.equal(operation.definitionId,
    "definition.generated.exponent.unwrap-unit-exponent");
  assert.deepEqual(evidence.strictLawIds, [
    "law.arithmetic.unit-exponent"
  ]);
  assert.ok(operation.lineage.some(({ relation, targetEntityIds }) =>
    relation === "removal" && targetEntityIds.length === 0
  ));
});

test("unit-exponent absorption projects the canonical elimination contract", async () => {
  const fixture = createKpGovernedExponentAbsorptionFixture();
  const animation = fixture.authority.animation;
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: "runtime.governed.exponent-absorption",
    animation,
    direction: "forward",
    progress: 0.75
  });
  const renderPlan = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame
  });
  const materialPlan = compileKpReaderEquationMaterialPlan(renderPlan);
  const transition = renderPlan.transitions[0]!;
  const materialTransition = materialPlan.transitions[0]!;
  const adapter = await readFile(
    "src/reader/renderers/equation-scene-compositor-adapter.ts",
    "utf8"
  );

  assert.deepEqual(renderPlan.diagnostics, []);
  assert.deepEqual(materialPlan.diagnostics, []);
  assert.ok(
    transition.relations.some(({ lifecycle }) => lifecycle === "exit")
  );
  assert.ok(
    materialTransition.owners.some(
      ({ lifecycle }) => lifecycle === "exit"
    )
  );
  assert.match(adapter, /kpNativeKatexFeaturePackLoader\.load\(\)/);
  assert.match(adapter, /nativeKatex\.compose\.createSession/);
  assert.doesNotMatch(
    adapter,
    /import\s*\{[^}]*createKpCanonicalNativeKatexSceneSession/
  );
  assert.doesNotMatch(adapter, /unit-exponent|unwrap-unit-exponent/);
});

test("unit-exponent construction stays static and headless", () => {
  const fixture = createKpGovernedExponentAbsorptionFixture();
  const animation = fixture.authority.animation;
  const projections = projectKpAnimationAsset(animation);
  const recomposed = recomposeKpAnimationAsset(projections);

  assert.deepEqual(recomposed, animation);
  assert.deepEqual(
    projections.productManifest.exportTargets.map(({ kind }) => kind),
    ["frame-sequence"]
  );
  for (const direction of ["forward", "rewind"] as const) {
    for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
      const sample = () => sampleKpAnimationRuntimeFrame({
        animation,
        direction,
        progress
      });
      assert.deepEqual(sample(), sample());
      assert.deepEqual(sample().diagnostics, []);
    }
  }
  const durable = JSON.stringify({
    request: fixture.request,
    construction: fixture.compilation.construction,
    projections
  });
  for (const forbidden of [
    "renderer-session",
    "sourceElement",
    "\"rect\"",
    "fontRevision",
    "viewportKey"
  ]) {
    assert.equal(durable.includes(forbidden), false, forbidden);
  }
});
