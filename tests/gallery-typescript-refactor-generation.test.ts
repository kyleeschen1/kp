import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { orchestrateKpCodeGeneration } from
  "../scripts/code-generation-orchestrator.ts";
import { routeKpCrossDomainGalleryGeneration } from
  "../scripts/cross-domain-gallery-generation-router.ts";
import {
  kpGalleryTypeScriptExplanationClaims,
  kpGalleryTypeScriptRefactorFrontend,
  kpGalleryTypeScriptRefactorRequest
} from "../scripts/gallery-typescript-refactor-frontend.ts";
import { createKpTypeScriptFreeShippingAnimationAsset } from
  "../src/semantic/typescript-free-shipping-animation-asset.ts";
import { kpEditorTypeScriptRefactorSurfaceAdapter } from
  "../src/editor/typescript-refactor-surface-adapter.ts";
import { validateKpAnimationGenerationCapabilityPins } from
  "../src/architecture/animation-generation-request-capability.ts";
import { validateKpAnimationGenerationRequest } from
  "../src/domain-ir/animation-generation-request.ts";
import {
  readKpAnimationCatalogueRoute
} from "../src/editor/animation-catalogue-route.ts";

test("the canonical TypeScript refactor uses the shared envelope and Direct pin", () => {
  const envelope = validateKpAnimationGenerationRequest(
    kpGalleryTypeScriptRefactorRequest
  );
  assert.equal(envelope.status, "accepted");
  if (envelope.status !== "accepted") return;
  assert.deepEqual(validateKpAnimationGenerationCapabilityPins(
    envelope.request
  ), []);
  assert.deepEqual(envelope.request.capabilityPins,
    kpGalleryTypeScriptRefactorFrontend.capabilityPins);
});

test("the canonical route reuses compiler semantics and production lifecycle", async () => {
  const result = routeKpCrossDomainGalleryGeneration(
    kpGalleryTypeScriptRefactorRequest,
    [kpGalleryTypeScriptRefactorFrontend]
  );
  const orchestration = orchestrateKpCodeGeneration(
    kpGalleryTypeScriptRefactorRequest
  );
  assert.equal(result.status, "existing-artifact");
  assert.equal(orchestration.status, "accepted");
  if (result.status !== "existing-artifact" ||
      orchestration.status !== "accepted") return;

  const asset = createKpTypeScriptFreeShippingAnimationAsset();
  assert.equal(result.artifact.artifactId, asset.id);
  assert.equal(result.artifact.timelineId, asset.score.timeline.id);
  assert.equal(result.artifact.rendererId,
    kpEditorTypeScriptRefactorSurfaceAdapter.id);
  assert.equal(result.semanticTrace.id,
    orchestration.semanticPlan.causalContract.contractId);
  assert.equal(result.artifact.vignetteId,
    "vignette.programming.typescript-free-shipping");
  assert.deepEqual(readKpAnimationCatalogueRoute(
    result.artifact.directUrl.slice(1)
  ), {
    active: true,
    source: "default",
    artifactId: asset.id
  });
  for (const path of [
    result.frontendAuthority.sourcePath,
    result.semanticTrace.authoritySourcePath,
    result.artifact.artifactSourcePath,
    result.artifact.hostSourcePath,
    result.artifact.rendererSourcePath,
    result.artifact.directUrlSourcePath,
    result.artifact.vignetteSourcePath!
  ]) assert.ok((await readFile(path, "utf8")).length > 0, path);
});

test("explanation claims bind to semantic and bounded behavior evidence", () => {
  const asset = createKpTypeScriptFreeShippingAnimationAsset();
  const result = orchestrateKpCodeGeneration(kpGalleryTypeScriptRefactorRequest);
  assert.equal(result.status, "accepted");
  if (result.status !== "accepted") return;
  const authorities = new Set([
    result.semanticPlan.operationAuthorityId,
    result.semanticPlan.legality.schemaVersion,
    result.semanticPlan.causalContract.schemaVersion,
    "recipe.code.extract-helper.v1",
    asset.behavior.contractId,
    asset.behavior.schemaVersion
  ]);
  assert.equal(kpGalleryTypeScriptExplanationClaims.every((claim) =>
    claim.authorityIds.every((id) => authorities.has(id))
  ), true);
});

test("valid edited revisions distinguish requested artifacts from semantic plans", () => {
  const variant = JSON.parse(JSON.stringify(kpGalleryTypeScriptRefactorRequest));
  for (const revision of variant.source.input.revisions) {
    revision.sourceText = revision.sourceText.replaceAll("50", "75");
  }
  const unavailable = routeKpCrossDomainGalleryGeneration(variant, [
    kpGalleryTypeScriptRefactorFrontend
  ]);
  assert.equal(unavailable.status, "repair-required");
  assert.equal(unavailable.diagnostics[0].code,
    "code-generation.artifact-unavailable");

  variant.expectedOutputs = [
    "semantic-plan",
    "typed-diagnostics",
    "coverage-evidence"
  ];
  const result = routeKpCrossDomainGalleryGeneration(variant, [
    kpGalleryTypeScriptRefactorFrontend
  ]);

  assert.equal(result.status, "semantic-plan-only");
  if (result.status !== "semantic-plan-only") return;
  assert.equal("artifact" in result, false);
  assert.match(result.reason, /governed-artifact-compilation/u);
  assert.equal(result.explanationClaimRefs.includes(
    "claim.code.typescript.extract-helper.behavior-cases"
  ), false);
});
