import assert from "node:assert/strict";
import test from "node:test";
import { buildKpAuthoredDistributionPreview } from "../src/experiments/authoring-structural/distribution-preview-build.ts";
import { restoreKpReaderAuthoringDistributionPreview } from "../src/reader/app/authoring-distribution-preview.ts";
import { createKpDistributionInspection } from "../src/experiments/authoring-distribution-focus-card/inspection-bridge.ts";

test("host bridge keeps exact prepared revisions and rejects altered preview inputs upstream", () => {
  const prepared = buildKpAuthoredDistributionPreview();
  const restored = restoreKpReaderAuthoringDistributionPreview(prepared);
  const lease = createKpDistributionInspection(restored), evidence = lease.capture().evidence;
  assert.equal(evidence.sourceRevision, prepared.beforeVersionId);
  assert.equal(evidence.targetRevision, prepared.afterVersionId);
  assert.equal(evidence.definitionId, "definition.generated.distribution.distribute-multiplication");
  assert.throws(() => restoreKpReaderAuthoringDistributionPreview({ ...prepared,
    animation: { ...prepared.animation, transformations: prepared.animation.transformations.slice(1) }
  }), /differs from/);
});
