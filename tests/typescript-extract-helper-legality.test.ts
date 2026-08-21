import assert from "node:assert/strict";
import test from "node:test";

import {
  proveKpTypeScriptExtractHelperLegality
} from "../scripts/typescript-extract-helper-legality.ts";
import {
  recognizeKpTypeScriptExtractHelperRoles
} from "../scripts/typescript-extract-helper-role-recognizer.ts";
import {
  compileKpTypeScriptFrontend
} from "../scripts/typescript-refactor-frontend.ts";
import {
  kpTypeScriptFreeShippingRefactorContract
} from "../src/semantic/typescript-free-shipping-refactor-contract.ts";

function prove(before: string, after: string) {
  const source = compileKpTypeScriptFrontend({
    path: "before.ts",
    revisionId: "fixture.before.v1",
    sourceText: before
  });
  const target = compileKpTypeScriptFrontend({
    path: "after.ts",
    revisionId: "fixture.after.v1",
    sourceText: after
  });
  return proveKpTypeScriptExtractHelperLegality(
    source,
    target,
    recognizeKpTypeScriptExtractHelperRoles(source, target)
  );
}

test("proves the canonical extract-helper causal shape", () => {
  const contract = kpTypeScriptFreeShippingRefactorContract;
  const result = prove(contract.before.source, contract.after.source);

  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  assert.equal(result.helperName, "qualifiesForFreeShipping");
  assert.deepEqual(result.requiredBindings, ["total"]);
  assert.deepEqual(result.obligations, [
    "contributors-are-distinct-owners",
    "helper-body-is-equivalent",
    "required-bindings-are-preserved",
    "replacement-calls-cover-contributors"
  ]);
});

test("rejects a source without a bounded extract-helper shape", () => {
  const result = prove(
    "function first(x: number) { return x > 1; }",
    "function first(x: number) { return x > 1; }"
  );

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(
    result.diagnostics[0]?.code,
    "code-refactor.unsupported-source-shape"
  );
});

test("rejects ambiguous repeated-decision ownership", () => {
  const result = prove(
    `function a(x: number) { return x > 1 && x < 8; }\nfunction b(x: number) { return x > 1 && x < 8; }`,
    `function gt(x: number) { return x > 1; }\nfunction lt(x: number) { return x < 8; }\nfunction a(x: number) { return gt(x) && lt(x); }\nfunction b(x: number) { return gt(x) && lt(x); }`
  );

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(
    result.diagnostics[0]?.code,
    "code-refactor.ambiguous-ownership"
  );
});

test("rejects replacement arguments that lose the source binding", () => {
  const result = prove(
    `function cost(total: number) { return total >= 50 ? 0 : 5; }\nfunction note(total: number) { return total >= 50 ? "free" : "paid"; }`,
    `function qualifies(total: number) { return total >= 50; }\nfunction cost(total: number, other: number) { return qualifies(other) ? 0 : 5; }\nfunction note(total: number, other: number) { return qualifies(other) ? "free" : "paid"; }`
  );

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(result.diagnostics[0]?.code, "code-refactor.unsafe-capture");
  assert.equal(result.diagnostics[0]?.phase, "legality");
});
