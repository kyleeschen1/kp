import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createKpSemanticStateSupplyTaxAuthoring } from
  "../src/experiments/typed-linear-supply-demand/semantic-state-supply-tax.ts";

const SUPPLY_TAX_AUTHORING_SOURCE =
  "src/experiments/typed-linear-supply-demand/semantic-state-supply-tax.ts";

test("the supply-tax base packet keeps ordinary authoring compact", () => {
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
    authoredSetupLines: 29
  });
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
