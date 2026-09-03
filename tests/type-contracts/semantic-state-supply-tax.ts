import type {
  KpLinearTaxDemandContractV1,
  KpLinearTaxSupplyContractV1,
  KpPerUnitTaxContractV1
} from "../../domains/economics/per-unit-tax-welfare.ts";
import type {
  KpPerUnitTaxMarketPhase,
  KpPerUnitTaxMarketStateV1
} from "../../domains/economics/per-unit-tax-welfare-model.ts";
import {
  createKpSemanticStateSupplyTaxAuthoring,
  type KpSupplyTaxBuyerFacingSupplyState,
  type KpSupplyTaxGovernmentRevenueState,
  type KpSupplyTaxIncidenceState
} from
  "../../src/experiments/typed-linear-supply-demand/semantic-state-supply-tax.ts";
import { defineKpSemanticStateTransform } from
  "../../src/semantic-state/authoring-state-transform.ts";
import { evaluateKpSemanticDerivedValue } from
  "../../src/semantic-state/derived-evaluator.ts";

const fixture = createKpSemanticStateSupplyTaxAuthoring();
const before = fixture.handles.pin(fixture.initial);
const demand: KpLinearTaxDemandContractV1 = before.source.demand.read();
const originalSupply: KpLinearTaxSupplyContractV1 =
  before.source.originalSupply.read();
const tax: KpPerUnitTaxContractV1 = before.source.tax.read();
const phase: KpPerUnitTaxMarketPhase = before.market.phase.read();
const supply: KpSupplyTaxBuyerFacingSupplyState =
  before.market.supply.read();
const sharedSupply: KpSupplyTaxBuyerFacingSupplyState =
  before.comparison.sharedSupply.read();
const copiedSupply: KpSupplyTaxBuyerFacingSupplyState =
  before.comparison.copiedSupply.read();
void demand;
void originalSupply;
void tax;
void phase;
void supply;
void sharedSupply;
void copiedSupply;

const equilibrium: KpPerUnitTaxMarketStateV1 =
  evaluateKpSemanticDerivedValue({
    graph: fixture.graph,
    snapshot: fixture.initial,
    target: fixture.handles.refs.outcomes.equilibrium
  });
const incidence: KpSupplyTaxIncidenceState = evaluateKpSemanticDerivedValue({
  graph: fixture.graph,
  snapshot: fixture.initial,
  target: fixture.handles.refs.outcomes.incidence
});
const revenue: KpSupplyTaxGovernmentRevenueState =
  evaluateKpSemanticDerivedValue({
    graph: fixture.graph,
    snapshot: fixture.initial,
    target: fixture.handles.refs.outcomes.governmentRevenue
  });
void equilibrium;
void incidence;
void revenue;

defineKpSemanticStateTransform({
  compiled: fixture.compiled,
  handles: fixture.handles,
  id: "supply-tax-type-contract",
  author(state) {
    state.market.phase.update(() => "taxed");
    state.market.supply.update(previous => ({
      ...previous,
      taxAmount: { numerator: "4", denominator: "1" }
    }));

    // @ts-expect-error Market phase updates preserve the declared phase union.
    state.market.phase.update(() => "settled");

    state.market.supply.update(previous => ({
      ...previous,
      // @ts-expect-error Exact rational fields cannot degrade to numbers.
      taxAmount: 4
    }));

    // @ts-expect-error Derived equilibrium is read-only inside transforms.
    state.outcomes.equilibrium.update(previous => previous);
  }
});
