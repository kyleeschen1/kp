import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpTypeScriptCodeGeneration
} from "../scripts/typescript-code-generation-frontend.ts";
import {
  KP_CODE_REFACTOR_GENERATION_REQUEST_SCHEMA,
  type KpCodeRefactorGenerationRequest
} from "../src/domain-ir/code-refactor-generation-request.ts";
import {
  kpTypeScriptFreeShippingRefactorContract
} from "../src/semantic/typescript-free-shipping-refactor-contract.ts";

function request(
  before: string,
  after: string,
  language: "typescript" | "python" = "typescript"
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
        path: language === "typescript" ? "before.ts" : "before.py",
        sourceText: before
      },
      {
        revisionId: "fixture.after.v1",
        role: "after",
        path: language === "typescript" ? "after.ts" : "after.py",
        sourceText: after
      }
    ],
    intent: {
      kind: "extract-helper",
      preserve: ["behavior", "program-identity"]
    }
  };
}

test("compiles the canonical request to verified causal operations", () => {
  const contract = kpTypeScriptFreeShippingRefactorContract;
  const result = compileKpTypeScriptCodeGeneration(request(
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

test("compiler rejection produces a typed repair and no plan", () => {
  const result = compileKpTypeScriptCodeGeneration(request(
    "function broken(total: number) { return total + ; }",
    "function okay(total: number) { return total > 2; }"
  ));

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(result.diagnostics[0]?.code, "code-refactor.parse-rejected");
  assert.equal(result.requestId, "request.fixture.extract-helper");
});

test("the TypeScript adapter refuses a Python request", () => {
  const result = compileKpTypeScriptCodeGeneration(request(
    "def first(total):\n    return total > 2",
    "def first(total):\n    return total > 2",
    "python"
  ));

  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.equal(result.diagnostics[0]?.code, "code-refactor.unsupported-operation");
});

test("the adapter imports no editor, framework, renderer, or runtime entry", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) =>
    readFile("scripts/typescript-code-generation-frontend.ts", "utf8")
  );
  assert.doesNotMatch(source, /(?:editor|svelte|renderer|timeline|playhead)/iu);
  assert.doesNotMatch(source, /(?:eval\s*\(|new Function|transpileModule)/u);
});
