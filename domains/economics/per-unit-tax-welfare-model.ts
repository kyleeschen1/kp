import type { ExactRationalDto } from "../../protocols/public-api.ts";
import {
  addKpRationals,
  createKpRational,
  divideKpRationals,
  equalKpRationals,
  multiplyKpRationals,
  subtractKpRationals,
  type KpNormalizedRational
} from "../math/exact-rational.ts";
import {
  kpPerUnitTaxWelfareExemplarInput,
  validateKpPerUnitTaxWelfareInput,
  type KpPerUnitTaxWelfareInputV1
} from "./per-unit-tax-welfare.ts";

export const kpPerUnitTaxWelfareModelSchemaVersion =
  "kp.economics.per-unit-tax-welfare-model.v1" as const;

export type KpPerUnitTaxMarketPhase = "untaxed" | "taxed";

export interface KpPerUnitTaxMarketStateV1 {
  readonly id: string;
  readonly phase: KpPerUnitTaxMarketPhase;
  readonly taxAmount: ExactRationalDto;
  readonly quantity: ExactRationalDto;
  readonly consumerPrice: ExactRationalDto;
  readonly producerPrice: ExactRationalDto;
  readonly demandPriceAtEquilibrium: ExactRationalDto;
  readonly originalSupplyPriceAtEquilibrium: ExactRationalDto;
  readonly buyerFacingSupplyPriceAtEquilibrium: ExactRationalDto;
  readonly priceWedge: ExactRationalDto;
  readonly marketClearsExactly: true;
  readonly wedgeEqualsTaxExactly: true;
}

export interface KpPerUnitTaxWelfareModelV1 {
  readonly schemaVersion: typeof kpPerUnitTaxWelfareModelSchemaVersion;
  readonly id: string;
  readonly input: KpPerUnitTaxWelfareInputV1;
  readonly states: {
    readonly untaxed: KpPerUnitTaxMarketStateV1;
    readonly taxed: KpPerUnitTaxMarketStateV1;
  };
}

export function createKpPerUnitTaxWelfareModel(
  input: KpPerUnitTaxWelfareInputV1 = kpPerUnitTaxWelfareExemplarInput
): KpPerUnitTaxWelfareModelV1 {
  const issues = validateKpPerUnitTaxWelfareInput(input);
  if (issues.length > 0) {
    throw new Error(
      issues.map(({ path, message }) => `${path}: ${message}`).join(" ")
    );
  }
  const clonedInput = cloneInput(input);
  return Object.freeze({
    schemaVersion: kpPerUnitTaxWelfareModelSchemaVersion,
    id: `model.${clonedInput.id}`,
    input: clonedInput,
    states: Object.freeze({
      untaxed: solveMarketState(clonedInput, "untaxed"),
      taxed: solveMarketState(clonedInput, "taxed")
    })
  });
}

export function evaluateKpPerUnitTaxDemandPrice(input: {
  readonly model: KpPerUnitTaxWelfareModelV1;
  readonly quantity: ExactRationalDto;
}): ExactRationalDto {
  const quantity = parseExact(input.quantity, "quantity");
  return toDto(subtractKpRationals(
    parseExact(input.model.input.demand.priceIntercept,
      "demand.priceIntercept"),
    multiplyKpRationals(
      parseExact(input.model.input.demand.priceChangePerQuantity,
        "demand.priceChangePerQuantity"),
      quantity
    )
  ));
}

export function evaluateKpPerUnitTaxSupplyPrice(input: {
  readonly model: KpPerUnitTaxWelfareModelV1;
  readonly quantity: ExactRationalDto;
}): ExactRationalDto {
  return toDto(evaluateSupply(
    input.model.input,
    parseExact(input.quantity, "quantity")
  ));
}

export function evaluateKpPerUnitTaxBuyerFacingSupplyPrice(input: {
  readonly model: KpPerUnitTaxWelfareModelV1;
  readonly phase: KpPerUnitTaxMarketPhase;
  readonly quantity: ExactRationalDto;
}): ExactRationalDto {
  const tax = parseExact(
    input.phase === "untaxed"
      ? input.model.input.tax.initialAmount
      : input.model.input.tax.finalAmount,
    `tax.${input.phase}`
  );
  return toDto(addKpRationals(
    evaluateSupply(input.model.input, parseExact(input.quantity, "quantity")),
    tax
  ));
}

