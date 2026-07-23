import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpGovernedExponentRadicalPromotionCandidate
} from "../src/authoring/governed-exponent-radical-promotion.ts";

test("governed exponent and radical requests compile from their promoted semantic traces", () => {
  const candidate = createKpGovernedExponentRadicalPromotionCandidate();

  assert.equal(candidate.status, "human-review-required");
  assert.deepEqual(
    candidate.recordedProviderResponses.map((request) => [
      request.operationIntent.operationId,
      request.normalFormIntent.normalFormId
    ]),
    [
      ["kp.algebra.lower-exponent", "lowered-exponent-product"],
      ["kp.algebra.unwrap-unit-exponent", "expanded-product"],
      ["kp.algebra.rewrite-power-as-root", "radical-expression"]
    ]
  );
  assert.deepEqual(
    candidate.compilations.map(({ plan }) =>
      plan.operation.canonicalComposition
    ),
    [
      ["kp.core.persist", "kp.core.fan-out", "kp.core.reorder"],
      ["kp.core.persist", "kp.core.unwrap", "kp.core.eliminate"],
      [
        "kp.core.persist",
        "kp.core.substitute",
        "kp.core.wrap",
        "kp.core.eliminate"
      ]
    ]
  );
  assert.deepEqual(
    candidate.compilations.map(({ plan }) => plan.operation.governance.pacing),
    [
      { kind: "per-descendant", semanticUnitCount: 2 },
      { kind: "single", semanticUnitCount: 1 },
      { kind: "single", semanticUnitCount: 1 }
    ]
  );
});

test("promotion candidate preserves every fixture-authored correspondence relation", () => {
  const candidate = createKpGovernedExponentRadicalPromotionCandidate();

  assert.deepEqual(
    candidate.compilations.map(({ plan }) =>
      plan.operation.correspondence.map(({ relation }) => relation)
    ),
    [
      ["fan-out", "fan-out"],
      ["identity", "identity", "identity", "removal"],
      ["role-change", "removal", "role-change", "role-change"]
    ]
  );
  assert.ok(candidate.compilations.every(({ plan }) =>
    plan.operation.governance.lawIds.length > 0 &&
    plan.provenance.source.evidenceIds.length > 1
  ));
  assert.ok(Object.isFrozen(candidate));
  assert.ok(candidate.compilations.every(({ plan }) => Object.isFrozen(plan)));
});

test("radical is promoted while exponent remains at the explicit human gate", () => {
  const candidate = createKpGovernedExponentRadicalPromotionCandidate();

  assert.deepEqual(candidate.animationPromotion, {
    exponent: {
      maturity: "reviewable",
      novelty: "composition",
      humanReviewRequired: false,
      goldCohort: false
    },
    radical: {
      maturity: "promoted",
      novelty: "composition",
      humanReviewRequired: false,
      goldCohort: true
    }
  });
  assert.equal(
    candidate.review.requestedDecision,
    "approve exponent as a gold symbolic exemplar beside the promoted radical"
  );
  assert.deepEqual(candidate.review.canonicalAnimationIds, [
    "animation.generated.exponent.square-as-product",
    "animation.generated.radical.square-root-as-power"
  ]);
});

test("provider responses contain semantic intent without presentation authority", () => {
  const candidate = createKpGovernedExponentRadicalPromotionCandidate();
  const forbidden = candidate.recordedProviderResponses.flatMap(collectKeys)
    .filter((key) =>
      /^(?:latex|dom|html|svg|css|pixels?|coordinates?|x|y|path|keyframes?|timing|durationMs|easing|typography|renderer|selectorId)$/i.test(key)
    );

  assert.deepEqual(forbidden, []);
  assert.ok(candidate.recordedProviderResponses.every((request) =>
    request.compressionIntent.preserve.includes("law") &&
    request.compressionIntent.preserve.includes("lineage")
  ));
});

function collectKeys(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) => [key, ...collectKeys(child)]);
}
