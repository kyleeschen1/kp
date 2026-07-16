import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpChoreographyLifecyclePromotion,
  validateKpChoreographyLifecycle,
  type KpChoreographyLifecycle
} from "../src/animation/choreography-lifecycle.ts";
import type { KpChoreographyVocabulary } from "../src/animation/choreography-vocabulary.ts";

const vocabulary: KpChoreographyVocabulary = {
  id: "vocabulary.radical",
  continuants: [{
    id: "continuant.x",
    meaning: "x persists.",
    relation: "role-change",
    source: { entityId: "power.x", selectorIds: ["power.x"] },
    target: { entityId: "radical.x", selectorIds: ["radical.x"] },
    identityAuthority: {
      kind: "correspondence",
      transformationId: "transform.root",
      correspondenceRecordId: "record.x"
    }
  }],
  representationalLineages: [{
    id: "lineage.root-notation",
    meaning: "Exponent notation becomes radical notation.",
    sourceRepresentation: { entityId: "power.exponent", selectorIds: ["power.exponent"] },
    targetRepresentation: { entityId: "radical.symbol", selectorIds: ["radical.symbol"] },
    cause: {
      kind: "canonical-operation",
      operationId: "kp.core.rewrite-root",
      bindingId: "binding.root"
    }
  }],
  objectConstancy: [],
  materialContinuity: [],
  motionClassifications: []
};

const lifecycle: KpChoreographyLifecycle = {
  id: "lifecycle.radical",
  records: [
    {
      id: "lifecycle.x",
      kind: "continuant",
      continuantId: "continuant.x",
      sourceEntityIds: ["power.x"],
      targetEntityIds: ["radical.x"],
      summary: "x persists as the radicand."
    },
    {
      id: "lifecycle.notation",
      kind: "successor",
      representationalLineageId: "lineage.root-notation",
      sourceEntityIds: ["power.exponent"],
      targetEntityIds: ["radical.symbol"],
      summary: "Root notation succeeds the exponent representation."
    },
    {
      id: "lifecycle.rule",
      kind: "artifact",
      ownerEntityId: "radical.symbol",
      structuralCauseId: "structure.radical-rule",
      sourceEntityIds: [],
      targetEntityIds: ["radical.rule"],
      summary: "The radical owner realizes its structural rule."
    }
  ]
};

test("lifecycle classification closes continuants, successors, and structural artifacts", () => {
  const input = {
    lifecycle,
    vocabulary,
    sourceEntityIds: ["power.x", "power.exponent"],
    targetEntityIds: ["radical.x", "radical.symbol", "radical.rule"]
  };
  assert.deepEqual(validateKpChoreographyLifecycle(input), []);
  assert.equal(checkKpChoreographyLifecyclePromotion(input).passed, true);
});

test("unexplained generated appearances produce non-promotable typed gaps", () => {
  const gaps = validateKpChoreographyLifecycle({
    lifecycle,
    vocabulary,
    sourceEntityIds: ["power.x", "power.exponent"],
    targetEntityIds: [
      "radical.x",
      "radical.symbol",
      "radical.rule",
      "radical.unexplained"
    ]
  });
  assert.deepEqual(gaps, [{
    kind: "choreography-lifecycle-gap",
    reason: "unclassified-target",
    path: "targetEntityIds[3]",
    entityId: "radical.unexplained",
    message:
      "Visible target entity radical.unexplained has no choreography lifecycle classification.",
    promotable: false,
    repair: "classify-entity"
  }]);
});

test("introductions and eliminations require explicit causal authorities", () => {
  const invalid: KpChoreographyLifecycle = {
    id: "lifecycle.invalid",
    records: [
      {
        id: "introduction.invalid",
        kind: "introduction",
        cause: { kind: "semantic-introduction", authorityId: "" },
        sourceEntityIds: [],
        targetEntityIds: ["target.new"],
        summary: "Introduced."
      },
      {
        id: "elimination.invalid",
        kind: "elimination",
        cause: { kind: "replacement", authorityId: "" },
        sourceEntityIds: ["source.old"],
        targetEntityIds: [],
        summary: "Removed."
      }
    ]
  };
  const gaps = validateKpChoreographyLifecycle({
    lifecycle: invalid,
    vocabulary,
    sourceEntityIds: ["source.old"],
    targetEntityIds: ["target.new"]
  });
  assert.deepEqual(gaps.map((item) => [item.reason, item.path, item.promotable]), [
    ["missing-cause", "records[0].cause.authorityId", false],
    ["missing-cause", "records[1].cause.authorityId", false]
  ]);
});

test("each visible entity receives exactly one lifecycle classification", () => {
  const duplicate: KpChoreographyLifecycle = {
    ...lifecycle,
    records: [
      ...lifecycle.records,
      {
        id: "lifecycle.duplicate-x",
        kind: "annotation",
        annotationId: "annotation.x",
        sourceEntityIds: [],
        targetEntityIds: ["radical.x"],
        summary: "Invalid duplicate ownership."
      }
    ]
  };
  const result = checkKpChoreographyLifecyclePromotion({
    lifecycle: duplicate,
    vocabulary,
    sourceEntityIds: ["power.x", "power.exponent"],
    targetEntityIds: ["radical.x", "radical.symbol", "radical.rule"]
  });
  assert.equal(result.passed, false);
  assert.deepEqual(result.failures, [{
    path: "targetEntityIds[0]",
    message: "Visible target entity radical.x has 2 choreography lifecycle classifications."
  }]);
});

test("lifecycle records cannot classify entities outside the visible states", () => {
  const invalid: KpChoreographyLifecycle = {
    ...lifecycle,
    records: [
      ...lifecycle.records,
      {
        id: "lifecycle.ghost",
        kind: "disclosure",
        disclosureId: "disclosure.ghost",
        sourceEntityIds: [],
        targetEntityIds: ["target.ghost"],
        summary: "A ghost disclosure must not enter promotion."
      }
    ]
  };
  const gaps = validateKpChoreographyLifecycle({
    lifecycle: invalid,
    vocabulary,
    sourceEntityIds: ["power.x", "power.exponent"],
    targetEntityIds: ["radical.x", "radical.symbol", "radical.rule"]
  });
  assert.deepEqual(gaps, [{
    kind: "choreography-lifecycle-gap",
    reason: "invalid-reference",
    path: "records[3].targetEntityIds[0]",
    entityId: "target.ghost",
    message: "Unknown visible target entity target.ghost.",
    promotable: false,
    repair: "repair-reference"
  }]);
});
