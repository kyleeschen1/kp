import assert from "node:assert/strict";
import test from "node:test";

// Role proof is downstream of the renderer-neutral teaching-intent authoring.
import {
  isKpVerifiedCancellationPresentationAuthoring,
  validateAndMintKpCancellationPresentationAuthoring,
  type KpCancellationPresentationAuthoringDraft
} from "../src/animation/cancellation-presentation-authoring.ts";

const transformation = {
  id: "transform.cancel",
  correspondenceMap: {
    id: "map.cancel",
    records: [
      {
        id: "inverse-cancel",
        relation: "cancelation" as const,
        sourceSelectorIds: [
          "left.plus",
          "left.four",
          "left.minus",
          "left.negative-four",
          "left.operator"
        ],
        targetSelectorIds: [],
        summary: "Certified inverse material cancels."
      },
      {
        id: "rule-removes",
        relation: "removal" as const,
        sourceSelectorIds: ["left.fraction-rule"],
        targetSelectorIds: [],
        summary: "Structural rule retires."
      },
      {
        id: "x-persists",
        relation: "identity" as const,
        sourceSelectorIds: ["left.x"],
        targetSelectorIds: ["target.x"],
        summary: "x persists."
      },
      {
        id: "equals-persists",
        relation: "identity" as const,
        sourceSelectorIds: ["source.equals"],
        targetSelectorIds: ["target.equals"],
        summary: "equals persists."
      }
    ]
  }
};

function draft(): KpCancellationPresentationAuthoringDraft {
  return {
    schemaVersion: "kp.cancellation-presentation-authoring.v1",
    id: "cancellation.cancel",
    transformationId: transformation.id,
    cancellationRecordId: "inverse-cancel",
    inverseBundles: [
      {
        id: "inverse.positive",
        selectorIds: ["left.plus", "left.four"]
      },
      {
        id: "inverse.negative",
        selectorIds: ["left.minus", "left.negative-four"]
      }
    ],
    catalysts: [{
      id: "catalyst.operator",
      selectorIds: ["left.operator"]
    }],
    artifacts: [{
      id: "artifact.fraction-rule",
      selectorIds: ["left.fraction-rule"]
    }],
    survivors: [
      {
        id: "survivor.x",
        sourceSelectorIds: ["left.x"],
        targetSelectorIds: ["target.x"]
      },
      {
        id: "survivor.equals",
        sourceSelectorIds: ["source.equals"],
        targetSelectorIds: ["target.equals"]
      }
    ]
  };
}

test("verified cancellation authoring is role-complete and nominal", () => {
  const result = validateAndMintKpCancellationPresentationAuthoring({
    transformation,
    draft: draft()
  });

  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;
  assert.equal(result.authoring.inverseBundles.length, 2);
  assert.equal(result.authoring.catalysts.length, 1);
  assert.equal(result.authoring.artifacts.length, 1);
  assert.equal(result.authoring.survivors.length, 2);
  assert.equal(
    isKpVerifiedCancellationPresentationAuthoring(result.authoring),
    true
  );
  assert.equal(Object.isFrozen(result.authoring), true);
});

test("runtime schema rejects wrong cardinality and unknown external fields", () => {
  const oneInverse = {
    ...draft(),
    inverseBundles: [draft().inverseBundles[0]]
  } as unknown as KpCancellationPresentationAuthoringDraft;
  const wrongCardinality = validateAndMintKpCancellationPresentationAuthoring({
    transformation,
    draft: oneInverse
  });
  assert.equal(wrongCardinality.status, "invalid");
  if (wrongCardinality.status === "invalid") {
    assert.ok(wrongCardinality.issues.some(({ code }) =>
      code === "schema.invalid"
    ));
  }

  const external = {
    ...draft(),
    rendererPath: "arc-from-screen-position"
  } as unknown as KpCancellationPresentationAuthoringDraft;
  const unknownField = validateAndMintKpCancellationPresentationAuthoring({
    transformation,
    draft: external
  });
  assert.equal(unknownField.status, "invalid");
  if (unknownField.status === "invalid") {
    assert.ok(unknownField.issues.some(({ code }) =>
      code === "schema.invalid"
    ));
  }
});

test("semantic authority rejects ambiguous, missing, and false survivor roles", () => {
  const ambiguous = draft();
  const result = validateAndMintKpCancellationPresentationAuthoring({
    transformation,
    draft: {
      ...ambiguous,
      catalysts: [{
        id: "catalyst.duplicate",
        selectorIds: ["left.plus"]
      }],
      artifacts: [],
      survivors: [{
        id: "survivor.false",
        sourceSelectorIds: ["left.x"],
        targetSelectorIds: ["target.equals"]
      }]
    }
  });

  assert.equal(result.status, "invalid");
  if (result.status !== "invalid") return;
  assert.ok(result.issues.some(({ code }) => code === "selector.ambiguous"));
  assert.ok(result.issues.some(({ code }) => code === "selector.missing"));
  assert.ok(result.issues.some(({ code }) => code === "role.invalid"));
});

test("serialized verified authoring loses private executable authority", () => {
  const result = validateAndMintKpCancellationPresentationAuthoring({
    transformation,
    draft: draft()
  });
  assert.equal(result.status, "verified");
  if (result.status !== "verified") return;

  const externalClone = JSON.parse(JSON.stringify(result.authoring));
  assert.equal(
    isKpVerifiedCancellationPresentationAuthoring(externalClone),
    false
  );
});
