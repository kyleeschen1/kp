import {
  evaluateKpParameterizedDemandInterceptAndPerUnitTax,
  type KpParameterizedDemandInterceptAndTaxEvaluationV1
} from "../../../domains/economics/per-unit-tax-parameterized.ts";
import type {
  KpPerUnitTaxMarketStateV1
} from "../../../domains/economics/per-unit-tax-welfare-model.ts";
import {
  createKpPerUnitTaxWelfareModel
} from "../../../domains/economics/per-unit-tax-welfare-model.ts";
import type {
  KpPerUnitTaxWelfareStateV1
} from "../../../domains/economics/per-unit-tax-welfare-accounting.ts";
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
import { assembleKpSemanticStateModel } from
  "../../semantic-state/authoring-model-assembly.ts";
import {
  assembleKpSemanticStateExplanation,
  bindKpSemanticStateExplanationMember,
  defineKpSemanticStateModelFamily
} from "../../semantic-state/authoring-explanation-assembly.ts";
import { kpStateDerived, kpStateGroup, kpStateValue } from
  "../../semantic-state/authoring-schema.ts";
import type { KpSemanticProgress } from
  "../../semantic-state/semantic-progress.ts";
import {
  declareKpSemanticStateCompositionGroup,
  declareKpSemanticStateCompositionSequence
} from "../../semantic-state/state-family-composition-declaration.ts";
import {
  kpStateFamilyParameters
} from "../../semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../../semantic-state/state-family-transition.ts";

export interface KpComposedMarketDemandParameters {
  readonly demandPriceIntercept: ExactRationalDto;
}

export interface KpComposedMarketTaxParameters {
  readonly taxAmount: ExactRationalDto;
}

