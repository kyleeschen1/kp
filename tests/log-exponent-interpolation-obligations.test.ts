import assert from "node:assert/strict";
import test from "node:test";

import { kpCanonicalLogExponentLifecycles } from "../src/animation/log-exponent-lifecycle.ts";
import {
  isKpCompiledLogExponentInterpolationProgram,
  kpCanonicalLogExponentInterpolationProgram
} from "../src/animation/log-exponent-interpolation-obligations.ts";

test("every lifecycle classification requires one executable interpolation", () => {
  const expected = kpCanonicalLogExponentLifecycles.reduce(
    (count, plan) => count + plan.lifecycle.records.length,
    0
  );
  const program = kpCanonicalLogExponentInterpolationProgram;
  assert.equal(isKpCompiledLogExponentInterpolationProgram(program), true);
  assert.equal(program.obligations.length, expected);
  assert.equal(
    new Set(program.obligations.map(({ lifecycleRecordId }) => lifecycleRecordId)).size,
    expected
  );
  assert.ok(program.obligations.every(
    ({ motionRequirement, reducedMotion }) =>
      motionRequirement === "required-in-full-motion" &&
      reducedMotion === "seek-directly-to-semantic-endpoint"
  ));
});

test("x transfer and balanced wrappers carry explicit typed guarantees", () => {
  const obligations = kpCanonicalLogExponentInterpolationProgram.obligations;
  const x = obligations.find(
    ({ lifecycleRecordId }) =>
      lifecycleRecordId ===
        "lifecycle.correspondence.extract-exponent.unknown-x"
  );
  assert.deepEqual(x?.channels, ["measured-position", "measured-scale"]);
  assert.equal(x?.terminalGuarantee, "arrive-before-target-ownership");
  const wrappers = obligations.find(
    ({ lifecycleRecordId }) =>
      lifecycleRecordId ===
        "lifecycle.correspondence.apply-log.introduce-balanced-wrappers"
  );
  assert.deepEqual(wrappers?.targetEntityIds, [
    "logged.left.log",
    "logged.left.log.operator",
    "logged.left.log.open",
    "logged.left.log.close",
    "logged.right.log",
    "logged.right.log.operator"
  ]);
  assert.equal(
    wrappers?.synchronizationGroupId,
    "synchronization.operation.log-exponent.apply-log-both-sides.balanced-introduction"
  );
  assert.equal(JSON.stringify(obligations).includes("opacity"), false);
});

test("copied interpolation shapes cannot claim compiler authority", () => {
  assert.equal(
    isKpCompiledLogExponentInterpolationProgram({
      ...kpCanonicalLogExponentInterpolationProgram
    }),
    false
  );
});
