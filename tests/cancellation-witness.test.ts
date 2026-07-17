import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveKpCancellationWitness,
  kpCancellationWitnessDescriptors,
  validateKpCancellationWitness
} from "../src/semantic/cancellation-witness.ts";
import { createLinearSolveKpAssetBundle } from "../src/semantic/linear-solve-asset.ts";
import { kpCanonicalOperationRegistry } from "../src/semantic/canonical-operation-registry.ts";

test("additive cancellation derives zero in the canceled algebraic slot", () => {
  const asset = createLinearSolveKpAssetBundle();
  const transformation = asset.transformations.find((candidate) =>
    candidate.transformType === "cancelAdditiveInverses"
  )!;
  const witness = deriveKpCancellationWitness({
    operationId: "kp.algebra.cancel-additive-inverses",
    transformation,
    bundle: asset.bundle,
    cancellationRecordId: "left-inverses-cancel",
    slotId: "slot.linear-solve.left-additive-inverses",
    survivorAnchorSelectorIds: [
      "equation.linear-solve.after-subtract.lhs.x",
      "equation.linear-solve.after-subtract.equals"
    ]
  });

  assert.equal(witness.semanticValue.integer, 0);
  assert.equal(witness.semanticValue.latex, "0");
  assert.equal(witness.identityKind, "additive");
  assert.equal(witness.slot.ownerObjectId, "equation.linear-solve.after-subtract");
  assert.equal(witness.slot.placement, "cancelled-source-span");
  assert.deepEqual(witness.slot.sourceSelectorIds, [
    "equation.linear-solve.after-subtract.lhs.plus3",
    "equation.linear-solve.after-subtract.lhs.minus3"
  ]);
  assert.deepEqual(witness.presentation.requiredOrdering, [
    "after-contact",
    "before-survivor-compaction"
  ]);
});

test("multiplicative cancellation derives one from its operation contract", () => {
  const fixture = multiplicativeFixture();
  const witness = deriveKpCancellationWitness({
    operationId: "kp.algebra.cancel-multiplicative-inverses",
    transformation: fixture.transformation,
    bundle: fixture.bundle,
    cancellationRecordId: "factors-cancel",
    slotId: "slot.product.inverse-factors",
    survivorAnchorSelectorIds: ["equation.product.x"]
  });
  assert.equal(witness.descriptorId, "witness.multiplicative-identity.one");
  assert.equal(witness.semanticValue.integer, 1);
  assert.equal(witness.semanticValue.latex, "1");
  assert.equal(witness.identityKind, "multiplicative");
});

test("canonical cancellation operations resolve every witness descriptor", () => {
  const descriptorIds = new Set(
    kpCancellationWitnessDescriptors.map((descriptor) => descriptor.id)
  );
  const cancellationEntries = kpCanonicalOperationRegistry.entries.filter(
    (entry) => entry.id.includes("cancel-")
  );
  assert.ok(cancellationEntries.length > 0);
  cancellationEntries.forEach((entry) => {
    entry.contract.witnessIds.forEach((id) => assert.ok(descriptorIds.has(
      id as typeof kpCancellationWitnessDescriptors[number]["id"]
    )));
  });
});

test("witness validation rejects invented values and partial source slots", () => {
  const asset = createLinearSolveKpAssetBundle();
  const transformation = asset.transformations.find((candidate) =>
    candidate.transformType === "cancelAdditiveInverses"
  )!;
  const witness = deriveKpCancellationWitness({
    operationId: "kp.algebra.cancel-additive-inverses",
    transformation,
    bundle: asset.bundle,
    cancellationRecordId: "left-inverses-cancel",
    slotId: "slot.linear",
    survivorAnchorSelectorIds: ["equation.linear-solve.after-subtract.lhs.x"]
  });
  const selectorOwners = Object.fromEntries(asset.bundle.objects.flatMap((object) =>
    object.selectors.map((selector) => [selector.id, object.id] as const)
  ));
  const issues = validateKpCancellationWitness({
    witness: {
      ...witness,
      semanticValue: { ...witness.semanticValue, integer: 1, latex: "1" },
      slot: {
        ...witness.slot,
        sourceSelectorIds: [witness.slot.sourceSelectorIds[0]!]
      }
    },
    declaredWitnessIds: ["witness.additive-identity.zero"],
    cancellationSourceSelectorIds: witness.slot.sourceSelectorIds,
    selectorOwners
  });
  assert.deepEqual(issues.map((issue) => issue.code), [
    "invented-value",
    "slot-source-mismatch"
  ]);
});

