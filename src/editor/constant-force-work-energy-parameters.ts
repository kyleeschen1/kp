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
  const raw = new URLSearchParams(search).get(
    kpConstantForceWorkEnergyForceParameter.queryKey
  );
  return createKpConstantForceWorkEnergyParameterState(raw);
}

export function createKpConstantForceWorkEnergyParameterState(
  value: string | number | null | undefined
): KpConstantForceWorkEnergyParameterState {
  const parsed = typeof value === "number" ? value : Number(value);
  const netForceNewtons =
    Number.isInteger(parsed) &&
      parsed >= kpConstantForceWorkEnergyForceParameter.minimum &&
      parsed <= kpConstantForceWorkEnergyForceParameter.maximum
      ? parsed
      : kpConstantForceWorkEnergyForceParameter.defaultValue;
  return Object.freeze({
    schemaVersion: "kp.constant-force-work-energy-parameters.v1",
    netForceNewtons
  });
}

export function writeKpConstantForceWorkEnergyParameters(input: {
  readonly search: string;
  readonly state: KpConstantForceWorkEnergyParameterState;
}): string {
  const params = new URLSearchParams(input.search);
  if (
    input.state.netForceNewtons ===
    kpConstantForceWorkEnergyForceParameter.defaultValue
  ) {
    params.delete(kpConstantForceWorkEnergyForceParameter.queryKey);
  } else {
    params.set(
      kpConstantForceWorkEnergyForceParameter.queryKey,
      String(input.state.netForceNewtons)
    );
  }
  const value = params.toString();
  return value.length === 0 ? "" : `?${value}`;
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
