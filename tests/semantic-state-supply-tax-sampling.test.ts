import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { evaluateKpParameterizedPerUnitTax } from
  "../domains/economics/per-unit-tax-parameterized.ts";
import { kpPerUnitTaxWelfareExemplarInput } from
  "../domains/economics/per-unit-tax-welfare.ts";
import { evaluateKpSemanticDerivedValue } from
  "../src/semantic-state/derived-evaluator.ts";
import { createKpSemanticProgress } from
  "../src/semantic-state/semantic-progress.ts";
import { createKpSemanticStateFamilyEvaluator } from
  "../src/semantic-state/state-family-evaluator.ts";
import { createKpSemanticStateSupplyTaxFamilyAuthoring } from
  "../src/experiments/typed-linear-supply-demand/semantic-state-supply-tax-family.ts";

const FAMILY_SOURCE =
  "src/experiments/typed-linear-supply-demand/semantic-state-supply-tax-family.ts";
const progressGrid = Object.freeze([
  createKpSemanticProgress(0n),
  createKpSemanticProgress(1n, 4n),
  createKpSemanticProgress(1n, 2n),
  createKpSemanticProgress(3n, 4n),
  createKpSemanticProgress(1n)
]);

for (const [name, input] of [
  ["canonical market", undefined],
  ["second exact market", {
    ...kpPerUnitTaxWelfareExemplarInput,
    demand: {
      ...kpPerUnitTaxWelfareExemplarInput.demand,
      priceIntercept: exact("14")
    }
  }]
] as const) {
  test(`${name} recomputes every exact sample from the tax driver`, () => {
    const fixture = createKpSemanticStateSupplyTaxFamilyAuthoring(input);
    const evaluator = createKpSemanticStateFamilyEvaluator({
      definition: fixture.family,
      application: fixture.application
    });

    for (const progress of progressGrid) {
      const source = evaluator.at(progress).source;
      const evaluation = evaluateKpSemanticDerivedValue({
        graph: fixture.graph,
        source,
        target: fixture.handles.refs.market.evaluation
      });
      const expected = evaluateKpParameterizedPerUnitTax({
        model: fixture.sourceModel,
        taxAmount: evaluation.taxAmount
      });

      assert.deepEqual(evaluation, expected);
      assert.deepEqual(evaluateKpSemanticDerivedValue({
        graph: fixture.graph,
        source,
        target: fixture.handles.refs.outcomes.equilibrium
      }), expected.market);
      assert.deepEqual(evaluateKpSemanticDerivedValue({
        graph: fixture.graph,
        source,
        target: fixture.handles.refs.outcomes.incidence
      }), {
        marketStateId: expected.market.id,
        phase: expected.market.phase,
        buyerPrice: expected.market.consumerPrice,
        sellerPrice: expected.market.producerPrice,
        priceWedge: expected.market.priceWedge,
        taxAmount: expected.market.taxAmount,
        wedgeEqualsTaxExactly: true
      });
      assert.deepEqual(evaluateKpSemanticDerivedValue({
        graph: fixture.graph,
        source,
        target: fixture.handles.refs.outcomes.governmentRevenue
      }), {
        marketStateId: expected.market.id,
        phase: expected.market.phase,
        amount: expected.accounting.governmentRevenue
      });
      assert.equal(expected.market.marketClearsExactly, true);
      assert.equal(expected.market.wedgeEqualsTaxExactly, true);
    }
  });
}

test("the bounded canonical grid retains exact tax and outcome values", () => {
  const fixture = createKpSemanticStateSupplyTaxFamilyAuthoring();
  const evaluator = createKpSemanticStateFamilyEvaluator({
    definition: fixture.family,
    application: fixture.application
  });

  assert.deepEqual(progressGrid.map(progress => {
    const source = evaluator.at(progress).source;
    const evaluation = evaluateKpSemanticDerivedValue({
      graph: fixture.graph,
      source,
      target: fixture.handles.refs.market.evaluation
    });
    return {
      tax: evaluation.taxAmount,
      quantity: evaluation.market.quantity,
      buyerPrice: evaluation.market.consumerPrice,
      sellerPrice: evaluation.market.producerPrice,
      revenue: evaluation.accounting.governmentRevenue
    };
  }), [
    row("0", "5", "7", "7", "0"),
    row("1", "9", "15", "13", "9", "2"),
    row("2", "4", "8", "6", "8"),
    row("3", "7", "17", "11", "21", "2"),
    row("4", "3", "9", "5", "12")
  ]);
});

test("direct seek order cannot change exact sampled economics", () => {
  const fixture = createKpSemanticStateSupplyTaxFamilyAuthoring();
  const evaluator = createKpSemanticStateFamilyEvaluator({
    definition: fixture.family,
    application: fixture.application
  });
  const order = [3, 1, 4, 0, 2, 1, 3] as const;
  const observed = new Map<string, unknown>();

  for (const index of order) {
    const progress = progressGrid[index]!;
    const result = evaluateKpSemanticDerivedValue({
      graph: fixture.graph,
      source: evaluator.at(progress).source,
      target: fixture.handles.refs.market.evaluation
    });
    const key = `${progress.numerator}/${progress.denominator}`;
    const prior = observed.get(key);
    if (prior === undefined) observed.set(key, result);
    else assert.deepEqual(result, prior);
  }

  assert.equal(observed.size, 5);
});

test("the family contains no independent output interpolation or numeric progress", () => {
  const source = readFileSync(FAMILY_SOURCE, "utf8");
  const interpolation = /function interpolateExact\([\s\S]*?\n\}/u.exec(source);

  assert.ok(interpolation);
  assert.match(source, /evaluateKpParameterizedPerUnitTax/u);
  assert.doesNotMatch(
    source,
    /interpolate(?:Market|Equilibrium|Incidence|Revenue|Supply)/u
  );
  assert.doesNotMatch(interpolation[0], /\b(?:Number|parseFloat|parseInt)\s*\(/u);
});

function row(
  tax: string,
  quantity: string,
  buyerPrice: string,
  sellerPrice: string,
  revenue: string,
  denominator = "1"
) {
  return {
    tax: exact(tax),
    quantity: exact(quantity, denominator),
    buyerPrice: exact(buyerPrice, denominator),
    sellerPrice: exact(sellerPrice, denominator),
    revenue: exact(revenue, denominator)
  };
}

function exact(numerator: string, denominator = "1") {
  return { numerator, denominator };
}
