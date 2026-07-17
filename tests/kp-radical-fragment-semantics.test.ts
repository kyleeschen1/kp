import assert from "node:assert/strict";
import test from "node:test";

import {
  createExponentRadicalRewriteAnimationAsset
} from "../src/animation/exponent-radical-adapter.ts";
import {
  createGeneratedRadicalTutorialFixture
} from "../src/semantic/generated-algebra-tutorial-fixture.ts";
import {
  resolveKpRadicalFragmentSemantics
} from "../src/semantic/radical-fragment-semantics.ts";
import {
  compileKpSemanticEquationTransitionResult
} from "../src/rendering/semantic-equation-transition-compiler.ts";

test("square-root rewrite exposes hook and overbar as independent semantic fragments", () => {
  const animation = createExponentRadicalRewriteAnimationAsset();
  const semantics = resolveKpRadicalFragmentSemantics(
    animation.transformations[0]!
  );

  assert.ok(semantics.source.numeratorSelectorId.endsWith(".exponent-numerator"));
  assert.ok(semantics.source.fractionRuleSelectorId.endsWith(".exponent-fraction-line"));
  assert.ok(semantics.source.denominatorSelectorId.endsWith(".exponent-denominator"));
  assert.ok(semantics.target.hookSelectorId.endsWith(".radical-hook"));
  assert.ok(semantics.target.overbarSelectorId.endsWith(".radical-overbar"));
  assert.ok(semantics.target.radicandSelectorId.endsWith(".radicand"));
  assert.equal(semantics.target.rootIndexSelectorId, undefined);
  assert.equal(semantics.target.radicandExponentSelectorId, undefined);
  assert.deepEqual(
    semantics.notationRecords.map((record) => [record.id, record.relation]),
    [
      ["unit-numerator-absorbed", "removal"],
      ["fraction-rule-becomes-radical-overbar", "role-change"],
      ["denominator-becomes-radical-hook", "role-change"]
    ]
  );
});

test("general roots expose explicit index and radicand exponent roles", () => {
  const fixture = createGeneratedRadicalTutorialFixture({
    familyId: "generated.radical",
    id: "generated.radical.cube-root-power",
    title: "Generated cube-root power",
    base: "x",
    index: 3,
    exponentNumerator: 2
  });
  const transformation = fixture.transformations[0]!;
  const semantics = resolveKpRadicalFragmentSemantics(transformation);
  const compilation = compileKpSemanticEquationTransitionResult({
    transformation,
    bundle: fixture.bundle
  });

  assert.equal(compilation.status, "semantic");
  assert.deepEqual(compilation.diagnostics, []);
  assert.ok(semantics.target.rootIndexSelectorId?.endsWith(".root-index"));
  assert.ok(
    semantics.target.radicandExponentSelectorId?.endsWith(".radicand-exponent")
  );
  assert.deepEqual(
    semantics.notationRecords.map((record) => [record.id, record.relation]),
    [
      ["numerator-becomes-radicand-exponent", "role-change"],
      ["fraction-rule-becomes-radical-overbar", "role-change"],
      ["denominator-becomes-root-index", "role-change"],
      ["radical-hook-introduced", "introduction"]
    ]
  );
});
