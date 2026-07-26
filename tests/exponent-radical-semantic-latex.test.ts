import assert from "node:assert/strict";
import test from "node:test";

import {
  createExponentExpansionAnimationAsset,
  createExponentRadicalRewriteAnimationAsset
} from "../src/animation/exponent-radical-adapter.ts";
import {
  createKpExponentRadicalSelectorAnnotatedLatex,
  projectKpExponentRadicalStructuralBindings
} from "../src/rendering/exponent-radical-selector-annotated-latex.ts";
import {
  resolveKpRadicalFragmentSemantics
} from "../src/semantic/radical-fragment-semantics.ts";
import { compileKpSemanticEquationTransitionResult } from "../src/domain-ir/public-api.ts";

test("exponent expansion and radical rewriting compile complete semantics", () => {
  for (const animation of [
    createExponentExpansionAnimationAsset(),
    createExponentRadicalRewriteAnimationAsset()
  ]) {
    for (const transformation of animation.transformations) {
      const result = compileKpSemanticEquationTransitionResult({
        transformation,
        bundle: animation.bundle
      });
      assert.equal(result.status, "semantic", transformation.id);
      assert.deepEqual(result.diagnostics, [], transformation.id);
    }
  }
});

test("exponent and radical states reserve structural glyphs for DOM binding", () => {
  for (const animation of [
    createExponentExpansionAnimationAsset(),
    createExponentRadicalRewriteAnimationAsset()
  ]) {
    for (const object of animation.bundle.objects) {
      const annotated = createKpExponentRadicalSelectorAnnotatedLatex({
        objectId: object.id,
        selectors: object.selectors
      });
      assert.ok(annotated, object.id);
      const structural = object.selectors.filter((selector) =>
        selector.id.endsWith(".exponent-fraction-line") ||
        selector.id.endsWith(".radical-hook") ||
        selector.id.endsWith(".radical-overbar")
      );
      assert.equal(annotated.annotations.length, object.selectors.length - structural.length);
      assert.deepEqual(
        annotated.structuralSelectorIds,
        structural.map(({ id }) => id)
      );
    }
  }
});

test("radical structural bindings cover compiler lineage without glyph matching", () => {
  const animation = createExponentRadicalRewriteAnimationAsset();
  const transformation = animation.transformations[0]!;
  const semantics = resolveKpRadicalFragmentSemantics(transformation);
  const structuralIds = animation.bundle.objects.flatMap((object) =>
    projectKpExponentRadicalStructuralBindings({
      objectId: object.id,
      selectors: object.selectors
    }).map(({ selectorId }) => selectorId)
  );

  assert.deepEqual(structuralIds, [
    semantics.source.fractionRuleSelectorId,
    semantics.target.hookSelectorId,
    semantics.target.overbarSelectorId
  ]);
  const allBoundIds = new Set(animation.bundle.objects.flatMap((object) => {
    const annotated = createKpExponentRadicalSelectorAnnotatedLatex({
      objectId: object.id,
      selectors: object.selectors
    })!;
    return [
      ...annotated.annotations.map(({ selectorId }) => selectorId),
      ...annotated.structuralSelectorIds
    ];
  }));
  for (const record of transformation.correspondenceMap!.records) {
    for (const selectorId of [
      ...record.sourceSelectorIds,
      ...record.targetSelectorIds
    ]) {
      assert.equal(allBoundIds.has(selectorId), true, selectorId);
    }
  }
});
