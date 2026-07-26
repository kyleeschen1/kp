import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCanonicalAnimationConstruction,
  validateKpCanonicalAnimationConstruction,
  type KpCanonicalAnimationConstructionInput
} from "../src/authoring/canonical-animation-construction.ts";

test("creates one immutable renderer-neutral split and merge construction", () => {
  const artifact = createKpCanonicalAnimationConstruction(fractionInput());

  assert.equal(artifact.kind, "canonical-animation-construction");
  assert.equal(artifact.schemaVersion, "kp.canonical-animation-construction.v1");
  assert.deepEqual(
    artifact.composition.operationStepIds,
    ["step.split", "step.merge"]
  );
  assert.deepEqual(
    artifact.operations.flatMap(({ lineage }) =>
      lineage.map(({ relation }) => relation)
    ),
    ["identity", "fan-out", "identity", "fan-in"]
  );
  assert.deepEqual(
    structuredClone(artifact),
    JSON.parse(JSON.stringify(artifact))
  );
  assert.equal(Object.isFrozen(artifact), true);
  assert.equal(Object.isFrozen(artifact.operations[0]!.lineage), true);
  assert.equal(Object.isFrozen(artifact.checkpoints[0]!.objectIds), true);
});

test("rejects object, entity, and operation references outside verified closure", () => {
  const input = fractionInput();
  const issues = validateKpCanonicalAnimationConstruction({
    ...input,
    operations: [{
      ...input.operations[0]!,
      sourceObjectIds: ["object.unknown"],
      roleBindings: { numerator: ["entity.unknown"] },
      lineage: [{
        ...input.operations[0]!.lineage[0]!,
        targetEntityIds: ["entity.unknown"]
      }]
    }]
  });

  assert.ok(issues.filter(({ code }) => code === "construction.reference").length >= 3);
});

test("requires composition to cover every operation exactly once", () => {
  const input = fractionInput();
  const issues = validateKpCanonicalAnimationConstruction({
    ...input,
    composition: {
      ...input.composition,
      operationStepIds: ["step.split", "step.split"]
    }
  });

  assert.ok(issues.some(({ code }) => code === "construction.duplicate"));
  assert.ok(issues.some(({ code, message }) =>
    code === "construction.totality" && message.includes("step.merge")
  ));
});

test("reuses canonical correspondence arity instead of inventing lineage rules", () => {
  const input = fractionInput();
  const issues = validateKpCanonicalAnimationConstruction({
    ...input,
    operations: [{
      ...input.operations[0]!,
      lineage: [{
        ...input.operations[0]!.lineage[1]!,
        relation: "identity"
      }]
    }]
  });
  assert.ok(issues.some(({ code, message }) =>
    code === "construction.totality" &&
    message.includes("requires endpoint shape one-to-one")
  ));
});

test("requires source and target checkpoints without prescribing rendering", () => {
  const input = fractionInput();
  const issues = validateKpCanonicalAnimationConstruction({
    ...input,
    checkpoints: input.checkpoints.filter(({ kind }) => kind !== "target")
  });
  assert.ok(issues.some(({ message }) =>
    message === "Construction requires a target checkpoint."
  ));

  const keys = collectKeys(
    createKpCanonicalAnimationConstruction(input)
  );
  for (const forbidden of [
    "css",
    "dom",
    "durationMs",
    "font",
    "geometry",
    "html",
    "keyframes",
    "latex",
    "paint",
    "renderer",
    "timing"
  ]) {
    assert.equal(keys.includes(forbidden), false, forbidden);
  }
});

