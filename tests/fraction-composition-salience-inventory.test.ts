import assert from "node:assert/strict";
import test from "node:test";
import {
  createKpFractionCompositionSalienceInventory,
  kpFractionCompositionSalienceCheckpointIds
} from "../src/reader/compiler/fraction-composition-salience-inventory.ts";
import {
  createKpLawfulFractionSolveMacro
} from "../src/semantic/fraction-solve-macro.ts";

test("fraction salience inventory closes native endpoints and transitions", () => {
  const inventory = createKpFractionCompositionSalienceInventory();
  const macro = createKpLawfulFractionSolveMacro();

  assert.equal(inventory.nativePaintOwner, "native-katex");
  assert.equal(inventory.selectorRealization, "annotated-katex-dom");
  assert.equal(inventory.structuralAnchorRealization, "measured-katex-artifact");
  assert.equal(inventory.envelopeRealization, "virtual-member-paint-union");
  assert.deepEqual(
    inventory.endpoints.map(({ stateId }) => stateId),
    macro.verification.stateIds
  );
  assert.deepEqual(
    inventory.transitions.map(({ stepId }) => stepId),
    macro.verification.stepIds
  );

  const selectorIds = new Set(inventory.endpoints.flatMap(
    ({ selectorIds }) => selectorIds
  ));
  const structuralAnchorIds = new Set(inventory.endpoints.flatMap(
    ({ structuralAnchorIds }) => structuralAnchorIds
  ));
  for (const transition of inventory.transitions) {
    for (const id of [
      ...transition.sourceSelectorIds,
      ...transition.targetSelectorIds
    ]) {
      assert.ok(selectorIds.has(id) || structuralAnchorIds.has(id), id);
    }
  }
});

test("six authored checkpoints address exact fold groups and KaTeX envelopes", () => {
  const inventory = createKpFractionCompositionSalienceInventory();
  assert.deepEqual(
    inventory.checkpoints.map(({ id }) => id),
    kpFractionCompositionSalienceCheckpointIds
  );
  assert.deepEqual(
    inventory.checkpoints.map(({ operationIds }) => operationIds.length),
    [0, 2, 2, 3, 3, 3]
  );
  for (const checkpoint of inventory.checkpoints) {
    const endpoint = inventory.endpoints.find(
      ({ stateId }) => stateId === checkpoint.stateId
    );
    assert.ok(endpoint);
    assert.ok(endpoint.envelopeIds.includes(checkpoint.defaultFocusTargetId));
  }
});
