import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpLogExponentDomainContract,
  kpCanonicalLogExponentDomainContract
} from "../src/semantic/log-exponent-domain-assumptions.ts";

test("canonical log-exponent domain makes every rewrite precondition explicit", () => {
  assert.equal(kpCanonicalLogExponentDomainContract.base, 2);
  assert.equal(kpCanonicalLogExponentDomainContract.rightValue, 7);
  assert.deepEqual(
    kpCanonicalLogExponentDomainContract.assumptions.map(({ id, status }) => ({ id, status })),
    [
      { id: "assumption.log-exponent.variable-real", status: "given" },
      { id: "assumption.log-exponent.base-positive", status: "given" },
      { id: "assumption.log-exponent.base-not-one", status: "given" },
      { id: "assumption.log-exponent.right-positive", status: "given" },
      { id: "assumption.log-exponent.power-positive", status: "derived" },
      { id: "assumption.log-exponent.log-injective", status: "derived" },
      { id: "assumption.log-exponent.log-base-nonzero", status: "derived" }
    ]
  );
});

test("log-exponent domain rejects illegal logarithm and division cases", () => {
  assert.throws(
    () => createKpLogExponentDomainContract({ base: 0, rightValue: 7 }),
    /base greater than zero/
  );
  assert.throws(
    () => createKpLogExponentDomainContract({ base: 1, rightValue: 7 }),
    /base other than one/
  );
  assert.throws(
    () => createKpLogExponentDomainContract({ base: 2, rightValue: 0 }),
    /positive argument/
  );
  assert.throws(
    () => createKpLogExponentDomainContract({ base: Number.NaN, rightValue: 7 }),
    /must be finite/
  );
});