function fractionInput(): KpCanonicalAnimationConstructionInput {
  const combined = "equation.numerator-split-merge.combined";
  const split = "equation.numerator-split-merge.split";
  return {
    id: "construction.numerator-split-merge",
    title: "Split and merge a fraction",
    semanticSource: {
      sourceId: "asset.numerator-split-merge-equation",
      revisionId: "1",
      operationPacks: [{ packId: "kp.algebra", version: "1.0.0" }]
    },
    objects: [
      {
        objectId: combined,
        entityIds: [
          `${combined}.fraction.numerator.x`,
          `${combined}.fraction.denominator.2`
        ],
        expressionIds: [combined]
      },
      {
        objectId: split,
        entityIds: [
          `${split}.left.fraction.numerator.x`,
          `${split}.left.fraction.denominator.2`,
          `${split}.right.fraction.denominator.2`
        ],
        expressionIds: [split]
      }
    ],
    operations: [
      {
        stepId: "step.split",
        transformationId: "transform.numerator-split-merge.split-sum",
        definitionId: "definition.symbolic.algebra.split-fraction-sum",
        sourceObjectIds: [combined],
        targetObjectIds: [split],
        roleBindings: {
          numerator: [`${combined}.fraction.numerator.x`],
          denominators: [
            `${split}.left.fraction.denominator.2`,
            `${split}.right.fraction.denominator.2`
          ]
        },
        lineage: [
          {
            id: "lineage.x.split",
            relation: "identity",
            sourceEntityIds: [`${combined}.fraction.numerator.x`],
            targetEntityIds: [`${split}.left.fraction.numerator.x`]
          },
          {
            id: "lineage.denominator.split",
            relation: "fan-out",
            sourceEntityIds: [`${combined}.fraction.denominator.2`],
            targetEntityIds: [
              `${split}.left.fraction.denominator.2`,
              `${split}.right.fraction.denominator.2`
            ]
          }
        ]
      },
      {
        stepId: "step.merge",
        transformationId: "transform.numerator-split-merge.merge-sum",
        definitionId: "definition.symbolic.algebra.merge-fractions",
        sourceObjectIds: [split],
        targetObjectIds: [combined],
        roleBindings: {
          numerator: [`${split}.left.fraction.numerator.x`],
          denominators: [
            `${split}.left.fraction.denominator.2`,
            `${split}.right.fraction.denominator.2`
          ]
        },
        lineage: [
          {
            id: "lineage.x.merge",
            relation: "identity",
            sourceEntityIds: [`${split}.left.fraction.numerator.x`],
            targetEntityIds: [`${combined}.fraction.numerator.x`]
          },
          {
            id: "lineage.denominator.merge",
            relation: "fan-in",
            sourceEntityIds: [
              `${split}.left.fraction.denominator.2`,
              `${split}.right.fraction.denominator.2`
            ],
            targetEntityIds: [`${combined}.fraction.denominator.2`]
          }
        ]
      }
    ],
    explanationIntents: [
      {
        id: "intent.shared-denominator",
        kind: "transmit",
        operationStepIds: ["step.split", "step.merge"],
        entityIds: [
          `${combined}.fraction.denominator.2`,
          `${split}.left.fraction.denominator.2`,
          `${split}.right.fraction.denominator.2`
        ],
        detail: "complete"
      }
    ],
    composition: {
      id: "composition.numerator-split-merge",
      kind: "sequence",
      operationStepIds: ["step.split", "step.merge"]
    },
    checkpoints: [
      {
        id: "checkpoint.combined.source",
        kind: "source",
        afterOperationStepIds: [],
        objectIds: [combined],
        focusEntityIds: [`${combined}.fraction.denominator.2`]
      },
      {
        id: "checkpoint.split",
        kind: "operation",
        afterOperationStepIds: ["step.split"],
        objectIds: [split],
        focusEntityIds: [
          `${split}.left.fraction.denominator.2`,
          `${split}.right.fraction.denominator.2`
        ]
      },
      {
        id: "checkpoint.combined.target",
        kind: "target",
        afterOperationStepIds: ["step.split", "step.merge"],
        objectIds: [combined],
        focusEntityIds: [`${combined}.fraction.denominator.2`]
      }
    ]
  };
}

function collectKeys(value: unknown): readonly string[] {
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) => [
    key,
    ...collectKeys(child)
  ]);
}
