import {
  kpSupplyDemandEquilibriumExemplarInput,
  type KpSupplyDemandEquilibriumModelInputV1
} from "../../domains/economics/supply-demand-equilibrium.ts";
import {
  createKpSupplyDemandEquilibriumModel
} from "../../domains/economics/supply-demand-equilibrium-model.ts";
import {
  createEconomicsEquilibriumAnimationAsset,
  economicsEquilibriumAnimationId
} from "../animation/economics-equilibrium-adapter.ts";
import {
  normalizeKpBoundedIntegerQueryParameter,
  readKpBoundedIntegerQueryParameter,
  writeKpBoundedIntegerQueryParameter
} from "./bounded-integer-query-parameter.ts";

export const kpEconomicsDemandInterceptParameter = Object.freeze({
  id: "parameter.economics.demand-price-intercept",
  queryKey: "demandIntercept",
  minimum: 15,
  maximum: 20,
  step: 1,
  defaultValue: 18
});

export interface KpEconomicsEquilibriumParameterState {
  readonly schemaVersion: "kp.economics-equilibrium-parameters.v1";
  readonly demandInterceptAfter: number;
}

export function readKpEconomicsEquilibriumParameters(
  search: string
): KpEconomicsEquilibriumParameterState {
  return createKpEconomicsEquilibriumParameterState(
    readKpBoundedIntegerQueryParameter({
      search,
      parameter: kpEconomicsDemandInterceptParameter
    })
  );
}

export function createKpEconomicsEquilibriumParameterState(
  value: string | number | null | undefined
): KpEconomicsEquilibriumParameterState {
  const demandInterceptAfter = normalizeKpBoundedIntegerQueryParameter({
    value,
    parameter: kpEconomicsDemandInterceptParameter
  });
  return Object.freeze({
    schemaVersion: "kp.economics-equilibrium-parameters.v1",
    demandInterceptAfter
  });
}

export function writeKpEconomicsEquilibriumParameters(input: {
  readonly search: string;
  readonly state: KpEconomicsEquilibriumParameterState;
}): string {
  return writeKpBoundedIntegerQueryParameter({
    search: input.search,
    parameter: kpEconomicsDemandInterceptParameter,
    value: input.state.demandInterceptAfter
  });
}

export function createParameterizedEconomicsEquilibriumAnimation(
  state: KpEconomicsEquilibriumParameterState
) {
  const input: KpSupplyDemandEquilibriumModelInputV1 = {
    ...kpSupplyDemandEquilibriumExemplarInput,
    demand: {
      ...kpSupplyDemandEquilibriumExemplarInput.demand,
      priceInterceptAfter: {
        numerator: String(state.demandInterceptAfter),
        denominator: "1"
      }
    }
  };
  const model = createKpSupplyDemandEquilibriumModel(input);
  const animation = createEconomicsEquilibriumAnimationAsset(model);
  if (animation.id !== economicsEquilibriumAnimationId) {
    throw new Error("Parameterized economics asset changed animation identity.");
  }
  return Object.freeze({ state, model, animation });
}
