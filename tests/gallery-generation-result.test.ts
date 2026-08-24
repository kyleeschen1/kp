import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  projectKpGalleryAcceptedGeneration,
  projectKpGalleryGenerationRepair
} from "../src/domain-ir/gallery-generation-result.ts";
import type {
  KpAnimationGenerationRequest
} from "../src/domain-ir/animation-generation-request.ts";

const request = Object.freeze({
  schemaVersion: "kp.animation-generation-request.v1" as const,
  kind: "animation-generation-request" as const,
  requestId: "request.code.typescript.extract-helper.gallery.v1",
  domain: "code" as const,
  source: Object.freeze({
    kind: "code.source-revisions",
    frontendId: "frontend.code.typescript-compiler.v1",
    input: Object.freeze({ revisionIds: ["before", "after"] })
  }),
  intent: Object.freeze({
    kind: "code.extract-helper",
    summary: "Extract a shared helper.",
    parameters: Object.freeze({ operation: "extract-helper" })
  }),
  expectedOutputs: Object.freeze([
    "semantic-plan" as const,
    "typed-diagnostics" as const
  ]),
  capabilityPins: Object.freeze([
    "capability.code.typescript-refactoring"
  ])
}) satisfies KpAnimationGenerationRequest;

const semanticTrace = Object.freeze({
  id: "contract.typescript.extract-helper.gallery",
  kind: "code.extract-helper-causal-contract",
  authoritySourcePath: "scripts/typescript-code-generation-frontend.ts"
});

test("artifact dispositions share authority and lifecycle references", () => {
  for (const status of ["compiled-artifact", "existing-artifact"] as const) {
    const result = projectKpGalleryAcceptedGeneration({
      status,
      request,
      frontendAuthoritySourcePath:
        "scripts/typescript-code-generation-frontend.ts",
      semanticTrace,
      explanationClaimRefs: ["claim.code.extract-helper.behavior-preserved"],
      evidenceRefs: ["evidence.code.typescript.extract-helper.canonical"],
      artifact: {
        artifactId: "animation.programming.typescript-free-shipping-refactor",
        artifactSourcePath:
          "src/semantic/typescript-free-shipping-animation-asset.ts",
        timelineId: "timeline.typescript.free-shipping-threshold",
        hostId: "host.catalogue.animation-player",
        hostSourcePath: "src/editor/animation-player-controller.ts",
        rendererId: "renderer.code.typescript-refactor",
        rendererSourcePath: "src/editor/typescript-refactor-surface-adapter.ts",
        directUrl: "/?animation=typescript-free-shipping-refactor",
        directUrlSourcePath:
          "src/editor/animation-library-display-catalog-builder.ts"
      }
    });

    assert.equal(result.status, status);
    assert.equal(result.frontendAuthority.frontendId,
      request.source.frontendId);
    assert.deepEqual(result.capabilityPins, request.capabilityPins);
    assert.equal(result.semanticTrace, semanticTrace);
    assert.equal(result.diagnostics.length, 0);
    assert.equal(Object.isFrozen(result), true);
    assert.equal(Object.isFrozen(result.artifact), true);
  }
});

test("semantic-only results remain honest without an artifact handle", () => {
  const result = projectKpGalleryAcceptedGeneration({
    status: "semantic-plan-only",
    request,
    frontendAuthoritySourcePath:
      "scripts/typescript-code-generation-frontend.ts",
    semanticTrace,
    explanationClaimRefs: ["claim.code.extract-helper.behavior-preserved"],
    evidenceRefs: ["evidence.code.typescript.extract-helper.variant"],
    reason: "generated-semantics-require-governed-artifact-compilation"
  });

  assert.equal(result.status, "semantic-plan-only");
  assert.equal("artifact" in result, false);
  assert.match(result.reason, /governed-artifact-compilation/u);
});

test("repairs preserve typed diagnostics without inventing authority", () => {
  const result = projectKpGalleryGenerationRepair({
    request,
    frontendAuthoritySourcePath:
      "scripts/typescript-code-generation-frontend.ts",
    diagnostics: [{
      authority: "domain-frontend",
      code: "code-generation.artifact-unavailable",
      path: "$.expectedOutputs",
      message: "The valid variant has no governed animation artifact.",
      repair: "Request semantic-plan output."
    }]
  });

  assert.equal(result.status, "repair-required");
  assert.equal(result.semanticTrace, undefined);
  assert.equal(result.explanationClaimRefs.length, 0);
  assert.equal(result.evidenceRefs.length, 0);
  assert.equal(result.diagnostics[0].authority, "domain-frontend");
  assert.equal(Object.isFrozen(result.diagnostics), true);
});

test("the shared projection carries references rather than domain semantics", () => {
  const source = readFileSync(new URL(
    "../src/domain-ir/gallery-generation-result.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source,
    /(?:interface|type)\s+.*(?:Ast|Equation|Graph|Program|Scene)/u);
  assert.doesNotMatch(source,
    /(?:durationMs|keyframe|coordinates|latex|sourceText|camera)/u);
});
