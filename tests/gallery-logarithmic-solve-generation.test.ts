import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { routeKpCrossDomainGalleryGeneration } from
  "../scripts/cross-domain-gallery-generation-router.ts";
import {
  kpGalleryLogarithmicSolveExplanationClaims,
  kpGalleryLogarithmicSolveFrontend,
  kpGalleryLogarithmicSolveRequest
} from "../scripts/gallery-logarithmic-solve-frontend.ts";
import { createKpLogExponentAnimationAsset } from
  "../src/animation/log-exponent-adapter.ts";
import { validateKpAnimationGenerationCapabilityPins } from
  "../src/architecture/animation-generation-request-capability.ts";
import { validateKpAnimationGenerationRequest } from
  "../src/domain-ir/animation-generation-request.ts";
import { kpCanonicalLogExponentDomainContract } from
  "../src/semantic/log-exponent-domain-assumptions.ts";
import { kpCanonicalLogExponentAuthoredProgram } from
  "../src/semantic/log-exponent-authored-operations.ts";
import { kpCanonicalLogExponentTransformationTree } from
  "../src/semantic/log-exponent-transformation-tree.ts";

test("the canonical logarithmic solve uses the shared envelope and exact pins", () => {
  const envelope = validateKpAnimationGenerationRequest(
    kpGalleryLogarithmicSolveRequest
  );
  assert.equal(envelope.status, "accepted");
  if (envelope.status !== "accepted") return;
  assert.deepEqual(validateKpAnimationGenerationCapabilityPins(
    envelope.request
  ), []);
  assert.deepEqual(envelope.request.capabilityPins,
    kpGalleryLogarithmicSolveFrontend.capabilityPins);
});

test("the exact route reuses the canonical asset host renderer and clock", async () => {
  const result = routeKpCrossDomainGalleryGeneration(
    kpGalleryLogarithmicSolveRequest,
    [kpGalleryLogarithmicSolveFrontend]
  );
  assert.equal(result.status, "existing-artifact");
  if (result.status !== "existing-artifact") return;

  const asset = createKpLogExponentAnimationAsset();
  assert.equal(result.artifact.artifactId, asset.id);
  assert.equal(result.artifact.timelineId, asset.timeline?.id);
  assert.equal(result.artifact.hostId, "editor-animation-player");
  assert.equal(result.artifact.rendererId,
    "editor-animation-surface.log-exponent.canonical-native-katex");
  assert.equal(result.semanticTrace.id,
    kpCanonicalLogExponentTransformationTree.id);
  assert.match(result.artifact.directUrl,
    /animation\.algebra\.log-exponent\.solve-two-power-x/u);
  for (const sourcePath of [
    result.frontendAuthority.sourcePath,
    result.semanticTrace.authoritySourcePath,
    result.artifact.artifactSourcePath,
    result.artifact.hostSourcePath,
    result.artifact.rendererSourcePath,
    result.artifact.directUrlSourcePath
  ]) assert.ok((await readFile(sourcePath, "utf8")).length > 0, sourcePath);
});

test("explanation claims are grounded in authored operations laws and assumptions", () => {
  const authorities = new Set([
    ...kpCanonicalLogExponentAuthoredProgram.operations.flatMap((operation) => [
      operation.id,
      ...operation.assumptionIds,
      ...(operation.kind === "extract-log-power-exponent" ||
          operation.kind === "divide-both-sides-by-log-base"
        ? [operation.lawId]
        : [])
    ]),
    ...kpCanonicalLogExponentDomainContract.assumptions.map(({ id }) => id)
  ]);
  assert.equal(kpGalleryLogarithmicSolveExplanationClaims.every((claim) =>
    claim.authorityIds.every((id) => authorities.has(id))
  ), true);
});

test("nearby equations remain typed gaps rather than borrowing choreography", () => {
  const variant = JSON.parse(JSON.stringify(kpGalleryLogarithmicSolveRequest));
  variant.source.input.states[0].latex = "3^x=7";
  const result = routeKpCrossDomainGalleryGeneration(variant, [
    kpGalleryLogarithmicSolveFrontend
  ]);

  assert.equal(result.status, "repair-required");
  assert.equal(result.diagnostics[0].code,
    "gallery-generation.equation.exact-exemplar-required");
  assert.equal(result.semanticTrace, undefined);
});
