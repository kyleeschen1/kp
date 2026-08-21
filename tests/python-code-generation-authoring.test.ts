import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpPythonAuthoringInput,
  kpPythonCodeAuthoringDescriptor,
  runKpPythonCodeGenerationCli
} from "../scripts/python-code-generation-authoring.ts";
import {
  KP_CODE_REFACTOR_GENERATION_REQUEST_SCHEMA
} from "../src/domain-ir/code-refactor-generation-request.ts";
import {
  kpPythonFreeShippingRefactorContract
} from "../src/semantic/python-free-shipping-refactor-contract.ts";

function request(before?: string) {
  const contract = kpPythonFreeShippingRefactorContract;
  return {
    schemaVersion: KP_CODE_REFACTOR_GENERATION_REQUEST_SCHEMA,
    kind: "code-refactor-generation-request",
    requestId: "request.python.authoring",
    language: "python",
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

test("Python discovery describes the exact bounded operation and counterexamples", () => {
  assert.equal(kpPythonCodeAuthoringDescriptor.operationId,
    "code.python.extract-helper");
  assert.ok(kpPythonCodeAuthoringDescriptor.aliases.includes("extract helper"));
  assert.ok(kpPythonCodeAuthoringDescriptor.rejects.includes(
    "unsafe binding or annotation changes"
  ));
});

test("accepted Python input produces one immutable last-valid snapshot", () => {
  const result = compileKpPythonAuthoringInput(request());
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  assert.equal(result.current.generation.status, "accepted");
  assert.equal(Object.isFrozen(result.current), true);
});

test("Python repair retains but never re-labels the last valid result", () => {
  const accepted = compileKpPythonAuthoringInput(request());
  assert.equal(accepted.status, "accepted");
  if (accepted.status !== "accepted") return;
  const repaired = compileKpPythonAuthoringInput(
    request("def broken(total: int):\n    return total +"),
    accepted.current
  );

  assert.equal(repaired.status, "repair-required");
  if (repaired.status !== "repair-required") return;
  assert.strictEqual(repaired.lastValid, accepted.current);
  assert.equal(repaired.diagnostics[0]?.code, "code-refactor.parse-rejected");
  assert.equal("current" in repaired, false);
});

test("invalid Python envelopes stop before language compilation", () => {
  const result = compileKpPythonAuthoringInput({
    ...request(),
    renderer: "canvas"
  });
  assert.equal(result.status, "repair-required");
  if (result.status !== "repair-required") return;
  assert.ok(result.diagnostics.some(({ code }) =>
    code === "code-refactor.request.field-unknown"
  ));
});

test("Python CLI returns machine-readable accepted and repair results", async () => {
  const output: string[] = [];
  const errors: string[] = [];
  const acceptedCode = await runKpPythonCodeGenerationCli(
    ["request.json"],
    {
      readText: async () => JSON.stringify(request()),
      writeOutput: (text) => output.push(text),
      writeError: (text) => errors.push(text)
    }
  );
  const repairCode = await runKpPythonCodeGenerationCli(
    ["request.json"],
    {
      readText: async () => JSON.stringify({ ...request(), language: "typescript" }),
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
