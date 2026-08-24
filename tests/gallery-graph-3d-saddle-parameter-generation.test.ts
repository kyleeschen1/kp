import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { routeKpCrossDomainGalleryGeneration } from
  "../scripts/cross-domain-gallery-generation-router.ts";
import {
  kpGalleryGraph3DSaddleParameterExplanationClaims,
  kpGalleryGraph3DSaddleParameterFrontend,
  kpGalleryGraph3DSaddleParameterRequest
} from "../scripts/gallery-graph-3d-saddle-parameter-frontend.ts";
import {
  createKpGraph3DSaddleParameterAnimationAsset
} from "../src/animation/graph-3d-saddle-parameter-asset.ts";
import { loadKpAnimationAsset } from
  "../src/animation/catalog-loader.ts";
import { validateKpAnimationGenerationCapabilityPins } from
  "../src/architecture/animation-generation-request-capability.ts";
import { validateKpAnimationGenerationRequest } from
  "../src/domain-ir/animation-generation-request.ts";
import { readKpAnimationCatalogueRoute } from
  "../src/editor/animation-catalogue-route.ts";
import {
  KP_EDITOR_GRAPH_3D_SADDLE_ADAPTER_ID,
  kpEditorGraph3DSaddleSurfaceAdapter
} from "../src/editor/graph-3d-saddle-parameter-surface-adapter.ts";
import {
  deriveKpEditorSelectedSurfaceCapabilities
} from "../src/editor/selected-surface-capability.ts";

test("the saddle parameter change uses the shared envelope and exact pin", () => {
  const envelope = validateKpAnimationGenerationRequest(
    kpGalleryGraph3DSaddleParameterRequest
  );
  assert.equal(envelope.status, "accepted");
  if (envelope.status !== "accepted") return;
  assert.deepEqual(validateKpAnimationGenerationCapabilityPins(
    envelope.request
  ), []);
  assert.deepEqual(envelope.request.capabilityPins,
    kpGalleryGraph3DSaddleParameterFrontend.capabilityPins);
});

test("the exact route compiles the saddle into the canonical Catalogue host", async () => {
  const result = routeKpCrossDomainGalleryGeneration(
    kpGalleryGraph3DSaddleParameterRequest,
    [kpGalleryGraph3DSaddleParameterFrontend]
  );
  assert.equal(result.status, "compiled-artifact");
  if (result.status !== "compiled-artifact") return;

  const asset = createKpGraph3DSaddleParameterAnimationAsset();
  assert.equal(result.artifact.artifactId, asset.id);
  assert.equal(result.artifact.timelineId, asset.animation.timeline?.id);
  assert.equal(result.artifact.hostId, "editor-animation-player");
  assert.equal(result.artifact.rendererId,
    KP_EDITOR_GRAPH_3D_SADDLE_ADAPTER_ID);
  assert.equal(result.artifact.rendererId,
    kpEditorGraph3DSaddleSurfaceAdapter.id);
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
  }), ["graph-webgl-3d"]);

  for (const sourcePath of [
    result.frontendAuthority.sourcePath,
    result.semanticTrace.authoritySourcePath,
    result.artifact.artifactSourcePath,
    result.artifact.hostSourcePath,
    result.artifact.rendererSourcePath,
    result.artifact.directUrlSourcePath
  ]) assert.ok((await readFile(sourcePath, "utf8")).length > 0, sourcePath);
});

test("Graph3D explanation claims bind to operation and trace laws", () => {
  const trace = createKpGraph3DSaddleParameterAnimationAsset().trace;
  const authorities = new Set([
    trace.operationId,
    ...(trace.transformation.lawRefs ?? []).map(({ id }) => id)
  ]);
  assert.equal(
    kpGalleryGraph3DSaddleParameterExplanationClaims.every((claim) =>
      claim.authorityIds.every((id) => authorities.has(id))
    ),
    true
  );
});

test("nearby surfaces camera requests and intents remain typed Graph3D gaps", () => {
  const denominator = clone(kpGalleryGraph3DSaddleParameterRequest);
  denominator.source.input.scene.targetParameters.denominator = 6;
  const denominatorResult = routeKpCrossDomainGalleryGeneration(denominator, [
    kpGalleryGraph3DSaddleParameterFrontend
  ]);
  assert.equal(denominatorResult.status, "repair-required");
  assert.equal(denominatorResult.diagnostics[0].code,
    "graph-3d-scene.request.exemplar-unsupported");
  assert.equal(denominatorResult.semanticTrace, undefined);

  const camera = clone(kpGalleryGraph3DSaddleParameterRequest);
  camera.source.input.camera = { azimuthDegrees: 50 };
  const cameraResult = routeKpCrossDomainGalleryGeneration(camera, [
    kpGalleryGraph3DSaddleParameterFrontend
  ]);
  assert.equal(cameraResult.status, "repair-required");
  assert.equal(cameraResult.diagnostics.some(({ code }) =>
    code === "graph-3d-scene.request.presentation-forbidden"
  ), true);
  assert.equal(cameraResult.semanticTrace, undefined);

  const intent = clone(kpGalleryGraph3DSaddleParameterRequest);
  intent.intent.parameters.targetDenominator = 12;
  const intentResult = routeKpCrossDomainGalleryGeneration(intent, [
    kpGalleryGraph3DSaddleParameterFrontend
  ]);
  assert.equal(intentResult.status, "repair-required");
  assert.equal(intentResult.diagnostics[0].code,
    "gallery-generation.graph-3d.intent-unsupported");
  assert.equal(intentResult.semanticTrace, undefined);
});

function clone<T>(value: T): any {
  return JSON.parse(JSON.stringify(value));
}