function solveMarketState(
  input: KpPerUnitTaxWelfareInputV1,
  phase: KpPerUnitTaxMarketPhase
): KpPerUnitTaxMarketStateV1 {
  const supplyIntercept = parseExact(
    input.supply.priceIntercept,
    "supply.priceIntercept"
  );
  const supplySlope = parseExact(
    input.supply.priceChangePerQuantity,
    "supply.priceChangePerQuantity"
  );
  const demandIntercept = parseExact(
    input.demand.priceIntercept,
    "demand.priceIntercept"
  );
  const demandSlope = parseExact(
    input.demand.priceChangePerQuantity,
    "demand.priceChangePerQuantity"
  );
  const taxAmount = parseExact(
    phase === "untaxed" ? input.tax.initialAmount : input.tax.finalAmount,
    `tax.${phase}`
  );
  const quantity = divideKpRationals(
    subtractKpRationals(
      subtractKpRationals(demandIntercept, supplyIntercept),
      taxAmount
    ),
    addKpRationals(supplySlope, demandSlope)
  );
  const producerPrice = addKpRationals(
    supplyIntercept,
    multiplyKpRationals(supplySlope, quantity)
  );
  const consumerPrice = subtractKpRationals(
    demandIntercept,
    multiplyKpRationals(demandSlope, quantity)
  );
  const buyerFacingSupplyPrice = addKpRationals(producerPrice, taxAmount);
  const priceWedge = subtractKpRationals(consumerPrice, producerPrice);

  // Market clearing is an economic invariant. A renderer may project these
  // values, but it must never repair or infer them from line intersections.
  if (!equalKpRationals(consumerPrice, buyerFacingSupplyPrice)) {
    throw new Error(`Exact ${phase} market does not clear.`);
  }
  if (!equalKpRationals(priceWedge, taxAmount)) {
    throw new Error(`Exact ${phase} price wedge does not equal the tax.`);
  }
  assertInsideAxes(input, quantity, consumerPrice, producerPrice, phase);

  return Object.freeze({
    id: input.equilibriumIds[phase],
    phase,
    taxAmount: toDto(taxAmount),
    quantity: toDto(quantity),
    consumerPrice: toDto(consumerPrice),
    producerPrice: toDto(producerPrice),
    demandPriceAtEquilibrium: toDto(consumerPrice),
    originalSupplyPriceAtEquilibrium: toDto(producerPrice),
    buyerFacingSupplyPriceAtEquilibrium: toDto(buyerFacingSupplyPrice),
    priceWedge: toDto(priceWedge),
    marketClearsExactly: true,
    wedgeEqualsTaxExactly: true
  });
}

function evaluateSupply(
  input: KpPerUnitTaxWelfareInputV1,
  quantity: KpNormalizedRational
): KpNormalizedRational {
  return addKpRationals(
    parseExact(input.supply.priceIntercept, "supply.priceIntercept"),
    multiplyKpRationals(
      parseExact(input.supply.priceChangePerQuantity,
        "supply.priceChangePerQuantity"),
      quantity
    )
  );
}

function assertInsideAxes(
  input: KpPerUnitTaxWelfareInputV1,
  quantity: KpNormalizedRational,
  consumerPrice: KpNormalizedRational,
  producerPrice: KpNormalizedRational,
  phase: KpPerUnitTaxMarketPhase
): void {
  const quantityMin = parseExact(input.axes.quantity.minimum,
    "axes.quantity.minimum");
  const quantityMax = parseExact(input.axes.quantity.maximum,
    "axes.quantity.maximum");
  const priceMin = parseExact(input.axes.price.minimum, "axes.price.minimum");
  const priceMax = parseExact(input.axes.price.maximum, "axes.price.maximum");
  if (compare(quantity, quantityMin) < 0 || compare(quantity, quantityMax) > 0) {
    throw new RangeError(`Exact ${phase} quantity lies outside the axis domain.`);
  }
  for (const [role, value] of [
    ["consumer", consumerPrice],
    ["producer", producerPrice]
  ] as const) {
    if (compare(value, priceMin) < 0 || compare(value, priceMax) > 0) {
      throw new RangeError(
        `Exact ${phase} ${role} price lies outside the axis domain.`
      );
    }
  }
}

function parseExact(value: ExactRationalDto, path: string): KpNormalizedRational {
  if (!/^-?\d+$/.test(value.numerator) || !/^-?\d+$/.test(value.denominator)) {
    throw new Error(`${path} must use integer numerator and denominator strings.`);
  }
  try {
    return createKpRational(BigInt(value.numerator), BigInt(value.denominator));
  } catch (error) {
    throw new Error(
      `${path} is invalid: ${error instanceof Error ? error.message : "unknown rational error"}`
    );
  }
}

function toDto(value: KpNormalizedRational): ExactRationalDto {
  return Object.freeze({
    numerator: value.numerator.toString(),
    denominator: value.denominator.toString()
  });
}

function compare(
  left: KpNormalizedRational,
  right: KpNormalizedRational
): number {
  const difference = left.numerator * right.denominator -
    right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function cloneInput(
  input: KpPerUnitTaxWelfareInputV1
): KpPerUnitTaxWelfareInputV1 {
  const cloneExact = (value: ExactRationalDto): ExactRationalDto =>
    toDto(parseExact(value, "exact value"));
  return Object.freeze({
    ...input,
    axes: Object.freeze({
      quantity: Object.freeze({
        ...input.axes.quantity,
        minimum: cloneExact(input.axes.quantity.minimum),
        maximum: cloneExact(input.axes.quantity.maximum),
        tickStep: cloneExact(input.axes.quantity.tickStep)
      }),
      price: Object.freeze({
        ...input.axes.price,
        minimum: cloneExact(input.axes.price.minimum),
        maximum: cloneExact(input.axes.price.maximum),
        tickStep: cloneExact(input.axes.price.tickStep)
      })
    }),
    supply: Object.freeze({
      ...input.supply,
      priceIntercept: cloneExact(input.supply.priceIntercept),
      priceChangePerQuantity: cloneExact(input.supply.priceChangePerQuantity)
    }),
    demand: Object.freeze({
      ...input.demand,
      priceIntercept: cloneExact(input.demand.priceIntercept),
      priceChangePerQuantity: cloneExact(input.demand.priceChangePerQuantity)
    }),
    tax: Object.freeze({
      ...input.tax,
      initialAmount: cloneExact(input.tax.initialAmount),
      finalAmount: cloneExact(input.tax.finalAmount)
    }),
    equilibriumIds: Object.freeze({ ...input.equilibriumIds }),
    preservation: Object.freeze([...input.preservation])
  });
}
