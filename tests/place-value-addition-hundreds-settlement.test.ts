import assert from "node:assert/strict";
import test from "node:test";

import {
  isKpPlaceValueHundredsEvaluation
} from "../src/rendering/place-value-addition-ones-evaluation.ts";
import {
  isKpPlaceValueNativeSettlement
} from "../src/rendering/place-value-addition-native-settlement.ts";
import {
  createKpPlaceValueAdditionRuntimeSession
} from "../src/rendering/place-value-addition-runtime.ts";

test("hundreds evaluation reuses the shared operation route", () => {
  const session = createKpPlaceValueAdditionRuntimeSession();
  const { onesEvaluation, hundredsEvaluation } = session;

  assert.equal(
    isKpPlaceValueHundredsEvaluation(hundredsEvaluation),
    true
  );
  assert.equal(hundredsEvaluation.expression, "1 + 2 + 1 = 4");
  assert.deepEqual(hundredsEvaluation.materialSelectorIds, [
    "carry.hundreds",
    "digit.first.hundreds",
    "digit.second.hundreds"
  ]);
  assert.deepEqual(hundredsEvaluation.targetSelectorIds, [
    "result.hundreds"
  ]);
  assert.equal(
    hundredsEvaluation.forward.programId,
    onesEvaluation.forward.programId
  );
  assert.equal(
    hundredsEvaluation.forward.route.primitiveRoute,
    onesEvaluation.forward.route.primitiveRoute
  );
});

test("the carried hundred is opaque material in the final evaluation", () => {
  const { hundredsEvaluation } =
    createKpPlaceValueAdditionRuntimeSession();
  const carry = hundredsEvaluation.binding.sourceAnnotations.find(
    ({ selectorIds }) => selectorIds.includes("carry.hundreds")
  );
  const plus = hundredsEvaluation.binding.sourceAnnotations.find(
    ({ selectorIds }) => selectorIds.includes("operator.add")
  );

  assert.equal(carry?.contribution, "material-input");
  assert.equal(plus?.contribution, "catalyst");
  assert.ok(
    hundredsEvaluation.binding.lineages[0]?.sourceAnnotationIds.includes(
      carry!.id
    )
  );
  assert.equal(hundredsEvaluation.opacityPolicy, "opaque");
  assert.deepEqual(
    hundredsEvaluation.rewind.phaseOrder,
    [...hundredsEvaluation.forward.phaseOrder].reverse()
  );
});

test("native settlement is nominal and closes the exact 434 roots", () => {
  const { nativeSettlement } =
    createKpPlaceValueAdditionRuntimeSession();

  assert.equal(isKpPlaceValueNativeSettlement(nativeSettlement), true);
  assert.deepEqual(nativeSettlement.sourceEntityIds, [
    "result.hundreds",
    "result.tens",
    "result.ones"
  ]);
  assert.equal(nativeSettlement.targetEntityId, "result");
  assert.equal(nativeSettlement.endpointOwner, "native-katex");
  assert.equal(
    nativeSettlement.handoffPolicy,
    "same-paint-root-no-first-frame"
  );
  assert.equal(nativeSettlement.opacityPolicy, "opaque");
  assert.equal(
    isKpPlaceValueNativeSettlement({ ...nativeSettlement }),
    false
  );
});
