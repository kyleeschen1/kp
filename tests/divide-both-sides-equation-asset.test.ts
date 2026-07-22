import assert from "node:assert/strict";
import test from "node:test";

import { validateKpAssetBundle } from "../src/semantic/asset.ts";
import { validateKpSemanticTransformation } from "../src/semantic/asset-transformation.ts";
import {
  createDivideBothSidesEquationKpAsset,
  divideBothSidesEquationAssetIds as ids
} from "../src/semantic/divide-both-sides-equation-asset.ts";

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

test("divide-both-sides trace postpones correspondence until the lineage slice", () => {
  const asset = createDivideBothSidesEquationKpAsset();

  for (const transformation of asset.transformations) {
    assert.equal(transformation.correspondenceMap, undefined);
    assert.deepEqual(transformation.correspondence, []);
  }
});
