import assert from "node:assert/strict";
import test from "node:test";

import { validateKpAssetBundle } from "../src/semantic/asset.ts";
import { validateKpSemanticTransformation } from "../src/semantic/asset-transformation.ts";
import {
  checkCorrespondenceMapRewindLaw,
  validateCorrespondenceMap
} from "../src/semantic/correspondence.ts";
import {
  createDivideBothSidesEquationKpAsset,
  divideBothSidesEquationAssetIds as ids
} from "../src/semantic/divide-both-sides-equation-asset.ts";
import { compileKpSemanticEquationTransitionResult } from "../src/domain-ir/public-api.ts";

test("divide-both-sides asset defines the exact four-state trace", () => {
  const asset = createDivideBothSidesEquationKpAsset();

  assert.equal(asset.sourceTraceId, "trace.linear-canonical-divide-both-sides");
  assert.deepEqual(validateKpAssetBundle(asset.bundle), []);
  assert.deepEqual(
    asset.bundle.objects.map((object) => [object.id, object.value]),
    [
      [ids.initial, { latex: "3x = 12" }],
      [ids.divided, { latex: "\\frac{3x}{3} = \\frac{12}{3}" }],
      [ids.coefficientCancelled, { latex: "x = \\frac{12}{3}" }],
      [ids.solved, { latex: "x = 4" }]
    ]
  );
});

test("divide-both-sides transformations form a continuous strict-law chain", () => {
  const asset = createDivideBothSidesEquationKpAsset();

  assert.deepEqual(
    asset.transformations.map((transformation) => ({
      id: transformation.id,
      type: transformation.transformType,
      source: transformation.sourceObjectIds,
      target: transformation.targetObjectIds,
      assumptions: transformation.assumptions,
      laws: transformation.lawRefs
    })),
    [
      {
        id: ids.divide,
        type: "divideBothSides",
        source: [ids.initial],
        target: [ids.divided],
        assumptions: ["Dividing equal quantities by the same non-zero value preserves equality."],
        laws: [{ id: "law.equation.divide-both-sides", level: "strict" }]
      },
      {
        id: ids.cancelCoefficient,
        type: "cancelMultiplicativeInverses",
        source: [ids.divided],
        target: [ids.coefficientCancelled],
        assumptions: ["A non-zero factor divided by itself simplifies to one."],
        laws: [{ id: "law.algebra.multiplicative-inverse", level: "strict" }]
      },
      {
        id: ids.simplifyQuotient,
        type: "simplifyConstantQuotient",
        source: [ids.coefficientCancelled],
        target: [ids.solved],
        assumptions: ["The exact quotient 12 divided by 3 is 4."],
        laws: [{ id: "law.arithmetic.constant-quotient", level: "strict" }]
      }
    ]
  );

  for (const transformation of asset.transformations) {
    assert.deepEqual(validateKpSemanticTransformation(transformation, asset.bundle), []);
  }
});

test("divide-both-sides trace owns every selector through total reversible correspondence", () => {
  const asset = createDivideBothSidesEquationKpAsset();

  for (const transformation of asset.transformations) {
    const map = transformation.correspondenceMap;
    assert.ok(map);
    const sourceSelectors = asset.bundle.objects
      .filter((object) => transformation.sourceObjectIds.includes(object.id))
      .flatMap((object) => object.selectors.map((selector) => selector.id));
    const targetSelectors = asset.bundle.objects
      .filter((object) => transformation.targetObjectIds.includes(object.id))
      .flatMap((object) => object.selectors.map((selector) => selector.id));

    assert.deepEqual(validateCorrespondenceMap(map, {
      sourceSelectorIds: sourceSelectors,
      targetSelectorIds: targetSelectors
    }), [], transformation.id);
    assert.deepEqual(checkCorrespondenceMapRewindLaw(map), [], transformation.id);

    const compiled = compileKpSemanticEquationTransitionResult({
      transformation,
      bundle: asset.bundle
    });
    assert.equal(compiled.status, "semantic", transformation.id);
    assert.ok(compiled.ir, transformation.id);
  }
});

test("divide correspondence distinguishes persistence, entry, cancellation, and synthesis", () => {
  const asset = createDivideBothSidesEquationKpAsset();

  assert.deepEqual(
    asset.transformations.map((transformation) =>
      transformation.correspondenceMap?.records.map((record) => [record.id, record.relation])
    ),
    [
      [
        ["coefficient-enters-numerator", "identity"],
        ["variable-enters-numerator", "identity"],
        ["relation-persists", "identity"],
        ["constant-enters-numerator", "identity"],
        ["matched-divisors-enter", "introduction"],
        ["fraction-rules-enter", "introduction"]
      ],
      [
        ["variable-persists", "identity"],
        ["relation-persists", "identity"],
        ["right-numerator-persists", "identity"],
        ["right-rule-persists", "identity"],
        ["right-divisor-persists", "identity"],
        ["coefficient-and-divisor-cancel", "cancelation"],
        ["left-fraction-rule-retires", "removal"]
      ],
      [
        ["variable-persists", "identity"],
        ["relation-persists", "identity"],
        ["quotient-becomes-four", "fan-in"]
      ]
    ]
  );
});
