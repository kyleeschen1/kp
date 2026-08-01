import type { ExactRationalDto } from "../../protocols/public-api.ts";
import {
  addKpRationals,
  createKpRational,
  divideKpRationals,
  multiplyKpRationals,
  subtractKpRationals,
  type KpNormalizedRational
} from "../math/exact-rational.ts";
import {
  kpSupplyDemandEquilibriumExemplarInput,
  type KpSupplyDemandEquilibriumModelInputV1
} from "./supply-demand-equilibrium.ts";

export const kpSupplyDemandEquilibriumModelSchemaVersion =
  "kp.economics.supply-demand-equilibrium-model.v1" as const;

export type KpSupplyDemandEquilibriumPhase = "before" | "after";

export interface KpSupplyDemandEquilibriumPointV1 {
  readonly id: string;
  readonly stateId: string;
  readonly quantity: ExactRationalDto;
  readonly price: ExactRationalDto;
}

export interface KpSupplyDemandEquilibriumStateV1 {
  readonly id: string;
  readonly phase: KpSupplyDemandEquilibriumPhase;
  readonly demandIntercept: ExactRationalDto;
  readonly equilibrium: KpSupplyDemandEquilibriumPointV1;
  readonly supplyPriceAtEquilibrium: ExactRationalDto;
  readonly demandPriceAtEquilibrium: ExactRationalDto;
  readonly marketClearsExactly: true;
}

export interface KpSupplyDemandEquilibriumModelV1 {
  readonly schemaVersion: typeof kpSupplyDemandEquilibriumModelSchemaVersion;
  readonly id: string;
  readonly input: KpSupplyDemandEquilibriumModelInputV1;
  readonly states: {
    readonly before: KpSupplyDemandEquilibriumStateV1;
    readonly after: KpSupplyDemandEquilibriumStateV1;
  };
}

export interface KpSupplyDemandMarketAtPriceV1 {
  readonly phase: KpSupplyDemandEquilibriumPhase;
  readonly price: ExactRationalDto;
  readonly supplyQuantity: ExactRationalDto;
  readonly demandQuantity: ExactRationalDto;
  readonly condition: "surplus" | "equilibrium" | "shortage";
  readonly magnitude: ExactRationalDto;
}

export interface KpSupplyDemandModelIssue {
  readonly path: string;
  readonly message: string;
}

export function createKpSupplyDemandEquilibriumModel(
  input: KpSupplyDemandEquilibriumModelInputV1 =
    kpSupplyDemandEquilibriumExemplarInput
): KpSupplyDemandEquilibriumModelV1 {
  const issues = validateKpSupplyDemandEquilibriumInput(input);
  if (issues.length > 0) {
    throw new Error(issues.map(({ path, message }) => `${path}: ${message}`).join(" "));
  }

  const clonedInput = cloneInput(input);
  return Object.freeze({
    schemaVersion: kpSupplyDemandEquilibriumModelSchemaVersion,
    id: `model.${clonedInput.id}`,
    input: clonedInput,
    states: Object.freeze({
      before: solveEquilibriumState(clonedInput, "before"),
      after: solveEquilibriumState(clonedInput, "after")
    })
  });
}

export function evaluateKpSupplyPrice(input: {
  readonly model: KpSupplyDemandEquilibriumModelV1;
  readonly quantity: ExactRationalDto;
}): ExactRationalDto {
  const quantity = parseExact(input.quantity, "quantity");
  const intercept = parseExact(
    input.model.input.supply.priceIntercept,
    "supply.priceIntercept"
  );
  const slope = parseExact(
    input.model.input.supply.priceChangePerQuantity,
    "supply.priceChangePerQuantity"
  );
  return toDto(addKpRationals(intercept, multiplyKpRationals(slope, quantity)));
}

export function evaluateKpDemandPrice(input: {
  readonly model: KpSupplyDemandEquilibriumModelV1;
  readonly phase: KpSupplyDemandEquilibriumPhase;
  readonly quantity: ExactRationalDto;
}): ExactRationalDto {
  const quantity = parseExact(input.quantity, "quantity");
  const intercept = demandIntercept(input.model.input, input.phase);
  const slope = parseExact(
    input.model.input.demand.priceChangePerQuantity,
    "demand.priceChangePerQuantity"
  );
  return toDto(
    subtractKpRationals(intercept, multiplyKpRationals(slope, quantity))
  );
}

