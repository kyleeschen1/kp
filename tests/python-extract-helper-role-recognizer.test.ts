import assert from "node:assert/strict";
import test from "node:test";

import {
  recognizeKpPythonExtractHelperRoles
} from "../scripts/python-extract-helper-role-recognizer.ts";
import { compileKpPythonFrontend } from "../scripts/python-refactor-frontend.ts";
import {
  kpPythonFreeShippingRefactorContract
} from "../src/semantic/python-free-shipping-refactor-contract.ts";

function compilePair(before: string, after: string) {
  return {
    source: compileKpPythonFrontend({
      path: "before.py",
      revisionId: "fixture.before.v1",
      sourceText: before
    }),
    target: compileKpPythonFrontend({
      path: "after.py",
      revisionId: "fixture.after.v1",
      sourceText: after
    })
  };
}

test("recognizes canonical Python extract-helper roles without semantic ids", () => {
  const contract = kpPythonFreeShippingRefactorContract;
  const { source, target } = compilePair(
    contract.before.source,
    contract.after.source
  );
  const roles = recognizeKpPythonExtractHelperRoles(source, target);

  assert.equal(roles.duplicateExpressionText, "total >= 50");
  assert.deepEqual(
    roles.sourceContributors.map(({ ownerFunctionName }) => ownerFunctionName),
    ["shipping_cost", "shipping_message"]
  );
  assert.deepEqual(
    roles.introducedHelpers.map(({ functionName }) => functionName),
    ["qualifies_for_free_shipping"]
  );
  assert.deepEqual(
    roles.targetCalls.map(({ ownerFunctionName, calleeName }) => ({
      ownerFunctionName,
      calleeName
    })),
    [
      { ownerFunctionName: "shipping_cost", calleeName: "qualifies_for_free_shipping" },
      { ownerFunctionName: "shipping_message", calleeName: "qualifies_for_free_shipping" }
    ]
  );
  assert.doesNotMatch(JSON.stringify(roles), /rule\.shipping|function\.qualifies/);
});

test("Python recognition follows renamed functions and changed literals", () => {
  const { source, target } = compilePair(
    `def fee(amount: float) -> int:\n    return 0 if amount > 12 else 3\n\ndef note(amount: float) -> str:\n    return "yes" if amount > 12 else "no"`,
    `def is_waived(amount: float) -> bool:\n    return amount > 12\n\ndef fee(amount: float) -> int:\n    return 0 if is_waived(amount) else 3\n\ndef note(amount: float) -> str:\n    return "yes" if is_waived(amount) else "no"`
  );
  const roles = recognizeKpPythonExtractHelperRoles(source, target);

  assert.equal(roles.duplicateExpressionText, "amount > 12");
  assert.deepEqual(
    roles.sourceContributors.map(({ ownerFunctionName }) => ownerFunctionName),
    ["fee", "note"]
  );
  assert.equal(roles.introducedHelpers[0]?.functionName, "is_waived");
  assert.equal(roles.targetCalls.length, 2);
});

test("Python recognition keeps the maximal repeated Boolean expression", () => {
  const { source, target } = compilePair(
    `def first(value: int) -> bool:\n    return value > 2 and value < 9\n\ndef second(value: int) -> bool:\n    return value > 2 and value < 9`,
    `def in_range(value: int) -> bool:\n    return value > 2 and value < 9\n\ndef first(value: int) -> bool:\n    return in_range(value)\n\ndef second(value: int) -> bool:\n    return in_range(value)`
  );
  const roles = recognizeKpPythonExtractHelperRoles(source, target);

  assert.equal(roles.duplicateGroupCount, 1);
  assert.equal(roles.duplicateExpressionText, "value > 2 and value < 9");
});

test("Python recognition reports empty candidates rather than claiming legality", () => {
  const { source, target } = compilePair(
    `def first(value: int) -> bool:\n    return value > 2\n\ndef second(value: int) -> bool:\n    return value < 9`,
    `def first(value: int) -> bool:\n    return value > 2\n\ndef second(value: int) -> bool:\n    return value < 9`
  );
  const roles = recognizeKpPythonExtractHelperRoles(source, target);

  assert.equal(roles.duplicateExpressionText, undefined);
  assert.deepEqual(roles.sourceContributors, []);
  assert.deepEqual(roles.introducedHelpers, []);
  assert.deepEqual(roles.targetCalls, []);
});

test("rejected Python syntax cannot become role evidence", () => {
  const accepted = compileKpPythonFrontend({
    path: "accepted.py",
    revisionId: "accepted.v1",
    sourceText: "def okay(value: int) -> bool:\n    return value > 2"
  });
  const rejected = compileKpPythonFrontend({
    path: "rejected.py",
    revisionId: "rejected.v1",
    sourceText: "def broken(value: int) -> bool:\n    return value +"
  });

  assert.throws(
    () => recognizeKpPythonExtractHelperRoles(rejected, accepted),
    /rejected Python syntax/
  );
});
