import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  addExactRationals,
  createExactRational,
  divideExactRationals,
  equalExactRationals,
  isZeroExactRational,
  multiplyExactRationals,
  negateExactRational,
  subtractExactRationals
} from "../protocols/public-api.ts";

test("neutral exact rationals normalize sign, zero, and common factors", () => {
  assert.deepEqual(createExactRational(10n, -4n), {
    numerator: -5n,
    denominator: 2n
  });
  assert.deepEqual(createExactRational(0n, -9n), {
    numerator: 0n,
    denominator: 1n
  });
  assert.equal(Object.isFrozen(createExactRational(1n, 3n)), true);
  assert.throws(
    () => createExactRational(1n, 0n),
    /denominator cannot be zero/
  );
});

test("neutral exact rational operations remain closed and exact", () => {
  const half = createExactRational(1n, 2n);
  const third = createExactRational(1n, 3n);

  assert.deepEqual(addExactRationals(half, third), createExactRational(5n, 6n));
  assert.deepEqual(
    subtractExactRationals(half, third),
    createExactRational(1n, 6n)
  );
  assert.deepEqual(
    multiplyExactRationals(half, third),
    createExactRational(1n, 6n)
  );
  assert.deepEqual(
    divideExactRationals(half, third),
    createExactRational(3n, 2n)
  );
  assert.deepEqual(negateExactRational(third), createExactRational(-1n, 3n));
  assert.equal(equalExactRationals({ numerator: 2n, denominator: 4n }, half), true);
  assert.equal(isZeroExactRational(createExactRational(0n, 7n)), true);
  assert.throws(
    () => divideExactRationals(half, createExactRational(0n)),
    /divide by zero/
  );
});

test("the neutral protocol is the only arithmetic implementation", async () => {
  const [authority, domainFacade, publicApi] = await Promise.all([
    readFile("protocols/exact-rational.ts", "utf8"),
    readFile("domains/math/exact-rational.ts", "utf8"),
    readFile("protocols/public-api.ts", "utf8")
  ]);

  assert.doesNotMatch(authority, /(?:domains|providers|src)\//);
  assert.match(domainFacade, /from "\.\.\/\.\.\/protocols\/public-api\.ts"/);
  assert.doesNotMatch(
    domainFacade,
    /\bexport\s+function\b|\bwhile\s*\(|\bObject\.freeze\b/
  );
  assert.match(publicApi, /from "\.\/exact-rational\.ts"/);
});
