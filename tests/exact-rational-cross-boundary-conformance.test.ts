import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  addKpRationals,
  createKpRational,
  divideKpRationals,
  equalKpRationals,
  isZeroKpRational,
  multiplyKpRationals,
  negateKpRational,
  subtractKpRationals
} from "../domains/math/exact-rational.ts";
import {
  addRational,
  divideRational,
  equalRational,
  isZeroRational,
  multiplyRational,
  negateRational,
  rational,
  rationalFromDto,
  rationalToDto,
  subtractRational
} from "../providers/linear-problems/public-api.ts";
import {
  addExactRationals,
  createExactRational,
  divideExactRationals,
  equalExactRationals,
  isZeroExactRational,
  multiplyExactRationals,
  negateExactRational,
  subtractExactRationals,
  type NormalizedExactRational
} from "../protocols/public-api.ts";

type ExactRationalFactory = (
  numerator: bigint,
  denominator?: bigint
) => NormalizedExactRational;

// These assignments make facade signature drift a compile-time failure while
// retaining the domain and provider vocabularies that their callers already use.
const domainFactory: ExactRationalFactory = createKpRational;
const providerFactory: ExactRationalFactory = rational;

test("domain aliases and provider facades conform to neutral exact arithmetic", () => {
  const cases = [
    [10n, -4n],
    [0n, -9n],
    [18n, 24n],
    [-21n, -14n]
  ] as const;

  for (const [numerator, denominator] of cases) {
    const expected = createExactRational(numerator, denominator);
    assert.deepEqual(domainFactory(numerator, denominator), expected);
    assert.deepEqual(providerFactory(numerator, denominator), expected);
    assert.equal(Object.isFrozen(domainFactory(numerator, denominator)), true);
    assert.equal(Object.isFrozen(providerFactory(numerator, denominator)), true);
  }

  const left = createExactRational(-2n, 3n);
  const right = createExactRational(5n, 7n);
  const operations = [
    [addExactRationals, addKpRationals, addRational],
    [subtractExactRationals, subtractKpRationals, subtractRational],
    [multiplyExactRationals, multiplyKpRationals, multiplyRational],
    [divideExactRationals, divideKpRationals, divideRational]
  ] as const;

  for (const [neutralOperation, domainOperation, providerOperation] of operations) {
    const expected = neutralOperation(left, right);
    assert.deepEqual(domainOperation(left, right), expected);
    assert.deepEqual(providerOperation(left, right), expected);
  }

  assert.deepEqual(negateKpRational(left), negateExactRational(left));
  assert.deepEqual(negateRational(left), negateExactRational(left));
  assert.equal(equalKpRationals({ numerator: -4n, denominator: 6n }, left), true);
  assert.equal(equalRational({ numerator: -4n, denominator: 6n }, left), true);
  assert.equal(isZeroKpRational(createKpRational(0n, 99n)), true);
  assert.equal(isZeroRational(rational(0n, 99n)), true);
  assert.equal(equalExactRationals(left, right), false);
  assert.equal(isZeroExactRational(left), false);

  const dto = { numerator: "-10", denominator: "14" } as const;
  assert.deepEqual(rationalFromDto(dto), createExactRational(-5n, 7n));
  assert.deepEqual(rationalToDto({ numerator: -10n, denominator: 14n }), {
    numerator: "-5",
    denominator: "7"
  });

  for (const factory of [createExactRational, createKpRational, rational]) {
    assert.throws(() => factory(1n, 0n), /denominator cannot be zero/);
  }
  const zero = createExactRational(0n);
  assert.throws(() => divideExactRationals(left, zero), /divide by zero/);
  assert.throws(() => divideKpRationals(left, zero), /divide by zero/);
  assert.throws(() => divideRational(left, zero), /divide by zero/);
});

test("compatibility facades delegate to one exact-rational implementation", async () => {
  const [authority, protocolApi, domainFacade, providerFacade] = await Promise.all([
    readFile("protocols/exact-rational.ts", "utf8"),
    readFile("protocols/public-api.ts", "utf8"),
    readFile("domains/math/exact-rational.ts", "utf8"),
    readFile("providers/linear-problems/rational.ts", "utf8")
  ]);

  assert.match(protocolApi, /from "\.\/exact-rational\.ts"/);
  assert.match(domainFacade, /from "\.\.\/\.\.\/protocols\/public-api\.ts"/);
  assert.match(providerFacade, /from "\.\.\/\.\.\/protocols\/public-api\.ts"/);

  // Facades may preserve names, but normalization and bigint arithmetic must
  // stay absent so a second authority cannot silently grow behind those names.
  for (const facade of [domainFacade, providerFacade]) {
    assert.doesNotMatch(facade, /\bfunction greatestCommonDivisor\b/);
    assert.doesNotMatch(facade, /\bObject\.freeze\b/);
    assert.doesNotMatch(facade, /\bwhile\s*\(/);
  }
  assert.doesNotMatch(domainFacade, /\bexport\s+function\b/);

  const delegatedOperations = [
    ["addRational", "addExactRationals"],
    ["subtractRational", "subtractExactRationals"],
    ["multiplyRational", "multiplyExactRationals"],
    ["divideRational", "divideExactRationals"],
    ["negateRational", "negateExactRational"],
    ["equalRational", "equalExactRationals"],
    ["isZeroRational", "isZeroExactRational"]
  ] as const;
  for (const [facadeName, authorityName] of delegatedOperations) {
    assert.match(
      providerFacade,
      new RegExp(`export function ${facadeName}\\([^]*?return ${authorityName}\\(`)
    );
  }

  assert.match(authority, /export function createExactRational\(/);
  assert.match(authority, /function greatestCommonDivisor\(/);
});
