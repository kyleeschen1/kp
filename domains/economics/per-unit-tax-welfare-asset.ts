import type { ExactRationalDto } from "../../protocols/public-api.ts";
import {
  addKpRationals,
  createKpRational
} from "../math/exact-rational.ts";
import {
  createKpPerUnitTaxWelfareAccounting,
  type KpPerUnitTaxWelfareAccountingV1
} from "./per-unit-tax-welfare-accounting.ts";
import {
  createKpPerUnitTaxWelfareModel,
  type KpPerUnitTaxWelfareModelV1
} from "./per-unit-tax-welfare-model.ts";

export const kpPerUnitTaxWelfareAssetSchemaVersion =
  "kp.economics.per-unit-tax-welfare-asset.v1" as const;

export interface KpSupplyTaxCurveEntityV1 {
  readonly id: string;
  readonly kind: "curve";
  readonly role: "demand" | "marginal-cost-supply" | "buyer-facing-taxed-supply";
  readonly equation:
    | "price-intercept-minus-slope-times-quantity"
    | "price-intercept-plus-slope-times-quantity";
  readonly intercept: ExactRationalDto;
  readonly slope: ExactRationalDto;
}

export interface KpSupplyTaxPriceEntityV1 {
  readonly id: string;
  readonly kind: "price-level";
  readonly role: "untaxed-market" | "consumer" | "producer";
  readonly value: ExactRationalDto;
}

export interface KpSupplyTaxWedgeEntityV1 {
  readonly id: string;
  readonly kind: "price-wedge";
  readonly taxParameterId: string;
  readonly quantity: ExactRationalDto;
  readonly consumerPriceId: string;
  readonly producerPriceId: string;
  readonly amount: ExactRationalDto;
}

export type KpSupplyTaxRegionRole =
  | "consumer-surplus"
  | "producer-surplus"
  | "government-revenue"
  | "deadweight-loss";

export type KpSupplyTaxRegionBoundaryV1 =
  | Readonly<{ kind: "curve"; entityId: string }>
  | Readonly<{ kind: "price-level"; entityId: string }>;

export interface KpSupplyTaxRegionEntityV1 {
  readonly id: string;
  readonly kind: "welfare-region";
  readonly role: KpSupplyTaxRegionRole;
  readonly phase: "untaxed" | "taxed";
  readonly value: ExactRationalDto;
  readonly quantityInterval: {
    readonly start: ExactRationalDto;
    readonly end: ExactRationalDto;
  };
  readonly upperBoundary: KpSupplyTaxRegionBoundaryV1;
  readonly lowerBoundary: KpSupplyTaxRegionBoundaryV1;
}

export interface KpSupplyTaxCorrespondenceV1 {
  readonly id: string;
  readonly relation: "persist" | "derive" | "succession" | "split";
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
}

export interface KpSupplyTaxLineageEdgeV1 {
  readonly id: string;
  readonly relation:
    | "tax-shift"
    | "market-clearing"
    | "price-incidence"
    | "revenue-transfer"
    | "lost-trades";
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly claim: string;
}

export interface KpPerUnitTaxWelfareAssetV1 {
  readonly schemaVersion: typeof kpPerUnitTaxWelfareAssetSchemaVersion;
  readonly id: string;
  readonly model: KpPerUnitTaxWelfareModelV1;
  readonly accounting: KpPerUnitTaxWelfareAccountingV1;
  readonly entities: {
    readonly curves: readonly KpSupplyTaxCurveEntityV1[];
    readonly prices: readonly KpSupplyTaxPriceEntityV1[];
    readonly wedge: KpSupplyTaxWedgeEntityV1;
    readonly regions: readonly KpSupplyTaxRegionEntityV1[];
  };
  readonly correspondences: readonly KpSupplyTaxCorrespondenceV1[];
  readonly lineage: readonly KpSupplyTaxLineageEdgeV1[];
}

const zero = Object.freeze({ numerator: "0", denominator: "1" });

