import type { KpVectorSpace } from "../../math/algebra/algebraic-structures.ts";
import {
  createKpDifferentiableMap,
  type KpDifferentiableMap
} from "../../math/algebra/differentiable-map.ts";
import { createKpLinearMap } from "../../math/algebra/linear-map.ts";
import type { KpMathAuthoringContext } from "../../math/authoring/public-api.ts";
import {
  createKpUnitTaggedScalarSpace,
  createKpUnitValue,
  projectKpDerivativeUnitToLatex,
  type KpUnitDescriptor,
  type KpUnitValue
} from "../../math/authoring/units.ts";

export interface KpLinearUnitRate<
  DomainUnitId extends string,
  CodomainUnitId extends string
> {
  readonly magnitude: number;
  readonly domainUnitId: DomainUnitId;
  readonly codomainUnitId: CodomainUnitId;
}

export interface KpLinearSupplyDemandCurve<
  QuantityUnitId extends string,
  PriceUnitId extends string
> {
  readonly kind: "linear-market-curve";
  readonly id: string;
  readonly role: "demand" | "supply";
  readonly priceAtZero: KpUnitValue<PriceUnitId>;
  readonly priceChangePerQuantity: KpLinearUnitRate<
    QuantityUnitId,
    PriceUnitId
  >;
  readonly priceAt: KpDifferentiableMap<
    KpUnitValue<QuantityUnitId>,
    KpUnitValue<PriceUnitId>,
    number
  >;
  readonly derivativeUnitLatex: string;
}

export interface KpLinearSupplyDemandExperiment<
  QuantityUnitId extends string,
  PriceUnitId extends string,
  WelfareUnitId extends string
> {
  readonly kind: "linear-supply-demand-experiment";
  readonly id: string;
  readonly context: KpMathAuthoringContext;
  readonly units: Readonly<{
    quantity: KpUnitDescriptor<QuantityUnitId>;
    price: KpUnitDescriptor<PriceUnitId>;
    welfare: KpUnitDescriptor<WelfareUnitId>;
  }>;
  readonly spaces: Readonly<{
    quantity: KpVectorSpace<KpUnitValue<QuantityUnitId>, number>;
    price: KpVectorSpace<KpUnitValue<PriceUnitId>, number>;
  }>;
  readonly demand: KpLinearSupplyDemandCurve<QuantityUnitId, PriceUnitId>;
  readonly supply: KpLinearSupplyDemandCurve<QuantityUnitId, PriceUnitId>;
}

export type KpLinearMarketScenario<PriceUnitId extends string> =
  | Readonly<{
      kind: "baseline";
    }>
  | Readonly<{
      kind: "per-unit-seller-tax";
      id: string;
      amount: KpUnitValue<PriceUnitId>;
    }>
  | Readonly<{
      kind: "price-floor";
      id: string;
      price: KpUnitValue<PriceUnitId>;
      rationing: "efficient-lowest-cost";
    }>;

export type KpLinearMarketRealizedPolicy<PriceUnitId extends string> =
  | Readonly<{
      kind: "baseline";
    }>
  | Readonly<{
      kind: "per-unit-seller-tax";
      id: string;
      amount: KpUnitValue<PriceUnitId>;
    }>
  | Readonly<{
      kind: "price-floor";
      id: string;
      price: KpUnitValue<PriceUnitId>;
      rationing: "efficient-lowest-cost";
      binding: boolean;
    }>;

export interface KpLinearMarketSnapshot<
  QuantityUnitId extends string,
  PriceUnitId extends string,
  WelfareUnitId extends string
