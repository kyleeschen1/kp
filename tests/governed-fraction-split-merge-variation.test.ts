import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetSeekRewindLaw
} from "../src/animation/asset.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  createKpGovernedFractionSplitMergeVariation
} from "../src/authoring/public-api.ts";
import {
  compileKpReaderEquationMaterialPlan,
  projectKpReaderEquationRenderPlan
} from "../src/reader/renderers/public-api.ts";

test("governed fraction variation compiles exact parameterized equality", () => {
  const fixture = createKpGovernedFractionSplitMergeVariation();
  const objects = fixture.authority.animation.bundle.objects;

  assert.equal(fixture.compilation.kind,
    "verified-governed-canonical-construction");
  assert.deepEqual(fixture.equalityCertificate.source, {
    variableCoefficient: { numerator: "1", denominator: "1" },
    constant: { numerator: "3", denominator: "1" }
  });
  assert.deepEqual(
    fixture.equalityCertificate.target,
    fixture.equalityCertificate.source
  );
  assert.deepEqual(
    objects.map(({ value }) => value),
    [
      { latex: "\\frac{3y + 9}{3}" },
      { latex: "\\frac{3y}{3} + \\frac{9}{3}" }
    ]
  );
  assert.deepEqual(
    fixture.compilation.construction.operations.map(
      ({ transformationId }) => transformationId
    ),
    fixture.request.approvedOperationIds
  );
});

test("governed fraction variation retains one seekable reader plan", () => {
  const fixture = createKpGovernedFractionSplitMergeVariation();
  const animation = fixture.authority.animation;

  assert.equal(checkKpAnimationAssetSeekRewindLaw(animation).passed, true);
  for (const direction of ["forward", "rewind"] as const) {
    for (let index = 0; index <= 100; index += 1) {
      const progress = index / 100;
      const sample = () => sampleKpAnimationRuntimeFrame({
        animation,
        direction,
        progress
      });
      const first = sample();
      sampleKpAnimationRuntimeFrame({
        animation,
        direction,
        progress: 1 - progress
      });
      assert.deepEqual(sample(), first);
    }
  }

  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    animation,
    direction: "forward",
    progress: 0.25
  });
  const renderPlan = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame
  });
  const materialPlan = compileKpReaderEquationMaterialPlan(renderPlan);
  assert.deepEqual(renderPlan.diagnostics, []);
  assert.deepEqual(materialPlan.diagnostics, []);
  assert.ok(materialPlan.transitions[0]?.owners.some(
    ({ lifecycle }) => lifecycle === "split"
  ));

  const serialized = JSON.stringify(fixture);
  for (const forbidden of [
    "\"renderer\"",
    "\"rect\"",
    "\"geometry\"",
    "\"keyframes\"",
    "\"timing\"",
    "\"dom\""
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
});
