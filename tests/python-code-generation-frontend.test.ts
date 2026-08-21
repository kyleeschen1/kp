import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpPythonCodeGeneration
} from "../scripts/python-code-generation-frontend.ts";
import {
  KP_CODE_REFACTOR_GENERATION_REQUEST_SCHEMA,
  type KpCodeRefactorGenerationRequest
} from "../src/domain-ir/code-refactor-generation-request.ts";
import {
  kpPythonFreeShippingRefactorContract
} from "../src/semantic/python-free-shipping-refactor-contract.ts";

function request(
  before: string,
  after: string,
  language: "typescript" | "python" = "python"
): KpCodeRefactorGenerationRequest {
  return {
    schemaVersion: KP_CODE_REFACTOR_GENERATION_REQUEST_SCHEMA,
    kind: "code-refactor-generation-request",
    requestId: "request.fixture.extract-helper",
    language,
    revisions: [
      {
        revisionId: "fixture.before.v1",
        role: "before",
        path: language === "python" ? "before.py" : "before.ts",
        sourceText: before
      },
      {
        revisionId: "fixture.after.v1",
        role: "after",
        path: language === "python" ? "after.py" : "after.ts",
        sourceText: after
      }
    ],
    intent: {
      kind: "extract-helper",
      preserve: ["behavior", "program-identity"]
    }
  };
}

test("compiles the canonical Python request to verified causal operations", () => {
  const contract = kpPythonFreeShippingRefactorContract;
  const result = compileKpPythonCodeGeneration(request(
    contract.before.source,
    contract.after.source
  ));

  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  assert.deepEqual(
    result.semanticPlan.causalContract.relations.map(({ kind }) => kind),
    [
      "merge-contributors",
      "introduce-helper",
      "change-contributor-role",
      "change-contributor-role",
      "succeed-program"
    ]
  );
  assert.equal(result.semanticPlan.roleEvidence.length, 8);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
});

test("Python parse rejection produces a typed repair and no plan", () => {
  const result = compileKpPythonCodeGeneration(request(
    "def broken(total: int):\n    return total +",
    "def okay(total: int) -> bool:\n    return total > 2"
  ));

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(result.diagnostics[0]?.code, "code-refactor.parse-rejected");
  assert.equal(result.requestId, "request.fixture.extract-helper");
});

test("Python semantic rejection remains an exact typed repair", () => {
  const result = compileKpPythonCodeGeneration(request(
    `def cost(total: int) -> int:\n    return 0 if total >= 50 else 5\n\ndef note(total: int) -> str:\n    return "free" if total >= 50 else "paid"`,
    `def qualifies(total: int) -> bool:\n    return total >= 50\n\ndef cost(total: int, other: int) -> int:\n    return 0 if qualifies(other) else 5\n\ndef note(total: int, other: int) -> str:\n    return "free" if qualifies(other) else "paid"`
  ));

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(result.diagnostics[0]?.code, "code-refactor.unsafe-capture");
});

test("the Python adapter refuses a TypeScript request", () => {
  const result = compileKpPythonCodeGeneration(request(
    "function first(total: number) { return total > 2; }",
    "function first(total: number) { return total > 2; }",
    "typescript"
  ));

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(result.diagnostics[0]?.code, "code-refactor.unsupported-operation");
});

test("the Python adapter imports no editor, framework, renderer, or runtime entry", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) =>
    readFile("scripts/python-code-generation-frontend.ts", "utf8")
  );
  assert.doesNotMatch(source, /(?:editor|svelte|renderer|timeline|playhead)/iu);
  assert.doesNotMatch(source, /(?:eval\s*\(|exec\s*\(|new Function)/u);
});
