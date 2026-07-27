import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFoldableDistributionFanOutCertificates
} from "../src/semantic/foldable-distribution-operation-certificates.ts";
import {
  kpDistributionCanonicalOperationSpec
} from "../src/semantic/distribution-canonical-operation.ts";

test("both foldable distribution branches certify exact fan-out lineage", () => {
  const certificates = createKpFoldableDistributionFanOutCertificates();

  assert.deepEqual(
    certificates.map(({ branch }) => branch),
    ["left", "right"]
  );
  certificates.forEach(({ rewrite }) => {
    assert.equal(rewrite.lawId, "kp.algebra.distribute.v1");
    assert.deepEqual(
      rewrite.lineage.map(({ relation }) => relation),
      ["fan-out", "preserve", "preserve"]
    );
    assert.equal(rewrite.lineage[0]?.sourceSubtreeIds.length, 1);
    assert.equal(rewrite.lineage[0]?.targetSubtreeIds.length, 2);
  });
});

test("both fan-outs execute through the promoted distribution operation", () => {
  const certificates = createKpFoldableDistributionFanOutCertificates();

  certificates.forEach(({ execution }) => {
    assert.equal(
      execution.operationSpecId,
      kpDistributionCanonicalOperationSpec.id
    );
    assert.deepEqual(
      execution.correspondenceMap.records.map(({ relation }) => relation),
      ["fan-out", "identity", "identity", "identity", "artifact"]
    );
    assert.deepEqual(
      execution.lineageGraph.edges.map(({ relation }) => relation),
      ["split", "persist", "persist", "persist", "removal"]
    );
    const fanOut = execution.correspondenceMap.records[0]!;
    assert.equal(fanOut.sourceSelectorIds.length, 1);
    assert.equal(fanOut.targetSelectorIds.length, 2);
  });
});

test("distribution certificates retain the canonical copy choreography", () => {
  assert.deepEqual(
    kpDistributionCanonicalOperationSpec.motif.map(
      ({ primitiveId, phaseId }) => [primitiveId, phaseId]
    ),
    [
      ["copy", "contract-source"],
      ["copy", "branch-descendants"],
      ["shift", "transit-descendants"],
      ["copy", "transit-descendants"],
      ["vanish", "arrive-descendants"],
      ["shift", "settle-descendants"]
    ]
  );
  assert.equal(
    kpDistributionCanonicalOperationSpec.motif.some(
      ({ primitiveId }) => primitiveId === "enter" || primitiveId === "exit"
    ),
    false
  );
});
