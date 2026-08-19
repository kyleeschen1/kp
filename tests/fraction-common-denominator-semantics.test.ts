import assert from "node:assert/strict";
import test from "node:test";

import {
  KP_COMMON_DENOMINATOR_ALIGNMENT_OPERATION_AUTHORITY,
  isKpCommonDenominatorProof,
  isKpVerifiedCommonDenominatorAlignment,
  kpCanonicalCommonDenominatorAlignment,
  kpCanonicalCommonDenominatorAlignmentDraft
} from "../src/semantic/fraction-common-denominator.ts";

test("alignment request supplies bounded explicit unit factors", () => {
  const draft = kpCanonicalCommonDenominatorAlignmentDraft;

  assert.equal(
    draft.operationAuthority,
    KP_COMMON_DENOMINATOR_ALIGNMENT_OPERATION_AUTHORITY
  );
  assert.deepEqual(
    draft.source.terms.map(({ numerator, denominator }) => [
      numerator.value,
      denominator.value
    ]),
    [[1n, 3n], [1n, 6n]]
  );
  assert.deepEqual(
    draft.target.terms.map(({ numerator, denominator }) => [
      numerator.value,
      denominator.value
    ]),
    [[2n, 6n], [1n, 6n]]
  );
  assert.deepEqual(
    draft.equivalenceMultipliers.map(({ numerator, denominator }) => [
      numerator,
      denominator
    ]),
    [[2n, 2n], [1n, 1n]]
  );
  assert.equal(Object.isFrozen(draft), true);
});

test("alignment authority verifies exact term and expression value", () => {
  const verified = kpCanonicalCommonDenominatorAlignment;

  assert.equal(isKpVerifiedCommonDenominatorAlignment(verified), true);
  assert.deepEqual(
    verified.targetForms.map(({ numerator, denominator, value }) => [
      numerator,
      denominator,
      value.numerator,
      value.denominator
    ]),
    [[2n, 6n, 1n, 3n], [1n, 6n, 1n, 6n]]
  );
  assert.deepEqual(
    verified.equivalenceMultipliers.map(({ exactValue }) => [
      exactValue.numerator,
      exactValue.denominator
    ]),
    [[1n, 1n], [1n, 1n]]
  );
  assert.deepEqual(
    [verified.exactTotal.numerator, verified.exactTotal.denominator],
    [1n, 2n]
  );
  assert.equal(Object.isFrozen(verified), true);
  assert.equal(isKpCommonDenominatorProof(verified.proof), true);
  assert.equal(isKpCommonDenominatorProof({ ...verified.proof }), false);
});
