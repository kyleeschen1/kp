import {
  createKpPerUnitTaxWelfareAccounting,
  type KpPerUnitTaxWelfareAccountingV1
} from "../../../domains/economics/per-unit-tax-welfare-accounting.ts";
import type {
  KpPerUnitTaxMarketStateV1,
  KpPerUnitTaxWelfareModelV1
} from "../../../domains/economics/per-unit-tax-welfare-model.ts";
import {
  createKpRational,
  type KpNormalizedRational
} from "../../../domains/math/exact-rational.ts";
import type { ExactRationalDto } from "../../../protocols/public-api.ts";
import type { KpMathAuthoringContext } from "../../math/authoring/context.ts";
import {
  createKpUnitValue,
  type KpUnitDescriptor
} from "../../math/authoring/units.ts";
import {
  createKpLinearSupplyDemandExperiment,
  evaluateKpLinearMarketScenario,
  type KpLinearMarketSnapshot,
  type KpLinearSupplyDemandExperiment
} from "./typed-linear-supply-demand.ts";

export interface KpExactRationalLinearMarketProjection<
  QuantityUnitId extends string,
  PriceUnitId extends string,
  WelfareUnitId extends string
> {
  readonly kind: "exact-rational-linear-market-projection";
  readonly canonical: Readonly<{
    model: KpPerUnitTaxWelfareModelV1;
    welfare: KpPerUnitTaxWelfareAccountingV1;
  }>;
  readonly sourceIds: readonly string[];
  readonly market: KpLinearSupplyDemandExperiment<
    QuantityUnitId,
    PriceUnitId,
    WelfareUnitId
  >;
  readonly snapshots: Readonly<{
    untaxed: KpLinearMarketSnapshot<
      QuantityUnitId,
      PriceUnitId,
      WelfareUnitId
    >;
    taxed: KpLinearMarketSnapshot<
      QuantityUnitId,
      PriceUnitId,
      WelfareUnitId
    >;
  }>;
  readonly stateLinks: Readonly<{
    untaxed: Readonly<{
      canonicalStateId: string;
      typedSnapshotId: string;
    }>;
    taxed: Readonly<{
      canonicalStateId: string;
      typedSnapshotId: string;
    }>;
  }>;
}

export function projectKpExactRationalLinearMarket<
  const QuantityUnitId extends string,
  const PriceUnitId extends string,
  const WelfareUnitId extends string
>(input: {
  readonly author: KpMathAuthoringContext;
  readonly key: string;
  readonly model: KpPerUnitTaxWelfareModelV1;
  readonly units: Readonly<{
    quantity: KpUnitDescriptor<QuantityUnitId>;
    price: KpUnitDescriptor<PriceUnitId>;
    welfare: KpUnitDescriptor<WelfareUnitId>;
  }>;
}): KpExactRationalLinearMarketProjection<
  QuantityUnitId,
  PriceUnitId,
  WelfareUnitId
> {
  const welfare = createKpPerUnitTaxWelfareAccounting(input.model);
  const market = createKpLinearSupplyDemandExperiment({
    author: input.author,
    key: input.key,
    units: input.units,
    demand: {
      priceAtZero: createKpUnitValue(
        input.units.price,
        exactNumber(input.model.input.demand.priceIntercept,
          "demand.priceIntercept")
      ),
      priceDropPerQuantity: exactNumber(
        input.model.input.demand.priceChangePerQuantity,
        "demand.priceChangePerQuantity"
      )
    },
    supply: {
      priceAtZero: createKpUnitValue(
        input.units.price,
        exactNumber(input.model.input.supply.priceIntercept,
          "supply.priceIntercept")
      ),
      priceRisePerQuantity: exactNumber(
        input.model.input.supply.priceChangePerQuantity,
        "supply.priceChangePerQuantity"
      )
    }
  });
  const untaxed = evaluateKpLinearMarketScenario(market, {
    kind: "baseline"
  });
  const taxed = evaluateKpLinearMarketScenario(market, {
    kind: "per-unit-seller-tax",
    id: input.model.states.taxed.id,
    amount: createKpUnitValue(
      input.units.price,
      exactNumber(input.model.states.taxed.taxAmount, "tax.finalAmount")
    )
  });

  requireSnapshotParity(untaxed, input.model.states.untaxed, {
    consumerSurplus: welfare.states.untaxed.consumerSurplus,
    producerSurplus: welfare.states.untaxed.producerSurplus,
    governmentRevenue: welfare.states.untaxed.governmentRevenue,
    deadweightLoss: { numerator: "0", denominator: "1" },
    totalSurplus: welfare.states.untaxed.totalSurplus
  }, "untaxed");
  requireSnapshotParity(taxed, input.model.states.taxed, {
    consumerSurplus: welfare.states.taxed.consumerSurplus,
    producerSurplus: welfare.states.taxed.producerSurplus,
    governmentRevenue: welfare.states.taxed.governmentRevenue,
    deadweightLoss: welfare.deadweightLoss,
    totalSurplus: welfare.states.taxed.totalSurplus
  }, "taxed");

  return Object.freeze({
    kind: "exact-rational-linear-market-projection" as const,
    canonical: Object.freeze({ model: input.model, welfare }),
    sourceIds: Object.freeze([
      input.model.id,
      welfare.id,
      input.model.input.demand.id,
      input.model.input.supply.id,
      input.model.input.tax.id,
      input.model.states.untaxed.id,
      input.model.states.taxed.id
    ]),
    market,
    snapshots: Object.freeze({ untaxed, taxed }),
    stateLinks: Object.freeze({
      untaxed: Object.freeze({
        canonicalStateId: input.model.states.untaxed.id,
        typedSnapshotId: untaxed.id
      }),
      taxed: Object.freeze({
        canonicalStateId: input.model.states.taxed.id,
        typedSnapshotId: taxed.id
      })
    })
  });
}

