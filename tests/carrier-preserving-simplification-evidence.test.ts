import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpTwoTimesOneCarrierExemplar,
  kpTwoTimesOneCarrierSelectorIds
} from "../src/semantic/carrier-preserving-simplification-exemplar.ts";
import {
  verifyKpCarrierPreservingSimplificationEvidence,
  type KpCarrierPreservingSimplificationEvidenceCandidate
} from "../src/semantic/carrier-preserving-simplification-evidence.ts";

test("two times one closes a semantic-only carrier evidence contract", () => {
  const exemplar = createKpTwoTimesOneCarrierExemplar();
  const candidate = twoTimesOneCandidate(exemplar.transformation.id);
  const result = verifyKpCarrierPreservingSimplificationEvidence({
    candidate,
    bundle: exemplar.bundle,
    transformation: exemplar.transformation
  });

  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;
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
    candidate: twoTimesOneCandidate(exemplar.transformation.id),
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
  const candidate = twoTimesOneCandidate(exemplar.transformation.id);
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
    candidate: twoTimesOneCandidate(exemplar.transformation.id),
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

function twoTimesOneCandidate(
  transformationId: string
): KpCarrierPreservingSimplificationEvidenceCandidate {
  const recordBase =
    "transform.operation-evaluation.two-times-one-carrier.simplify-identity";
  return {
    schemaVersion: "kp.carrier-preserving-simplification-evidence.v1",
    id: "kp.carrier-evidence.two-times-one.v1",
    transformationId,
    endpoints: {
      sourceObjectId:
        "expression.operation-evaluation.two-times-one-carrier.source",
      targetObjectId:
        "expression.operation-evaluation.two-times-one-carrier.target"
    },
    carrier: {
      correspondenceRecordId: `${recordBase}.carrier-persists`,
      sourceSelectorId: kpTwoTimesOneCarrierSelectorIds.sourceCarrier,
      targetSelectorId: kpTwoTimesOneCarrierSelectorIds.targetCarrier
    },
    identityLawWitness: {
      lawId: "law.arithmetic.multiplicative-identity",
      sourceSelectorId:
        kpTwoTimesOneCarrierSelectorIds.sourceIdentityWitness,
      removalRecordId: `${recordBase}.identity-witness-removed`
    },
    removedSyntaxCohort: {
      selectorIds: [
        kpTwoTimesOneCarrierSelectorIds.sourceOperator,
        kpTwoTimesOneCarrierSelectorIds.sourceIdentityWitness
      ],
      correspondenceRecordIds: [
        `${recordBase}.operator-removed`,
        `${recordBase}.identity-witness-removed`
      ]
    },
    stationaryContext: []
  };
}