export function createKpPerUnitTaxWelfareAsset(
  model: KpPerUnitTaxWelfareModelV1 = createKpPerUnitTaxWelfareModel()
): KpPerUnitTaxWelfareAssetV1 {
  const accounting = createKpPerUnitTaxWelfareAccounting(model);
  const curveIds = {
    demand: model.input.demand.id,
    supply: model.input.supply.id,
    taxedSupply: model.input.supply.taxedId
  } as const;
  const priceIds = {
    untaxed: "price.economics.tax.untaxed-market",
    consumer: "price.economics.tax.consumer",
    producer: "price.economics.tax.producer"
  } as const;
  const regionIds = {
    consumerUntaxed: "region.economics.tax.consumer-surplus.untaxed",
    producerUntaxed: "region.economics.tax.producer-surplus.untaxed",
    consumerTaxed: "region.economics.tax.consumer-surplus.taxed",
    producerTaxed: "region.economics.tax.producer-surplus.taxed",
    revenue: "region.economics.tax.government-revenue",
    deadweightLoss: "region.economics.tax.deadweight-loss"
  } as const;
  const curves = Object.freeze([
    Object.freeze({
      id: curveIds.demand,
      kind: "curve" as const,
      role: "demand" as const,
      equation: model.input.demand.equationForm,
      intercept: model.input.demand.priceIntercept,
      slope: model.input.demand.priceChangePerQuantity
    }),
    Object.freeze({
      id: curveIds.supply,
      kind: "curve" as const,
      role: "marginal-cost-supply" as const,
      equation: model.input.supply.equationForm,
      intercept: model.input.supply.priceIntercept,
      slope: model.input.supply.priceChangePerQuantity
    }),
    Object.freeze({
      id: curveIds.taxedSupply,
      kind: "curve" as const,
      role: "buyer-facing-taxed-supply" as const,
      equation: model.input.supply.equationForm,
      intercept: addDtos(
        model.input.supply.priceIntercept,
        model.input.tax.finalAmount
      ),
      slope: model.input.supply.priceChangePerQuantity
    })
  ] satisfies readonly KpSupplyTaxCurveEntityV1[]);
  const prices = Object.freeze([
    price(priceIds.untaxed, "untaxed-market", model.states.untaxed.consumerPrice),
    price(priceIds.consumer, "consumer", model.states.taxed.consumerPrice),
    price(priceIds.producer, "producer", model.states.taxed.producerPrice)
  ]);
  const regions = Object.freeze([
    region(regionIds.consumerUntaxed, "consumer-surplus", "untaxed",
      accounting.states.untaxed.consumerSurplus, zero,
      model.states.untaxed.quantity, curve(curveIds.demand),
      priceBoundary(priceIds.untaxed)),
    region(regionIds.producerUntaxed, "producer-surplus", "untaxed",
      accounting.states.untaxed.producerSurplus, zero,
      model.states.untaxed.quantity, priceBoundary(priceIds.untaxed),
      curve(curveIds.supply)),
    region(regionIds.consumerTaxed, "consumer-surplus", "taxed",
      accounting.states.taxed.consumerSurplus, zero,
      model.states.taxed.quantity, curve(curveIds.demand),
      priceBoundary(priceIds.consumer)),
    region(regionIds.producerTaxed, "producer-surplus", "taxed",
      accounting.states.taxed.producerSurplus, zero,
      model.states.taxed.quantity, priceBoundary(priceIds.producer),
      curve(curveIds.supply)),
    region(regionIds.revenue, "government-revenue", "taxed",
      accounting.states.taxed.governmentRevenue, zero,
      model.states.taxed.quantity, priceBoundary(priceIds.consumer),
      priceBoundary(priceIds.producer)),
    region(regionIds.deadweightLoss, "deadweight-loss", "taxed",
      accounting.deadweightLoss, model.states.taxed.quantity,
      model.states.untaxed.quantity, curve(curveIds.demand),
      curve(curveIds.supply))
  ]);

  return Object.freeze({
    schemaVersion: kpPerUnitTaxWelfareAssetSchemaVersion,
    id: `asset.${model.input.id}`,
    model,
    accounting,
    entities: Object.freeze({
      curves,
      prices,
      wedge: Object.freeze({
        id: model.input.wedgeId,
        kind: "price-wedge",
        taxParameterId: model.input.tax.id,
        quantity: model.states.taxed.quantity,
        consumerPriceId: priceIds.consumer,
        producerPriceId: priceIds.producer,
        amount: model.states.taxed.priceWedge
      }),
      regions
    }),
    correspondences: Object.freeze([
      correspondence("demand-persists", "persist", [curveIds.demand],
        [curveIds.demand]),
      correspondence("supply-persists-as-marginal-cost", "persist",
        [curveIds.supply], [curveIds.supply]),
      correspondence("taxed-supply-is-derived", "derive",
        [curveIds.supply, model.input.tax.id], [curveIds.taxedSupply]),
      correspondence("equilibrium-succeeds", "succession",
        [model.states.untaxed.id], [model.states.taxed.id]),
      correspondence("market-price-splits", "split", [priceIds.untaxed],
        [priceIds.consumer, priceIds.producer])
    ]),
    lineage: Object.freeze([
      lineage("tax-shifts-supply", "tax-shift",
        [curveIds.supply, model.input.tax.id], [curveIds.taxedSupply],
        "The tax adds a vertical wedge to the buyer-facing supply schedule."),
      lineage("taxed-market-clears", "market-clearing",
        [curveIds.demand, curveIds.taxedSupply], [model.states.taxed.id],
        "Demand clears the buyer-facing taxed supply at the taxed quantity."),
      lineage("price-wedge-splits-incidence", "price-incidence",
        [model.states.untaxed.id, model.input.tax.id],
        [priceIds.consumer, priceIds.producer, model.input.wedgeId],
        "The tax separates the consumer price from the producer price."),
      lineage("wedge-funds-revenue", "revenue-transfer",
        [model.input.wedgeId, model.states.taxed.id], [regionIds.revenue],
        "The tax wedge over traded units becomes government revenue."),
      lineage("lost-trades-create-dwl", "lost-trades",
        [curveIds.demand, curveIds.supply, model.states.untaxed.id,
          model.states.taxed.id], [regionIds.deadweightLoss],
        "Trades between the taxed and untaxed quantities no longer occur.")
    ])
  });
}

