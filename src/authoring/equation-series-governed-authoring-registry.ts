import {
  kpEquationSeriesBothSidesAuthoringDeclarations,
  validateKpEquationSeriesBothSidesAuthoring
} from "./equation-series-both-sides-authoring.ts";
import type { KpNormalizedEquationTransformSeriesState } from
  "./equation-latex-endpoint-normalizer.ts";
import type { KpEquationSeriesVerifiedSemanticSource } from
  "./equation-series-governed-source.ts";
import {
  kpEquationSeriesLogarithmBaseAuthoringDeclaration,
  validateKpEquationSeriesLogarithmBaseAuthoring
} from "./equation-series-logarithm-base-authoring.ts";
import type { KpEquationSeriesIntentResolutionResult } from
  "./equation-series-intent-resolver.ts";
import type { KpEquationSeriesExternalDiagnostic } from
  "./equation-series-repair-taxonomy.ts";
import type { KpEquationTransformSeriesRequest } from
  "./equation-transform-series-request.ts";
import {
  kpEquationSeriesFractionEquivalenceAuthoringDeclaration,
  validateKpEquationSeriesFractionEquivalenceAuthoring
} from "./equation-series-fraction-equivalence-authoring.ts";
import {
  kpEquationSeriesCommonDenominatorAuthoringDeclaration,
  validateKpEquationSeriesCommonDenominatorAuthoring
} from "./equation-series-common-denominator-authoring.ts";

export interface KpEquationSeriesGovernedAuthoringValidator {
  readonly id: string;
  readonly operationIds: readonly string[];
  readonly validate: (input: KpEquationSeriesGovernedAuthoringInput) =>
    readonly KpEquationSeriesExternalDiagnostic[];
}

export interface KpEquationSeriesGovernedAuthoringInput {
  readonly request: KpEquationTransformSeriesRequest;
  readonly normalizedStates:
    readonly KpNormalizedEquationTransformSeriesState[];
  readonly resolution: KpEquationSeriesIntentResolutionResult;
  readonly sourceAuthorities?:
    readonly KpEquationSeriesVerifiedSemanticSource[] | undefined;
}

export function createKpEquationSeriesGovernedAuthoringRegistry(
  validators: readonly KpEquationSeriesGovernedAuthoringValidator[]
): readonly KpEquationSeriesGovernedAuthoringValidator[] {
  const owners = new Set<string>();
  for (const validator of validators) {
    for (const operationId of validator.operationIds) {
      if (owners.has(operationId)) {
        throw new Error(`Duplicate governed authoring owner ${operationId}.`);
      }
      owners.add(operationId);
    }
  }
  return deepFreeze(validators.map((validator) => ({
    ...validator,
    operationIds: [...validator.operationIds]
  })));
}

export const kpEquationSeriesGovernedAuthoringRegistry =
  createKpEquationSeriesGovernedAuthoringRegistry([{
    id: "governance.equation-series.both-sides.v1",
    operationIds: kpEquationSeriesBothSidesAuthoringDeclarations.map(
      ({ operationId }) => operationId
    ),
    validate: validateKpEquationSeriesBothSidesAuthoring
  }, {
    id: "governance.equation-series.logarithm-base.v1",
    operationIds: [
      kpEquationSeriesLogarithmBaseAuthoringDeclaration.operationId
    ],
    validate: validateKpEquationSeriesLogarithmBaseAuthoring
  }, {
    id: "governance.equation-series.fraction-equivalence.v1",
    operationIds: [
      kpEquationSeriesFractionEquivalenceAuthoringDeclaration.operationId
    ],
    validate: validateKpEquationSeriesFractionEquivalenceAuthoring
  }, {
    id: "governance.equation-series.common-denominator-alignment.v1",
    operationIds: [
      kpEquationSeriesCommonDenominatorAuthoringDeclaration.operationId
    ],
    validate: validateKpEquationSeriesCommonDenominatorAuthoring
  }]);

/** Each governed operation is dispatched by registered ownership, not a switch. */
export function validateKpEquationSeriesGovernedAuthoring(
  input: KpEquationSeriesGovernedAuthoringInput
): readonly KpEquationSeriesExternalDiagnostic[] {
  if (input.resolution.status !== "resolved") return Object.freeze([]);
  const selected = new Set(input.resolution.plans.map(
    ({ operationId }) => operationId
  ));
  return deepFreeze(kpEquationSeriesGovernedAuthoringRegistry
    .filter(({ operationIds }) => operationIds.some((id) => selected.has(id)))
    .flatMap(({ validate }) => validate(input)));
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
