import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createKpPerUnitTaxWelfareAccounting
} from "../domains/economics/per-unit-tax-welfare-accounting.ts";
import { evaluateKpSemanticDerivedValue } from
  "../src/semantic-state/derived-evaluator.ts";
import {
  createKpSemanticStateSupplyTaxFamilyAuthoring
} from "../src/experiments/typed-linear-supply-demand/semantic-state-supply-tax-family.ts";

const SOURCE =
  "src/experiments/typed-linear-supply-demand/semantic-state-supply-tax-family.ts";

test("the supply-tax family authors one exact semantic driver", () => {
  const fixture = createKpSemanticStateSupplyTaxFamilyAuthoring();
  const { before, after, commit } = fixture.application;

  assert.deepEqual(before.market.taxAmount.read(), exact("0"));
  assert.deepEqual(after.market.taxAmount.read(), exact("4"));
  assert.equal(commit.journal[0]?.operation.kind, "update");
  const operation = commit.journal[0]?.operation;
  if (operation?.kind !== "update") {
    throw new Error("Expected one tax-amount update.");
  }
  assert.equal(
    operation.slotId,
    fixture.handles.refs.market.taxAmount.slotId
  );
  assert.deepEqual(
    fixture.family.declaration.transitionPlan.declarations.map(declaration => ({
      mode: declaration.transitionMode,
      target: declaration.target.path
    })),
    [{ mode: "semantic-interpolation", target: ["market", "taxAmount"] }]
  );
  assert.equal(fixture.application.commit.before, fixture.initial);
  assert.equal(fixture.application.commit.journal.length, 1);
});

test("endpoint outcomes retain canonical market and accounting parity", () => {
  const fixture = createKpSemanticStateSupplyTaxFamilyAuthoring();
  const accounting = createKpPerUnitTaxWelfareAccounting(fixture.sourceModel);

  for (const [snapshot, market, welfare] of [
    [fixture.initial, fixture.sourceModel.states.untaxed,
      accounting.states.untaxed],
    [fixture.application.commit.after, fixture.sourceModel.states.taxed,
      accounting.states.taxed]
  ] as const) {
    assert.deepEqual(evaluateKpSemanticDerivedValue({
      graph: fixture.graph,
      snapshot,
      target: fixture.handles.refs.outcomes.equilibrium
    }), market);
    assert.deepEqual(evaluateKpSemanticDerivedValue({
      graph: fixture.graph,
      snapshot,
      target: fixture.handles.refs.outcomes.governmentRevenue
    }), {
      marketStateId: market.id,
      phase: market.phase,
      amount: welfare.governmentRevenue
    });
  }
});

test("buyer-facing supply and outcomes have stable explicit dependencies", () => {
  const fixture = createKpSemanticStateSupplyTaxFamilyAuthoring();
  const dependencies = Object.fromEntries(
    fixture.graph.input.definitions.map(definition => [
      definition.target.path?.join("."),
      definition.dependencies.map(edge => edge.dependency.path?.join("."))
    ])
  );

  assert.deepEqual(dependencies, {
    "market.buyerFacingSupply": ["market.evaluation"],
    "market.evaluation": ["source.model", "market.taxAmount"],
    "outcomes.equilibrium": ["market.evaluation"],
    "outcomes.governmentRevenue": ["market.evaluation"],
    "outcomes.incidence": ["outcomes.equilibrium"]
  });
  assert.deepEqual(evaluateKpSemanticDerivedValue({
    graph: fixture.graph,
    snapshot: fixture.application.commit.after,
    target: fixture.handles.refs.market.buyerFacingSupply
  }), {
    id: fixture.sourceModel.input.supply.taxedId,
    sourceSupplyId: fixture.sourceModel.input.supply.id,
    label: "Supply plus tax",
    phase: "taxed",
    direction: "upward",
    equationForm: "price-intercept-plus-slope-times-quantity",
    priceIntercept: exact("6"),
    priceChangePerQuantity:
      fixture.sourceModel.input.supply.priceChangePerQuantity,
    taxAmount: exact("4")
  });
});

test("the family packet stays compact and delegates economics", () => {
  const authoring = readAuthoringRegion();
  const metrics = {
    lowLevelConstructionCalls: countMatches(
      authoring,
      /(?:createKpSemanticStateIdentityScope|createKpSemanticEntityVersionStore|createKpSemanticSlotAbsence|createKpAggregateSemanticSnapshot|beginKpSemanticTransaction)\(/gu
    ),
    manualKernelMetadataFields: countMatches(
      authoring,
      /\b(?:revisionId|slotId|entityId):\s*["']/gu
    ),
    authorCasts: countMatches(authoring, /\bas\s+(?:Kp|Readonly|never)\b/gu),
    endpointUpdateCalls: countMatches(authoring, /\.update\(/gu),
    authoredSetupLines: authoring.split("\n")
      .filter(line => line.trim().length > 0).length
  };

  assert.deepEqual(metrics, {
    lowLevelConstructionCalls: 0,
    manualKernelMetadataFields: 0,
    authorCasts: 0,
    endpointUpdateCalls: 1,
    authoredSetupLines: 106
  });
  assert.match(authoring, /evaluateKpParameterizedPerUnitTax/u);
  assert.doesNotMatch(authoring, /(?:consumerPrice|producerPrice)\s*[-+*/]/u);
});

function readAuthoringRegion(): string {
  const source = readFileSync(SOURCE, "utf8");
  const match = /\/\/ supply-tax-family-authoring:start\n([\s\S]*?)\/\/ supply-tax-family-authoring:end/u
    .exec(source);
  assert.ok(match);
  return match[1]!;
}

function countMatches(source: string, pattern: RegExp): number {
  return [...source.matchAll(pattern)].length;
}

function exact(numerator: string, denominator = "1") {
  return { numerator, denominator };
}
