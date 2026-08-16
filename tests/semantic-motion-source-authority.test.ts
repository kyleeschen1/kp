import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpSemanticMotionSourceAuthority
} from "../src/domain-ir/public-api.ts";
import {
  kpCanonicalCancellationPressureContract
} from "../src/semantic/cancellation-pressure-contract.ts";
import {
  kpCanonicalCancellationPressureSemanticMotionSource
} from "../src/semantic/cancellation-pressure-semantic-motion.ts";
import {
  kpCanonicalDistributionPressureSemanticMotionSource
} from "../src/semantic/distribution-pressure-semantic-motion.ts";
import {
  kpCanonicalLogQuotientSemanticMotionSource
} from "../src/semantic/log-quotient-semantic-motion.ts";

test("three real callers derive target provenance without glyph inference", () => {
  const distribution = kpCanonicalDistributionPressureSemanticMotionSource;
  const distributionFactor = distribution.entities.find(
    ({ id }) => id.endsWith(".expanded.left-factor")
  );
  const distributionConnector = distribution.entities.find(
    ({ id }) => id.endsWith(".expanded.plus")
  );
  assert.equal(distributionFactor?.provenance.kind, "derived");
  assert.equal(distributionConnector?.provenance.kind, "identity-successor");

  const quotient = kpCanonicalLogQuotientSemanticMotionSource;
  const quotientX = quotient.entities.find(({ id }) => id === "target.numerator.x");
  const fusedLog = quotient.entities.find(({ id }) => id === "target.log");
  assert.equal(quotientX?.provenance.kind, "identity-successor");
  assert.equal(fusedLog?.provenance.kind, "derived");

  const cancellation = kpCanonicalCancellationPressureSemanticMotionSource;
  const rightInverse = kpCanonicalCancellationPressureContract.continuants.find(
    ({ role }) => role === "right-inverse"
  );
  const survivingRightInverse = cancellation.entities.find(
    ({ id }) => id === rightInverse?.targetSelectorId
  );
  const retiredLeftInverse = cancellation.entities.find(
    ({ id }) => id ===
      kpCanonicalCancellationPressureContract.inversePair.sourceSelectorIds[1]
  );
  assert.equal(
    survivingRightInverse?.provenance.kind,
    "identity-successor"
  );
  assert.equal(retiredLeftInverse?.provenance.kind, "authored");
});

test("source authority fails closed without authored target identity", () => {
  assert.throws(() => createKpSemanticMotionSourceAuthority({
    sourceId: "source.test",
    revisionId: "revision.test",
    transformationId: "transform.test",
    assetIds: ["animation.test"],
    sourceState: { id: "state.source", objectIds: ["object.source"], entityIds: ["source.a"] },
    targetState: { id: "state.target", objectIds: ["object.target"], entityIds: ["target.a"] },
    correspondenceMap: {
      id: "correspondence.test",
      records: [{
        id: "record.test",
        relation: "fan-out",
        sourceSelectorIds: ["source.a"],
        targetSelectorIds: ["target.a"],
        summary: "derive a target"
      }]
    },
    semanticIdentityIdByEntityId: { "source.a": "identity.a" }
  }), /requires authored identity/);
});
