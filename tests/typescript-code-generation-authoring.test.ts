import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpTypeScriptAuthoringInput,
  kpTypeScriptCodeAuthoringDescriptor,
  runKpTypeScriptCodeGenerationCli
} from "../scripts/typescript-code-generation-authoring.ts";
import {
  KP_CODE_REFACTOR_GENERATION_REQUEST_SCHEMA
} from "../src/domain-ir/code-refactor-generation-request.ts";
import {
  kpTypeScriptFreeShippingRefactorContract
} from "../src/semantic/typescript-free-shipping-refactor-contract.ts";

function request(before?: string) {
  const contract = kpTypeScriptFreeShippingRefactorContract;
  return {
    schemaVersion: KP_CODE_REFACTOR_GENERATION_REQUEST_SCHEMA,
    kind: "code-refactor-generation-request",
    requestId: "request.typescript.authoring",
    language: "typescript",
    revisions: [
      {
        revisionId: contract.before.revisionId,
        role: "before",
        path: contract.before.path,
        sourceText: before ?? contract.before.source
      },
      {
        revisionId: contract.after.revisionId,
        role: "after",
        path: contract.after.path,
        sourceText: contract.after.source
      }
    ],
    intent: {
      kind: "extract-helper",
      preserve: ["behavior", "program-identity"]
    }
  };
}

test("discovery describes the exact bounded operation and counterexamples", () => {
  assert.equal(kpTypeScriptCodeAuthoringDescriptor.operationId,
    "code.typescript.extract-helper");
  assert.ok(kpTypeScriptCodeAuthoringDescriptor.aliases.includes(
    "extract helper"
  ));
  assert.ok(kpTypeScriptCodeAuthoringDescriptor.rejects.includes(
    "unsafe binding capture"
  ));
});

test("accepted input produces one immutable last-valid snapshot", () => {
  const result = compileKpTypeScriptAuthoringInput(request());
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  assert.equal(result.current.generation.status, "accepted");
  assert.equal(Object.isFrozen(result.current), true);
});

test("repair retains but never re-labels the last valid result", () => {
  const accepted = compileKpTypeScriptAuthoringInput(request());
  assert.equal(accepted.status, "accepted");
  if (accepted.status !== "accepted") return;
  const repaired = compileKpTypeScriptAuthoringInput(
    request("function broken(total: number) { return total + ; }"),
    accepted.current
  );

  assert.equal(repaired.status, "repair-required");
  if (repaired.status !== "repair-required") return;
  assert.strictEqual(repaired.lastValid, accepted.current);
  assert.equal(repaired.diagnostics[0]?.code, "code-refactor.parse-rejected");
  assert.equal("current" in repaired, false);
});

test("invalid envelopes stop before language compilation", () => {
  const result = compileKpTypeScriptAuthoringInput({
    ...request(),
    renderer: "canvas"
  });
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.ok(result.diagnostics.some(({ code }) =>
    code === "code-refactor.request.field-unknown"
  ));
});

test("CLI returns machine-readable accepted and repair results", async () => {
  const output: string[] = [];
  const errors: string[] = [];
  const acceptedCode = await runKpTypeScriptCodeGenerationCli(
    ["request.json"],
    {
      readText: async () => JSON.stringify(request()),
      writeOutput: (text) => output.push(text),
      writeError: (text) => errors.push(text)
    }
  );
  const repairCode = await runKpTypeScriptCodeGenerationCli(
    ["request.json"],
    {
      readText: async () => JSON.stringify({ ...request(), language: "python" }),
      writeOutput: (text) => output.push(text),
      writeError: (text) => errors.push(text)
    }
  );

  assert.equal(acceptedCode, 0);
  assert.equal(repairCode, 2);
  assert.equal(JSON.parse(output[0]!).status, "accepted");
  assert.equal(JSON.parse(output[1]!).status, "repair-required");
  assert.deepEqual(errors, []);
});