> {
  readonly kind: "linear-supply-demand-snapshot";
  readonly id: string;
  readonly marketId: string;
  readonly policy: KpLinearMarketRealizedPolicy<PriceUnitId>;
  readonly quantities: Readonly<{
    demanded: KpUnitValue<QuantityUnitId>;
    supplied: KpUnitValue<QuantityUnitId>;
    traded: KpUnitValue<QuantityUnitId>;
    shortage: KpUnitValue<QuantityUnitId>;
    surplus: KpUnitValue<QuantityUnitId>;
  }>;
  readonly prices: Readonly<{
    buyer: KpUnitValue<PriceUnitId>;
    seller: KpUnitValue<PriceUnitId>;
  }>;
  readonly welfare: Readonly<{
    consumerSurplus: KpUnitValue<WelfareUnitId>;
    producerSurplus: KpUnitValue<WelfareUnitId>;
    governmentRevenue: KpUnitValue<WelfareUnitId>;
    deadweightLoss: KpUnitValue<WelfareUnitId>;
    totalSurplus: KpUnitValue<WelfareUnitId>;
  }>;
  readonly sourceIds: readonly string[];
}

export function createKpLinearSupplyDemandExperiment<
  const QuantityUnitId extends string,
  const PriceUnitId extends string,
  const WelfareUnitId extends string
>(input: {
  readonly author: KpMathAuthoringContext;
  readonly key: string;
  readonly units: Readonly<{
    quantity: KpUnitDescriptor<QuantityUnitId>;
    price: KpUnitDescriptor<PriceUnitId>;
    welfare: KpUnitDescriptor<WelfareUnitId>;
  }>;
  readonly demand: Readonly<{
    priceAtZero: KpUnitValue<PriceUnitId>;
    priceDropPerQuantity: number;
  }>;
  readonly supply: Readonly<{
    priceAtZero: KpUnitValue<PriceUnitId>;
    priceRisePerQuantity: number;
  }>;
}): KpLinearSupplyDemandExperiment<
  QuantityUnitId,
  PriceUnitId,
  WelfareUnitId
> {
  const scalars = input.author.defaults.scalars;
  if (scalars === undefined) {
    throw new Error(
      "Linear supply-demand authoring requires numeric scalar defaults; " +
      "use createKpStandardMathAuthoringContext."
    );
  }

  const context = input.author.at("markets", input.key);
  const demandPriceAtZero = normalizedUnitValue(
    input.demand.priceAtZero,
    input.units.price,
    "Demand price at zero"
  );
  const supplyPriceAtZero = normalizedUnitValue(
    input.supply.priceAtZero,
    input.units.price,
    "Supply price at zero"
  );
  const demandSlope = requirePositiveFinite(
    input.demand.priceDropPerQuantity,
    "Demand price drop per quantity"
  );
  const supplySlope = requirePositiveFinite(
    input.supply.priceRisePerQuantity,
    "Supply price rise per quantity"
  );
  if (demandPriceAtZero.magnitude <= supplyPriceAtZero.magnitude) {
    throw new Error(
      "The bounded linear market requires demand price at zero to exceed " +
      "supply price at zero."
    );
  }

  const quantitySpace = createKpUnitTaggedScalarSpace({
    id: context.id("spaces", "quantity"),
    label: "Market quantity",
    unit: input.units.quantity,
    scalars
  });
  const priceSpace = createKpUnitTaggedScalarSpace({
    id: context.id("spaces", "price"),
    label: "Market price",
    unit: input.units.price,
    scalars
  });
  const demand = createCurve({
    context,
    role: "demand",
    quantityUnit: input.units.quantity,
    priceUnit: input.units.price,
    quantitySpace,
    priceSpace,
    priceAtZero: demandPriceAtZero,
    signedSlope: -demandSlope
  });
  const supply = createCurve({
    context,
    role: "supply",
    quantityUnit: input.units.quantity,
    priceUnit: input.units.price,
    quantitySpace,
    priceSpace,
    priceAtZero: supplyPriceAtZero,
    signedSlope: supplySlope
  });

  return Object.freeze({
    kind: "linear-supply-demand-experiment" as const,
    id: input.author.id("markets", input.key),
    context,
    units: Object.freeze({ ...input.units }),
    spaces: Object.freeze({ quantity: quantitySpace, price: priceSpace }),
    demand,
    supply
  });
}

export function evaluateKpLinearMarketScenario<
  const QuantityUnitId extends string,
  const PriceUnitId extends string,
  const WelfareUnitId extends string
