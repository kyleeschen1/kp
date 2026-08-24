import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import generatedPacket from
  "../src/architecture/cross-domain-gallery-conformance-packet.generated.json" with {
    type: "json"
  };
import { createKpCrossDomainGalleryConformancePacket } from
  "../scripts/cross-domain-gallery-conformance-packet.ts";

test("the checked-in packet matches current routed requests byte-for-byte", () => {
  const current = createKpCrossDomainGalleryConformancePacket();
  assert.deepEqual(generatedPacket, current);
  assert.deepEqual(current.domains, ["equation", "code"]);
  assert.deepEqual(current.dispositionCounts, {
    "compiled-artifact": 0,
    "existing-artifact": 2,
    "semantic-plan-only": 0,
    "repair-required": 0
  });
});

test("every executable seed names present authority and lifecycle sources", async () => {
  const packet = createKpCrossDomainGalleryConformancePacket();
  for (const entry of packet.cases) {
    const result = entry.expectedResult;
    assert.equal(result.status, "existing-artifact");
    if (result.status !== "existing-artifact") continue;
    assert.equal(result.explanationClaimRefs.length > 0, true);
    assert.equal(result.evidenceRefs.length > 0, true);
    for (const path of [
      result.frontendAuthority.sourcePath,
      result.semanticTrace.authoritySourcePath,
      result.artifact.artifactSourcePath,
      result.artifact.hostSourcePath,
      result.artifact.rendererSourcePath,
      result.artifact.directUrlSourcePath
    ]) assert.ok((await readFile(path, "utf8")).length > 0, path);
  }
});

test("the packet remains a projection rather than a copied domain IR", () => {
  const packet = JSON.stringify(generatedPacket);
  assert.doesNotMatch(packet,
    /(?:keyframes|coordinates|motionPath|computedStyle|webglContext)/iu);
  assert.equal(generatedPacket.cases.every(({ expectedResult }) =>
    "semanticPlan" in expectedResult === false
  ), true);
});
