import assert from "node:assert/strict";
import test from "node:test";
import { checkAuthorTask, authorTaskExample } from "../scripts/author-check-owner-dispatch.ts";
import { routeKpCrossDomainGalleryGeneration } from "../scripts/cross-domain-gallery-generation-router.ts";
import { kpGalleryGraph3DSaddleParameterFrontend, kpGalleryGraph3DSaddleParameterRequest } from "../scripts/gallery-graph-3d-saddle-parameter-frontend.ts";

test("Graph3D checking retains the exact router result, artifact host and semantic trace", async () => {
  const source = await authorTaskExample("graph3d.saddle");
  assert.deepEqual(source, kpGalleryGraph3DSaddleParameterRequest);
  const expected = routeKpCrossDomainGalleryGeneration(source, [kpGalleryGraph3DSaddleParameterFrontend]);
  const report = await checkAuthorTask("graph3d.saddle", JSON.stringify(source));
  assert.equal(report.status, "checked");
  assert.deepEqual(report.result, expected);
  assert.equal(expected.status, "compiled-artifact");
  if (expected.status !== "compiled-artifact") return;
  assert.equal(expected.artifact.hostId, "editor-animation-player");
  assert.equal(expected.artifact.rendererId, "editor-animation-surface.graph.webgl-3d-saddle");
  assert.ok(expected.semanticTrace.id);
  assert.ok(expected.evidenceRefs.length);
});

test("Graph3D unsupported camera, topology, parameters and frontend pins preserve routed gaps", async () => {
  const source = kpGalleryGraph3DSaddleParameterRequest;
  for (const value of [
    { ...source, capabilityPins: ["capability.equation"] },
    { ...source, intent: { ...source.intent, parameters: { ...source.intent.parameters, targetDenominator: 9 } } },
    { ...source, source: { ...source.source, input: { ...source.source.input, camera: { azimuthDegrees: 90 } } } },
    { ...source, source: { ...source.source, input: { ...source.source.input, scene: { ...source.source.input.scene, topology: "different" } } } },
    { ...source, source: { ...source.source, frontendId: "frontend.foreign.v1" } }
  ]) {
    const expected = routeKpCrossDomainGalleryGeneration(value, [kpGalleryGraph3DSaddleParameterFrontend]);
    assert.equal(expected.status, "repair-required");
    const report = await checkAuthorTask("graph3d.saddle", JSON.stringify(value));
    assert.equal(report.status, "repair-gap");
    assert.deepEqual(report.result, expected);
  }
});