function price(
  id: string,
  role: KpSupplyTaxPriceEntityV1["role"],
  value: ExactRationalDto
): KpSupplyTaxPriceEntityV1 {
  return Object.freeze({ id, kind: "price-level", role, value });
}

function region(
  id: string,
  role: KpSupplyTaxRegionRole,
  phase: KpSupplyTaxRegionEntityV1["phase"],
  value: ExactRationalDto,
  start: ExactRationalDto,
  end: ExactRationalDto,
  upperBoundary: KpSupplyTaxRegionBoundaryV1,
  lowerBoundary: KpSupplyTaxRegionBoundaryV1
): KpSupplyTaxRegionEntityV1 {
  return Object.freeze({
    id,
    kind: "welfare-region",
    role,
    phase,
    value,
    quantityInterval: Object.freeze({ start, end }),
    upperBoundary,
    lowerBoundary
  });
}

function curve(entityId: string): KpSupplyTaxRegionBoundaryV1 {
  return Object.freeze({ kind: "curve", entityId });
}

function priceBoundary(entityId: string): KpSupplyTaxRegionBoundaryV1 {
  return Object.freeze({ kind: "price-level", entityId });
}

function correspondence(
  suffix: string,
  relation: KpSupplyTaxCorrespondenceV1["relation"],
  sourceEntityIds: readonly string[],
  targetEntityIds: readonly string[]
): KpSupplyTaxCorrespondenceV1 {
  return Object.freeze({
    id: `correspondence.economics.tax.${suffix}`,
    relation,
    sourceEntityIds: Object.freeze([...sourceEntityIds]),
    targetEntityIds: Object.freeze([...targetEntityIds])
  });
}

function lineage(
  suffix: string,
  relation: KpSupplyTaxLineageEdgeV1["relation"],
  sourceEntityIds: readonly string[],
  targetEntityIds: readonly string[],
  claim: string
): KpSupplyTaxLineageEdgeV1 {
  return Object.freeze({
    id: `lineage.economics.tax.${suffix}`,
    relation,
    sourceEntityIds: Object.freeze([...sourceEntityIds]),
    targetEntityIds: Object.freeze([...targetEntityIds]),
    claim
  });
}

function addDtos(
  left: ExactRationalDto,
  right: ExactRationalDto
): ExactRationalDto {
  const value = addKpRationals(
    createKpRational(BigInt(left.numerator), BigInt(left.denominator)),
    createKpRational(BigInt(right.numerator), BigInt(right.denominator))
  );
  return Object.freeze({
    numerator: value.numerator.toString(),
    denominator: value.denominator.toString()
  });
}
