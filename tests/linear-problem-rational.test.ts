import assert from "node:assert/strict";
import test from "node:test";

import {
  addLinearExpression,
  addRational,
  divideRational,
  equalRational,
  evaluateLinearExpression,
  linearExpression,
  multiplyRational,
  rational,
  rationalToDto,
  scaleLinearExpression,
  subtractRational
} from "../providers/linear-problems/public-api.ts";

test("exact rationals normalize signs, common factors, and zero", () => {
  assert.deepEqual(rationalToDto(rational(10n, -4n)), { numerator: "-5", denominator: "2" });
  assert.deepEqual(rationalToDto(rational(0n, -9n)), { numerator: "0", denominator: "1" });
  assert.throws(() => rational(1n, 0n), /denominator cannot be zero/);
});

test("exact rational arithmetic and equality stay canonical", () => {
  assert.deepEqual(rationalToDto(addRational(rational(1n, 2n), rational(1n, 3n))), {
    numerator: "5",
    denominator: "6"
  });
  assert.deepEqual(rationalToDto(subtractRational(rational(1n, 2n), rational(2n, 3n))), {
    numerator: "-1",
    denominator: "6"
  });
  assert.deepEqual(rationalToDto(multiplyRational(rational(-2n, 3n), rational(9n, 4n))), {
    numerator: "-3",
    denominator: "2"
  });
  assert.deepEqual(rationalToDto(divideRational(rational(5n), rational(2n))), {
    numerator: "5",
    denominator: "2"
  });
  assert.equal(equalRational({ numerator: 2n, denominator: 4n }, rational(1n, 2n)), true);
  assert.throws(() => divideRational(rational(1n), rational(0n)), /divide by zero/);
});

test("small integer rational identities hold across signs", () => {
  for (let numerator = -8; numerator <= 8; numerator += 1) {
    for (let denominator = -8; denominator <= 8; denominator += 1) {
      if (denominator === 0) continue;
      const value = rational(BigInt(numerator), BigInt(denominator));
      assert.equal(equalRational(subtractRational(value, value), rational(0n)), true);
      assert.equal(equalRational(addRational(value, rational(0n)), value), true);
      assert.equal(equalRational(multiplyRational(value, rational(1n)), value), true);
    }
  }
});

test("linear-expression operations preserve exact coefficients and evaluation", () => {
  const expression = linearExpression("x", rational(2n), rational(3n));
  const shifted = addLinearExpression(expression, linearExpression("x", rational(0n), rational(-3n)));
  assert.deepEqual(rationalToDto(shifted.constant), { numerator: "0", denominator: "1" });
  assert.deepEqual(rationalToDto(evaluateLinearExpression(expression, rational(5n, 2n))), {
    numerator: "8",
    denominator: "1"
  });
  assert.deepEqual(
    rationalToDto(scaleLinearExpression(shifted, rational(1n, 2n)).coefficient),
    { numerator: "1", denominator: "1" }
  );
  assert.throws(
    () => addLinearExpression(expression, linearExpression("y", rational(1n))),
    /Cannot combine x and y/
  );
});

