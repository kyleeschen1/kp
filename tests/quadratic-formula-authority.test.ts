import assert from "node:assert/strict";
import test from "node:test";

import { createCanonicalKpQuadraticSemanticFixture } from "../src/semantic/quadratic-branching-fixture.ts";
import {
  createCanonicalKpQuadraticFormulaAuthority,
  validateKpQuadraticFormulaAuthority,
  type KpQuadraticFormulaAuthority
} from "../src/semantic/quadratic-formula-authority.ts";

test("formula authority pins the verified semantic operation order", () => {
  const authority = canonicalAuthority();
  assert.deepEqual(authority.operations.map(({ id }) => id), [
    "operation.quadratic-formula.substitute-coefficients",
    "operation.quadratic-formula.evaluate-discriminant",
    "operation.quadratic-formula.simplify-exact-radical",
    "operation.quadratic-formula.divide-candidate-numerators",
    "operation.quadratic-formula.verify-results"
  ]);
  for (const operation of authority.operations) {
    assert.match(operation.lawId, /^law\./);
    assert.ok(operation.inputRoles.length > 0);
    assert.ok(operation.outputRoles.length > 0);
  }
});

test("formula arithmetic is exact from coefficients through both results", () => {
  const authority = canonicalAuthority();
  assert.deepEqual(authority.exactValues, {
    coefficients: { a: "1", b: "-5", c: "6" },
    negatedB: "5",
    discriminant: "1",
    exactSquareRoot: "1",
    denominator: "2",
    minusResult: { numerator: "2", denominator: "1" },
    plusResult: { numerator: "3", denominator: "1" }
  });
  assert.deepEqual(
    validateKpQuadraticFormulaAuthority(
      authority,
      createCanonicalKpQuadraticSemanticFixture()
    ),
    []
  );
});

test("formula authority owns exact discriminant sub-operations", () => {
  const authority = canonicalAuthority();
  assert.deepEqual(
    authority.discriminantEvaluation.map(
      ({ id, expression, result, dependsOn }) => ({
        id,
        expression,
        result,
        dependsOn
      })
    ),
    [
      {
        id: "operation.quadratic-formula.evaluate-b-square",
        expression: "(-5)^2",
        result: "25",
        dependsOn: [
          "operation.quadratic-formula.substitute-coefficients"
        ]
      },
      {
        id: "operation.quadratic-formula.evaluate-four-a-c",
        expression: "4(1)(6)",
        result: "24",
        dependsOn: ["operation.quadratic-formula.evaluate-b-square"]
      },
      {
        id: "operation.quadratic-formula.subtract-discriminant",
        expression: "25-24",
        result: "1",
        dependsOn: ["operation.quadratic-formula.evaluate-four-a-c"]
      },
      {
        id: "operation.quadratic-formula.prepare-denominator",
        expression: "2(1)",
        result: "2",
        dependsOn: ["operation.quadratic-formula.subtract-discriminant"]
      }
    ]
  );
});

test("formula authority owns numerator work before exact division", () => {
  const authority = canonicalAuthority();
  assert.deepEqual(
    authority.candidateEvaluation.map(
      ({ id, expression, result, dependsOn }) => ({
        id,
        expression,
        result,
        dependsOn
      })
    ),
    [
      {
        id: "operation.quadratic-formula.evaluate-candidate-numerators",
        expression: "5±1",
        result: "4|6",
        dependsOn: [
          "operation.quadratic-formula.simplify-exact-radical"
        ]
      },
      {
        id: "operation.quadratic-formula.divide-candidates",
        expression: "4/2|6/2",
        result: "2|3",
        dependsOn: [
          "operation.quadratic-formula.evaluate-candidate-numerators"
        ]
      }
    ]
  );
});

test("formula authority is isolated from the radical presentation workaround", () => {
  const authority = canonicalAuthority();
  assert.deepEqual(authority.executionBoundary, {
    kind: "semantic-exact",
    radicalProjectionReuse: "forbidden"
  });
  assert.equal(authority.provenance.authority, "verified-quadratic-formula");
});

test("validator rejects coefficient, discriminant, and result drift", () => {
  const fixture = createCanonicalKpQuadraticSemanticFixture();
  const authority = canonicalAuthority();
  const coefficientDrift = {
    ...authority,
    exactValues: {
      ...authority.exactValues,
      coefficients: { a: "1", b: "-4", c: "6" }
    }
  } as KpQuadraticFormulaAuthority;
  assert.equal(
    validateKpQuadraticFormulaAuthority(coefficientDrift, fixture)[0]?.code,
    "coefficient-mismatch"
  );

  const discriminantDrift = {
    ...authority,
    exactValues: { ...authority.exactValues, discriminant: "4" }
  } as KpQuadraticFormulaAuthority;
  assert.equal(
    validateKpQuadraticFormulaAuthority(discriminantDrift, fixture)[0]?.code,
    "discriminant-mismatch"
  );

  const resultDrift = {
    ...authority,
    exactValues: {
      ...authority.exactValues,
      plusResult: { numerator: "4", denominator: "1" }
    }
  } as KpQuadraticFormulaAuthority;
  assert.equal(
    validateKpQuadraticFormulaAuthority(resultDrift, fixture)[0]?.code,
    "result-mismatch"
  );
});

test("validator rejects operation reordering and radical-boundary reuse", () => {
  const fixture = createCanonicalKpQuadraticSemanticFixture();
  const authority = canonicalAuthority();
  const broken = {
    ...authority,
    operations: [
      authority.operations[1]!,
      authority.operations[0]!,
      ...authority.operations.slice(2)
    ],
    executionBoundary: {
      kind: "semantic-exact",
      radicalProjectionReuse: "allowed"
    }
  } as unknown as KpQuadraticFormulaAuthority;
  assert.deepEqual(
    validateKpQuadraticFormulaAuthority(broken, fixture).map(({ code }) => code),
    ["operation-pin", "radical-boundary"]
  );
});

test("formula authority is deeply immutable and JSON-stable", () => {
  const authority = canonicalAuthority();
  assert.equal(Object.isFrozen(authority), true);
  assert.equal(Object.isFrozen(authority.exactValues), true);
  assert.equal(Object.isFrozen(authority.operations), true);
  assert.equal(Object.isFrozen(authority.operations[0]?.inputRoles), true);
  assert.deepEqual(JSON.parse(JSON.stringify(authority)), authority);
});

function canonicalAuthority() {
  return createCanonicalKpQuadraticFormulaAuthority(
    createCanonicalKpQuadraticSemanticFixture()
  );
}
