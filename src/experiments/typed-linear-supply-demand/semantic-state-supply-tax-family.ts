import {
  evaluateKpParameterizedPerUnitTax,
  type KpParameterizedPerUnitTaxEvaluationV1
} from "../../../domains/economics/per-unit-tax-parameterized.ts";
import {
  createKpPerUnitTaxWelfareModel,
  evaluateKpPerUnitTaxBuyerFacingSupplyPrice,
  type KpPerUnitTaxMarketStateV1
} from "../../../domains/economics/per-unit-tax-welfare-model.ts";
import type {
  KpPerUnitTaxWelfareInputV1
} from "../../../domains/economics/per-unit-tax-welfare.ts";
import {
  addExactRationals,
  createExactRational,
  multiplyExactRationals,
  subtractExactRationals,
  type NormalizedExactRational
} from "../../../protocols/exact-rational.ts";
import type { ExactRationalDto } from "../../../protocols/public-api.ts";
import { defineKpSemanticStateDerivation } from
  "../../semantic-state/authoring-derived-definition.ts";
import { compileKpSemanticStateSchema } from
  "../../semantic-state/authoring-schema-compiler.ts";
import { createKpSemanticStateHandleSet } from
  "../../semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../../semantic-state/authoring-state-materializer.ts";
import { kpStateDerived, kpStateGroup, kpStateValue } from
  "../../semantic-state/authoring-schema.ts";
import {
  compileKpSemanticDerivedGraph,
  normalizeKpSemanticDerivedGraphInput
} from "../../semantic-state/derived-graph.ts";
import type { KpSemanticProgress } from
  "../../semantic-state/semantic-progress.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../../semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../../semantic-state/state-family-transition.ts";
import type {
  KpSupplyTaxBuyerFacingSupplyState,
  KpSupplyTaxGovernmentRevenueState,
  KpSupplyTaxIncidenceState
} from "./semantic-state-supply-tax.ts";

export interface KpSupplyTaxFamilyParameters {
  readonly finalTaxAmount: ExactRationalDto;
}

export function createKpSemanticStateSupplyTaxFamilyAuthoring(
  input?: KpPerUnitTaxWelfareInputV1
) {
  const sourceModel = createKpPerUnitTaxWelfareModel(input);

  // supply-tax-family-authoring:start
  const schema = kpStateGroup({
    source: kpStateGroup({
      model: kpStateValue<KpPerUnitTaxWelfareInputV1>(sourceModel.input)
    }),
    market: kpStateGroup({
      taxAmount: kpStateValue<ExactRationalDto>(
        sourceModel.input.tax.initialAmount
      ),
      evaluation: kpStateDerived<KpParameterizedPerUnitTaxEvaluationV1>(),
      buyerFacingSupply:
        kpStateDerived<KpSupplyTaxBuyerFacingSupplyState>()
    }),
    outcomes: kpStateGroup({
      equilibrium: kpStateDerived<KpPerUnitTaxMarketStateV1>(),
      incidence: kpStateDerived<KpSupplyTaxIncidenceState>(),
      governmentRevenue:
        kpStateDerived<KpSupplyTaxGovernmentRevenueState>()
    })
  });
  const compiled = compileKpSemanticStateSchema(
    "economics.supply-tax.family-authoring",
    schema
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const evaluation = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.market.evaluation,
    dependencies: [handles.refs.source.model, handles.refs.market.taxAmount],
    compute: ([modelInput, taxAmount]) => evaluateKpParameterizedPerUnitTax({
      model: createKpPerUnitTaxWelfareModel(modelInput),
      taxAmount
    })
  });
  const buyerFacingSupply = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.market.buyerFacingSupply,
    dependencies: [handles.refs.market.evaluation],
    compute: ([evaluated]) => projectBuyerFacingSupply(evaluated)
  });
  const equilibrium = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.outcomes.equilibrium,
    dependencies: [handles.refs.market.evaluation],
    compute: ([evaluated]) => evaluated.market
  });
  const incidence = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.outcomes.incidence,
    dependencies: [handles.refs.outcomes.equilibrium],
    compute: ([market]) => projectIncidence(market)
  });
  const governmentRevenue = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.outcomes.governmentRevenue,
    dependencies: [handles.refs.market.evaluation],
    compute: ([evaluated]) => Object.freeze({
      marketStateId: evaluated.market.id,
      phase: evaluated.market.phase,
      amount: evaluated.accounting.governmentRevenue
    })
  });
  const derivations = Object.freeze([
    evaluation,
    buyerFacingSupply,
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
  const taxTransition = declareKpSemanticStateInterpolation({
    id: "tax-amount-interpolation",
    sourceId: "economics.supply-tax.family-authoring.tax-amount",
    target: handles.refs.market.taxAmount
  });
  const family = defineKpSemanticStateFamily({
    compiled,
    handles,
    id: "set-per-unit-tax",
    sourceId: "economics.supply-tax.family-authoring.set-per-unit-tax",
    parameters: kpStateFamilyParameters<KpSupplyTaxFamilyParameters>(),
    transitions: builder => [builder.interpolate(
      taxTransition,
      ({ before, after, progress }) => interpolateExact(
        before,
        after,
        progress
      )
    )] as const,
    author(parameters, state) {
      const evaluated = evaluateKpParameterizedPerUnitTax({
        model: sourceModel,
        taxAmount: parameters.finalTaxAmount
      });
      state.market.taxAmount.update(() => evaluated.taxAmount);
    }
  });
  const application = family.apply(initial, {
    applicationId: "canonical",
    parameters: { finalTaxAmount: sourceModel.input.tax.finalAmount },
    sourceId: "economics.supply-tax.family-authoring.application.canonical"
  });
  // supply-tax-family-authoring:end

  return Object.freeze({
    sourceModel,
    schema,
    compiled,
    handles,
    derivations: Object.freeze({
      evaluation,
      buyerFacingSupply,
      equilibrium,
      incidence,
      governmentRevenue
    }),
    graph,
    initial,
    taxTransition,
    family,
    application
  });
}

function projectBuyerFacingSupply(
  evaluated: KpParameterizedPerUnitTaxEvaluationV1
): KpSupplyTaxBuyerFacingSupplyState {
  const supply = evaluated.model.input.supply;
  const phase = evaluated.market.phase;
  return Object.freeze({
    id: phase === "untaxed" ? supply.id : supply.taxedId,
    sourceSupplyId: supply.id,
    label: phase === "untaxed" ? supply.label : supply.taxedLabel,
    phase,
    direction: supply.direction,
    equationForm: supply.equationForm,
    priceIntercept: evaluateKpPerUnitTaxBuyerFacingSupplyPrice({
      model: evaluated.model,
      phase,
      quantity: { numerator: "0", denominator: "1" }
    }),
    priceChangePerQuantity: supply.priceChangePerQuantity,
    taxAmount: evaluated.taxAmount
  });
}

function projectIncidence(
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

function interpolateExact(
  before: ExactRationalDto,
  after: ExactRationalDto,
  progress: KpSemanticProgress
): ExactRationalDto {
  const value = addExactRationals(
    parseExact(before),
    multiplyExactRationals(
      subtractExactRationals(parseExact(after), parseExact(before)),
      progress
    )
  );
  return Object.freeze({
    numerator: value.numerator.toString(),
    denominator: value.denominator.toString()
  });
}

function parseExact(value: ExactRationalDto): NormalizedExactRational {
  return createExactRational(
    BigInt(value.numerator),
    BigInt(value.denominator)
  );
}
