import type {
  ExactRationalDto,
  NormalizedExactRational
} from "../../protocols/public-api.ts";
import {
  addKpRationals,
  createKpRational,
  divideKpRationals,
  multiplyKpRationals,
  subtractKpRationals
} from "../math/exact-rational.ts";
import type {
  KpPerUnitTaxWelfareAssetV1
} from "./per-unit-tax-welfare-asset.ts";

export const kpPerUnitTaxWelfareFrameSchemaVersion =
  "kp.economics.per-unit-tax-welfare-frame.v1" as const;

export type KpSupplyTaxFrameDirection = "forward" | "rewind";

export interface KpPerUnitTaxWelfareFrameV1 {
  readonly schemaVersion: typeof kpPerUnitTaxWelfareFrameSchemaVersion;
  readonly id: string;
  readonly assetId: string;
  readonly direction: KpSupplyTaxFrameDirection;
  readonly playbackProgress: ExactRationalDto;
  readonly modelProgress: ExactRationalDto;
  readonly phase: "untaxed" | "tax-transit" | "taxed";
  readonly curves: {
    readonly demandId: string;
    readonly originalSupplyId: string;
    readonly buyerFacingSupplyId: string;
    readonly originalSupplyIntercept: ExactRationalDto;
    readonly buyerFacingSupplyIntercept: ExactRationalDto;
  };
  readonly market: {
    readonly taxAmount: ExactRationalDto;
    readonly quantity: ExactRationalDto;
    readonly consumerPrice: ExactRationalDto;
    readonly producerPrice: ExactRationalDto;
    readonly priceWedge: ExactRationalDto;
  };
  readonly welfare: {
    readonly consumerSurplus: ExactRationalDto;
    readonly producerSurplus: ExactRationalDto;
    readonly governmentRevenue: ExactRationalDto;
    readonly totalSurplus: ExactRationalDto;
    readonly deadweightLoss: ExactRationalDto;
  };
  readonly activeSemanticIds: readonly string[];
}

export function sampleKpPerUnitTaxWelfareFrame(input: {
  readonly asset: KpPerUnitTaxWelfareAssetV1;
  readonly progress: ExactRationalDto;
  readonly direction?: KpSupplyTaxFrameDirection | undefined;
}): KpPerUnitTaxWelfareFrameV1 {
  const direction = input.direction ?? "forward";
  const playbackProgress = parseExact(input.progress, "progress");
  assertUnitInterval(playbackProgress);
  const one = createKpRational(1n);
  const half = createKpRational(1n, 2n);
  const modelProgress = direction === "forward"
    ? playbackProgress
    : subtractKpRationals(one, playbackProgress);
  const model = input.asset.model;
  const supplyIntercept = parseExact(model.input.supply.priceIntercept,
    "supply.priceIntercept");
  const supplySlope = parseExact(model.input.supply.priceChangePerQuantity,
    "supply.priceChangePerQuantity");
  const demandIntercept = parseExact(model.input.demand.priceIntercept,
    "demand.priceIntercept");
  const demandSlope = parseExact(model.input.demand.priceChangePerQuantity,
    "demand.priceChangePerQuantity");
  const taxAmount = interpolateExact(
    parseExact(model.input.tax.initialAmount, "tax.initialAmount"),
    parseExact(model.input.tax.finalAmount, "tax.finalAmount"),
    modelProgress
  );
  const buyerFacingSupplyIntercept = addKpRationals(
    supplyIntercept,
    taxAmount
  );
  const quantity = divideKpRationals(
    subtractKpRationals(demandIntercept, buyerFacingSupplyIntercept),
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
  const priceWedge = subtractKpRationals(consumerPrice, producerPrice);
  const consumerSurplus = multiplyKpRationals(
    half,
    multiplyKpRationals(
      subtractKpRationals(demandIntercept, consumerPrice),
      quantity
    )
  );
  const producerSurplus = multiplyKpRationals(
    half,
    multiplyKpRationals(
      subtractKpRationals(producerPrice, supplyIntercept),
      quantity
    )
  );
  const governmentRevenue = multiplyKpRationals(taxAmount, quantity);
  const totalSurplus = addKpRationals(
    addKpRationals(consumerSurplus, producerSurplus),
    governmentRevenue
  );
  const untaxedTotal = parseExact(
    input.asset.accounting.states.untaxed.totalSurplus,
    "accounting.untaxed.totalSurplus"
  );
  const deadweightLoss = subtractKpRationals(untaxedTotal, totalSurplus);
  const phase = exactIsZero(modelProgress)
    ? "untaxed"
    : exactIsOne(modelProgress)
      ? "taxed"
      : "tax-transit";
  const progressDto = toDto(modelProgress);

  return Object.freeze({
    schemaVersion: kpPerUnitTaxWelfareFrameSchemaVersion,
    id: `frame.${input.asset.id}.${direction}.${exactId(progressDto)}`,
    assetId: input.asset.id,
    direction,
    playbackProgress: toDto(playbackProgress),
    modelProgress: progressDto,
    phase,
    curves: Object.freeze({
      demandId: model.input.demand.id,
      originalSupplyId: model.input.supply.id,
      buyerFacingSupplyId: model.input.supply.taxedId,
      originalSupplyIntercept: toDto(supplyIntercept),
      buyerFacingSupplyIntercept: toDto(buyerFacingSupplyIntercept)
    }),
    market: Object.freeze({
      taxAmount: toDto(taxAmount),
      quantity: toDto(quantity),
      consumerPrice: toDto(consumerPrice),
      producerPrice: toDto(producerPrice),
      priceWedge: toDto(priceWedge)
    }),
    welfare: Object.freeze({
      consumerSurplus: toDto(consumerSurplus),
      producerSurplus: toDto(producerSurplus),
      governmentRevenue: toDto(governmentRevenue),
      totalSurplus: toDto(totalSurplus),
      deadweightLoss: toDto(deadweightLoss)
    }),
    activeSemanticIds: Object.freeze([
      model.input.demand.id,
      model.input.supply.id,
      model.input.supply.taxedId,
      model.input.tax.id,
      model.input.wedgeId,
      ...input.asset.entities.regions.map(({ id }) => id)
    ])
  });
}

function interpolateExact(
  from: NormalizedExactRational,
  to: NormalizedExactRational,
  progress: NormalizedExactRational
): NormalizedExactRational {
  return addKpRationals(
    from,
    multiplyKpRationals(subtractKpRationals(to, from), progress)
  );
}

function parseExact(
  value: ExactRationalDto,
  path: string
): NormalizedExactRational {
  if (!/^-?\d+$/.test(value.numerator) || !/^-?\d+$/.test(value.denominator)) {
    throw new Error(`${path} must use integer numerator and denominator strings.`);
  }
  return createKpRational(BigInt(value.numerator), BigInt(value.denominator));
}

function toDto(value: NormalizedExactRational): ExactRationalDto {
  return Object.freeze({
    numerator: value.numerator.toString(),
    denominator: value.denominator.toString()
  });
}

function assertUnitInterval(value: NormalizedExactRational): void {
  if (value.numerator < 0n || value.numerator > value.denominator) {
    throw new RangeError("Supply-tax frame progress must lie between zero and one.");
  }
}

function exactIsZero(value: NormalizedExactRational): boolean {
  return value.numerator === 0n;
}

function exactIsOne(value: NormalizedExactRational): boolean {
  return value.numerator === value.denominator;
}

function exactId(value: ExactRationalDto): string {
  return `${value.numerator}-of-${value.denominator}`;
}
