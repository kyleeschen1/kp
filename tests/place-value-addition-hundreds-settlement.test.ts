import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  isKpPlaceValueColumnEvaluation
} from "../src/rendering/place-value-addition-column-evaluation.ts";
import {
  createKpPlaceValueAdditionRuntimeSession
} from "../src/rendering/place-value-addition-runtime.ts";

test("hundreds evaluation reuses the shared operation route", () => {
  const session = createKpPlaceValueAdditionRuntimeSession();
  const referenceEvaluation = session.columnEvaluations[0]!;
  const finalEvaluation = session.columnEvaluations[2]!;

  assert.equal(
    isKpPlaceValueColumnEvaluation(finalEvaluation),
    true
  );
  assert.equal(finalEvaluation.expression, "1 + 2 + 1 = 4");
  assert.deepEqual(finalEvaluation.materialSelectorIds, [
    "carry.hundreds",
    "digit.first.hundreds",
    "digit.second.hundreds"
  ]);
  assert.deepEqual(finalEvaluation.targetSelectorIds, [
    "result.hundreds"
  ]);
  assert.equal(
    finalEvaluation.forward.programId,
    referenceEvaluation.forward.programId
  );
  assert.equal(
    finalEvaluation.forward.route.primitiveRoute,
    referenceEvaluation.forward.route.primitiveRoute
  );
});

test("the carried hundred is opaque material in the final evaluation", () => {
  const evaluation =
    createKpPlaceValueAdditionRuntimeSession().columnEvaluations[2]!;
  const carryProxy = evaluation.writtenOwnership.contributionProxies.find(
    ({ sourceCellId }) => sourceCellId === "carry.hundreds"
  );
  const carry = evaluation.binding.sourceAnnotations.find(
    ({ selectorIds }) => selectorIds.includes(carryProxy!.proxySelectorId)
  );
  const plus = evaluation.binding.sourceAnnotations.find(
    ({ selectorIds }) => selectorIds.includes(
      evaluation.writtenOwnership.catalystProxy.proxySelectorId
    )
  );

  assert.equal(carry?.contribution, "material-input");
  assert.equal(plus?.contribution, "catalyst");
  assert.ok(
    evaluation.binding.lineages[0]?.sourceAnnotationIds.includes(
      carry!.id
    )
  );
  assert.equal(evaluation.opacityPolicy, "opaque");
  assert.deepEqual(
    evaluation.rewind.phaseOrder,
    [...evaluation.forward.phaseOrder].reverse()
  );
});

test("the persistent scaffold is the only runtime settlement scene", () => {
  const session = createKpPlaceValueAdditionRuntimeSession();
  const settleBeat = session.foundation.presentation.beats.find(
    ({ kind }) => kind === "settle"
  );
  const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");

  assert.equal("nativeSettlement" in session, false);
  assert.equal(settleBeat?.programs[0]?.kind, "native-settlement");
  assert.equal(
    existsSync(join(
      projectRoot,
      "src/rendering/place-value-addition-native-settlement.ts"
    )),
    false
  );
});