interface ExactWelfareView {
  readonly consumerSurplus: ExactRationalDto;
  readonly producerSurplus: ExactRationalDto;
  readonly governmentRevenue: ExactRationalDto;
  readonly deadweightLoss: ExactRationalDto;
  readonly totalSurplus: ExactRationalDto;
}

function requireSnapshotParity(
  snapshot: KpLinearMarketSnapshot<string, string, string>,
  state: KpPerUnitTaxMarketStateV1,
  welfare: ExactWelfareView,
  path: string
): void {
  requireNumberParity(snapshot.quantities.traded.magnitude, state.quantity,
    `${path}.quantity`);
  requireNumberParity(snapshot.prices.buyer.magnitude, state.consumerPrice,
    `${path}.consumerPrice`);
  requireNumberParity(snapshot.prices.seller.magnitude, state.producerPrice,
    `${path}.producerPrice`);
  requireNumberParity(snapshot.welfare.consumerSurplus.magnitude,
    welfare.consumerSurplus, `${path}.consumerSurplus`);
  requireNumberParity(snapshot.welfare.producerSurplus.magnitude,
    welfare.producerSurplus, `${path}.producerSurplus`);
  requireNumberParity(snapshot.welfare.governmentRevenue.magnitude,
    welfare.governmentRevenue, `${path}.governmentRevenue`);
  requireNumberParity(snapshot.welfare.deadweightLoss.magnitude,
    welfare.deadweightLoss, `${path}.deadweightLoss`);
  requireNumberParity(snapshot.welfare.totalSurplus.magnitude,
    welfare.totalSurplus, `${path}.totalSurplus`);
}

function requireNumberParity(
  actual: number,
  expected: ExactRationalDto,
  path: string
): void {
  const exact = exactNumber(expected, path);
  if (!Object.is(actual, exact)) {
    throw new Error(
      `${path} typed projection ${actual} does not equal exact authority ${exact}.`
    );
  }
}

function exactNumber(value: ExactRationalDto, path: string): number {
  const rational = parseExact(value, path);
  const absoluteNumerator = rational.numerator < 0n
    ? -rational.numerator
    : rational.numerator;
  const maximum = BigInt(Number.MAX_SAFE_INTEGER);
  if (absoluteNumerator > maximum || rational.denominator > maximum ||
      !isPowerOfTwo(rational.denominator)) {
    throw new Error(
      `${path} cannot be projected exactly to a JavaScript number; ` +
      "the typed market remains a bounded pressure view."
    );
  }
  const projected = Number(rational.numerator) / Number(rational.denominator);
  if (!Number.isFinite(projected)) {
    throw new Error(`${path} cannot be projected to a finite JavaScript number.`);
  }
  return projected;
}

function parseExact(value: ExactRationalDto, path: string): KpNormalizedRational {
  if (!/^-?\d+$/.test(value.numerator) || !/^-?\d+$/.test(value.denominator)) {
    throw new Error(`${path} must use exact integer numerator and denominator strings.`);
  }
  try {
    return createKpRational(BigInt(value.numerator), BigInt(value.denominator));
  } catch (error) {
    throw new Error(
      `${path} is invalid: ${error instanceof Error ? error.message : "unknown rational error"}`
    );
  }
}

function isPowerOfTwo(value: bigint): boolean {
  return value > 0n && (value & (value - 1n)) === 0n;
}
