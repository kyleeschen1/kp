import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createKpSemanticStateSupplyTaxAuthoring } from
  "../src/experiments/typed-linear-supply-demand/semantic-state-supply-tax.ts";
import { evaluateKpSemanticDerivedValue } from
  "../src/semantic-state/derived-evaluator.ts";
import { kpPerUnitTaxWelfareExemplarInput } from
  "../domains/economics/per-unit-tax-welfare.ts";

const SUPPLY_TAX_AUTHORING_SOURCE =
  "src/experiments/typed-linear-supply-demand/semantic-state-supply-tax.ts";

test("the supply-tax packet keeps ordinary authoring compact", () => {
  const authoring = readAuthoringRegion();
  const metrics = Object.freeze({
    manualIdentityFactoryCalls: countMatches(
      authoring,
      /identities\.(?:slot|entity|derivation|initialSnapshot|transformation|appliedTransformation)\(/gu
    ),
    lowLevelConstructionCalls: countMatches(
      authoring,
      /(?:createKpSemanticStateIdentityScope|createKpSemanticEntityVersionStore|createKpSemanticSlotAbsence|createKpAggregateSemanticSnapshot|beginKpSemanticTransaction)\(/gu
    ),
    manualKernelMetadataFields: countMatches(
      authoring,
      /\b(?:sourceId|revisionId|slotId|entityId):\s*["']/gu
    ),
    authorCasts: countMatches(authoring, /\bas\s+(?:Kp|Readonly|never)\b/gu),
    marketFacadePrimitives: countMatches(
      authoring,
      /kpState(?:Supply|Demand|Tax|Equilibrium|Revenue)\b/gu
    ),
    authoredSetupLines: authoring.split("\n")
      .filter(line => line.trim().length > 0)
      .length
  });

  assert.deepEqual(metrics, {
    manualIdentityFactoryCalls: 0,
    lowLevelConstructionCalls: 0,
    manualKernelMetadataFields: 0,
    authorCasts: 0,
    marketFacadePrimitives: 0,
    authoredSetupLines: 74
  });
});

test("derived market outcomes retain explicit exact-rational dependencies", () => {
  const fixture = createKpSemanticStateSupplyTaxAuthoring();
  const dependencyPaths = Object.fromEntries(
    fixture.graph.input.definitions.map(definition => [
      definition.target.path?.join("."),
      definition.dependencies.map(edge => edge.dependency.path?.join("."))
    ])
  );

  assert.deepEqual(dependencyPaths, {
    "outcomes.equilibrium": [
      "source.demand",
      "market.phase",
      "market.supply"
    ],
    "outcomes.governmentRevenue": ["outcomes.equilibrium"],
    "outcomes.incidence": ["outcomes.equilibrium"]
  });
  assert.deepEqual(
    evaluateKpSemanticDerivedValue({
      graph: fixture.graph,
      snapshot: fixture.initial,
      target: fixture.handles.refs.outcomes.equilibrium
    }),
    fixture.model.states.untaxed
  );
  assert.deepEqual(
    evaluateKpSemanticDerivedValue({
      graph: fixture.graph,
      snapshot: fixture.applied.commit.after,
      target: fixture.handles.refs.outcomes.equilibrium
    }),
    fixture.model.states.taxed
  );
  assert.deepEqual(
    evaluateKpSemanticDerivedValue({
      graph: fixture.graph,
      snapshot: fixture.applied.commit.after,
      target: fixture.handles.refs.outcomes.incidence
    }),
    {
      marketStateId: fixture.model.states.taxed.id,
      phase: "taxed",
      buyerPrice: { numerator: "9", denominator: "1" },
      sellerPrice: { numerator: "5", denominator: "1" },
      priceWedge: { numerator: "4", denominator: "1" },
      taxAmount: fixture.model.states.taxed.taxAmount,
      wedgeEqualsTaxExactly: true
    }
  );
  assert.deepEqual(
    evaluateKpSemanticDerivedValue({
      graph: fixture.graph,
      snapshot: fixture.applied.commit.after,
      target: fixture.handles.refs.outcomes.governmentRevenue
    }),
    {
      marketStateId: fixture.model.states.taxed.id,
      phase: "taxed",
      amount: fixture.accounting.states.taxed.governmentRevenue
    }
  );
});

test("derived outcomes follow a second canonical exact market", () => {
  const fixture = createKpSemanticStateSupplyTaxAuthoring({
    ...kpPerUnitTaxWelfareExemplarInput,
    demand: {
      ...kpPerUnitTaxWelfareExemplarInput.demand,
      priceIntercept: { numerator: "14", denominator: "1" }
    }
  });
  const snapshot = fixture.applied.commit.after;

  assert.deepEqual(evaluateKpSemanticDerivedValue({
    graph: fixture.graph,
    snapshot,
    target: fixture.handles.refs.outcomes.equilibrium
  }), fixture.model.states.taxed);
  assert.deepEqual(evaluateKpSemanticDerivedValue({
    graph: fixture.graph,
    snapshot,
    target: fixture.handles.refs.outcomes.incidence
  }), {
    marketStateId: fixture.model.states.taxed.id,
    phase: "taxed",
    buyerPrice: { numerator: "10", denominator: "1" },
    sellerPrice: { numerator: "6", denominator: "1" },
    priceWedge: { numerator: "4", denominator: "1" },
    taxAmount: { numerator: "4", denominator: "1" },
    wedgeEqualsTaxExactly: true
  });
  assert.deepEqual(evaluateKpSemanticDerivedValue({
    graph: fixture.graph,
    snapshot,
    target: fixture.handles.refs.outcomes.governmentRevenue
  }), {
    marketStateId: fixture.model.states.taxed.id,
    phase: "taxed",
    amount: { numerator: "16", denominator: "1" }
  });
});

test("the pressure caller keeps exact-rational formulas in canonical economics", () => {
  const source = readFileSync(SUPPLY_TAX_AUTHORING_SOURCE, "utf8");

  assert.match(source, /createKpPerUnitTaxWelfareModel/u);
  assert.match(source, /createKpPerUnitTaxWelfareAccounting/u);
  assert.match(source, /evaluateKpPerUnitTaxBuyerFacingSupplyPrice/u);
  assert.doesNotMatch(source, /domains\/math\/exact-rational/u);
  assert.doesNotMatch(
    source,
    /(?:add|subtract|multiply|divide|equal)KpRationals/u
  );
});

test("the typed seller-tax update retains exact canonical market values", () => {
  const fixture = createKpSemanticStateSupplyTaxAuthoring();
  const before = fixture.applied.before;
  const after = fixture.applied.after;

  assert.equal(before.market.phase.read(), "untaxed");
  assert.equal(after.market.phase.read(), "taxed");
  assert.deepEqual(
    before.source.demand.read(),
    fixture.model.input.demand
  );
  assert.deepEqual(
    before.source.originalSupply.read(),
    fixture.model.input.supply
  );
  assert.deepEqual(before.source.tax.read(), fixture.model.input.tax);
  assert.equal(
    before.source.originalSupply.read(),
    after.source.originalSupply.read()
  );
  assert.deepEqual(before.market.supply.read(), {
    id: fixture.model.input.supply.id,
    sourceSupplyId: fixture.model.input.supply.id,
    label: "Supply",
    phase: "untaxed",
    direction: "upward",
    equationForm: "price-intercept-plus-slope-times-quantity",
    priceIntercept: fixture.model.input.supply.priceIntercept,
    priceChangePerQuantity:
      fixture.model.input.supply.priceChangePerQuantity,
    taxAmount: fixture.model.states.untaxed.taxAmount
  });
  assert.deepEqual(after.market.supply.read(), {
    id: fixture.model.input.supply.taxedId,
    sourceSupplyId: fixture.model.input.supply.id,
    label: "Supply plus tax",
    phase: "taxed",
    direction: "upward",
    equationForm: "price-intercept-plus-slope-times-quantity",
    priceIntercept: {
      numerator: "6",
      denominator: "1"
    },
    priceChangePerQuantity:
      fixture.model.input.supply.priceChangePerQuantity,
    taxAmount: fixture.model.states.taxed.taxAmount
  });
  assert.deepEqual(
    fixture.applied.commit.journal.map(entry => entry.operation.kind),
    ["update", "update"]
  );
  assert.deepEqual(
    fixture.applied.commit.journal.map(entry =>
      entry.operation.kind === "update" ? entry.operation.slotId : undefined
    ),
    [
      fixture.compiled.identityScope.slot("market.phase"),
      fixture.compiled.identityScope.slot("market.supply")
    ]
  );
});

function readAuthoringRegion(): string {
  const source = readFileSync(SUPPLY_TAX_AUTHORING_SOURCE, "utf8");
  const authoring = source.split("// supply-tax-authoring:start")[1]
    ?.split("// supply-tax-authoring:end")[0];
  assert.notEqual(authoring, undefined);
  return authoring ?? "";
}

function countMatches(source: string, pattern: RegExp): number {
  return [...source.matchAll(pattern)].length;
}