>(
  market: KpLinearSupplyDemandExperiment<
    QuantityUnitId,
    PriceUnitId,
    WelfareUnitId
  >,
  scenario: KpLinearMarketScenario<NoInfer<PriceUnitId>>
): KpLinearMarketSnapshot<QuantityUnitId, PriceUnitId, WelfareUnitId> {
  const baseline = solveBaseline(market);

  switch (scenario.kind) {
    case "baseline":
      return createSnapshot(market, "baseline", Object.freeze({
        kind: "baseline" as const
      }), baseline);
    case "per-unit-seller-tax":
      return solveSellerTax(market, scenario, baseline);
    case "price-floor":
      return solvePriceFloor(market, scenario, baseline);
  }
}

interface NumericOutcome {
  readonly demanded: number;
  readonly supplied: number;
  readonly traded: number;
  readonly shortage: number;
  readonly surplus: number;
  readonly buyerPrice: number;
  readonly sellerPrice: number;
  readonly consumerSurplus: number;
  readonly producerSurplus: number;
  readonly governmentRevenue: number;
  readonly deadweightLoss: number;
  readonly totalSurplus: number;
}

function createCurve<
  const QuantityUnitId extends string,
  const PriceUnitId extends string
>(input: {
  readonly context: KpMathAuthoringContext;
  readonly role: "demand" | "supply";
  readonly quantityUnit: KpUnitDescriptor<QuantityUnitId>;
  readonly priceUnit: KpUnitDescriptor<PriceUnitId>;
  readonly quantitySpace: KpVectorSpace<KpUnitValue<QuantityUnitId>, number>;
  readonly priceSpace: KpVectorSpace<KpUnitValue<PriceUnitId>, number>;
  readonly priceAtZero: KpUnitValue<PriceUnitId>;
  readonly signedSlope: number;
}): KpLinearSupplyDemandCurve<QuantityUnitId, PriceUnitId> {
  const id = input.context.id("curves", input.role);
  const derivativeId = input.context.id("derivatives", input.role);
  const priceAt = createKpDifferentiableMap({
    id: input.context.id("functions", `${input.role}-price-at-quantity`),
    domain: input.quantitySpace,
    codomain: input.priceSpace,
    evaluate: (quantity) => createKpUnitValue(
      input.priceUnit,
      input.priceAtZero.magnitude + input.signedSlope * requireUnitMagnitude(
        quantity,
        input.quantityUnit,
        `${capitalize(input.role)} quantity`
      )
    ),
    derivativeAt: (quantity) => {
      requireUnitMagnitude(
        quantity,
        input.quantityUnit,
        `${capitalize(input.role)} derivative point`
      );
      return createKpLinearMap({
        id: derivativeId,
        domain: input.quantitySpace,
        codomain: input.priceSpace,
        apply: (change) => createKpUnitValue(
          input.priceUnit,
          input.signedSlope * requireUnitMagnitude(
            change,
            input.quantityUnit,
            `${capitalize(input.role)} quantity change`
          )
        ),
        linearity: {
          kind: "tested",
          suiteId: "kp.test.typed-linear-supply-demand.derivative-linearity",
          equalityId: input.priceSpace.vectors.equality.id
        },
        sourceMapIds: [id]
      });
    },
    sourceFunctionIds: [id]
  });

  return Object.freeze({
    kind: "linear-market-curve" as const,
    id,
    role: input.role,
    priceAtZero: input.priceAtZero,
    priceChangePerQuantity: Object.freeze({
      magnitude: input.signedSlope,
      domainUnitId: input.quantityUnit.id,
      codomainUnitId: input.priceUnit.id
    }),
    priceAt,
    derivativeUnitLatex: projectKpDerivativeUnitToLatex({
      domain: input.quantityUnit,
      codomain: input.priceUnit
    })
  });
}

function solveBaseline<
  Q extends string,
  P extends string,
  W extends string
