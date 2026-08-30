import type { ExactRationalDto } from "../../protocols/public-api.ts";
import {
  createKpRational,
  type KpNormalizedRational
} from "../math/exact-rational.ts";
import type { KpEconomicsAxisContractV1 } from
  "./supply-demand-equilibrium.ts";

export const kpPerUnitTaxWelfareSchemaVersion =
  "kp.economics.per-unit-tax-welfare.v1" as const;

export const kpPerUnitTaxWelfarePreservation = [
  "demand-curve-identity",
  "original-supply-as-marginal-cost",
  "tax-as-vertical-price-wedge",
  "buyer-facing-tax-shifted-supply",
  "consumer-producer-price-distinction",
  "exact-rational-economic-truth"
] as const;

export type KpPerUnitTaxWelfarePreservation =
  typeof kpPerUnitTaxWelfarePreservation[number];

export interface KpLinearTaxSupplyContractV1 {
  readonly id: string;
  readonly taxedId: string;
  readonly label: "Supply";
  readonly taxedLabel: "Supply plus tax";
  readonly direction: "upward";
  readonly equationForm: "price-intercept-plus-slope-times-quantity";
  readonly priceIntercept: ExactRationalDto;
  readonly priceChangePerQuantity: ExactRationalDto;
}

export interface KpLinearTaxDemandContractV1 {
  readonly id: string;
  readonly label: "Demand";
  readonly direction: "downward";
  readonly equationForm: "price-intercept-minus-slope-times-quantity";
  readonly priceIntercept: ExactRationalDto;
  readonly priceChangePerQuantity: ExactRationalDto;
}

export interface KpPerUnitTaxContractV1 {
  readonly id: string;
  readonly label: "Per-unit tax";
  readonly application: "buyer-facing-supply-intercept";
  readonly initialAmount: ExactRationalDto;
  readonly finalAmount: ExactRationalDto;
}

export interface KpPerUnitTaxWelfareInputV1 {
  readonly schemaVersion: typeof kpPerUnitTaxWelfareSchemaVersion;
  readonly id: string;
  readonly title: string;
  readonly axes: {
    readonly quantity: KpEconomicsAxisContractV1;
    readonly price: KpEconomicsAxisContractV1;
  };
  readonly supply: KpLinearTaxSupplyContractV1;
  readonly demand: KpLinearTaxDemandContractV1;
  readonly tax: KpPerUnitTaxContractV1;
  readonly equilibriumIds: {
    readonly untaxed: string;
    readonly taxed: string;
  };
  readonly wedgeId: string;
  readonly preservation: readonly KpPerUnitTaxWelfarePreservation[];
}

export interface KpPerUnitTaxWelfareInputIssue {
  readonly path: string;
  readonly message: string;
}

const exact = (numerator: string, denominator = "1"): ExactRationalDto => ({
  numerator,
  denominator
});

// These values keep every market and welfare result exact while leaving
// enough graphical separation to inspect the tax wedge and lost trades.
export const kpPerUnitTaxWelfareExemplarInput = {
  schemaVersion: kpPerUnitTaxWelfareSchemaVersion,
  id: "economics.supply-demand.per-unit-tax",
  title: "A per-unit tax in a competitive market",
  axes: {
    quantity: {
      id: "axis.economics.tax.quantity",
      symbol: "Q",
      label: "Quantity",
      orientation: "horizontal",
      minimum: exact("0"),
      maximum: exact("8"),
      tickStep: exact("1")
    },
    price: {
      id: "axis.economics.tax.price",
      symbol: "P",
      label: "Price",
      orientation: "vertical",
      minimum: exact("0"),
      maximum: exact("14"),
      tickStep: exact("1")
    }
  },
  supply: {
    id: "curve.economics.tax.supply",
    taxedId: "curve.economics.tax.supply-with-tax",
    label: "Supply",
    taxedLabel: "Supply plus tax",
    direction: "upward",
    equationForm: "price-intercept-plus-slope-times-quantity",
    priceIntercept: exact("2"),
    priceChangePerQuantity: exact("1")
  },
  demand: {
    id: "curve.economics.tax.demand",
    label: "Demand",
    direction: "downward",
    equationForm: "price-intercept-minus-slope-times-quantity",
    priceIntercept: exact("12"),
    priceChangePerQuantity: exact("1")
  },
  tax: {
    id: "parameter.economics.per-unit-tax",
    label: "Per-unit tax",
    application: "buyer-facing-supply-intercept",
    initialAmount: exact("0"),
    finalAmount: exact("4")
  },
  equilibriumIds: {
    untaxed: "equilibrium.economics.tax.untaxed",
    taxed: "equilibrium.economics.tax.taxed"
  },
  wedgeId: "wedge.economics.tax",
  preservation: kpPerUnitTaxWelfarePreservation
} as const satisfies KpPerUnitTaxWelfareInputV1;