export function classifyKpSupplyDemandMarketAtPrice(input: {
  readonly model: KpSupplyDemandEquilibriumModelV1;
  readonly phase: KpSupplyDemandEquilibriumPhase;
  readonly price: ExactRationalDto;
}): KpSupplyDemandMarketAtPriceV1 {
  const price = parseExact(input.price, "price");
  assertWithinAxis(
    price,
    input.model.input.axes.price.minimum,
    input.model.input.axes.price.maximum,
    "price"
  );

  const supplyQuantity = divideKpRationals(
    subtractKpRationals(
      price,
      parseExact(input.model.input.supply.priceIntercept, "supply.priceIntercept")
    ),
    parseExact(
      input.model.input.supply.priceChangePerQuantity,
      "supply.priceChangePerQuantity"
    )
  );
  const demandQuantity = divideKpRationals(
    subtractKpRationals(demandIntercept(input.model.input, input.phase), price),
    parseExact(
      input.model.input.demand.priceChangePerQuantity,
      "demand.priceChangePerQuantity"
    )
  );
  const comparison = compare(supplyQuantity, demandQuantity);
  const difference = subtractKpRationals(supplyQuantity, demandQuantity);

  return Object.freeze({
    phase: input.phase,
    price: toDto(price),
    supplyQuantity: toDto(supplyQuantity),
    demandQuantity: toDto(demandQuantity),
    condition:
      comparison > 0 ? "surplus" : comparison < 0 ? "shortage" : "equilibrium",
    magnitude: toDto(absolute(difference))
  });
}

export function validateKpSupplyDemandEquilibriumInput(
  input: KpSupplyDemandEquilibriumModelInputV1
): readonly KpSupplyDemandModelIssue[] {
  const issues: KpSupplyDemandModelIssue[] = [];
  const exactFields = [
    ["axes.quantity.minimum", input.axes.quantity.minimum],
    ["axes.quantity.maximum", input.axes.quantity.maximum],
    ["axes.quantity.tickStep", input.axes.quantity.tickStep],
    ["axes.price.minimum", input.axes.price.minimum],
    ["axes.price.maximum", input.axes.price.maximum],
    ["axes.price.tickStep", input.axes.price.tickStep],
    ["supply.priceIntercept", input.supply.priceIntercept],
    ["supply.priceChangePerQuantity", input.supply.priceChangePerQuantity],
    ["demand.priceChangePerQuantity", input.demand.priceChangePerQuantity],
    ["demand.priceInterceptBefore", input.demand.priceInterceptBefore],
    ["demand.priceInterceptAfter", input.demand.priceInterceptAfter]
  ] as const;
  const parsed = new Map<string, KpNormalizedRational>();

  exactFields.forEach(([path, value]) => {
    try {
      parsed.set(path, parseExact(value, path));
    } catch (error) {
      issues.push({
        path,
        message: error instanceof Error ? error.message : "Invalid exact rational."
      });
    }
  });
  if (issues.length > 0) return Object.freeze(issues);

  requireLessThan(parsed, "axes.quantity.minimum", "axes.quantity.maximum", issues);
  requireLessThan(parsed, "axes.price.minimum", "axes.price.maximum", issues);
  requirePositive(parsed, "axes.quantity.tickStep", issues);
  requirePositive(parsed, "axes.price.tickStep", issues);
  requirePositive(parsed, "supply.priceChangePerQuantity", issues);
  requirePositive(parsed, "demand.priceChangePerQuantity", issues);
  requireLessThan(
    parsed,
    "demand.priceInterceptBefore",
    "demand.priceInterceptAfter",
    issues
  );

  if (issues.length === 0) {
    for (const phase of ["before", "after"] as const) {
      const state = solveEquilibriumState(input, phase);
      checkWithinAxis(
        parseExact(state.equilibrium.quantity, `${phase}.equilibrium.quantity`),
        parsed.get("axes.quantity.minimum")!,
        parsed.get("axes.quantity.maximum")!,
        `${phase}.equilibrium.quantity`,
        issues
      );
      checkWithinAxis(
        parseExact(state.equilibrium.price, `${phase}.equilibrium.price`),
        parsed.get("axes.price.minimum")!,
        parsed.get("axes.price.maximum")!,
        `${phase}.equilibrium.price`,
        issues
      );
    }
  }

  return Object.freeze(issues);
}

