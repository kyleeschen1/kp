import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { validateKpAnimationGenerationCapabilityPins } from
  "../src/architecture/animation-generation-request-capability.ts";
import { compileKpAnimationDomainFrontendEvidence } from
  "../src/architecture/animation-domain-frontend-evidence.ts";
import { kpAnimationCapabilityPlan } from
  "../src/architecture/cross-domain-animation-capability-plan.ts";
import {
  validateKpAnimationGenerationRequest,
  type KpAnimationGenerationDomain,
  type KpAnimationGenerationRequest
} from "../src/domain-ir/animation-generation-request.ts";

const domainExamples: readonly Readonly<{
  domain: KpAnimationGenerationDomain;
  sourceKind: string;
  frontendId: string;
  capabilityId: string;
}>[] = Object.freeze([{
  domain: "equation",
  sourceKind: "equation.native-latex-series",
  frontendId: "frontend.equation.native-latex.v1",
  capabilityId: "capability.equation.transform-series"
}, {
  domain: "matrix",
  sourceKind: "matrix.semantic-operands",
  frontendId: "frontend.matrix.semantic-composition.v1",
  capabilityId: "capability.matrix.vector-composition"
}, {
  domain: "code",
  sourceKind: "code.source-document",
  frontendId: "frontend.code.typescript-compiler.v1",
  capabilityId: "capability.code.typescript-refactoring"
}, {
  domain: "graph-2d",
  sourceKind: "graph-2d.semantic-scene",
  frontendId: "frontend.graph-2d.function-model.v1",
  capabilityId: "capability.graph-2d.function-transformations"
}, {
  domain: "graph-3d",
  sourceKind: "graph-3d.semantic-scene",
  frontendId: "frontend.graph-3d.semantic-scene.v1",
  capabilityId: "capability.graph-3d.scene-transformations"
}]);

test("one envelope accepts opaque requests while only proved frontends close", () => {
  for (const example of domainExamples) {
    const input = request(example);
    const result = validateKpAnimationGenerationRequest(input);
    assert.equal(result.status, "accepted", example.domain);
    if (result.status !== "accepted") continue;
    assert.deepEqual(
      validateKpAnimationGenerationCapabilityPins(result.request).map(
        ({ code }) => code
      ),
      example.domain === "equation" || example.domain === "code" ||
        example.domain === "graph-2d"
        ? []
        : ["animation-generation.frontend.required"]
    );
    assert.equal(Object.isFrozen(result.request), true);
    assert.equal(Object.isFrozen(result.request.source.input), true);
    assert.equal(Object.isFrozen((input["source"] as any)["input"]), false);
    assert.deepEqual(JSON.parse(JSON.stringify(result.request)), result.request);
  }
});

test("domain source and capability mismatches produce typed repairs", () => {
  const malformed = request({
    ...domainExamples[1]!,
    sourceKind: "code.source-document"
  });
  const envelope = validateKpAnimationGenerationRequest(malformed);
  assert.deepEqual(
    envelope.status === "repair-required"
      ? envelope.diagnostics.map(({ code }) => code)
      : [],
    ["animation-generation.source.domain-mismatch"]
  );

  const accepted = requireAccepted(request({
    ...domainExamples[1]!,
    frontendId: "frontend.matrix.unknown.v1"
  }));
  assert.deepEqual(
    validateKpAnimationGenerationCapabilityPins(accepted).map(({ code }) => code),
    ["animation-generation.frontend.mismatch"]
  );

  const wrongDomain = requireAccepted({
    ...request(domainExamples[1]!),
    capabilityPins: ["capability.code.typescript-refactoring"]
  });
  assert.deepEqual(
    validateKpAnimationGenerationCapabilityPins(wrongDomain).map(({ code }) =>
      code
    ),
    ["animation-generation.capability.domain-mismatch"]
  );
});

test("exact domain-owned evidence closes the matching frontend gap", () => {
  const accepted = requireAccepted(request(domainExamples[1]!));
  const evidence = compileKpAnimationDomainFrontendEvidence({
    plan: kpAnimationCapabilityPlan,
    authorities: [{
      authorityId: "frontend.matrix.semantic-composition.v1",
      domain: "matrix",
      sourcePath: "src/domains/matrix/semantic-composition-frontend.ts"
    }]
  });
  assert.deepEqual(
    validateKpAnimationGenerationCapabilityPins(accepted, evidence),
    []
  );
});

test("presentation fields are forbidden recursively while domain data stays opaque", () => {
  const input = request(domainExamples[4]!);
  const result = validateKpAnimationGenerationRequest({
    ...input,
    source: {
      ...(input["source"] as Record<string, unknown>),
      input: {
        semanticCamera: { targetObjectId: "surface.1" },
        renderer: "webgl",
        nested: { durationMs: 500 }
      }
    },
    layout: "cinematic"
  });
  assert.deepEqual(
    result.status === "repair-required"
      ? result.diagnostics.map(({ code, path }) => ({ code, path }))
      : [],
    [{
      code: "animation-generation.field.unknown",
      path: "$.layout"
    }, {
      code: "animation-generation.field.forbidden",
      path: "$.source.input.renderer"
    }, {
      code: "animation-generation.field.forbidden",
      path: "$.source.input.nested.durationMs"
    }]
  );
});

test("the envelope owns routing only and imports no domain frontend or renderer", () => {
  const source = readFileSync(new URL(
    "../src/domain-ir/animation-generation-request.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source, /from ["'][^"']*(?:editor|rendering|domains)\//u);
  assert.doesNotMatch(source, /(?:Svelte|HTMLElement|SVGElement|WebGLRenderingContext)/u);
  assert.doesNotMatch(source, /interface\s+.*(?:Ast|Matrix|Equation|Graph|Scene)/u);
});

function request(example: Readonly<{
  domain: KpAnimationGenerationDomain;
  sourceKind: string;
  frontendId: string;
  capabilityId: string;
}>): Record<string, any> {
  return {
    schemaVersion: "kp.animation-generation-request.v1",
    kind: "animation-generation-request",
    requestId: `request.${example.domain}.example.v1`,
    domain: example.domain,
    source: {
      kind: example.sourceKind,
      frontendId: example.frontendId,
      input: { domainOwnedValue: [1, 2, 3] }
    },
    intent: {
      kind: `${example.domain}.transform`,
      summary: `Compile one ${example.domain} transformation.`,
      parameters: { operationId: `${example.domain}.operation.example` }
    },
    expectedOutputs: ["semantic-plan", "typed-diagnostics"],
    capabilityPins: [example.capabilityId]
  };
}

function requireAccepted(value: unknown): KpAnimationGenerationRequest {
  const result = validateKpAnimationGenerationRequest(value);
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") throw new Error("Expected accepted request.");
  return result.request;
}
