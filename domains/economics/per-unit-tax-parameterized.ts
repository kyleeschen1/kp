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
export const kpParameterizedDemandInterceptAndTaxEvaluationSchemaVersion =
  "kp.economics.parameterized-demand-intercept-and-tax-evaluation.v1" as const;

export interface KpParameterizedPerUnitTaxEvaluationV1 {
  readonly schemaVersion:
    typeof kpParameterizedPerUnitTaxEvaluationSchemaVersion;
  readonly sourceModelId: string;
  readonly taxAmount: ExactRationalDto;
  readonly model: KpPerUnitTaxWelfareModelV1;
  readonly market: KpPerUnitTaxMarketStateV1;
  readonly accounting: KpPerUnitTaxWelfareStateV1;
}

export interface KpParameterizedDemandInterceptAndTaxEvaluationV1 {
  readonly schemaVersion:
    typeof kpParameterizedDemandInterceptAndTaxEvaluationSchemaVersion;
  readonly sourceModelId: string;
  readonly demandPriceIntercept: ExactRationalDto;
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

/**
 * Rebuilds canonical input for the two independently authored parameters.
 * Market clearing and welfare remain delegated to their existing exact
 * constructors, so this adapter owns parameter substitution but no formulas.
 */
export function evaluateKpParameterizedDemandInterceptAndPerUnitTax(input: {
  readonly model: KpPerUnitTaxWelfareModelV1;
  readonly demandPriceIntercept: ExactRationalDto;
  readonly taxAmount: ExactRationalDto;
}): KpParameterizedDemandInterceptAndTaxEvaluationV1 {
  const demandPriceIntercept = normalizeExactParameter(
    input.demandPriceIntercept,
    "demandPriceIntercept"
  );
  const taxAmount = normalizeTaxAmount(input.taxAmount);
  const initialAmount = normalizeTaxAmount(input.model.input.tax.initialAmount);
  const finalAmount = normalizeTaxAmount(input.model.input.tax.finalAmount);
  const sourceDemandPriceIntercept = normalizeExactParameter(
    input.model.input.demand.priceIntercept,
    "model.input.demand.priceIntercept"
  );
  const usesInitialEndpoint = equalKpRationals(taxAmount, initialAmount);
  const usesFinalEndpoint = equalKpRationals(taxAmount, finalAmount);
  const usesSourceDemand = equalKpRationals(
    demandPriceIntercept,
    sourceDemandPriceIntercept
  );
  const model = usesSourceDemand &&
    (usesInitialEndpoint || usesFinalEndpoint)
    ? input.model
    : createKpPerUnitTaxWelfareModel({
      ...input.model.input,
      demand: {
        ...input.model.input.demand,
        priceIntercept: toDto(demandPriceIntercept)
      },
      tax: {
        ...input.model.input.tax,
        // The canonical model keeps a positive taxed endpoint even when this
        // evaluation selects its zero-tax endpoint.
        finalAmount: usesInitialEndpoint
          ? input.model.input.tax.finalAmount
          : toDto(taxAmount)
      }
    });
  const accounting = createKpPerUnitTaxWelfareAccounting(model);
  const phase = usesInitialEndpoint ? "untaxed" : "taxed";
  const market = model.states[phase];

  return Object.freeze({
    schemaVersion:
      kpParameterizedDemandInterceptAndTaxEvaluationSchemaVersion,
    sourceModelId: input.model.id,
    demandPriceIntercept: model.input.demand.priceIntercept,
    taxAmount: market.taxAmount,
    model,
    market,
    accounting: accounting.states[phase]
  });
}

function normalizeTaxAmount(value: ExactRationalDto): KpNormalizedRational {
  const normalized = normalizeExactParameter(value, "taxAmount");
  if (normalized.numerator < 0n) {
    throw new RangeError("taxAmount must be nonnegative.");
  }
  return normalized;
}

function normalizeExactParameter(
  value: ExactRationalDto,
  path: string
): KpNormalizedRational {
  if (!/^-?\d+$/.test(value.numerator) || !/^-?\d+$/.test(value.denominator)) {
    throw new Error(
      `${path} must use integer numerator and denominator strings.`
    );
  }
  try {
    return createKpRational(
      BigInt(value.numerator),
      BigInt(value.denominator)
    );
  } catch (error) {
    throw new Error(
      `${path} is invalid: ${
        error instanceof Error ? error.message : "unknown rational error"
      }`
    );
  }
}

function toDto(
  value: KpNormalizedRational
): ExactRationalDto {
  return Object.freeze({
    numerator: value.numerator.toString(),
    denominator: value.denominator.toString()
  });
}
