import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpTypeScriptFrontend
} from "../scripts/typescript-refactor-frontend.ts";
import {
  recognizeKpTypeScriptExtractHelperRoles
} from "../scripts/typescript-extract-helper-role-recognizer.ts";
import {
  kpTypeScriptFreeShippingRefactorContract
} from "../src/semantic/typescript-free-shipping-refactor-contract.ts";

function compilePair(before: string, after: string) {
  return {
    source: compileKpTypeScriptFrontend({
      path: "before.ts",
      revisionId: "fixture.before.v1",
      sourceText: before
    }),
    target: compileKpTypeScriptFrontend({
      path: "after.ts",
      revisionId: "fixture.after.v1",
      sourceText: after
    })
  };
}

test("recognizes canonical extract-helper roles without semantic ids", () => {
  const contract = kpTypeScriptFreeShippingRefactorContract;
  const { source, target } = compilePair(
    contract.before.source,
    contract.after.source
  );
  const roles = recognizeKpTypeScriptExtractHelperRoles(source, target);

  assert.equal(roles.duplicateExpressionText, "total >= 50");
  assert.deepEqual(
    roles.sourceContributors.map(({ ownerFunctionName }) => ownerFunctionName),
    ["shippingCost", "shippingMessage"]
  );
  assert.deepEqual(
    roles.introducedHelpers.map(({ functionName }) => functionName),
    ["qualifiesForFreeShipping"]
  );
  assert.deepEqual(
    roles.targetCalls.map(({ ownerFunctionName, calleeName }) => ({
      ownerFunctionName,
      calleeName
    })),
    [
      { ownerFunctionName: "shippingCost", calleeName: "qualifiesForFreeShipping" },
      { ownerFunctionName: "shippingMessage", calleeName: "qualifiesForFreeShipping" }
    ]
  );
  assert.doesNotMatch(JSON.stringify(roles), /rule\.shipping|function\.qualifies/);
});

test("recognition follows renamed functions and changed literals", () => {
  const { source, target } = compilePair(
    `function fee(amount: number) { return amount > 12 ? 0 : 3; }\nfunction note(amount: number) { return amount > 12 ? "yes" : "no"; }`,
    `function isWaived(amount: number) { return amount > 12; }\nfunction fee(amount: number) { return isWaived(amount) ? 0 : 3; }\nfunction note(amount: number) { return isWaived(amount) ? "yes" : "no"; }`
  );
  const roles = recognizeKpTypeScriptExtractHelperRoles(source, target);

  assert.equal(roles.duplicateExpressionText, "amount > 12");
  assert.deepEqual(
    roles.sourceContributors.map(({ ownerFunctionName }) => ownerFunctionName),
    ["fee", "note"]
  );
  assert.equal(roles.introducedHelpers[0]?.functionName, "isWaived");
  assert.equal(roles.targetCalls.length, 2);
});

test("recognition reports empty candidates rather than claiming legality", () => {
  const { source, target } = compilePair(
    `function first(value: number) { return value > 2; }\nfunction second(value: number) { return value < 9; }`,
    `function first(value: number) { return value > 2; }\nfunction second(value: number) { return value < 9; }`
  );
  const roles = recognizeKpTypeScriptExtractHelperRoles(source, target);

  assert.equal(roles.duplicateExpressionText, undefined);
  assert.deepEqual(roles.sourceContributors, []);
  assert.deepEqual(roles.introducedHelpers, []);
  assert.deepEqual(roles.targetCalls, []);
});

test("rejected syntax cannot become role evidence", () => {
  const accepted = compileKpTypeScriptFrontend({
    path: "accepted.ts",
    revisionId: "accepted.v1",
    sourceText: "function okay(value: number) { return value > 2; }"
  });
  const rejected = compileKpTypeScriptFrontend({
    path: "rejected.ts",
    revisionId: "rejected.v1",
    sourceText: "function broken(value: number) { return value + ; }"
  });

  assert.throws(
    () => recognizeKpTypeScriptExtractHelperRoles(rejected, accepted),
    /rejected TypeScript syntax/
  );
});
