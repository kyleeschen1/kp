import type { ExactRationalDto } from "../../protocols/public-api.ts";
import {
  createKpRational,
  equalKpRationals,
  type KpNormalizedRational
} from "../math/exact-rational.ts";
import {
  createKpPerUnitTaxWelfareAccounting,
  type KpPerUnitTaxWelfareStateV1
} from "./per-unit-tax-welfare-accounting.ts";
import {
  createKpPerUnitTaxWelfareModel,
  type KpPerUnitTaxMarketStateV1,
  type KpPerUnitTaxWelfareModelV1
} from "./per-unit-tax-welfare-model.ts";

export const kpParameterizedPerUnitTaxEvaluationSchemaVersion =
  "kp.economics.parameterized-per-unit-tax-evaluation.v1" as const;

export interface KpParameterizedPerUnitTaxEvaluationV1 {
  readonly schemaVersion:
    typeof kpParameterizedPerUnitTaxEvaluationSchemaVersion;
  readonly sourceModelId: string;
  readonly taxAmount: ExactRationalDto;
  readonly model: KpPerUnitTaxWelfareModelV1;
  readonly market: KpPerUnitTaxMarketStateV1;
  readonly accounting: KpPerUnitTaxWelfareStateV1;
}

/**
 * Evaluates an explicit tax through the existing two-endpoint economics model.
 * The adapter substitutes only the tax parameter; market clearing and welfare
 * remain owned by the canonical model and accounting constructors.
 */
export function evaluateKpParameterizedPerUnitTax(input: {
  readonly model: KpPerUnitTaxWelfareModelV1;
  readonly taxAmount: ExactRationalDto;
}): KpParameterizedPerUnitTaxEvaluationV1 {
  const taxAmount = normalizeTaxAmount(input.taxAmount);
  const initialAmount = normalizeTaxAmount(input.model.input.tax.initialAmount);
  const finalAmount = normalizeTaxAmount(input.model.input.tax.finalAmount);
  const usesInitialEndpoint = equalKpRationals(taxAmount, initialAmount);
  const usesFinalEndpoint = equalKpRationals(taxAmount, finalAmount);
  const model = usesInitialEndpoint || usesFinalEndpoint
    ? input.model
    : createKpPerUnitTaxWelfareModel({
      ...input.model.input,
      tax: {
        ...input.model.input.tax,
        finalAmount: toDto(taxAmount)
      }
    });
  const accounting = createKpPerUnitTaxWelfareAccounting(model);
  const phase = usesInitialEndpoint ? "untaxed" : "taxed";
  const market = model.states[phase];

  return Object.freeze({
    schemaVersion: kpParameterizedPerUnitTaxEvaluationSchemaVersion,
    sourceModelId: input.model.id,
    taxAmount: market.taxAmount,
    model,
    market,
    accounting: accounting.states[phase]
  });
}

function normalizeTaxAmount(value: ExactRationalDto): KpNormalizedRational {
  if (!/^-?\d+$/.test(value.numerator) || !/^-?\d+$/.test(value.denominator)) {
    throw new Error(
      "taxAmount must use integer numerator and denominator strings."
    );
  }
  let normalized;
  try {
    normalized = createKpRational(
      BigInt(value.numerator),
      BigInt(value.denominator)
    );
  } catch (error) {
    throw new Error(
      `taxAmount is invalid: ${
        error instanceof Error ? error.message : "unknown rational error"
      }`
    );
  }
  if (normalized.numerator < 0n) {
    throw new RangeError("taxAmount must be nonnegative.");
  }
  return normalized;
}

function toDto(
  value: KpNormalizedRational
): ExactRationalDto {
  return Object.freeze({
    numerator: value.numerator.toString(),
    denominator: value.denominator.toString()
  });
}
