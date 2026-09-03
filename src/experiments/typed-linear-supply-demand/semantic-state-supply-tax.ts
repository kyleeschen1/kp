import {
  createKpPerUnitTaxWelfareModel,
  evaluateKpPerUnitTaxBuyerFacingSupplyPrice,
  type KpPerUnitTaxMarketPhase,
  type KpPerUnitTaxWelfareModelV1
} from "../../../domains/economics/per-unit-tax-welfare-model.ts";
import type {
  KpLinearTaxDemandContractV1,
  KpLinearTaxSupplyContractV1,
  KpPerUnitTaxContractV1,
  KpPerUnitTaxWelfareInputV1
} from "../../../domains/economics/per-unit-tax-welfare.ts";
import type { ExactRationalDto } from "../../../protocols/public-api.ts";
import { compileKpSemanticStateSchema } from
  "../../semantic-state/authoring-schema-compiler.ts";
import { createKpSemanticStateHandleSet } from
  "../../semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../../semantic-state/authoring-state-materializer.ts";
import { defineKpSemanticStateTransform } from
  "../../semantic-state/authoring-state-transform.ts";
import { kpStateGroup, kpStateValue } from
  "../../semantic-state/authoring-schema.ts";

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

export function createKpSemanticStateSupplyTaxAuthoring(
  input?: KpPerUnitTaxWelfareInputV1
) {
  // Rebuilding through the domain constructor keeps exact economics upstream.
  const model = createKpPerUnitTaxWelfareModel(input);
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
    })
  });
  const compiled = compileKpSemanticStateSchema(
    "economics.supply-tax.authoring",
    schema
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const initial = materializeKpSemanticStateInitialSnapshot(compiled);
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
    schema,
    compiled,
    handles,
    initial,
    addSellerTax,
    applied
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
