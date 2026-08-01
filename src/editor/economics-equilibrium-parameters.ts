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
  const raw = new URLSearchParams(search).get(
    kpEconomicsDemandInterceptParameter.queryKey
  );
  return createKpEconomicsEquilibriumParameterState(raw);
}

export function createKpEconomicsEquilibriumParameterState(
  value: string | number | null | undefined
): KpEconomicsEquilibriumParameterState {
  const parsed = typeof value === "number" ? value : Number(value);
  const demandInterceptAfter =
    Number.isInteger(parsed) &&
      parsed >= kpEconomicsDemandInterceptParameter.minimum &&
      parsed <= kpEconomicsDemandInterceptParameter.maximum
      ? parsed
      : kpEconomicsDemandInterceptParameter.defaultValue;
  return Object.freeze({
    schemaVersion: "kp.economics-equilibrium-parameters.v1",
    demandInterceptAfter
  });
}

export function writeKpEconomicsEquilibriumParameters(input: {
  readonly search: string;
  readonly state: KpEconomicsEquilibriumParameterState;
}): string {
  const params = new URLSearchParams(input.search);
  if (
    input.state.demandInterceptAfter ===
    kpEconomicsDemandInterceptParameter.defaultValue
  ) {
    params.delete(kpEconomicsDemandInterceptParameter.queryKey);
  } else {
    params.set(
      kpEconomicsDemandInterceptParameter.queryKey,
      String(input.state.demandInterceptAfter)
    );
  }
  const value = params.toString();
  return value.length === 0 ? "" : `?${value}`;
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

