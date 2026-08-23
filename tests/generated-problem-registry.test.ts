import { strict as assert } from "node:assert";
import test from "node:test";

import {
  checkGeneratedProblemRegistrySurface,
  createGeneratedProblemRegistryRecords,
  findGeneratedProblemRegistryRecord
} from "../src/semantic/generated-problem-registry.ts";

test("createGeneratedProblemRegistryRecords summarizes generated algebra, calculus, and linear algebra fixtures", () => {
  const records = createGeneratedProblemRegistryRecords();
  const ids = records.map((record) => record.fixtureId);
  const calculus = findGeneratedProblemRegistryRecord(
    "generated.calculus.derivative.power-rule-x-cubed"
  );
  const integral = findGeneratedProblemRegistryRecord(
    "generated.calculus.integral.power-rule-quadratic"
  );
  const matrixVector = findGeneratedProblemRegistryRecord(
    "generated.linear-algebra.matrix-vector.two-by-two"
  );
  const dotProduct = findGeneratedProblemRegistryRecord(
    "generated.linear-algebra.dot-product.three-vector"
  );
  const matrixMatrix = findGeneratedProblemRegistryRecord(
    "generated.linear-algebra.matrix-matrix.two-by-two"
  );

  assert.equal(records.length, 18);
  assert.ok(ids.includes("generated.linear-solve.x-plus-3"));
  assert.ok(ids.includes("generated.fraction-expression.two-fourths"));
  assert.ok(ids.includes("generated.calculus.derivative.sum-rule-polynomial"));
  assert.ok(ids.includes("generated.calculus.integral.power-rule-quadratic"));
  assert.ok(ids.includes("generated.linear-algebra.dot-product.three-vector"));
  assert.ok(ids.includes("generated.linear-algebra.matrix-matrix.two-by-two"));
  assert.deepEqual(calculus, {
    fixtureId: "generated.calculus.derivative.power-rule-x-cubed",
    familyId: "generated.calculus.derivative",
    domain: "calculus",
    title: "Generated derivative power rule for x cubed",
    bundleId: "asset.generated.calculus.derivative.power-rule-x-cubed",
    animationId: "animation.generated.calculus.derivative.power-rule-x-cubed",
    animationRowId:
      "animation-generated-calculus-derivative-power-rule-x-cubed",
    traceId: "trace.generated.calculus.derivative.power-rule-x-cubed",
    objectCount: 3,
    selectorCount: 12,
    transformationCount: 2,
    traceStepCount: 3,
    flashcardCount: 3,
    drillDownCount: 0,
    objectTypes: ["expression"],
    transformationTypes: [
      "applyDerivativePowerRule",
      "simplifyConstantDifference"
    ],
    transformDefinitionIds: [
      "definition.generated.calculus.derivative.power-rule",
      "definition.generated.linear-solve.simplify-constant-difference"
    ],
    lawIds: [
      "law.calculus.derivative.power-rule",
      "law.arithmetic.constant-difference"
    ],
    flashcardKinds: ["predict-next", "cloze", "explain-transform"],
    searchFields: calculus?.searchFields ?? []
  });
  assert.ok(
    integral?.searchFields.includes("law.calculus.integral.power-rule")
  );
  assert.ok(
    matrixVector?.searchFields.includes(
      "law.linear-algebra.matrix-vector-product"
    )
  );
  assert.ok(dotProduct?.searchFields.includes("law.linear-algebra.dot-product"));
  assert.ok(
    matrixMatrix?.searchFields.includes(
      "law.linear-algebra.matrix-matrix-product"
    )
  );
  assert.deepEqual(checkGeneratedProblemRegistrySurface(), {
    lawId: "generated-problem-registry.surface",
    passed: true,
    failures: []
  });
});

test("checkGeneratedProblemRegistrySurface reports duplicate animation ids", () => {
  const records = createGeneratedProblemRegistryRecords();
  const duplicate = {
    ...records[1]!,
    fixtureId: "generated.duplicate",
    animationId: records[0]!.animationId
  };

  assert.deepEqual(checkGeneratedProblemRegistrySurface([records[0]!, duplicate]), {
    lawId: "generated-problem-registry.surface",
    passed: false,
    failures: [
      {
        path: "records[1].animationId",
        message:
          `Duplicate generated problem animation id ${records[0]!.animationId}.`
      },
      {
        path: "records[1].animationId",
        message:
          "Generated problem registry record generated.duplicate must map to animation.generated.duplicate."
      }
    ]
  });
});
