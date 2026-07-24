import assert from "node:assert/strict";
import test from "node:test";

import {
  createCanonicalKpQuadraticSemanticFixture,
  createKpQuadraticSemanticFixture
} from "../src/semantic/quadratic-branching-fixture.ts";
import { listKpStructuredExpressionSubtrees } from "../src/semantic/structured-expression.ts";

test("canonical quadratic fixture preserves exact authored evidence", () => {
  const fixture = createCanonicalKpQuadraticSemanticFixture();

  assert.deepEqual(fixture.coefficients, { a: "1", b: "-5", c: "6" });
  assert.deepEqual(fixture.discriminant, {
    numerator: "1",
    denominator: "1"
  });
  assert.deepEqual(fixture.verifiedRoots, [
    { numerator: "2", denominator: "1" },
    { numerator: "3", denominator: "1" }
  ]);
  assert.equal(
    listKpStructuredExpressionSubtrees(fixture.equation.left).length,
    10
  );
  assert.equal(fixture.equation.right.root.kind, "number");
  assert.equal(fixture.provenance.authority, "authored-exact");
});

test("quadratic fixture verifies supplied roots without solving", () => {
  assert.throws(
    () =>
      createKpQuadraticSemanticFixture({
        id: "quadratic.invalid-root",
        variable: "x",
        coefficients: { a: 1n, b: -5n, c: 6n },
        verifiedRoots: [
          { numerator: "2", denominator: "1" },
          { numerator: "4", denominator: "1" }
        ],
        provenance: {
          authority: "authored-exact",
          sourceRef: "tests/quadratic-branching-fixture.test.ts"
        }
      }),
    /does not satisfy/
  );
});

test("quadratic fixture rejects non-quadratic and invalid rational inputs", () => {
  assert.throws(
    () =>
      createKpQuadraticSemanticFixture({
        id: "quadratic.not-quadratic",
        variable: "x",
        coefficients: { a: 0n, b: 1n, c: 0n },
        verifiedRoots: [
          { numerator: "0", denominator: "1" },
          { numerator: "0", denominator: "1" }
        ],
        provenance: {
          authority: "authored-exact",
          sourceRef: "tests/quadratic-branching-fixture.test.ts"
        }
      }),
    /leading coefficient/
  );
  assert.throws(
    () =>
      createKpQuadraticSemanticFixture({
        id: "quadratic.invalid-rational",
        variable: "x",
        coefficients: { a: 1n, b: -5n, c: 6n },
        verifiedRoots: [
          { numerator: "2", denominator: "0" },
          { numerator: "3", denominator: "1" }
        ],
        provenance: {
          authority: "authored-exact",
          sourceRef: "tests/quadratic-branching-fixture.test.ts"
        }
      }),
    /denominator/
  );
});

test("quadratic fixture is deeply immutable and JSON-stable", () => {
  const fixture = createCanonicalKpQuadraticSemanticFixture();
  assert.equal(Object.isFrozen(fixture), true);
  assert.equal(Object.isFrozen(fixture.equation), true);
  assert.equal(Object.isFrozen(fixture.verifiedRoots), true);
  assert.deepEqual(JSON.parse(JSON.stringify(fixture)), fixture);
});