>(market: KpLinearSupplyDemandExperiment<Q, P, W>): NumericOutcome {
  const demandAtZero = market.demand.priceAtZero.magnitude;
  const supplyAtZero = market.supply.priceAtZero.magnitude;
  const demandDrop = -market.demand.priceChangePerQuantity.magnitude;
  const supplyRise = market.supply.priceChangePerQuantity.magnitude;
  const traded = (demandAtZero - supplyAtZero) / (demandDrop + supplyRise);
  const price = demandAtZero - demandDrop * traded;
  const consumerSurplus = 0.5 * (demandAtZero - price) * traded;
  const producerSurplus = 0.5 * (price - supplyAtZero) * traded;
  return {
    demanded: traded,
    supplied: traded,
    traded,
    shortage: 0,
    surplus: 0,
    buyerPrice: price,
    sellerPrice: price,
    consumerSurplus,
    producerSurplus,
    governmentRevenue: 0,
    deadweightLoss: 0,
    totalSurplus: consumerSurplus + producerSurplus
  };
}

function solveSellerTax<
  Q extends string,
  P extends string,
  W extends string
>(
  market: KpLinearSupplyDemandExperiment<Q, P, W>,
  scenario: Extract<KpLinearMarketScenario<P>, { kind: "per-unit-seller-tax" }>,
  baseline: NumericOutcome
): KpLinearMarketSnapshot<Q, P, W> {
  requireText(scenario.id, "Seller-tax scenario id");
  const amount = normalizedUnitValue(
    scenario.amount,
    market.units.price,
    "Tax amount"
  );
  requireNonNegative(amount.magnitude, "Tax amount");

  const demandAtZero = market.demand.priceAtZero.magnitude;
  const supplyAtZero = market.supply.priceAtZero.magnitude;
  if (amount.magnitude >= demandAtZero - supplyAtZero) {
    throw new Error(
      "The bounded seller-tax scenario requires a positive interior trade quantity."
    );
  }
  const demandDrop = -market.demand.priceChangePerQuantity.magnitude;
  const supplyRise = market.supply.priceChangePerQuantity.magnitude;
  const traded = (
    demandAtZero - supplyAtZero - amount.magnitude
  ) / (demandDrop + supplyRise);
  const buyerPrice = demandAtZero - demandDrop * traded;
  const sellerPrice = buyerPrice - amount.magnitude;
  const consumerSurplus = 0.5 * (demandAtZero - buyerPrice) * traded;
  const producerSurplus = 0.5 * (sellerPrice - supplyAtZero) * traded;
  const governmentRevenue = amount.magnitude * traded;
  const totalSurplus = consumerSurplus + producerSurplus + governmentRevenue;
  const outcome: NumericOutcome = {
    demanded: traded,
    supplied: traded,
    traded,
    shortage: 0,
    surplus: 0,
    buyerPrice,
    sellerPrice,
    consumerSurplus,
    producerSurplus,
    governmentRevenue,
    deadweightLoss: Math.max(0, baseline.totalSurplus - totalSurplus),
    totalSurplus
  };

  return createSnapshot(market, scenario.id, Object.freeze({
    kind: "per-unit-seller-tax" as const,
    id: scenario.id,
    amount
  }), outcome);
}

function solvePriceFloor<
  Q extends string,
  P extends string,
  W extends string