test("witness derivation rejects wrong operations, records, and slot owners", () => {
  const asset = createLinearSolveKpAssetBundle();
  const transformation = asset.transformations.find((candidate) =>
    candidate.transformType === "cancelAdditiveInverses"
  )!;
  assert.throws(() => deriveKpCancellationWitness({
    operationId: "kp.algebra.cancel-multiplicative-inverses",
    transformation,
    bundle: asset.bundle,
    cancellationRecordId: "left-inverses-cancel",
    slotId: "slot.wrong",
    survivorAnchorSelectorIds: []
  }), /does not authorize transform/);
  assert.throws(() => deriveKpCancellationWitness({
    operationId: "kp.algebra.cancel-additive-inverses",
    transformation,
    bundle: asset.bundle,
    cancellationRecordId: "x-persists",
    slotId: "slot.wrong",
    survivorAnchorSelectorIds: []
  }), /requires cancelation record/);
  assert.throws(() => deriveKpCancellationWitness({
    operationId: "kp.algebra.cancel-additive-inverses",
    transformation,
    bundle: asset.bundle,
    cancellationRecordId: "left-inverses-cancel",
    slotId: "slot.wrong",
    survivorAnchorSelectorIds: ["equation.linear-solve.left-simplified.lhs.x"]
  }), /is not owned by/);
});

function multiplicativeFixture() {
  const sourceObjectId = "equation.product";
  const targetObjectId = "equation.product.simplified";
  const selectors = ["x", "factor", "inverse"].map((suffix) => ({
    id: `${sourceObjectId}.${suffix}`,
    objectId: sourceObjectId,
    kind: "term"
  }));
  return {
    bundle: {
      id: "asset.product",
      title: "Cancel inverse factors",
      version: 1 as const,
      objects: [
        {
          id: sourceObjectId,
          kind: "semantic-object" as const,
          objectType: "equation",
          title: "Product",
          value: { latex: "x a a^{-1}" },
          selectors
        },
        {
          id: targetObjectId,
          kind: "semantic-object" as const,
          objectType: "equation",
          title: "Simplified product",
          value: { latex: "x" },
          selectors: [{
            id: `${targetObjectId}.x`,
            objectId: targetObjectId,
            kind: "term"
          }]
        }
      ]
    },
    transformation: {
      id: "transform.product.cancel",
      kind: "semantic-transformation" as const,
      transformType: "cancelMultiplicativeInverses",
      title: "Cancel inverse factors",
      sourceObjectIds: [sourceObjectId],
      targetObjectIds: [targetObjectId],
      preserves: ["value" as const],
      assumptions: [],
      lawRefs: [{ id: "law.algebra.cancel-multiplicative-inverses", level: "strict" as const }],
      correspondenceMap: {
        id: "correspondence.product.cancel",
        records: [
          {
            id: "x-persists",
            relation: "identity" as const,
            sourceSelectorIds: [`${sourceObjectId}.x`],
            targetSelectorIds: [`${targetObjectId}.x`],
            summary: "x persists."
          },
          {
            id: "factors-cancel",
            relation: "cancelation" as const,
            sourceSelectorIds: [
              `${sourceObjectId}.factor`,
              `${sourceObjectId}.inverse`
            ],
            targetSelectorIds: [],
            summary: "Inverse factors cancel."
          }
        ]
      },
      correspondence: []
    }
  };
}