export function createKpSemanticStateComposedMarketPacket(
  input?: KpPerUnitTaxWelfareInputV1
) {
  const sourceModel = createKpPerUnitTaxWelfareModel(input);

  // composed-market-packet:start
  const schema = kpStateGroup({
    source: kpStateGroup({
      model: kpStateValue<KpPerUnitTaxWelfareInputV1>(sourceModel.input)
    }),
    drivers: kpStateGroup({
      demandPriceIntercept: kpStateValue<ExactRationalDto>(
        sourceModel.input.demand.priceIntercept
      ),
      taxAmount: kpStateValue<ExactRationalDto>(
        sourceModel.input.tax.initialAmount
      )
    }),
    outcomes: kpStateGroup({
      evaluation:
        kpStateDerived<KpParameterizedDemandInterceptAndTaxEvaluationV1>(),
      equilibrium: kpStateDerived<KpPerUnitTaxMarketStateV1>(),
      accounting: kpStateDerived<KpPerUnitTaxWelfareStateV1>()
    })
  });
  const model = assembleKpSemanticStateModel({
    namespace: "economics.composed-market",
    schema,
    derive: ({ refs, derive }) => {
      const evaluation = derive({
        target: refs.outcomes.evaluation,
        dependencies: [
          refs.source.model,
          refs.drivers.demandPriceIntercept,
          refs.drivers.taxAmount
        ],
        compute: ([modelInput, demandPriceIntercept, taxAmount]) =>
          evaluateKpParameterizedDemandInterceptAndPerUnitTax({
            model: createKpPerUnitTaxWelfareModel(modelInput),
            demandPriceIntercept,
            taxAmount
          })
      });
      const equilibrium = derive({
        target: refs.outcomes.equilibrium,
        dependencies: [refs.outcomes.evaluation],
        compute: ([evaluated]) => evaluated.market
      });
      const accounting = derive({
        target: refs.outcomes.accounting,
        dependencies: [refs.outcomes.evaluation],
        compute: ([evaluated]) => evaluated.accounting
      });
      return [evaluation, equilibrium, accounting];
    }
  });
  const stateHandles = model.handles;
  const demandTransition = declareKpSemanticStateInterpolation({
    id: "demand-intercept-interpolation",
    sourceId: "economics.composed-market.demand-intercept",
    target: stateHandles.refs.drivers.demandPriceIntercept
  });
  const taxTransition = declareKpSemanticStateInterpolation({
    id: "tax-amount-interpolation",
    sourceId: "economics.composed-market.tax-amount",
    target: stateHandles.refs.drivers.taxAmount
  });
  const demandFamily = defineKpSemanticStateModelFamily(model, {
    id: "set-demand-intercept",
    sourceId: "economics.composed-market.set-demand-intercept",
    parameters: kpStateFamilyParameters<KpComposedMarketDemandParameters>(),
    transitions: builder => Object.freeze([builder.interpolate(
      demandTransition,
      ({ before, after, progress }) => interpolateExact(
        before,
        after,
        progress
      )
    )]),
    author(parameters, state) {
      const validated =
        evaluateKpParameterizedDemandInterceptAndPerUnitTax({
          model: sourceModel,
          demandPriceIntercept: parameters.demandPriceIntercept,
          taxAmount: sourceModel.input.tax.initialAmount
        });
      state.drivers.demandPriceIntercept.update(
        () => validated.demandPriceIntercept
      );
    }
  });
  const taxFamily = defineKpSemanticStateModelFamily(model, {
    id: "set-per-unit-tax",
    sourceId: "economics.composed-market.set-per-unit-tax",
    parameters: kpStateFamilyParameters<KpComposedMarketTaxParameters>(),
    transitions: builder => Object.freeze([builder.interpolate(
      taxTransition,
      ({ before, after, progress }) => interpolateExact(
        before,
        after,
        progress
      )
    )]),
    author(parameters, state) {
      const validated =
        evaluateKpParameterizedDemandInterceptAndPerUnitTax({
          model: sourceModel,
          demandPriceIntercept: sourceModel.input.demand.priceIntercept,
          taxAmount: parameters.taxAmount
        });
      state.drivers.taxAmount.update(() => validated.taxAmount);
    }
  });
  const demandApplication = demandFamily.prepareApplication({
    applicationId: "raise-demand",
    parameters: {
      demandPriceIntercept: { numerator: "14", denominator: "1" }
    },
    sourceId: "economics.composed-market.raise-demand"
  });
  const taxApplication = taxFamily.prepareApplication({
    applicationId: "add-tax",
    parameters: { taxAmount: { numerator: "2", denominator: "1" } },
    sourceId: "economics.composed-market.add-tax"
  });
  const demandMember = bindKpSemanticStateExplanationMember({
    name: "raise-demand",
    sourceId: "economics.composed-market.member.raise-demand",
    application: demandApplication,
    definition: demandFamily
  });
  const taxMember = bindKpSemanticStateExplanationMember({
    name: "add-tax",
    sourceId: "economics.composed-market.member.add-tax",
    application: taxApplication,
    definition: taxFamily
  });
  const root = declareKpSemanticStateCompositionGroup({
    name: "market-policy",
    sourceId: "economics.composed-market.group.market-policy",
    body: declareKpSemanticStateCompositionSequence({
      name: "timeline",
      sourceId: "economics.composed-market.sequence.timeline",
      members: [
        declareKpSemanticStateCompositionGroup({
          name: "demand-shift",
          sourceId: "economics.composed-market.group.demand-shift",
          body: demandMember.member
        }),
        declareKpSemanticStateCompositionGroup({
          name: "tax-policy",
          sourceId: "economics.composed-market.group.tax-policy",
          body: taxMember.member
        })
      ]
    })
  });
  const explanation = assembleKpSemanticStateExplanation({
    model,
    localId: "demand-then-tax",
    sourceId: "economics.composed-market.composition",
    root,
    members: [demandMember, taxMember]
  });
  // composed-market-packet:end

  return Object.freeze({
    sourceModel,
    schema,
    model,
    explanation,
    compiled: model.compiled,
    stateHandles,
    derivations: Object.freeze({
      evaluation: model.derivations[0]!,
      equilibrium: model.derivations[1]!,
      accounting: model.derivations[2]!
    }),
    graph: model.graph,
    initial: model.initial,
    transitions: Object.freeze({ demand: demandTransition, tax: taxTransition }),
    families: Object.freeze({ demand: demandFamily, tax: taxFamily }),
    applications: Object.freeze({
      demand: demandApplication,
      tax: taxApplication
    }),
    members: Object.freeze({ demand: demandMember.member, tax: taxMember.member }),
    declaration: explanation.declaration,
    validated: explanation.validated,
    preflight: explanation.preflight,
    composition: explanation.composition,
    endpointBindings: explanation.endpointBindings,
    chain: explanation.chain,
    compositionHandles: explanation.handles
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
