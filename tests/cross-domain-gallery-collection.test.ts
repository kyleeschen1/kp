import assert from "node:assert/strict";
import test from "node:test";

import packet from
  "../src/architecture/cross-domain-gallery-conformance-packet.generated.json" with {
    type: "json"
  };
import {
  findKpCrossDomainGalleryExecutableCase,
  KP_CROSS_DOMAIN_GALLERY_COLLECTION
} from "../src/editor/cross-domain-gallery-collection.ts";
import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";

test("the curated collection is exactly the five-case conformance packet", () => {
  assert.equal(KP_CROSS_DOMAIN_GALLERY_COLLECTION.cases.length, 5);
  assert.deepEqual(
    KP_CROSS_DOMAIN_GALLERY_COLLECTION.cases.map(({ caseId }) => caseId),
    packet.cases.map(({ id }) => id)
  );
  assert.equal(Object.isFrozen(KP_CROSS_DOMAIN_GALLERY_COLLECTION), true);
});

test("executable collection cases bind to packet artifacts and Catalogue URLs", () => {
  const catalogueIds = new Set(
    createKpAnimationCatalogueProjection().entries.map(({ animationId }) =>
      animationId
    )
  );
  const executable = KP_CROSS_DOMAIN_GALLERY_COLLECTION.cases.filter(
    (entry) => entry.status === "executable"
  );
  assert.equal(executable.length, 4);

  for (const entry of executable) {
    const conformance = packet.cases.find(({ id }) => id === entry.caseId);
    assert.ok(conformance);
    assert.ok(
      conformance.expectedResult.status === "compiled-artifact" ||
      conformance.expectedResult.status === "existing-artifact"
    );
    if (!("artifact" in conformance.expectedResult) ||
      conformance.expectedResult.artifact === undefined) continue;
    assert.equal(
      entry.animationId,
      conformance.expectedResult.artifact.artifactId
    );
    assert.equal(
      entry.frontendId,
      conformance.expectedResult.frontendAuthority.frontendId
    );
    assert.deepEqual(
      entry.authorityClaimRefs,
      conformance.expectedResult.explanationClaimRefs
    );
    assert.equal(catalogueIds.has(entry.animationId), true);
    assert.equal(
      new URL(entry.href, "https://kp.test").searchParams.get("artifact"),
      entry.animationId
    );
    assert.equal(
      findKpCrossDomainGalleryExecutableCase(entry.animationId),
      entry
    );
  }
});

test("the visible gap binds to the packet diagnostic without an artifact", () => {
  const gap = KP_CROSS_DOMAIN_GALLERY_COLLECTION.cases.find(
    (entry) => entry.status === "repair-required"
  );
  assert.ok(gap);
  const conformance = packet.cases.find(({ id }) => id === gap.caseId);
  assert.ok(conformance);
  assert.equal(conformance.expectedResult.status, "repair-required");
  assert.equal(conformance.expectedResult.diagnostics.some(({ code }) =>
    code === gap.diagnosticCode
  ), true);
  assert.equal("animationId" in gap, false);
  assert.equal("href" in gap, false);
});
