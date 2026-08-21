import assert from "node:assert/strict";
import test from "node:test";

import {
  proveKpPythonExtractHelperLegality
} from "../scripts/python-extract-helper-legality.ts";
import {
  recognizeKpPythonExtractHelperRoles
} from "../scripts/python-extract-helper-role-recognizer.ts";
import { compileKpPythonFrontend } from "../scripts/python-refactor-frontend.ts";
import {
  kpPythonFreeShippingRefactorContract
} from "../src/semantic/python-free-shipping-refactor-contract.ts";

function prove(before: string, after: string) {
  const source = compileKpPythonFrontend({
    path: "before.py",
    revisionId: "fixture.before.v1",
    sourceText: before
  });
  const target = compileKpPythonFrontend({
    path: "after.py",
    revisionId: "fixture.after.v1",
    sourceText: after
  });
  return proveKpPythonExtractHelperLegality(
    source,
    target,
    recognizeKpPythonExtractHelperRoles(source, target)
  );
}

test("proves the canonical Python extract-helper causal shape", () => {
  const contract = kpPythonFreeShippingRefactorContract;
  const result = prove(contract.before.source, contract.after.source);

  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  assert.equal(result.helperName, "qualifies_for_free_shipping");
  assert.deepEqual(result.requiredBindings, ["total"]);
  assert.deepEqual(result.requiredAnnotations, [{ name: "total", annotation: "int" }]);
  assert.deepEqual(result.obligations, [
    "contributors-are-distinct-owners",
    "helper-body-is-equivalent",
    "required-bindings-are-preserved",
    "annotations-are-preserved",
    "replacement-calls-cover-contributors"
  ]);
});

test("rejects a source without a bounded Python extract-helper shape", () => {
  const result = prove(
    "def first(x: int) -> bool:\n    return x > 1",
    "def first(x: int) -> bool:\n    return x > 1"
  );

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(result.diagnostics[0]?.code, "code-refactor.unsupported-source-shape");
});

test("rejects ambiguous repeated-decision ownership", () => {
  const result = prove(
    `def a(x: int) -> bool:\n    low = x > 1\n    return low if x < 8 else False\n\ndef b(x: int) -> bool:\n    low = x > 1\n    return False if x < 8 else low`,
    `def gt(x: int) -> bool:\n    return x > 1\n\ndef lt(x: int) -> bool:\n    return x < 8\n\ndef a(x: int) -> bool:\n    low = gt(x)\n    return low if lt(x) else False\n\ndef b(x: int) -> bool:\n    low = gt(x)\n    return False if lt(x) else low`
  );

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(result.diagnostics[0]?.code, "code-refactor.ambiguous-ownership");
});

test("rejects replacement arguments that lose a source binding", () => {
  const result = prove(
    `def cost(total: int) -> int:\n    return 0 if total >= 50 else 5\n\ndef note(total: int) -> str:\n    return "free" if total >= 50 else "paid"`,
    `def qualifies(total: int) -> bool:\n    return total >= 50\n\ndef cost(total: int, other: int) -> int:\n    return 0 if qualifies(other) else 5\n\ndef note(total: int, other: int) -> str:\n    return "free" if qualifies(other) else "paid"`
  );

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(result.diagnostics[0]?.code, "code-refactor.unsafe-capture");
  assert.equal(result.diagnostics[0]?.phase, "legality");
});

test("rejects changed helper parameter annotations", () => {
  const result = prove(
    `def cost(total: int) -> int:\n    return 0 if total >= 50 else 5\n\ndef note(total: int) -> str:\n    return "free" if total >= 50 else "paid"`,
    `def qualifies(total: str) -> bool:\n    return total >= 50\n\ndef cost(total: int) -> int:\n    return 0 if qualifies(total) else 5\n\ndef note(total: int) -> str:\n    return "free" if qualifies(total) else "paid"`
  );

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(result.diagnostics[0]?.code, "code-refactor.unsafe-capture");
  assert.match(result.diagnostics[0]?.message ?? "", /annotation/);
});

test("rejects variadic and keyword-call extraction shapes", () => {
  const result = prove(
    `def cost(total: int) -> int:\n    return 0 if total >= 50 else 5\n\ndef note(total: int) -> str:\n    return "free" if total >= 50 else "paid"`,
    `def qualifies(*, total: int) -> bool:\n    return total >= 50\n\ndef cost(total: int) -> int:\n    return 0 if qualifies(total=total) else 5\n\ndef note(total: int) -> str:\n    return "free" if qualifies(total=total) else "paid"`
  );

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(result.diagnostics[0]?.code, "code-refactor.unsupported-source-shape");
});
