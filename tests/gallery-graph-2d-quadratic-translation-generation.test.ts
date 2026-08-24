import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { routeKpCrossDomainGalleryGeneration } from
  "../scripts/cross-domain-gallery-generation-router.ts";
import {
  kpGalleryGraph2DQuadraticTranslationExplanationClaims,
  kpGalleryGraph2DQuadraticTranslationFrontend,
  kpGalleryGraph2DQuadraticTranslationRequest
} from "../scripts/gallery-graph-2d-quadratic-translation-frontend.ts";
import {
  createKpGraph2DQuadraticTranslationAnimationAsset
} from "../src/animation/graph-2d-quadratic-translation-asset.ts";
import { loadKpAnimationAsset } from
  "../src/animation/catalog-loader.ts";
import { validateKpAnimationGenerationCapabilityPins } from
  "../src/architecture/animation-generation-request-capability.ts";
import { validateKpAnimationGenerationRequest } from
  "../src/domain-ir/animation-generation-request.ts";
import { readKpAnimationCatalogueRoute } from
  "../src/editor/animation-catalogue-route.ts";
import {
  KP_EDITOR_GRAPH_2D_QUADRATIC_TRANSLATION_ADAPTER_ID,
  kpEditorGraph2DQuadraticTranslationSurfaceAdapter
} from "../src/editor/graph-2d-quadratic-translation-surface-adapter.ts";
import {
  deriveKpEditorSelectedSurfaceCapabilities
} from "../src/editor/selected-surface-capability.ts";

test("the quadratic translation uses the shared envelope and exact pin", () => {
  const envelope = validateKpAnimationGenerationRequest(
    kpGalleryGraph2DQuadraticTranslationRequest
  );
  assert.equal(envelope.status, "accepted");
  if (envelope.status !== "accepted") return;
  assert.deepEqual(validateKpAnimationGenerationCapabilityPins(
    envelope.request
  ), []);
  assert.deepEqual(envelope.request.capabilityPins,
    kpGalleryGraph2DQuadraticTranslationFrontend.capabilityPins);
});

test("the exact route compiles the asset into the canonical Catalogue host", async () => {
  const result = routeKpCrossDomainGalleryGeneration(
    kpGalleryGraph2DQuadraticTranslationRequest,
    [kpGalleryGraph2DQuadraticTranslationFrontend]
  );
  assert.equal(result.status, "compiled-artifact");
  if (result.status !== "compiled-artifact") return;

  const asset = createKpGraph2DQuadraticTranslationAnimationAsset();
  assert.equal(result.artifact.artifactId, asset.id);
  assert.equal(result.artifact.timelineId, asset.animation.timeline?.id);
  assert.equal(result.artifact.hostId, "editor-animation-player");
  assert.equal(result.artifact.rendererId,
    KP_EDITOR_GRAPH_2D_QUADRATIC_TRANSLATION_ADAPTER_ID);
  assert.equal(result.artifact.rendererId,
    kpEditorGraph2DQuadraticTranslationSurfaceAdapter.id);
  assert.equal(result.semanticTrace.id, asset.trace.id);
  assert.deepEqual(readKpAnimationCatalogueRoute(
    result.artifact.directUrl.slice(1)
  ), {
    active: true,
    source: "default",
    artifactId: asset.id
  });

  const loaded = await loadKpAnimationAsset(asset.id);
  assert.equal(loaded.packId, "graph");
  assert.equal(loaded.animation.id, asset.id);
  assert.deepEqual(deriveKpEditorSelectedSurfaceCapabilities({
    animationId: asset.id,
    slotKinds: ["graph"]
  }), ["graph-svg-katex-labels"]);

  for (const sourcePath of [
    result.frontendAuthority.sourcePath,
    result.semanticTrace.authoritySourcePath,
    result.artifact.artifactSourcePath,
    result.artifact.hostSourcePath,
    result.artifact.rendererSourcePath,
    result.artifact.directUrlSourcePath
  ]) assert.ok((await readFile(sourcePath, "utf8")).length > 0, sourcePath);
});

test("Graph2D explanation claims are grounded in operation and trace laws", () => {
  const trace = createKpGraph2DQuadraticTranslationAnimationAsset().trace;
  const authorities = new Set([
    trace.operationId,
    ...(trace.transformation.lawRefs ?? []).map(({ id }) => id)
  ]);
  assert.equal(
    kpGalleryGraph2DQuadraticTranslationExplanationClaims.every((claim) =>
      claim.authorityIds.every((id) => authorities.has(id))
    ),
    true
  );
});

test("nearby shifts formulas and intents remain typed Graph2D gaps", () => {
  const shifted = clone(kpGalleryGraph2DQuadraticTranslationRequest);
  shifted.source.input.function.targetParameters.horizontalShift = 1;
  const shiftedResult = routeKpCrossDomainGalleryGeneration(shifted, [
    kpGalleryGraph2DQuadraticTranslationFrontend
  ]);
  assert.equal(shiftedResult.status, "repair-required");
  assert.equal(shiftedResult.diagnostics[0].code,
    "graph-2d-function.request.exemplar-unsupported");
  assert.equal(shiftedResult.semanticTrace, undefined);

  const formula = clone(kpGalleryGraph2DQuadraticTranslationRequest);
  formula.source.input.formula = "y=(x-3)^2";
  const formulaResult = routeKpCrossDomainGalleryGeneration(formula, [
    kpGalleryGraph2DQuadraticTranslationFrontend
  ]);
  assert.equal(formulaResult.status, "repair-required");
  assert.equal(formulaResult.diagnostics.some(({ code }) =>
    code === "graph-2d-function.request.formula-forbidden"
  ), true);
  assert.equal(formulaResult.semanticTrace, undefined);

  const intent = clone(kpGalleryGraph2DQuadraticTranslationRequest);
  intent.intent.parameters.targetHorizontalShift = 3;
  const intentResult = routeKpCrossDomainGalleryGeneration(intent, [
    kpGalleryGraph2DQuadraticTranslationFrontend
  ]);
  assert.equal(intentResult.status, "repair-required");
  assert.equal(intentResult.diagnostics[0].code,
    "gallery-generation.graph-2d.intent-unsupported");
  assert.equal(intentResult.semanticTrace, undefined);
});

function clone<T>(value: T): any {
  return JSON.parse(JSON.stringify(value));
}
