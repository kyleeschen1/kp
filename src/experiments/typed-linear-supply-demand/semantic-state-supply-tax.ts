import {
  createKpPerUnitTaxWelfareModel,
  evaluateKpPerUnitTaxBuyerFacingSupplyPrice,
  type KpPerUnitTaxMarketPhase,
  type KpPerUnitTaxMarketStateV1,
  type KpPerUnitTaxWelfareModelV1
} from "../../../domains/economics/per-unit-tax-welfare-model.ts";
import {
  createKpPerUnitTaxWelfareAccounting,
  type KpPerUnitTaxWelfareAccountingV1
} from "../../../domains/economics/per-unit-tax-welfare-accounting.ts";
import type {
  KpLinearTaxDemandContractV1,
  KpLinearTaxSupplyContractV1,
  KpPerUnitTaxContractV1,
  KpPerUnitTaxWelfareInputV1
} from "../../../domains/economics/per-unit-tax-welfare.ts";
import type { ExactRationalDto } from "../../../protocols/public-api.ts";
import { defineKpSemanticStateDerivation } from
  "../../semantic-state/authoring-derived-definition.ts";
import { compileKpSemanticStateSchema } from
  "../../semantic-state/authoring-schema-compiler.ts";
import { createKpSemanticStateHandleSet } from
  "../../semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../../semantic-state/authoring-state-materializer.ts";
import { defineKpSemanticStateTransform } from
  "../../semantic-state/authoring-state-transform.ts";
import { kpStateDerived, kpStateGroup, kpStateValue } from
  "../../semantic-state/authoring-schema.ts";
import {
  compileKpSemanticDerivedGraph,
  normalizeKpSemanticDerivedGraphInput
} from "../../semantic-state/derived-graph.ts";

export interface KpSupplyTaxBuyerFacingSupplyState {
  readonly id: string;
  readonly sourceSupplyId: string;
  readonly label: "Supply" | "Supply plus tax";
  readonly phase: KpPerUnitTaxMarketPhase;
  readonly direction: "upward";
  readonly equationForm: "price-intercept-plus-slope-times-quantity";
  readonly priceIntercept: ExactRationalDto;
  readonly priceChangePerQuantity: ExactRationalDto;
  readonly taxAmount: ExactRationalDto;
}

export interface KpSupplyTaxIncidenceState {
  readonly marketStateId: string;
  readonly phase: KpPerUnitTaxMarketPhase;
  readonly buyerPrice: ExactRationalDto;
  readonly sellerPrice: ExactRationalDto;
  readonly priceWedge: ExactRationalDto;
  readonly taxAmount: ExactRationalDto;
  readonly wedgeEqualsTaxExactly: true;
}

export interface KpSupplyTaxGovernmentRevenueState {
  readonly marketStateId: string;
  readonly phase: KpPerUnitTaxMarketPhase;
  readonly amount: ExactRationalDto;
}

