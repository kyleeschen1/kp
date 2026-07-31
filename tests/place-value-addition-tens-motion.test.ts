import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpPlaceValueAdditionRuntimeSession
} from "../src/rendering/place-value-addition-runtime.ts";
import {
  isKpPlaceValueColumnEvaluation
} from "../src/rendering/place-value-addition-column-evaluation.ts";
import {
  isKpPlaceValueColumnExchange
} from "../src/rendering/place-value-addition-column-exchange.ts";

test("tens evaluation reuses the exact ones compiler and executable route", () => {
  const session = createKpPlaceValueAdditionRuntimeSession();
  const referenceEvaluation = session.columnEvaluations[0]!;
  const successorEvaluation = session.columnEvaluations[1]!;

  assert.equal(isKpPlaceValueColumnEvaluation(successorEvaluation), true);
  assert.equal(successorEvaluation.expression, "1 + 7 + 5 = 13");
  assert.deepEqual(successorEvaluation.materialSelectorIds, [
    "carry.tens",
    "digit.first.tens",
    "digit.second.tens"
  ]);
  assert.equal(
    successorEvaluation.forward.programId,
    referenceEvaluation.forward.programId
  );
  assert.equal(
    successorEvaluation.forward.route.primitiveRoute,
    referenceEvaluation.forward.route.primitiveRoute
  );
  assert.equal(successorEvaluation.catalystSelectorId, "operator.add");
  assert.equal(
    successorEvaluation.binding.sourceAnnotations.filter(
      ({ contribution }) => contribution === "material-input"
    ).length,
    3
  );
});

test("the carried ten is material input, never decorative context", () => {
  const evaluation =
    createKpPlaceValueAdditionRuntimeSession().columnEvaluations[1]!;
  const carryProxy = evaluation.writtenOwnership.contributionProxies.find(
    ({ sourceCellId }) => sourceCellId === "carry.tens"
  );
  const carry = evaluation.binding.sourceAnnotations.find(
    ({ selectorIds }) => selectorIds.includes(carryProxy!.proxySelectorId)
  );
  const lineage = evaluation.binding.lineages[0];

  assert.equal(carry?.contribution, "material-input");
  assert.ok(lineage?.sourceAnnotationIds.includes(carry!.id));
  assert.ok(
    !evaluation.binding.targetAnnotations.some(
      ({ selectorIds }) => selectorIds.includes(carryProxy!.proxySelectorId)
    )
  );
});

test("tens exchange uses the same nominal fission and transfer boundary", () => {
  const session = createKpPlaceValueAdditionRuntimeSession();
  const referenceExchange = session.columnExchanges[0]!;
  const successorExchange = session.columnExchanges[1]!;

  assert.equal(isKpPlaceValueColumnExchange(successorExchange), true);
  assert.deepEqual(successorExchange.fissionPlan.sourceEntityIds, [
    "evaluation.tens.total"
  ]);
  assert.deepEqual(successorExchange.fissionPlan.targetEntityIds, [
    "result.tens",
    "carry.hundreds"
  ]);
  assert.equal(
    successorExchange.forward.programId,
    referenceExchange.forward.programId
  );
  assert.equal(
    successorExchange.forward.route.primitiveRoute,
    referenceExchange.forward.route.primitiveRoute
  );
  assert.equal(
    successorExchange.transferProgress,
    referenceExchange.transferProgress
  );
  assert.equal(
    successorExchange.baseTenExchangeId,
    "exchange.tens-to-hundreds"
  );
});

test("tens evaluation and exchange rewind through inverse phase order", () => {
  const session = createKpPlaceValueAdditionRuntimeSession();
  const evaluation = session.columnEvaluations[1]!;
  const exchange = session.columnExchanges[1]!;

  assert.deepEqual(
    evaluation.rewind.phaseOrder,
    [...evaluation.forward.phaseOrder].reverse()
  );
  assert.deepEqual(
    exchange.rewind.phaseOrder,
    [...exchange.forward.phaseOrder].reverse()
  );
});