export function validateKpPerUnitTaxWelfareInput(
  input: KpPerUnitTaxWelfareInputV1
): readonly KpPerUnitTaxWelfareInputIssue[] {
  const issues: KpPerUnitTaxWelfareInputIssue[] = [];
  const exactFields = [
    ["axes.quantity.minimum", input.axes.quantity.minimum],
    ["axes.quantity.maximum", input.axes.quantity.maximum],
    ["axes.quantity.tickStep", input.axes.quantity.tickStep],
    ["axes.price.minimum", input.axes.price.minimum],
    ["axes.price.maximum", input.axes.price.maximum],
    ["axes.price.tickStep", input.axes.price.tickStep],
    ["supply.priceIntercept", input.supply.priceIntercept],
    ["supply.priceChangePerQuantity", input.supply.priceChangePerQuantity],
    ["demand.priceIntercept", input.demand.priceIntercept],
    ["demand.priceChangePerQuantity", input.demand.priceChangePerQuantity],
    ["tax.initialAmount", input.tax.initialAmount],
    ["tax.finalAmount", input.tax.finalAmount]
  ] as const;
  const parsed = new Map<string, KpNormalizedRational>();

  for (const [path, value] of exactFields) {
    try {
      parsed.set(
        path,
        createKpRational(BigInt(value.numerator), BigInt(value.denominator))
      );
    } catch (error) {
      issues.push({
        path,
        message: error instanceof Error ? error.message : "Invalid exact rational."
      });
    }
  }
  if (issues.length > 0) return Object.freeze(issues);

  requireLessThan(parsed, "axes.quantity.minimum", "axes.quantity.maximum", issues);
  requireLessThan(parsed, "axes.price.minimum", "axes.price.maximum", issues);
  requirePositive(parsed, "axes.quantity.tickStep", issues);
  requirePositive(parsed, "axes.price.tickStep", issues);
  requirePositive(parsed, "supply.priceChangePerQuantity", issues);
  requirePositive(parsed, "demand.priceChangePerQuantity", issues);
  requireZero(parsed, "tax.initialAmount", issues);
  requirePositive(parsed, "tax.finalAmount", issues);

  return Object.freeze(issues);
}

function requireLessThan(
  values: ReadonlyMap<string, KpNormalizedRational>,
  leftPath: string,
  rightPath: string,
  issues: KpPerUnitTaxWelfareInputIssue[]
): void {
  if (compare(values.get(leftPath)!, values.get(rightPath)!) < 0) return;
  issues.push({
    path: leftPath,
    message: `Must be less than ${rightPath}.`
  });
}

function requirePositive(
  values: ReadonlyMap<string, KpNormalizedRational>,
  path: string,
  issues: KpPerUnitTaxWelfareInputIssue[]
): void {
  if (compare(values.get(path)!, createKpRational(0n, 1n)) > 0) return;
  issues.push({ path, message: "Must be positive." });
}

function requireZero(
  values: ReadonlyMap<string, KpNormalizedRational>,
  path: string,
  issues: KpPerUnitTaxWelfareInputIssue[]
): void {
  if (compare(values.get(path)!, createKpRational(0n, 1n)) === 0) return;
  issues.push({ path, message: "Must be exactly zero for this exemplar." });
}

function compare(
  left: KpNormalizedRational,
  right: KpNormalizedRational
): number {
  const difference = left.numerator * right.denominator -
    right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}
