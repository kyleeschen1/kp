import type {
  ExactRationalDto,
  NormalizedExactRational
} from "../../protocols/public-api.ts";
import {
  addKpRationals,
  createKpRational,
  multiplyKpRationals,
  subtractKpRationals
} from "../math/exact-rational.ts";
import type {
  KpSupplyDemandEquilibriumModelV1
} from "./supply-demand-equilibrium-model.ts";

export const kpSupplyDemandEquilibriumFrameSchemaVersion =
  "kp.economics.supply-demand-equilibrium-frame.v1" as const;

export type KpEconomicsFrameDirection = "forward" | "rewind";

export interface KpSupplyDemandEquilibriumFrameV1 {
  readonly schemaVersion: typeof kpSupplyDemandEquilibriumFrameSchemaVersion;
  readonly id: string;
  readonly modelId: string;
  readonly direction: KpEconomicsFrameDirection;
  readonly playbackProgress: ExactRationalDto;
  readonly modelProgress: ExactRationalDto;
  readonly phase: "before" | "shifting" | "after";
  readonly axes: {
    readonly quantityAxisId: string;
    readonly priceAxisId: string;
    readonly horizontalSymbol: "Q";
    readonly verticalSymbol: "P";
  };
  readonly supply: {
    readonly id: string;
    readonly priceIntercept: ExactRationalDto;
    readonly priceChangePerQuantity: ExactRationalDto;
  };
  readonly demand: {
    readonly id: string;
    readonly interceptParameterId: string;
    readonly priceInterceptBefore: ExactRationalDto;
    readonly priceInterceptCurrent: ExactRationalDto;
    readonly priceInterceptAfter: ExactRationalDto;
    readonly priceChangePerQuantity: ExactRationalDto;
  };
  readonly equilibrium: {
    readonly id: string;
    readonly quantity: ExactRationalDto;
    readonly price: ExactRationalDto;
  };
  readonly marketSides: {
    readonly surplus: "above-equilibrium-price";
    readonly shortage: "below-equilibrium-price";
  };
  readonly activeSemanticIds: readonly string[];
}

export function sampleKpSupplyDemandEquilibriumFrame(input: {
  readonly model: KpSupplyDemandEquilibriumModelV1;
  readonly progress: ExactRationalDto;
  readonly direction?: KpEconomicsFrameDirection | undefined;
}): KpSupplyDemandEquilibriumFrameV1 {
  const direction = input.direction ?? "forward";
  const playbackProgress = parseExact(input.progress, "progress");
  assertUnitInterval(playbackProgress);
  const modelProgress =
    direction === "forward"
      ? playbackProgress
      : subtractKpRationals(createKpRational(1n), playbackProgress);
  const before = input.model.states.before;
  const after = input.model.states.after;
  const demandIntercept = interpolateExact(
    parseExact(before.demandIntercept, "before.demandIntercept"),
    parseExact(after.demandIntercept, "after.demandIntercept"),
    modelProgress
  );
  const equilibriumQuantity = interpolateExact(
    parseExact(before.equilibrium.quantity, "before.equilibrium.quantity"),
    parseExact(after.equilibrium.quantity, "after.equilibrium.quantity"),
    modelProgress
  );
  const equilibriumPrice = interpolateExact(
    parseExact(before.equilibrium.price, "before.equilibrium.price"),
    parseExact(after.equilibrium.price, "after.equilibrium.price"),
    modelProgress
  );
  const phase = exactIsZero(modelProgress)
    ? "before"
    : exactIsOne(modelProgress)
      ? "after"
      : "shifting";
  const modelProgressDto = toDto(modelProgress);

  return Object.freeze({
    schemaVersion: kpSupplyDemandEquilibriumFrameSchemaVersion,
    id: `frame.${input.model.id}.${direction}.${exactId(modelProgressDto)}`,
    modelId: input.model.id,
    direction,
    playbackProgress: toDto(playbackProgress),
    modelProgress: modelProgressDto,
    phase,
    axes: Object.freeze({
      quantityAxisId: input.model.input.axes.quantity.id,
      priceAxisId: input.model.input.axes.price.id,
      horizontalSymbol: "Q",
      verticalSymbol: "P"
    }),
    supply: Object.freeze({
      id: input.model.input.supply.id,
      priceIntercept: cloneExact(input.model.input.supply.priceIntercept),
      priceChangePerQuantity: cloneExact(
        input.model.input.supply.priceChangePerQuantity
      )
    }),
    demand: Object.freeze({
      id: input.model.input.demand.id,
      interceptParameterId: input.model.input.demand.interceptParameterId,
      priceInterceptBefore: cloneExact(
        input.model.input.demand.priceInterceptBefore
      ),
      priceInterceptCurrent: toDto(demandIntercept),
      priceInterceptAfter: cloneExact(
        input.model.input.demand.priceInterceptAfter
      ),
      priceChangePerQuantity: cloneExact(
        input.model.input.demand.priceChangePerQuantity
      )
    }),
    equilibrium: Object.freeze({
      id: input.model.input.equilibriumId,
      quantity: toDto(equilibriumQuantity),
      price: toDto(equilibriumPrice)
    }),
    marketSides: Object.freeze({
      surplus: input.model.input.surplusSide,
      shortage: input.model.input.shortageSide
    }),
    activeSemanticIds: Object.freeze([
      input.model.input.supply.id,
      input.model.input.demand.id,
      input.model.input.equilibriumId,
      input.model.input.demand.interceptParameterId
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
  try {
    return createKpRational(BigInt(value.numerator), BigInt(value.denominator));
  } catch (error) {
    throw new Error(
      `${path} is invalid: ${error instanceof Error ? error.message : "unknown rational error"}`
    );
  }
}

function toDto(value: NormalizedExactRational): ExactRationalDto {
  return Object.freeze({
    numerator: value.numerator.toString(),
    denominator: value.denominator.toString()
  });
}

function cloneExact(value: ExactRationalDto): ExactRationalDto {
  return toDto(parseExact(value, "exact value"));
}

function assertUnitInterval(value: NormalizedExactRational): void {
  if (value.numerator < 0n || value.numerator > value.denominator) {
    throw new RangeError("Economics frame progress must lie between zero and one.");
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

