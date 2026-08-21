import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { kpPythonFreeShippingRefactorContract } from
  "../src/semantic/python-free-shipping-refactor-contract.ts";
import { kpTypeScriptFreeShippingRefactorContract } from
  "../src/semantic/typescript-free-shipping-refactor-contract.ts";
import {
  validateKpCodeRefactorGenerationRequest,
  type KpCodeRefactorLanguage
} from "../src/domain-ir/code-refactor-generation-request.ts";
import { validateKpAnimationGenerationRequest } from
  "../src/domain-ir/animation-generation-request.ts";

test("ordered TypeScript and Python extract-helper requests are immutable", () => {
  for (const language of ["typescript", "python"] as const) {
    const input = request(language);
    const result = validateKpCodeRefactorGenerationRequest(input);
    assert.equal(result.status, "accepted");
    if (result.status !== "accepted") continue;
    assert.equal(result.request.language, language);
    assert.deepEqual(
      result.request.revisions.map(({ role }) => role),
      ["before", "after"]
    );
    assert.equal(Object.isFrozen(result.request), true);
    assert.equal(Object.isFrozen(result.request.revisions), true);
    assert.equal(Object.isFrozen(input), false);
    assert.deepEqual(
      JSON.parse(JSON.stringify(result.request)),
      result.request
    );
  }
});

test("revision order and bounded intent fail with typed protocol repairs", () => {
  const reversed = request("typescript");
  reversed["revisions"].reverse();
  const reversedResult = validateKpCodeRefactorGenerationRequest(reversed);
  assert.deepEqual(
    reversedResult.status === "repair-required"
      ? reversedResult.diagnostics.map(({ code }) => code)
      : [],
    ["code-refactor.request.revision-order"]
  );

  const broadened = request("python");
  broadened["intent"].kind = "rename-symbol";
  const broadenedResult = validateKpCodeRefactorGenerationRequest(broadened);
  assert.deepEqual(
    broadenedResult.status === "repair-required"
      ? broadenedResult.diagnostics.map(({ code }) => code)
      : [],
    ["code-refactor.request.value-invalid"]
  );
});

test("code protocol composes as opaque input under the cross-domain envelope", () => {
  const codeRequest = validateKpCodeRefactorGenerationRequest(
    request("typescript")
  );
  assert.equal(codeRequest.status, "accepted");
  if (codeRequest.status !== "accepted") return;

  const result = validateKpAnimationGenerationRequest({
    schemaVersion: "kp.animation-generation-request.v1",
    kind: "animation-generation-request",
    requestId: "request.code.typescript.extract-helper.outer.v1",
    domain: "code",
    source: {
      kind: "code.source-revisions",
      frontendId: "frontend.code.typescript-compiler.v1",
      input: codeRequest.request
    },
    intent: {
      kind: "code.extract-helper",
      summary: "Extract one duplicated rule into a shared helper.",
      parameters: { operation: "extract-helper" }
    },
    expectedOutputs: ["semantic-plan", "typed-diagnostics"],
    capabilityPins: ["capability.code.typescript-refactoring"]
  });

  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  assert.deepEqual(result.request.source.input, codeRequest.request);
});

test("request protocol rejects syntax shortcuts and presentation recursively", () => {
  const input = request("typescript") as Record<string, any>;
  input["ast"] = { kind: "SourceFile" };
  input["revisions"][0].renderer = "dom";
  input["intent"].durationMs = 500;
  const result = validateKpCodeRefactorGenerationRequest(input);

  assert.deepEqual(
    result.status === "repair-required"
      ? result.diagnostics.map(({ code, path }) => ({ code, path }))
      : [],
    [{
      code: "code-refactor.request.field-unknown",
      path: "$.ast"
    }, {
      code: "code-refactor.request.field-forbidden",
      path: "$.revisions[0].renderer"
    }, {
      code: "code-refactor.request.field-forbidden",
      path: "$.intent.durationMs"
    }, {
      code: "code-refactor.request.field-unknown",
      path: "$.revisions[0].renderer"
    }, {
      code: "code-refactor.request.field-unknown",
      path: "$.intent.durationMs"
    }]
  );
});

test("protocol imports no parser renderer editor or language semantic model", () => {
  const source = readFileSync(new URL(
    "../src/domain-ir/code-refactor-generation-request.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(
    source,
    /from ["'][^"']*(?:scripts|editor|rendering|semantic|animation)\//u
  );
  assert.doesNotMatch(source, /^import\s/mu);
  assert.doesNotMatch(source, /(?:HTMLElement|SVGElement|WebGL|Svelte)/u);
  assert.doesNotMatch(source, /interface\s+.*(?:Ast|SyntaxNode|Token)/u);
});

function request(language: KpCodeRefactorLanguage): Record<string, any> {
  const contract = language === "typescript"
    ? kpTypeScriptFreeShippingRefactorContract
    : kpPythonFreeShippingRefactorContract;
  return {
    schemaVersion: "kp.code-refactor-generation-request.v1",
    kind: "code-refactor-generation-request",
    requestId: `request.code.${language}.extract-helper.v1`,
    language,
    revisions: [{
      revisionId: contract.before.revisionId,
      role: "before",
      path: contract.before.path,
      sourceText: contract.before.source
    }, {
      revisionId: contract.after.revisionId,
      role: "after",
      path: contract.after.path,
      sourceText: contract.after.source
    }],
    intent: {
      kind: "extract-helper",
      preserve: ["behavior", "program-identity"]
    }
  };
}
