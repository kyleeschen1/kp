import type { ExactRationalDto } from "../../protocols/public-api.ts";
import {
  addKpRationals,
  createKpRational,
  equalKpRationals,
  multiplyKpRationals,
  subtractKpRationals,
  type KpNormalizedRational
} from "../math/exact-rational.ts";
import {
  createKpPerUnitTaxWelfareModel,
  type KpPerUnitTaxMarketStateV1,
  type KpPerUnitTaxWelfareModelV1
} from "./per-unit-tax-welfare-model.ts";

export const kpPerUnitTaxWelfareAccountingSchemaVersion =
  "kp.economics.per-unit-tax-welfare-accounting.v1" as const;

export interface KpPerUnitTaxWelfareStateV1 {
  readonly marketStateId: string;
  readonly consumerSurplus: ExactRationalDto;
  readonly producerSurplus: ExactRationalDto;
  readonly governmentRevenue: ExactRationalDto;
  readonly privateSurplus: ExactRationalDto;
  readonly totalSurplus: ExactRationalDto;
}

export interface KpPerUnitTaxWelfareAccountingV1 {
  readonly schemaVersion:
    typeof kpPerUnitTaxWelfareAccountingSchemaVersion;
  readonly id: string;
  readonly states: {
    readonly untaxed: KpPerUnitTaxWelfareStateV1;
    readonly taxed: KpPerUnitTaxWelfareStateV1;
  };
  readonly lostPrivateSurplus: ExactRationalDto;
  readonly deadweightLoss: ExactRationalDto;
  readonly welfareClosesExactly: true;
  readonly redistributionAndLossCloseExactly: true;
}

export function createKpPerUnitTaxWelfareAccounting(
  model: KpPerUnitTaxWelfareModelV1 = createKpPerUnitTaxWelfareModel()
): KpPerUnitTaxWelfareAccountingV1 {
  const untaxed = solveWelfareState(model, model.states.untaxed);
  const taxed = solveWelfareState(model, model.states.taxed);
  const untaxedTotal = parseExact(untaxed.totalSurplus, "untaxed.totalSurplus");
  const taxedTotal = parseExact(taxed.totalSurplus, "taxed.totalSurplus");
  const deadweightLoss = subtractKpRationals(untaxedTotal, taxedTotal);
  const lostPrivateSurplus = subtractKpRationals(
    parseExact(untaxed.privateSurplus, "untaxed.privateSurplus"),
    parseExact(taxed.privateSurplus, "taxed.privateSurplus")
  );
  const redistributedAndLost = addKpRationals(
    parseExact(taxed.governmentRevenue, "taxed.governmentRevenue"),
    deadweightLoss
  );

  // Revenue is transferred surplus; only the residual reduction in total
  // surplus is deadweight loss. Keep that accounting independent of polygons.
  if (!equalKpRationals(lostPrivateSurplus, redistributedAndLost)) {
    throw new Error("Lost private surplus does not equal revenue plus deadweight loss.");
  }
  const reconstructedTaxedTotal = addKpRationals(
    parseExact(taxed.privateSurplus, "taxed.privateSurplus"),
    parseExact(taxed.governmentRevenue, "taxed.governmentRevenue")
  );
  if (!equalKpRationals(taxedTotal, reconstructedTaxedTotal)) {
    throw new Error("Taxed total surplus does not close exactly.");
  }

  return Object.freeze({
    schemaVersion: kpPerUnitTaxWelfareAccountingSchemaVersion,
    id: `welfare.${model.input.id}`,
    states: Object.freeze({ untaxed, taxed }),
    lostPrivateSurplus: toDto(lostPrivateSurplus),
    deadweightLoss: toDto(deadweightLoss),
    welfareClosesExactly: true,
    redistributionAndLossCloseExactly: true
  });
}

function solveWelfareState(
  model: KpPerUnitTaxWelfareModelV1,
  market: KpPerUnitTaxMarketStateV1
): KpPerUnitTaxWelfareStateV1 {
  const half = createKpRational(1n, 2n);
  const quantity = parseExact(market.quantity, `${market.phase}.quantity`);
  const consumerPrice = parseExact(
    market.consumerPrice,
    `${market.phase}.consumerPrice`
  );
  const producerPrice = parseExact(
    market.producerPrice,
    `${market.phase}.producerPrice`
  );
  const demandIntercept = parseExact(
    model.input.demand.priceIntercept,
    "demand.priceIntercept"
  );
  const supplyIntercept = parseExact(
    model.input.supply.priceIntercept,
    "supply.priceIntercept"
  );
  const taxAmount = parseExact(market.taxAmount, `${market.phase}.taxAmount`);
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
  const privateSurplus = addKpRationals(consumerSurplus, producerSurplus);
  const totalSurplus = addKpRationals(privateSurplus, governmentRevenue);
  return Object.freeze({
    marketStateId: market.id,
    consumerSurplus: toDto(consumerSurplus),
    producerSurplus: toDto(producerSurplus),
    governmentRevenue: toDto(governmentRevenue),
    privateSurplus: toDto(privateSurplus),
    totalSurplus: toDto(totalSurplus)
  });
}

function parseExact(value: ExactRationalDto, path: string): KpNormalizedRational {
  if (!/^-?\d+$/.test(value.numerator) || !/^-?\d+$/.test(value.denominator)) {
    throw new Error(`${path} must use integer numerator and denominator strings.`);
  }
  return createKpRational(BigInt(value.numerator), BigInt(value.denominator));
}

function toDto(value: KpNormalizedRational): ExactRationalDto {
  return Object.freeze({
    numerator: value.numerator.toString(),
    denominator: value.denominator.toString()
  });
}
