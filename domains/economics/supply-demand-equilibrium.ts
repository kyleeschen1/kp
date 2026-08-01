import type { ExactRationalDto } from "../../protocols/public-api.ts";

export const kpSupplyDemandEquilibriumSchemaVersion =
  "kp.economics.supply-demand-equilibrium.v1" as const;

export const kpSupplyDemandEquilibriumPreservation = [
  "supply-curve-identity",
  "demand-curve-identity",
  "equilibrium-role",
  "surplus-side",
  "shortage-side",
  "demand-intercept-parameter",
  "narrative-claim-lineage"
] as const;

export type KpSupplyDemandEquilibriumPreservation =
  typeof kpSupplyDemandEquilibriumPreservation[number];

export interface KpEconomicsAxisContractV1 {
  readonly id: string;
  readonly symbol: "Q" | "P";
  readonly label: "Quantity" | "Price";
  readonly orientation: "horizontal" | "vertical";
  readonly minimum: ExactRationalDto;
  readonly maximum: ExactRationalDto;
  readonly tickStep: ExactRationalDto;
}

export interface KpLinearSupplyContractV1 {
  readonly id: string;
  readonly label: "Supply";
  readonly direction: "upward";
  readonly equationForm: "price-intercept-plus-slope-times-quantity";
  readonly priceIntercept: ExactRationalDto;
  readonly priceChangePerQuantity: ExactRationalDto;
}

export interface KpLinearDemandShiftContractV1 {
  readonly id: string;
  readonly label: "Demand";
  readonly direction: "downward";
  readonly equationForm: "price-intercept-minus-slope-times-quantity";
  readonly priceChangePerQuantity: ExactRationalDto;
  readonly interceptParameterId: string;
  readonly priceInterceptBefore: ExactRationalDto;
  readonly priceInterceptAfter: ExactRationalDto;
}

export interface KpSupplyDemandEquilibriumModelInputV1 {
  readonly schemaVersion: typeof kpSupplyDemandEquilibriumSchemaVersion;
  readonly id: string;
  readonly title: string;
  readonly axes: {
    readonly quantity: KpEconomicsAxisContractV1;
    readonly price: KpEconomicsAxisContractV1;
  };
  readonly supply: KpLinearSupplyContractV1;
  readonly demand: KpLinearDemandShiftContractV1;
  readonly equilibriumId: string;
  readonly surplusSide: "above-equilibrium-price";
  readonly shortageSide: "below-equilibrium-price";
  readonly preservation: readonly KpSupplyDemandEquilibriumPreservation[];
}

const exact = (numerator: string, denominator = "1"): ExactRationalDto => ({
  numerator,
  denominator
});

// These small integers make both equilibria exact and visually legible; the
// exemplar is domain truth, not a configurable economics solver.
export const kpSupplyDemandEquilibriumExemplarInput = {
  schemaVersion: kpSupplyDemandEquilibriumSchemaVersion,
  id: "economics.supply-demand.demand-intercept-shift",
  title: "Supply and demand equilibrium shift",
  axes: {
    quantity: {
      id: "axis.economics.quantity",
      symbol: "Q",
      label: "Quantity",
      orientation: "horizontal",
      minimum: exact("0"),
      maximum: exact("12"),
      tickStep: exact("2")
    },
    price: {
      id: "axis.economics.price",
      symbol: "P",
      label: "Price",
      orientation: "vertical",
      minimum: exact("0"),
      maximum: exact("20"),
      tickStep: exact("2")
    }
  },
  supply: {
    id: "curve.economics.supply",
    label: "Supply",
    direction: "upward",
    equationForm: "price-intercept-plus-slope-times-quantity",
    priceIntercept: exact("2"),
    priceChangePerQuantity: exact("1")
  },
  demand: {
    id: "curve.economics.demand",
    label: "Demand",
    direction: "downward",
    equationForm: "price-intercept-minus-slope-times-quantity",
    priceChangePerQuantity: exact("1"),
    interceptParameterId: "parameter.economics.demand-price-intercept",
    priceInterceptBefore: exact("14"),
    priceInterceptAfter: exact("18")
  },
  equilibriumId: "equilibrium.economics.supply-demand",
  surplusSide: "above-equilibrium-price",
  shortageSide: "below-equilibrium-price",
  preservation: kpSupplyDemandEquilibriumPreservation
} as const satisfies KpSupplyDemandEquilibriumModelInputV1;

