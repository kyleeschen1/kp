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
import {
  evaluateKpConstantForceWorkEnergyAtPosition,
  type KpConstantForceWorkEnergyModelV1,
  type KpConstantForceWorkEnergyStateV1
} from "./constant-force-work-energy-model.ts";

export const kpConstantForceWorkEnergyFrameSchemaVersion =
  "kp.physics.constant-force-work-energy-frame.v1" as const;

export type KpConstantForceWorkEnergyFrameDirection = "forward" | "rewind";

export interface KpConstantForceWorkEnergyFrameV1 {
  readonly schemaVersion: typeof kpConstantForceWorkEnergyFrameSchemaVersion;
  readonly id: string;
  readonly modelId: string;
  readonly direction: KpConstantForceWorkEnergyFrameDirection;
  readonly playbackProgress: ExactRationalDto;
  readonly modelProgress: ExactRationalDto;
  readonly phase: "initial" | "accumulating" | "final";
  readonly axes: {
    readonly positionAxisId: string;
    readonly forceAxisId: string;
    readonly horizontalSymbolLatex: "x";
    readonly verticalSymbolLatex: "F_x";
  };
  readonly state: KpConstantForceWorkEnergyStateV1;
  readonly unitIds: {
    readonly position: string;
    readonly force: string;
    readonly work: string;
    readonly kineticEnergy: string;
  };
  readonly activeSemanticIds: readonly string[];
}

export function sampleKpConstantForceWorkEnergyFrame(input: {
  readonly model: KpConstantForceWorkEnergyModelV1;
  readonly progress: ExactRationalDto;
  readonly direction?: KpConstantForceWorkEnergyFrameDirection | undefined;
}): KpConstantForceWorkEnergyFrameV1 {
  const direction = input.direction ?? "forward";
  const playbackProgress = parseExact(input.progress, "progress");
  assertUnitInterval(playbackProgress);
  const modelProgress = direction === "forward"
    ? playbackProgress
    : subtractKpRationals(createKpRational(1n), playbackProgress);
  const start = parseExact(
    input.model.input.motion.interval.start,
    "motion.interval.start"
  );
  const end = parseExact(
    input.model.input.motion.interval.end,
    "motion.interval.end"
  );
  const position = addKpRationals(
    start,
    multiplyKpRationals(subtractKpRationals(end, start), modelProgress)
  );
  const state = evaluateKpConstantForceWorkEnergyAtPosition({
    model: input.model,
    position: toDto(position)
  });
  const phase = modelProgress.numerator === 0n
    ? "initial"
    : modelProgress.numerator === modelProgress.denominator
      ? "final"
      : "accumulating";
  const modelProgressDto = toDto(modelProgress);

  return Object.freeze({
    schemaVersion: kpConstantForceWorkEnergyFrameSchemaVersion,
    id: `frame.${input.model.id}.${direction}.${exactId(modelProgressDto)}`,
    modelId: input.model.id,
    direction,
    playbackProgress: toDto(playbackProgress),
    modelProgress: modelProgressDto,
    phase,
    axes: Object.freeze({
      positionAxisId: input.model.input.forcePositionGraph.positionAxis.id,
      forceAxisId: input.model.input.forcePositionGraph.forceAxis.id,
      horizontalSymbolLatex: "x",
      verticalSymbolLatex: "F_x"
    }),
    state,
    unitIds: Object.freeze({
      position: input.model.input.units.meter.id,
      force: input.model.input.units.newton.id,
      work: input.model.input.units.joule.id,
      kineticEnergy: input.model.input.units.joule.id
    }),
    activeSemanticIds: Object.freeze([
      input.model.input.motion.object.id,
      input.model.input.motion.interval.id,
      input.model.input.motion.netForce.id,
      input.model.input.motion.netForce.parameter.id,
      input.model.input.forcePositionGraph.constantForceSegmentId,
      input.model.input.forcePositionGraph.workAreaId
    ])
  });
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

function assertUnitInterval(value: NormalizedExactRational): void {
  if (value.numerator < 0n || value.numerator > value.denominator) {
    throw new RangeError("Physics frame progress must lie between zero and one.");
  }
}

function exactId(value: ExactRationalDto): string {
  return `${value.numerator}-of-${value.denominator}`;
}
