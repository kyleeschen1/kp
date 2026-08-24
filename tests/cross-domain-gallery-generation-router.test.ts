import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  routeKpCrossDomainGalleryGeneration,
  type KpCrossDomainGalleryFrontend
} from "../scripts/cross-domain-gallery-generation-router.ts";
import {
  projectKpGalleryAcceptedGeneration,
  type KpGalleryGenerationResult
} from "../src/domain-ir/gallery-generation-result.ts";
import {
  validateKpAnimationGenerationRequest,
  type KpAnimationGenerationRequest
} from "../src/domain-ir/animation-generation-request.ts";

const rawRequest = {
  schemaVersion: "kp.animation-generation-request.v1",
  kind: "animation-generation-request",
  requestId: "request.code.typescript.extract-helper.gallery.v1",
  domain: "code",
  source: {
    kind: "code.source-revisions",
    frontendId: "frontend.code.typescript-compiler.v1",
    input: { revisionIds: ["before", "after"] }
  },
  intent: {
    kind: "code.extract-helper",
    summary: "Extract a shared helper.",
    parameters: { operation: "extract-helper" }
  },
  expectedOutputs: ["semantic-plan", "typed-diagnostics"],
  capabilityPins: ["capability.code.typescript-refactoring"]
};

const frontend = createFrontend();

test("invalid envelopes return request-owned diagnostics without routing", () => {
  let calls = 0;
  const result = routeKpCrossDomainGalleryGeneration(
    { ...rawRequest, durationMs: 500 },
    [{ ...frontend, project: (request) => {
      calls += 1;
      return frontend.project(request);
    } }]
  );

  assert.equal(result.status, "repair-required");
  assert.equal(result.diagnostics[0].authority, "request-envelope");
  assert.equal(calls, 0);
});

test("missing duplicate and capability-mismatched routes fail closed", () => {
  const missing = routeKpCrossDomainGalleryGeneration(rawRequest, []);
  assert.equal(missing.status, "repair-required");
  assert.equal(missing.diagnostics[0].code,
    "gallery-generation.frontend-unavailable");

  const duplicate = routeKpCrossDomainGalleryGeneration(
    rawRequest,
    [frontend, frontend]
  );
  assert.equal(duplicate.status, "repair-required");
  assert.equal(duplicate.diagnostics[0].code,
    "gallery-generation.frontend-ambiguous");

  const capability = routeKpCrossDomainGalleryGeneration(rawRequest, [{
    ...frontend,
    capabilityPins: ["capability.code.unsupported"]
  }]);
  assert.equal(capability.status, "repair-required");
  assert.equal(capability.diagnostics[0].code,
    "gallery-generation.capability-mismatch");
});

test("one exact frontend returns its reference-only projection", () => {
  const result = routeKpCrossDomainGalleryGeneration(rawRequest, [frontend]);

  assert.equal(result.status, "semantic-plan-only");
  assert.equal(result.requestId, rawRequest.requestId);
  assert.equal(result.frontendAuthority.frontendId, frontend.frontendId);
  assert.equal(Object.isFrozen(result), true);
});

test("frontends cannot forge request or authority identity", () => {
  const forged: KpCrossDomainGalleryFrontend = {
    ...frontend,
    project: (request) => ({
      ...frontend.project(request),
      domain: "equation"
    } as unknown as KpGalleryGenerationResult)
  };
  const result = routeKpCrossDomainGalleryGeneration(rawRequest, [forged]);

  assert.equal(result.status, "repair-required");
  assert.equal(result.diagnostics[0].code,
    "gallery-generation.result-authority-mismatch");
});

test("the router imports no domain frontend renderer or semantic model", () => {
  const source = readFileSync(new URL(
    "../scripts/cross-domain-gallery-generation-router.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source,
    /from ["'][^"']*(?:animation|rendering|semantic|editor)\//u);
  assert.doesNotMatch(source,
    /(?:Ast|Equation|Graph|Program|Scene|SVG|WebGL|KaTeX)/u);
});

function createFrontend(): KpCrossDomainGalleryFrontend {
  return Object.freeze({
    domain: "code" as const,
    sourceKind: "code.source-revisions",
    frontendId: "frontend.code.typescript-compiler.v1",
    capabilityPins: ["capability.code.typescript-refactoring"],
    authoritySourcePath: "scripts/typescript-code-generation-frontend.ts",
    project: (request: KpAnimationGenerationRequest) =>
      projectKpGalleryAcceptedGeneration({
        status: "semantic-plan-only",
        request,
        frontendAuthoritySourcePath:
          "scripts/typescript-code-generation-frontend.ts",
        semanticTrace: {
          id: "contract.typescript.extract-helper.gallery",
          kind: "code.extract-helper-causal-contract",
          authoritySourcePath:
            "scripts/typescript-code-generation-frontend.ts"
        },
        explanationClaimRefs: [
          "claim.code.extract-helper.behavior-preserved"
        ],
        reason: "generated-semantics-require-governed-artifact-compilation"
      })
  });
}

test("the fixture itself remains a valid shared envelope", () => {
  assert.equal(validateKpAnimationGenerationRequest(rawRequest).status,
    "accepted");
});