function solveEquilibriumState(
  input: KpSupplyDemandEquilibriumModelInputV1,
  phase: KpSupplyDemandEquilibriumPhase
): KpSupplyDemandEquilibriumStateV1 {
  const supplyIntercept = parseExact(
    input.supply.priceIntercept,
    "supply.priceIntercept"
  );
  const supplySlope = parseExact(
    input.supply.priceChangePerQuantity,
    "supply.priceChangePerQuantity"
  );
  const demandSlope = parseExact(
    input.demand.priceChangePerQuantity,
    "demand.priceChangePerQuantity"
  );
  const intercept = demandIntercept(input, phase);
  const quantity = divideKpRationals(
    subtractKpRationals(intercept, supplyIntercept),
    addKpRationals(supplySlope, demandSlope)
  );
  const supplyPrice = addKpRationals(
    supplyIntercept,
    multiplyKpRationals(supplySlope, quantity)
  );
  const demandPrice = subtractKpRationals(
    intercept,
    multiplyKpRationals(demandSlope, quantity)
  );

  if (compare(supplyPrice, demandPrice) !== 0) {
    throw new Error(`Exact ${phase} equilibrium does not clear the market.`);
  }

  return Object.freeze({
    id: `${input.equilibriumId}.${phase}`,
    phase,
    demandIntercept: toDto(intercept),
    equilibrium: Object.freeze({
      id: input.equilibriumId,
      stateId: `${input.equilibriumId}.${phase}`,
      quantity: toDto(quantity),
      price: toDto(supplyPrice)
    }),
    supplyPriceAtEquilibrium: toDto(supplyPrice),
    demandPriceAtEquilibrium: toDto(demandPrice),
    marketClearsExactly: true
  });
}

function demandIntercept(
  input: KpSupplyDemandEquilibriumModelInputV1,
  phase: KpSupplyDemandEquilibriumPhase
): KpNormalizedRational {
  return parseExact(
    phase === "before"
      ? input.demand.priceInterceptBefore
      : input.demand.priceInterceptAfter,
    `demand.priceIntercept${phase === "before" ? "Before" : "After"}`
  );
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

function compare(left: KpNormalizedRational, right: KpNormalizedRational): number {
  const difference =
    left.numerator * right.denominator - right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function absolute(value: KpNormalizedRational): KpNormalizedRational {
  return createKpRational(
    value.numerator < 0n ? -value.numerator : value.numerator,
    value.denominator
  );
}

function requirePositive(
  parsed: ReadonlyMap<string, KpNormalizedRational>,
  path: string,
  issues: KpSupplyDemandModelIssue[]
): void {
  if (compare(parsed.get(path)!, createKpRational(0n)) <= 0) {
    issues.push({ path, message: "Value must be positive." });
  }
}

function requireLessThan(
  parsed: ReadonlyMap<string, KpNormalizedRational>,
  leftPath: string,
  rightPath: string,
  issues: KpSupplyDemandModelIssue[]
): void {
  if (compare(parsed.get(leftPath)!, parsed.get(rightPath)!) >= 0) {
    issues.push({
      path: rightPath,
      message: `${rightPath} must be greater than ${leftPath}.`
    });
  }
}

function checkWithinAxis(
  value: KpNormalizedRational,
  minimum: KpNormalizedRational,
  maximum: KpNormalizedRational,
  path: string,
  issues: KpSupplyDemandModelIssue[]
): void {
  if (compare(value, minimum) < 0 || compare(value, maximum) > 0) {
    issues.push({ path, message: "Exact equilibrium must lie inside its axis domain." });
  }
}

function assertWithinAxis(
  value: KpNormalizedRational,
  minimum: ExactRationalDto,
  maximum: ExactRationalDto,
  path: string
): void {
  if (
    compare(value, parseExact(minimum, `${path}.minimum`)) < 0 ||
    compare(value, parseExact(maximum, `${path}.maximum`)) > 0
  ) {
    throw new RangeError(`${path} must lie inside the exemplar axis domain.`);
  }
}

function cloneInput(
  input: KpSupplyDemandEquilibriumModelInputV1
): KpSupplyDemandEquilibriumModelInputV1 {
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
      priceChangePerQuantity: cloneExact(input.demand.priceChangePerQuantity),
      priceInterceptBefore: cloneExact(input.demand.priceInterceptBefore),
      priceInterceptAfter: cloneExact(input.demand.priceInterceptAfter)
    }),
    preservation: Object.freeze([...input.preservation])
  });
}

