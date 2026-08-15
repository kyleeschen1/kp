import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpLogQuotientDomainContract,
  kpCanonicalLogQuotientDomainContract
} from "../src/semantic/log-quotient-domain-assumptions.ts";

test("canonical log quotient states positivity and shared-base assumptions explicitly", () => {
  assert.equal(kpCanonicalLogQuotientDomainContract.logarithmBase, "e");
  assert.deepEqual(
    kpCanonicalLogQuotientDomainContract.assumptions.map(({ id, status }) => ({ id, status })),
    [
      { id: "assumption.log-quotient.x-positive", status: "given" },
      { id: "assumption.log-quotient.y-positive", status: "given" },
      { id: "assumption.log-quotient.shared-base", status: "given" },
      { id: "assumption.log-quotient.quotient-positive", status: "derived" }
    ]
  );
});

test("log quotient rejects mismatched and illegal logarithm bases", () => {
  assert.throws(
    () => createKpLogQuotientDomainContract({
      sourceLeftBase: 2,
      sourceRightBase: 10,
      targetBase: 2
    }),
    /share one base/
  );
  assert.throws(
    () => createKpLogQuotientDomainContract({
      sourceLeftBase: 1,
      sourceRightBase: 1,
      targetBase: 1
    }),
    /positive and other than one/
  );
  assert.throws(
    () => createKpLogQuotientDomainContract({
      sourceLeftBase: Number.NaN,
      sourceRightBase: Number.NaN,
      targetBase: Number.NaN
    }),
    /must be finite/
  );
});
