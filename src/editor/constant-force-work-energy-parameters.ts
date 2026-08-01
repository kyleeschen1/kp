import {
  kpConstantForceWorkEnergyExemplarInput
} from "../../domains/physics/constant-force-work-energy.ts";
import {
  createKpConstantForceWorkEnergyModel
} from "../../domains/physics/constant-force-work-energy-model.ts";
import {
  constantForceWorkEnergyAnimationId,
  createConstantForceWorkEnergyAnimationAsset
} from "../animation/constant-force-work-energy-adapter.ts";
import {
  normalizeKpBoundedIntegerQueryParameter,
  readKpBoundedIntegerQueryParameter,
  writeKpBoundedIntegerQueryParameter
} from "./bounded-integer-query-parameter.ts";

export const kpConstantForceWorkEnergyForceParameter = Object.freeze({
  id: "parameter.physics.work-energy.net-force-newtons",
  queryKey: "netForce",
  minimum: 1,
  maximum: 5,
  step: 1,
  defaultValue: 3
});

export interface KpConstantForceWorkEnergyParameterState {
  readonly schemaVersion: "kp.constant-force-work-energy-parameters.v1";
  readonly netForceNewtons: number;
}

export function readKpConstantForceWorkEnergyParameters(
  search: string
): KpConstantForceWorkEnergyParameterState {
  return createKpConstantForceWorkEnergyParameterState(
    readKpBoundedIntegerQueryParameter({
      search,
      parameter: kpConstantForceWorkEnergyForceParameter
    })
  );
}

export function createKpConstantForceWorkEnergyParameterState(
  value: string | number | null | undefined
): KpConstantForceWorkEnergyParameterState {
  const netForceNewtons = normalizeKpBoundedIntegerQueryParameter({
    value,
    parameter: kpConstantForceWorkEnergyForceParameter
  });
  return Object.freeze({
    schemaVersion: "kp.constant-force-work-energy-parameters.v1",
    netForceNewtons
  });
}

export function writeKpConstantForceWorkEnergyParameters(input: {
  readonly search: string;
  readonly state: KpConstantForceWorkEnergyParameterState;
}): string {
  return writeKpBoundedIntegerQueryParameter({
    search: input.search,
    parameter: kpConstantForceWorkEnergyForceParameter,
    value: input.state.netForceNewtons
  });
}

export function createParameterizedConstantForceWorkEnergyAnimation(
  state: KpConstantForceWorkEnergyParameterState
) {
  const model = createKpConstantForceWorkEnergyModel({
    input: kpConstantForceWorkEnergyExemplarInput,
    netForceMagnitude: {
      numerator: String(state.netForceNewtons),
      denominator: "1"
    }
  });
  const animation = createConstantForceWorkEnergyAnimationAsset(model);
  if (animation.id !== constantForceWorkEnergyAnimationId) {
    throw new Error("Parameterized physics asset changed animation identity.");
  }
  return Object.freeze({ state, model, animation });
}
