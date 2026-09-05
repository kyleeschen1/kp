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
import { compileKpSemanticStateComposition } from
  "../../semantic-state/state-family-composition-compiler.ts";
import {
  declareKpSemanticStateComposition,
  declareKpSemanticStateCompositionGroup,
  declareKpSemanticStateCompositionMember,
  declareKpSemanticStateCompositionSequence
} from "../../semantic-state/state-family-composition-declaration.ts";
import {
  assembleKpSemanticStateCompositionEndpointChain,
  bindKpSemanticStateCompositionEndpoint
} from "../../semantic-state/state-family-composition-endpoints.ts";
import { createKpSemanticStateCompositionHandleSet } from
  "../../semantic-state/state-family-composition-handles.ts";
import {
  bindKpSemanticStateCompositionGraph,
  preflightKpSemanticStateComposition
} from "../../semantic-state/state-family-composition-preflight.ts";
import { validateKpSemanticStateComposition } from
  "../../semantic-state/state-family-composition-validation.ts";
import {
  defineKpSemanticStateFamily,
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
  const compiled = compileKpSemanticStateSchema(
    "economics.composed-market",
    schema
  );
  const stateHandles = createKpSemanticStateHandleSet(compiled);
  const evaluation = defineKpSemanticStateDerivation({
    compiled,
    target: stateHandles.refs.outcomes.evaluation,
    dependencies: [
      stateHandles.refs.source.model,
      stateHandles.refs.drivers.demandPriceIntercept,
      stateHandles.refs.drivers.taxAmount
    ],
    compute: ([modelInput, demandPriceIntercept, taxAmount]) =>
      evaluateKpParameterizedDemandInterceptAndPerUnitTax({
        model: createKpPerUnitTaxWelfareModel(modelInput),
        demandPriceIntercept,
        taxAmount
      })
  });
  const equilibrium = defineKpSemanticStateDerivation({
    compiled,
    target: stateHandles.refs.outcomes.equilibrium,
    dependencies: [stateHandles.refs.outcomes.evaluation],
    compute: ([evaluated]) => evaluated.market
  });
  const accounting = defineKpSemanticStateDerivation({
    compiled,
    target: stateHandles.refs.outcomes.accounting,
    dependencies: [stateHandles.refs.outcomes.evaluation],
    compute: ([evaluated]) => evaluated.accounting
  });
  const derivations = Object.freeze([evaluation, equilibrium, accounting]);
  const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations
  });
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, derivations)
  );
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
  const demandFamily = defineKpSemanticStateFamily({
    compiled,
    handles: stateHandles,
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
  const taxFamily = defineKpSemanticStateFamily({
    compiled,
    handles: stateHandles,
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
  const demandMember = declareKpSemanticStateCompositionMember({
    name: "raise-demand",
    sourceId: "economics.composed-market.member.raise-demand",
    application: demandApplication
  });
  const taxMember = declareKpSemanticStateCompositionMember({
    name: "add-tax",
    sourceId: "economics.composed-market.member.add-tax",
    application: taxApplication
  });
  const declaration = declareKpSemanticStateComposition({
    namespace: compiled.namespace,
    localId: "demand-then-tax",
    sourceId: "economics.composed-market.composition",
    root: declareKpSemanticStateCompositionGroup({
      name: "market-policy",
      sourceId: "economics.composed-market.group.market-policy",
      body: declareKpSemanticStateCompositionSequence({
        name: "timeline",
        sourceId: "economics.composed-market.sequence.timeline",
        members: [
          declareKpSemanticStateCompositionGroup({
            name: "demand-shift",
            sourceId: "economics.composed-market.group.demand-shift",
            body: demandMember
          }),
          declareKpSemanticStateCompositionGroup({
            name: "tax-policy",
            sourceId: "economics.composed-market.group.tax-policy",
            body: taxMember
          })
        ]
      })
    })
  });
  const validated = validateKpSemanticStateComposition({
    identities: compiled.identityScope,
    declaration,
    definitions: [demandFamily.declaration, taxFamily.declaration]
  });
  const preflight = preflightKpSemanticStateComposition({
    composition: validated,
    base: initial,
    graphBindings: [
      bindKpSemanticStateCompositionGraph({
        definitionId: demandFamily.id,
        graph
      }),
      bindKpSemanticStateCompositionGraph({
        definitionId: taxFamily.id,
        graph
      })
    ]
  });
  const composition = compileKpSemanticStateComposition({
    identities: compiled.identityScope,
    preflight
  });
  const endpointBindings = Object.freeze([
    bindKpSemanticStateCompositionEndpoint({
      definition: demandFamily,
      application: demandApplication
    }),
    bindKpSemanticStateCompositionEndpoint({
      definition: taxFamily,
      application: taxApplication
    })
  ]);
  const chain = assembleKpSemanticStateCompositionEndpointChain({
    composition,
    base: initial,
    bindings: endpointBindings
  });
  const compositionHandles =
    createKpSemanticStateCompositionHandleSet(composition);
  // composed-market-packet:end

  return Object.freeze({
    sourceModel,
    schema,
    compiled,
    stateHandles,
    derivations: Object.freeze({ evaluation, equilibrium, accounting }),
    graph,
    initial,
    transitions: Object.freeze({ demand: demandTransition, tax: taxTransition }),
    families: Object.freeze({ demand: demandFamily, tax: taxFamily }),
    applications: Object.freeze({
      demand: demandApplication,
      tax: taxApplication
    }),
    members: Object.freeze({ demand: demandMember, tax: taxMember }),
    declaration,
    validated,
    preflight,
    composition,
    endpointBindings,
    chain,
    compositionHandles
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
