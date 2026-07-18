export interface KpTutorialNumericParameter {
  readonly id: string;
  readonly label: string;
  readonly defaultValue: number;
  readonly minimum: number;
  readonly maximum: number;
  readonly step: number;
}

export interface KpTutorialDerivedLaw {
  readonly id: string;
  readonly inputIds: readonly string[];
  readonly outputIds: readonly string[];
  readonly summary: string;
}

export interface KpTutorialInteractionModel {
  readonly id: string;
  readonly parameters: readonly KpTutorialNumericParameter[];
  readonly derivedLaws: readonly KpTutorialDerivedLaw[];
}

export type KpTutorialDerivedLawEvaluator = (
  inputs: Readonly<Record<string, number>>
) => Readonly<Record<string, number>>;

export interface KpTutorialInteractionFrame {
  readonly modelId: string;
  readonly parameterValues: Readonly<Record<string, number>>;
  readonly derivedValues: Readonly<Record<string, number>>;
}

export function sampleKpTutorialInteractionModel(input: {
  readonly model: KpTutorialInteractionModel;
  readonly parameterValues?: Readonly<Record<string, number>> | undefined;
  readonly evaluators: Readonly<Record<string, KpTutorialDerivedLawEvaluator>>;
}): KpTutorialInteractionFrame {
  const parameterValues = Object.fromEntries(
    input.model.parameters.map((parameter) => [
      parameter.id,
      normalizeParameter(
        input.parameterValues?.[parameter.id] ?? parameter.defaultValue,
        parameter
      )
    ])
  );
  const unknownParameterIds = Object.keys(input.parameterValues ?? {}).filter(
    (parameterId) => !(parameterId in parameterValues)
  );
  if (unknownParameterIds.length > 0) {
    throw new Error(`Unknown interaction parameters: ${unknownParameterIds.join(", ")}.`);
  }

  const derivedValues: Record<string, number> = {};
  for (const law of input.model.derivedLaws) {
    const evaluator = input.evaluators[law.id];
    if (evaluator === undefined) {
      throw new Error(`Missing evaluator for derived law ${law.id}.`);
    }
    const available = { ...parameterValues, ...derivedValues };
    const missing = law.inputIds.filter((inputId) => !(inputId in available));
    if (missing.length > 0) {
      throw new Error(`Derived law ${law.id} has unavailable inputs: ${missing.join(", ")}.`);
    }
    const result = evaluator(
      Object.fromEntries(law.inputIds.map((inputId) => [inputId, available[inputId]!]))
    );
    const resultIds = Object.keys(result);
    if (
      resultIds.length !== law.outputIds.length ||
      law.outputIds.some((outputId) => !resultIds.includes(outputId))
    ) {
      throw new Error(`Derived law ${law.id} returned undeclared outputs.`);
    }
    Object.assign(derivedValues, result);
  }

  return { modelId: input.model.id, parameterValues, derivedValues };
}

export function checkKpTutorialInteractionDeterminism(input: {
  readonly model: KpTutorialInteractionModel;
  readonly parameterValues?: Readonly<Record<string, number>> | undefined;
  readonly evaluators: Readonly<Record<string, KpTutorialDerivedLawEvaluator>>;
}): boolean {
  const first = sampleKpTutorialInteractionModel(input);
  const second = sampleKpTutorialInteractionModel(input);
  return JSON.stringify(first) === JSON.stringify(second);
}

function normalizeParameter(
  value: number,
  parameter: KpTutorialNumericParameter
): number {
  if (
    !Number.isFinite(value) ||
    !Number.isFinite(parameter.minimum) ||
    !Number.isFinite(parameter.maximum) ||
    parameter.minimum > parameter.maximum ||
    !Number.isFinite(parameter.step) ||
    parameter.step <= 0
  ) {
    throw new Error(`Invalid numeric parameter ${parameter.id}.`);
  }

  const clamped = Math.min(parameter.maximum, Math.max(parameter.minimum, value));
  const steps = Math.round((clamped - parameter.minimum) / parameter.step);
  return Number((parameter.minimum + steps * parameter.step).toPrecision(12));
}