export function createKpSemanticStateSupplyTaxAuthoring(
  input?: KpPerUnitTaxWelfareInputV1
) {
  // Rebuilding through the domain constructor keeps exact economics upstream.
  const model = createKpPerUnitTaxWelfareModel(input);
  const accounting = createKpPerUnitTaxWelfareAccounting(model);
  const untaxedSupply = projectBuyerFacingSupply(model, "untaxed");
  const taxedSupply = projectBuyerFacingSupply(model, "taxed");

  // supply-tax-authoring:start
  const schema = kpStateGroup({
    source: kpStateGroup({
      demand: kpStateValue<KpLinearTaxDemandContractV1>(model.input.demand),
      originalSupply: kpStateValue<KpLinearTaxSupplyContractV1>(
        model.input.supply
      ),
      tax: kpStateValue<KpPerUnitTaxContractV1>(model.input.tax)
    }),
    market: kpStateGroup({
      phase: kpStateValue<KpPerUnitTaxMarketPhase>("untaxed"),
      supply: kpStateValue<KpSupplyTaxBuyerFacingSupplyState>(untaxedSupply)
    }),
    outcomes: kpStateGroup({
      equilibrium: kpStateDerived<KpPerUnitTaxMarketStateV1>(),
      incidence: kpStateDerived<KpSupplyTaxIncidenceState>(),
      governmentRevenue:
        kpStateDerived<KpSupplyTaxGovernmentRevenueState>()
    })
  });
  const compiled = compileKpSemanticStateSchema(
    "economics.supply-tax.authoring",
    schema
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const equilibrium = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.outcomes.equilibrium,
    dependencies: [
      handles.refs.source.demand,
      handles.refs.market.phase,
      handles.refs.market.supply
    ],
    compute: ([_demand, phase, supply]) => selectCanonicalMarketState(
      model,
      phase,
      supply
    )
  });
  const incidence = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.outcomes.incidence,
    dependencies: [handles.refs.outcomes.equilibrium],
    compute: ([market]) => projectCanonicalIncidence(market)
  });
  const governmentRevenue = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.outcomes.governmentRevenue,
    dependencies: [handles.refs.outcomes.equilibrium],
    compute: ([market]) => projectCanonicalGovernmentRevenue(
      accounting,
      market
    )
  });
  const derivations = Object.freeze([
    equilibrium,
    incidence,
    governmentRevenue
  ]);
  const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations
  });
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, derivations)
  );
  const addSellerTax = defineKpSemanticStateTransform({
    compiled,
    handles,
    id: "add-seller-tax",
    author(state) {
      state.market.phase.update(() => "taxed");
      state.market.supply.update(() => taxedSupply);
    }
  });
  const applied = addSellerTax.apply(initial, "first");
  // supply-tax-authoring:end

  return Object.freeze({
    model,
    accounting,
    schema,
    compiled,
    handles,
    derivations: Object.freeze({ equilibrium, incidence, governmentRevenue }),
    graph,
    initial,
    addSellerTax,
    applied
  });
}

function selectCanonicalMarketState(
  model: KpPerUnitTaxWelfareModelV1,
  phase: KpPerUnitTaxMarketPhase,
  supply: KpSupplyTaxBuyerFacingSupplyState
): KpPerUnitTaxMarketStateV1 {
  if (supply.phase !== phase) {
    throw new Error("Buyer-facing supply and market phase must advance together.");
  }
  return model.states[phase];
}

function projectCanonicalIncidence(
  market: KpPerUnitTaxMarketStateV1
): KpSupplyTaxIncidenceState {
  return Object.freeze({
    marketStateId: market.id,
    phase: market.phase,
    buyerPrice: market.consumerPrice,
    sellerPrice: market.producerPrice,
    priceWedge: market.priceWedge,
    taxAmount: market.taxAmount,
    wedgeEqualsTaxExactly: market.wedgeEqualsTaxExactly
  });
}

function projectCanonicalGovernmentRevenue(
  accounting: KpPerUnitTaxWelfareAccountingV1,
  market: KpPerUnitTaxMarketStateV1
): KpSupplyTaxGovernmentRevenueState {
  const welfare = accounting.states[market.phase];
  if (welfare.marketStateId !== market.id) {
    throw new Error("Welfare accounting must reference the selected market state.");
  }
  return Object.freeze({
    marketStateId: market.id,
    phase: market.phase,
    amount: welfare.governmentRevenue
  });
}

function projectBuyerFacingSupply(
  model: KpPerUnitTaxWelfareModelV1,
  phase: KpPerUnitTaxMarketPhase
): KpSupplyTaxBuyerFacingSupplyState {
  const supply = model.input.supply;
  return Object.freeze({
    id: phase === "untaxed" ? supply.id : supply.taxedId,
    sourceSupplyId: supply.id,
    label: phase === "untaxed" ? supply.label : supply.taxedLabel,
    phase,
    direction: supply.direction,
    equationForm: supply.equationForm,
    priceIntercept: evaluateKpPerUnitTaxBuyerFacingSupplyPrice({
      model,
      phase,
      quantity: { numerator: "0", denominator: "1" }
    }),
    priceChangePerQuantity: supply.priceChangePerQuantity,
    taxAmount: model.states[phase].taxAmount
  });
}
