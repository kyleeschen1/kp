import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpTwoTimesOneCarrierEvidenceCandidate,
  createKpTwoTimesOneCarrierExemplar,
  kpTwoTimesOneCarrierSelectorIds
} from "../src/semantic/carrier-preserving-simplification-exemplar.ts";
import {
  verifyKpCarrierPreservingSimplificationEvidence,
  isKpVerifiedCarrierPreservingSimplificationEvidence
} from "../src/semantic/carrier-preserving-simplification-evidence.ts";

test("two times one closes a semantic-only carrier evidence contract", () => {
  const exemplar = createKpTwoTimesOneCarrierExemplar();
  const candidate = createKpTwoTimesOneCarrierEvidenceCandidate();
  const result = verifyKpCarrierPreservingSimplificationEvidence({
    candidate,
    bundle: exemplar.bundle,
    transformation: exemplar.transformation
  });

  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;
  assert.equal(
    isKpVerifiedCarrierPreservingSimplificationEvidence(result.evidence),
    true
  );
  assert.equal(
    isKpVerifiedCarrierPreservingSimplificationEvidence({
      ...result.evidence
    }),
    false
  );
  assert.deepEqual(Object.keys(result.evidence), [
    "schemaVersion",
    "id",
    "transformationId",
    "endpoints",
    "carrier",
    "identityLawWitness",
    "removedSyntaxCohort",
    "stationaryContext"
  ]);
  assert.equal(
    /geometry|timing|opacity|renderer|node/i.test(JSON.stringify(result.evidence)),
    false
  );
});

test("carrier evidence fails closed without a strict identity law", () => {
  const exemplar = createKpTwoTimesOneCarrierExemplar();
  const result = verifyKpCarrierPreservingSimplificationEvidence({
    candidate: createKpTwoTimesOneCarrierEvidenceCandidate(),
    bundle: exemplar.bundle,
    transformation: {
      ...exemplar.transformation,
      lawRefs: exemplar.transformation.lawRefs?.map((law) => ({
        ...law,
        level: "sampled" as const
      }))
    }
  });

  assert.equal(result.status, "invalid-evidence");
  if (result.status !== "invalid-evidence") return;
  assert.equal(
    result.issues.some(({ path }) => path === "identityLawWitness.lawId"),
    true
  );
});

test("carrier evidence rejects incomplete or overlapping removal cohorts", () => {
  const exemplar = createKpTwoTimesOneCarrierExemplar();
  const candidate = createKpTwoTimesOneCarrierEvidenceCandidate();
  const result = verifyKpCarrierPreservingSimplificationEvidence({
    candidate: {
      ...candidate,
      removedSyntaxCohort: {
        ...candidate.removedSyntaxCohort,
        selectorIds: [
          kpTwoTimesOneCarrierSelectorIds.sourceCarrier,
          kpTwoTimesOneCarrierSelectorIds.sourceIdentityWitness
        ]
      }
    },
    bundle: exemplar.bundle,
    transformation: exemplar.transformation
  });

  assert.equal(result.status, "invalid-evidence");
  if (result.status !== "invalid-evidence") return;
  assert.equal(
    result.issues.some(({ path }) => path === "removedSyntaxCohort"),
    true
  );
  assert.equal(
    result.issues.some(({ message }) => message.includes("persistent carrier")),
    true
  );
});

test("extra identity lineage cannot become an implicit second carrier", () => {
  const exemplar = createKpTwoTimesOneCarrierExemplar();
  const map = exemplar.transformation.correspondenceMap;
  assert.ok(map);
  const forgedRecord = {
    id: `${map.id}.forged-second-carrier`,
    relation: "identity" as const,
    sourceSelectorIds: [
      kpTwoTimesOneCarrierSelectorIds.sourceIdentityWitness
    ],
    targetSelectorIds: [kpTwoTimesOneCarrierSelectorIds.targetCarrier],
    summary: "Invalid second carrier inferred from a repeated glyph."
  };
  const result = verifyKpCarrierPreservingSimplificationEvidence({
    candidate: createKpTwoTimesOneCarrierEvidenceCandidate(),
    bundle: exemplar.bundle,
    transformation: {
      ...exemplar.transformation,
      correspondenceMap: { ...map, records: [...map.records, forgedRecord] }
    }
  });

  assert.equal(result.status, "invalid-evidence");
  if (result.status !== "invalid-evidence") return;
  assert.equal(
    result.issues.some(({ path }) => path === "lifecycle"),
    true
  );
});
