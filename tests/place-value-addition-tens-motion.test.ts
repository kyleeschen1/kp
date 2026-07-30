import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpPlaceValueAdditionRuntimeSession
} from "../src/rendering/place-value-addition-runtime.ts";
import {
  isKpPlaceValueTensEvaluation
} from "../src/rendering/place-value-addition-ones-evaluation.ts";
import {
  isKpPlaceValueTensExchange
} from "../src/rendering/place-value-addition-ones-exchange.ts";

test("tens evaluation reuses the exact ones compiler and executable route", () => {
  const session = createKpPlaceValueAdditionRuntimeSession();
  const { onesEvaluation, tensEvaluation } = session;

  assert.equal(isKpPlaceValueTensEvaluation(tensEvaluation), true);
  assert.equal(tensEvaluation.expression, "1 + 7 + 5 = 13");
  assert.deepEqual(tensEvaluation.materialSelectorIds, [
    "carry.tens",
    "digit.first.tens",
    "digit.second.tens"
  ]);
  assert.equal(
    tensEvaluation.forward.programId,
    onesEvaluation.forward.programId
  );
  assert.equal(
    tensEvaluation.forward.route.primitiveRoute,
    onesEvaluation.forward.route.primitiveRoute
  );
  assert.equal(tensEvaluation.catalystSelectorId, "operator.add");
  assert.equal(
    tensEvaluation.binding.sourceAnnotations.filter(
      ({ contribution }) => contribution === "material-input"
    ).length,
    3
  );
});

test("the carried ten is material input, never decorative context", () => {
  const { tensEvaluation } = createKpPlaceValueAdditionRuntimeSession();
  const carry = tensEvaluation.binding.sourceAnnotations.find(
    ({ selectorIds }) => selectorIds.includes("carry.tens")
  );
  const lineage = tensEvaluation.binding.lineages[0];

  assert.equal(carry?.contribution, "material-input");
  assert.ok(lineage?.sourceAnnotationIds.includes(carry!.id));
  assert.ok(
    !tensEvaluation.binding.targetAnnotations.some(
      ({ selectorIds }) => selectorIds.includes("carry.tens")
    )
  );
});

test("tens exchange uses the same nominal fission and transfer boundary", () => {
  const session = createKpPlaceValueAdditionRuntimeSession();
  const { onesExchange, tensExchange } = session;

  assert.equal(isKpPlaceValueTensExchange(tensExchange), true);
  assert.deepEqual(tensExchange.fissionPlan.sourceEntityIds, [
    "evaluation.tens.total"
  ]);
  assert.deepEqual(tensExchange.fissionPlan.targetEntityIds, [
    "result.tens",
    "carry.hundreds"
  ]);
  assert.equal(
    tensExchange.forward.programId,
    onesExchange.forward.programId
  );
  assert.equal(
    tensExchange.forward.route.primitiveRoute,
    onesExchange.forward.route.primitiveRoute
  );
  assert.equal(
    tensExchange.transferProgress,
    onesExchange.transferProgress
  );
  assert.equal(tensExchange.baseTenExchangeId, "exchange.tens-to-hundreds");
});

test("tens evaluation and exchange rewind through inverse phase order", () => {
  const { tensEvaluation, tensExchange } =
    createKpPlaceValueAdditionRuntimeSession();

  assert.deepEqual(
    tensEvaluation.rewind.phaseOrder,
    [...tensEvaluation.forward.phaseOrder].reverse()
  );
  assert.deepEqual(
    tensExchange.rewind.phaseOrder,
    [...tensExchange.forward.phaseOrder].reverse()
  );
});
