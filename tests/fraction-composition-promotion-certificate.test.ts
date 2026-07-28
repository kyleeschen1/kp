import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  assertKpCanonicalReaderPromotionCost,
  evaluateKpCanonicalReaderPromotionCost,
  type KpCanonicalReaderPromotionCostEvidence
} from "../src/architecture/canonical-reader-promotion-cost.ts";
import {
  certifyKpFractionCompositionPromotionReadiness,
  kpFractionCompositionPromotionPrerequisiteIds
} from "../src/architecture/fraction-composition-promotion-certificate.ts";
import {
  createKpGovernedCanonicalConstructionRequest,
  createKpGovernedFractionSplitMergeVariation,
  findKpForbiddenPresentationAuthority,
  validateKpGovernedCanonicalConstructionRequest,
  type KpGovernedCanonicalConstructionRequest
} from "../src/authoring/canonical-animation-public-api.ts";

const markdown = await readFile(
  new URL("../content/lessons/fraction-composition.md", import.meta.url),
  "utf8"
);

test("fraction composition readiness closes every automated prerequisite", () => {
  const certificate =
    certifyKpFractionCompositionPromotionReadiness({ markdown });

  assert.equal(
    certificate.schemaVersion,
    "kp.verified-fraction-composition-promotion-readiness.v1"
  );
  assert.equal(certificate.status, "ready-for-human-review");
  assert.equal(certificate.remainingGate, "human-perceptual-review");
  assert.deepEqual(
    certificate.prerequisiteEvidence.map(({ id }) => id),
    kpFractionCompositionPromotionPrerequisiteIds
  );
  assert.ok(certificate.prerequisiteEvidence.every(
    ({ evidenceSourceIds }) => evidenceSourceIds.length > 0
  ));
  assert.equal(
    JSON.stringify(certificate).includes("humanReviewPassed"),
    false
  );
});

test("governed fraction variation carries no math or presentation authority", () => {
  const variation = createKpGovernedFractionSplitMergeVariation();
  const request = variation.request;
  const fractionCompositionRequest: KpGovernedCanonicalConstructionRequest = {
    schemaVersion: "kp.governed-semantic-authoring-request.v2",
    id: "request.fraction-composition.distribution-summary",
    source: {
      kind: "verified-semantic-source",
      sourceId: "asset.fraction-composition-equation",
      revisionId: "1",
      operationPacks: [{ packId: "kp.algebra", version: "1.0.0" }]
    },
    approvedObjectIds: [
      "fraction-solve.state.factored",
      "fraction-solve.state.distributed"
    ],
    approvedOperationIds: ["fraction-solve.step.distribute"],
    explanationPurpose: {
      kind: "cause",
      objectIds: [
        "fraction-solve.state.factored",
        "fraction-solve.state.distributed"
      ],
      operationIds: ["fraction-solve.step.distribute"]
    },
    detailLevel: "summary",
    compositionIntent: {
      kind: "sequence",
      operationIds: ["fraction-solve.step.distribute"]
    }
  };
  const governedFractionComposition =
    createKpGovernedCanonicalConstructionRequest(
      fractionCompositionRequest
    );

  assert.equal(
    variation.compilation.kind,
    "verified-governed-canonical-construction"
  );
  assert.deepEqual(findKpForbiddenPresentationAuthority(request), []);
  assert.deepEqual(
    Object.keys(request).sort(),
    [
      "approvedObjectIds",
      "approvedOperationIds",
      "compositionIntent",
      "detailLevel",
      "explanationPurpose",
      "id",
      "schemaVersion",
      "source"
    ]
  );
  assert.deepEqual(
    Object.keys(request.source).sort(),
    ["kind", "operationPacks", "revisionId", "sourceId"]
  );
  assert.deepEqual(
    findKpForbiddenPresentationAuthority(governedFractionComposition),
    []
  );

  const adversarialIssues = validateKpGovernedCanonicalConstructionRequest({
    ...fractionCompositionRequest,
    targetLatex: "x=9",
    timingTable: [0, 1],
    domFragment: "<span>x</span>",
    geometryPlan: { x: 12 }
  });
  assert.deepEqual(
    [...new Set(
      adversarialIssues
        .filter(({ code }) => code === "governed-schema.unsafe-authority")
        .map(({ message }) =>
          message.match(/Provider-authored .* is outside/)?.[0]
        )
    )].sort(),
    [
      "Provider-authored domFragment is outside",
      "Provider-authored geometryPlan is outside",
      "Provider-authored targetLatex is outside",
      "Provider-authored timingTable is outside",
      "Provider-authored x is outside"
    ]
  );
});

test("fraction promotion proof passes the bounded post-kit diff ratchet", () => {
  const evidence: KpCanonicalReaderPromotionCostEvidence = {
    schemaVersion: "kp.canonical-reader-promotion-cost.v1",
    promotionId: "promotion.fraction-composition.readiness",
    changedFiles: [
      "src/architecture/fraction-composition-promotion-certificate.ts",
      "tests/fraction-composition-promotion-certificate.test.ts",
      "tests/type-fixtures/fraction-composition-promotion-certificate.ts",
      "package.json",
      "docs/project/reviews/2026-07-27-canonical-fraction-composition-promotion-long-loop-proposal.md",
      "docs/theseus/events/2026-07-27.jsonl",
      "docs/theseus/nodes/run-contracts/run-contract.kp.canonical-fraction-composition-promotion-v1.json"
    ],
    addedLifecycleCategories: [],
    addedSchedulerCategories: [],
    notationSpecificGeometryFiles: [],
    addedRuntimeArtifactIds: []
  };

  assert.deepEqual(evaluateKpCanonicalReaderPromotionCost(evidence), []);
  assert.doesNotThrow(() => assertKpCanonicalReaderPromotionCost(evidence));
});