>(
  market: KpLinearSupplyDemandExperiment<Q, P, W>,
  scenario: Extract<KpLinearMarketScenario<P>, { kind: "price-floor" }>,
  baseline: NumericOutcome
): KpLinearMarketSnapshot<Q, P, W> {
  requireText(scenario.id, "Price-floor scenario id");
  const floorPrice = normalizedUnitValue(
    scenario.price,
    market.units.price,
    "Price floor"
  );
  requireNonNegative(floorPrice.magnitude, "Price floor");
  const binding = floorPrice.magnitude > baseline.buyerPrice;
  const policy = Object.freeze({
    kind: "price-floor" as const,
    id: scenario.id,
    price: floorPrice,
    rationing: scenario.rationing,
    binding
  });
  if (!binding) {
    return createSnapshot(market, scenario.id, policy, baseline);
  }

  const demandAtZero = market.demand.priceAtZero.magnitude;
  const supplyAtZero = market.supply.priceAtZero.magnitude;
  const demandDrop = -market.demand.priceChangePerQuantity.magnitude;
  const supplyRise = market.supply.priceChangePerQuantity.magnitude;
  const demanded = Math.max(
    0,
    (demandAtZero - floorPrice.magnitude) / demandDrop
  );
  const supplied = Math.max(
    0,
    (floorPrice.magnitude - supplyAtZero) / supplyRise
  );
  const traded = Math.min(demanded, supplied);
  const consumerSurplus = Math.max(
    0,
    0.5 * (demandAtZero - floorPrice.magnitude) * traded
  );
  // Producer surplus assumes the declared lowest-cost sellers transact first.
  const producerSurplus = Math.max(
    0,
    (floorPrice.magnitude - supplyAtZero) * traded -
      0.5 * supplyRise * traded * traded
  );
  const totalSurplus = consumerSurplus + producerSurplus;
  const outcome: NumericOutcome = {
    demanded,
    supplied,
    traded,
    shortage: Math.max(0, demanded - supplied),
    surplus: Math.max(0, supplied - demanded),
    buyerPrice: floorPrice.magnitude,
    sellerPrice: floorPrice.magnitude,
    consumerSurplus,
    producerSurplus,
    governmentRevenue: 0,
    deadweightLoss: Math.max(0, baseline.totalSurplus - totalSurplus),
    totalSurplus
  };

  return createSnapshot(market, scenario.id, policy, outcome);
}

function createSnapshot<
  Q extends string,
  P extends string,
  W extends string
>(
  market: KpLinearSupplyDemandExperiment<Q, P, W>,
  scenarioId: string,
  policy: KpLinearMarketRealizedPolicy<P>,
  outcome: NumericOutcome
): KpLinearMarketSnapshot<Q, P, W> {
  const quantity = (magnitude: number) => createKpUnitValue(
    market.units.quantity,
    magnitude
  );
  const price = (magnitude: number) => createKpUnitValue(
    market.units.price,
    magnitude
  );
  const welfare = (magnitude: number) => createKpUnitValue(
    market.units.welfare,
    magnitude
  );
  return Object.freeze({
    kind: "linear-supply-demand-snapshot" as const,
    id: market.context.id("snapshots", scenarioId),
    marketId: market.id,
    policy,
    quantities: Object.freeze({
      demanded: quantity(outcome.demanded),
      supplied: quantity(outcome.supplied),
      traded: quantity(outcome.traded),
      shortage: quantity(outcome.shortage),
      surplus: quantity(outcome.surplus)
    }),
    prices: Object.freeze({
      buyer: price(outcome.buyerPrice),
      seller: price(outcome.sellerPrice)
    }),
    welfare: Object.freeze({
      consumerSurplus: welfare(outcome.consumerSurplus),
      producerSurplus: welfare(outcome.producerSurplus),
      governmentRevenue: welfare(outcome.governmentRevenue),
      deadweightLoss: welfare(outcome.deadweightLoss),
      totalSurplus: welfare(outcome.totalSurplus)
    }),
    sourceIds: Object.freeze([
      market.id,
      market.demand.id,
      market.supply.id
    ])
  });
}

function normalizedUnitValue<const UnitId extends string>(
  value: KpUnitValue<string>,
  unit: KpUnitDescriptor<UnitId>,
  label: string
): KpUnitValue<UnitId> {
  return createKpUnitValue(unit, requireUnitMagnitude(value, unit, label));
}

function requireUnitMagnitude<const UnitId extends string>(
  value: KpUnitValue<string>,
  unit: KpUnitDescriptor<UnitId>,
  label: string
): number {
  if (value.unitId !== unit.id) {
    throw new Error(`${label} must use unit ${unit.id}; received ${value.unitId}.`);
  }
  if (!Number.isFinite(value.magnitude)) {
    throw new Error(`${label} magnitude must be finite.`);
  }
  return value.magnitude;
}

function requirePositiveFinite(value: number, label: string): number {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} must be positive and finite.`);
  }
  return value;
}

function requireNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be non-negative and finite.`);
  }
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0 || value.trim() !== value) {
    throw new Error(`${label} must be non-empty and trimmed.`);
  }
}

function capitalize(value: string): string {
  return value[0]?.toUpperCase() + value.slice(1);
}
