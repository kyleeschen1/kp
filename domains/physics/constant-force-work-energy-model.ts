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
  kpConstantForceWorkEnergyExemplarInput,
  type KpConstantForceWorkEnergyModelInputV1,
  type KpSiDimensionV1
} from "./constant-force-work-energy.ts";

export const kpConstantForceWorkEnergyModelSchemaVersion =
  "kp.physics.constant-force-work-energy-model.v1" as const;

export type KpConstantForceWorkEnergyPhase = "initial" | "sample" | "final";

export interface KpConstantForceWorkEnergyStateV1 {
  readonly id: string;
  readonly phase: KpConstantForceWorkEnergyPhase;
  readonly objectId: string;
  readonly position: ExactRationalDto;
  readonly displacement: ExactRationalDto;
  readonly netForceMagnitude: ExactRationalDto;
  readonly accumulatedWork: ExactRationalDto;
  readonly kineticEnergyChange: ExactRationalDto;
  readonly kineticEnergy: ExactRationalDto;
  readonly workEqualsKineticEnergyChange: true;
}

export interface KpConstantForceWorkEnergyModelV1 {
  readonly schemaVersion: typeof kpConstantForceWorkEnergyModelSchemaVersion;
  readonly id: string;
  readonly input: KpConstantForceWorkEnergyModelInputV1;
  readonly parameterState: {
    readonly netForceMagnitude: ExactRationalDto;
  };
  readonly unitProof: {
    readonly forceTimesDisplacement: KpSiDimensionV1;
    readonly energy: KpSiDimensionV1;
    readonly newtonTimesMeterEqualsJoule: true;
  };
  readonly states: {
    readonly initial: KpConstantForceWorkEnergyStateV1;
    readonly final: KpConstantForceWorkEnergyStateV1;
  };
}

export interface KpConstantForceWorkEnergyModelIssue {
  readonly path: string;
  readonly message: string;
}

export interface CreateKpConstantForceWorkEnergyModelInput {
  readonly input?: KpConstantForceWorkEnergyModelInputV1;
  readonly netForceMagnitude?: ExactRationalDto;
}

export function createKpConstantForceWorkEnergyModel(
  options: CreateKpConstantForceWorkEnergyModelInput = {}
): KpConstantForceWorkEnergyModelV1 {
  const authoredInput = options.input ?? kpConstantForceWorkEnergyExemplarInput;
  const issues = validateKpConstantForceWorkEnergyInput(authoredInput);
  if (issues.length > 0) {
    throw new Error(issues.map(({ path, message }) => `${path}: ${message}`).join(" "));
  }

  const input = cloneInput(authoredInput);
  const netForceMagnitude = parseExact(
    options.netForceMagnitude ?? input.motion.netForce.magnitude,
    "netForceMagnitude"
  );
  assertParameterValue(input, netForceMagnitude);
  const unitProof = createUnitProof(input);
  const parameterState = Object.freeze({
    netForceMagnitude: toDto(netForceMagnitude)
  });
  const modelBase = {
    schemaVersion: kpConstantForceWorkEnergyModelSchemaVersion,
    id: `model.${input.id}`,
    input,
    parameterState,
    unitProof
  } as const;
  const initial = solveState(
    modelBase,
    parseExact(input.motion.interval.start, "motion.interval.start")
  );
  const final = solveState(
    modelBase,
    parseExact(input.motion.interval.end, "motion.interval.end")
  );

  return Object.freeze({
    ...modelBase,
    states: Object.freeze({ initial, final })
  });
}

export function evaluateKpConstantForceWorkEnergyAtPosition(input: {
  readonly model: KpConstantForceWorkEnergyModelV1;
  readonly position: ExactRationalDto;
}): KpConstantForceWorkEnergyStateV1 {
  const position = parseExact(input.position, "position");
  const start = parseExact(
    input.model.input.motion.interval.start,
    "motion.interval.start"
  );
  const end = parseExact(
    input.model.input.motion.interval.end,
    "motion.interval.end"
  );
  if (compare(position, start) < 0 || compare(position, end) > 0) {
    throw new RangeError("position must lie inside the authored displacement interval.");
  }
  return solveState(input.model, position);
}

export function validateKpConstantForceWorkEnergyInput(
  input: KpConstantForceWorkEnergyModelInputV1
): readonly KpConstantForceWorkEnergyModelIssue[] {
  const issues: KpConstantForceWorkEnergyModelIssue[] = [];
  const exactFields = [
    ["motion.object.initialKineticEnergy.value", input.motion.object.initialKineticEnergy.value],
    ["motion.interval.start", input.motion.interval.start],
    ["motion.interval.end", input.motion.interval.end],
    ["motion.netForce.magnitude", input.motion.netForce.magnitude],
    ["motion.netForce.parameter.minimum", input.motion.netForce.parameter.minimum],
    ["motion.netForce.parameter.maximum", input.motion.netForce.parameter.maximum],
    ["motion.netForce.parameter.step", input.motion.netForce.parameter.step],
    ["motion.netForce.parameter.default", input.motion.netForce.parameter.default],
    ["forcePositionGraph.positionAxis.minimum", input.forcePositionGraph.positionAxis.minimum],
    ["forcePositionGraph.positionAxis.maximum", input.forcePositionGraph.positionAxis.maximum],
    ["forcePositionGraph.positionAxis.tickStep", input.forcePositionGraph.positionAxis.tickStep],
    ["forcePositionGraph.forceAxis.minimum", input.forcePositionGraph.forceAxis.minimum],
    ["forcePositionGraph.forceAxis.maximum", input.forcePositionGraph.forceAxis.maximum],
    ["forcePositionGraph.forceAxis.tickStep", input.forcePositionGraph.forceAxis.tickStep],
    ["canonicalResults.work.value", input.canonicalResults.work.value],
    ["canonicalResults.kineticEnergyChange.value", input.canonicalResults.kineticEnergyChange.value],
    ["canonicalResults.finalKineticEnergy.value", input.canonicalResults.finalKineticEnergy.value]
  ] as const;
  const parsed = new Map<string, KpNormalizedRational>();

  for (const [path, value] of exactFields) {
    try {
      parsed.set(path, parseExact(value, path));
    } catch (error) {
      issues.push({
        path,
        message: error instanceof Error ? error.message : "Invalid exact rational."
      });
    }
  }
  if (issues.length > 0) return Object.freeze(issues);

  const requiredDimensions = [
    ["units.meter.siDimension", input.units.meter.siDimension, { mass: 0, length: 1, time: 0 }],
    ["units.newton.siDimension", input.units.newton.siDimension, { mass: 1, length: 1, time: -2 }],
    ["units.joule.siDimension", input.units.joule.siDimension, { mass: 1, length: 2, time: -2 }]
  ] as const;
  for (const [path, actual, expected] of requiredDimensions) {
    if (!dimensionsEqual(actual, expected)) {
      issues.push({
        path,
        message:
          path === "units.joule.siDimension"
            ? "Joule must use SI energy dimensions so newton times meter must equal joule."
            : "Unit must use its authored SI dimensions."
      });
    }
  }

  requireLessThan(
    parsed,
    "forcePositionGraph.positionAxis.minimum",
    "forcePositionGraph.positionAxis.maximum",
    issues
  );
  requireLessThan(
    parsed,
    "forcePositionGraph.forceAxis.minimum",
    "forcePositionGraph.forceAxis.maximum",
    issues
  );
  requirePositive(parsed, "forcePositionGraph.positionAxis.tickStep", issues);
  requirePositive(parsed, "forcePositionGraph.forceAxis.tickStep", issues);
  requireLessThan(parsed, "motion.interval.start", "motion.interval.end", issues);
  requirePositive(parsed, "motion.netForce.magnitude", issues);
  requireLessThan(
    parsed,
    "motion.netForce.parameter.minimum",
    "motion.netForce.parameter.maximum",
    issues
  );
  requirePositive(parsed, "motion.netForce.parameter.step", issues);
  requireNonNegative(parsed, "motion.object.initialKineticEnergy.value", issues);

  checkWithin(
    parsed.get("motion.interval.start")!,
    parsed.get("forcePositionGraph.positionAxis.minimum")!,
    parsed.get("forcePositionGraph.positionAxis.maximum")!,
    "motion.interval.start",
    issues
  );
  checkWithin(
    parsed.get("motion.interval.end")!,
    parsed.get("forcePositionGraph.positionAxis.minimum")!,
    parsed.get("forcePositionGraph.positionAxis.maximum")!,
    "motion.interval.end",
    issues
  );
  checkWithin(
    parsed.get("motion.netForce.parameter.maximum")!,
    parsed.get("forcePositionGraph.forceAxis.minimum")!,
    parsed.get("forcePositionGraph.forceAxis.maximum")!,
    "motion.netForce.parameter.maximum",
    issues
  );
  checkWithin(
    parsed.get("motion.netForce.parameter.default")!,
    parsed.get("motion.netForce.parameter.minimum")!,
    parsed.get("motion.netForce.parameter.maximum")!,
    "motion.netForce.parameter.default",
    issues
  );

  if (
    compare(
      parsed.get("motion.netForce.magnitude")!,
      parsed.get("motion.netForce.parameter.default")!
    ) !== 0
  ) {
    issues.push({
      path: "motion.netForce.magnitude",
      message: "Authored force magnitude must equal the parameter default."
    });
  }

  validateUnitReferences(input, issues);

  const displacement = subtractKpRationals(
    parsed.get("motion.interval.end")!,
    parsed.get("motion.interval.start")!
  );
  const work = multiplyKpRationals(
    parsed.get("motion.netForce.magnitude")!,
    displacement
  );
  const finalKineticEnergy = addKpRationals(
    parsed.get("motion.object.initialKineticEnergy.value")!,
    work
  );
  checkExactResult(parsed, "canonicalResults.work.value", work, issues);
  checkExactResult(
    parsed,
    "canonicalResults.kineticEnergyChange.value",
    work,
    issues
  );
  checkExactResult(
    parsed,
    "canonicalResults.finalKineticEnergy.value",
    finalKineticEnergy,
    issues
  );

  return Object.freeze(issues);
}

function solveState(
  model: Pick<
    KpConstantForceWorkEnergyModelV1,
    "input" | "parameterState" | "unitProof"
  >,
  position: KpNormalizedRational
): KpConstantForceWorkEnergyStateV1 {
  const start = parseExact(model.input.motion.interval.start, "motion.interval.start");
  const end = parseExact(model.input.motion.interval.end, "motion.interval.end");
  const displacement = subtractKpRationals(position, start);
  const force = parseExact(
    model.parameterState.netForceMagnitude,
    "parameterState.netForceMagnitude"
  );
  const work = multiplyKpRationals(force, displacement);
  const initialKineticEnergy = parseExact(
    model.input.motion.object.initialKineticEnergy.value,
    "motion.object.initialKineticEnergy.value"
  );
  const kineticEnergy = addKpRationals(initialKineticEnergy, work);
  const comparisonWithStart = compare(position, start);
  const comparisonWithEnd = compare(position, end);
  const phase: KpConstantForceWorkEnergyPhase =
    comparisonWithStart === 0
      ? "initial"
      : comparisonWithEnd === 0
        ? "final"
        : "sample";

  return Object.freeze({
    id: `state.physics.work-energy.${phase}`,
    phase,
    objectId: model.input.motion.object.id,
    position: toDto(position),
    displacement: toDto(displacement),
    netForceMagnitude: toDto(force),
    accumulatedWork: toDto(work),
    kineticEnergyChange: toDto(work),
    kineticEnergy: toDto(kineticEnergy),
    workEqualsKineticEnergyChange: true
  });
}

function assertParameterValue(
  input: KpConstantForceWorkEnergyModelInputV1,
  value: KpNormalizedRational
): void {
  const minimum = parseExact(
    input.motion.netForce.parameter.minimum,
    "motion.netForce.parameter.minimum"
  );
  const maximum = parseExact(
    input.motion.netForce.parameter.maximum,
    "motion.netForce.parameter.maximum"
  );
  if (compare(value, minimum) < 0 || compare(value, maximum) > 0) {
    throw new RangeError(
      "netForceMagnitude must lie inside the authored parameter bounds."
    );
  }
  const step = parseExact(
    input.motion.netForce.parameter.step,
    "motion.netForce.parameter.step"
  );
  const stepsFromMinimum = divideKpRationals(
    subtractKpRationals(value, minimum),
    step
  );
  if (stepsFromMinimum.denominator !== 1n) {
    throw new RangeError("netForceMagnitude must align to the authored parameter step.");
  }
}

function createUnitProof(
  input: KpConstantForceWorkEnergyModelInputV1
): KpConstantForceWorkEnergyModelV1["unitProof"] {
  const forceTimesDisplacement = Object.freeze(
    addDimensions(input.units.newton.siDimension, input.units.meter.siDimension)
  );
  const energy = Object.freeze({ ...input.units.joule.siDimension });
  if (!dimensionsEqual(forceTimesDisplacement, energy)) {
    throw new Error("Validated physics input lost its work-energy unit identity.");
  }
  return Object.freeze({
    forceTimesDisplacement,
    energy,
    newtonTimesMeterEqualsJoule: true
  });
}

function validateUnitReferences(
  input: KpConstantForceWorkEnergyModelInputV1,
  issues: KpConstantForceWorkEnergyModelIssue[]
): void {
  const expected = [
    ["motion.object.initialKineticEnergy.unitId", input.motion.object.initialKineticEnergy.unitId, input.units.joule.id],
    ["motion.interval.unitId", input.motion.interval.unitId, input.units.meter.id],
    ["motion.netForce.unitId", input.motion.netForce.unitId, input.units.newton.id],
    ["forcePositionGraph.positionAxis.unitId", input.forcePositionGraph.positionAxis.unitId, input.units.meter.id],
    ["forcePositionGraph.forceAxis.unitId", input.forcePositionGraph.forceAxis.unitId, input.units.newton.id],
    ["canonicalResults.work.unitId", input.canonicalResults.work.unitId, input.units.joule.id],
    ["canonicalResults.kineticEnergyChange.unitId", input.canonicalResults.kineticEnergyChange.unitId, input.units.joule.id],
    ["canonicalResults.finalKineticEnergy.unitId", input.canonicalResults.finalKineticEnergy.unitId, input.units.joule.id]
  ] as const;
  for (const [path, actual, wanted] of expected) {
    if (actual !== wanted) {
      issues.push({ path, message: `Expected unit reference ${wanted}.` });
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

function compare(left: KpNormalizedRational, right: KpNormalizedRational): number {
  const difference =
    left.numerator * right.denominator - right.numerator * left.denominator;
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function addDimensions(
  left: KpSiDimensionV1,
  right: KpSiDimensionV1
): KpSiDimensionV1 {
  return {
    mass: left.mass + right.mass,
    length: left.length + right.length,
    time: left.time + right.time
  };
}

function dimensionsEqual(left: KpSiDimensionV1, right: KpSiDimensionV1): boolean {
  return (
    left.mass === right.mass &&
    left.length === right.length &&
    left.time === right.time
  );
}

function requirePositive(
  parsed: ReadonlyMap<string, KpNormalizedRational>,
  path: string,
  issues: KpConstantForceWorkEnergyModelIssue[]
): void {
  if (compare(parsed.get(path)!, createKpRational(0n)) <= 0) {
    issues.push({ path, message: "Value must be positive." });
  }
}

function requireNonNegative(
  parsed: ReadonlyMap<string, KpNormalizedRational>,
  path: string,
  issues: KpConstantForceWorkEnergyModelIssue[]
): void {
  if (compare(parsed.get(path)!, createKpRational(0n)) < 0) {
    issues.push({ path, message: "Value must be nonnegative." });
  }
}

function requireLessThan(
  parsed: ReadonlyMap<string, KpNormalizedRational>,
  leftPath: string,
  rightPath: string,
  issues: KpConstantForceWorkEnergyModelIssue[]
): void {
  if (compare(parsed.get(leftPath)!, parsed.get(rightPath)!) >= 0) {
    issues.push({
      path: rightPath,
      message: `${rightPath} must be greater than ${leftPath}.`
    });
  }
}

function checkWithin(
  value: KpNormalizedRational,
  minimum: KpNormalizedRational,
  maximum: KpNormalizedRational,
  path: string,
  issues: KpConstantForceWorkEnergyModelIssue[]
): void {
  if (compare(value, minimum) < 0 || compare(value, maximum) > 0) {
    issues.push({ path, message: "Value must lie inside its authored domain." });
  }
}

function checkExactResult(
  parsed: ReadonlyMap<string, KpNormalizedRational>,
  path: string,
  expected: KpNormalizedRational,
  issues: KpConstantForceWorkEnergyModelIssue[]
): void {
  if (compare(parsed.get(path)!, expected) !== 0) {
    issues.push({ path, message: "Canonical result does not match exact model truth." });
  }
}

function cloneInput(
  input: KpConstantForceWorkEnergyModelInputV1
): KpConstantForceWorkEnergyModelInputV1 {
  const cloneExact = (value: ExactRationalDto): ExactRationalDto =>
    toDto(parseExact(value, "exact value"));
  const cloneAxis = (
    axis: KpConstantForceWorkEnergyModelInputV1["forcePositionGraph"]["positionAxis"]
  ) =>
    Object.freeze({
      ...axis,
      minimum: cloneExact(axis.minimum),
      maximum: cloneExact(axis.maximum),
      tickStep: cloneExact(axis.tickStep)
    });
  const cloneUnit = (
    value: KpConstantForceWorkEnergyModelInputV1["units"]["meter"]
  ) => Object.freeze({ ...value, siDimension: Object.freeze({ ...value.siDimension }) });
  const cloneQuantity = (
    value: KpConstantForceWorkEnergyModelInputV1["motion"]["object"]["initialKineticEnergy"]
  ) => Object.freeze({ ...value, value: cloneExact(value.value) });

  return Object.freeze({
    ...input,
    assumptions: Object.freeze([...input.assumptions]) as typeof input.assumptions,
    units: Object.freeze({
      meter: cloneUnit(input.units.meter),
      newton: cloneUnit(input.units.newton),
      joule: cloneUnit(input.units.joule)
    }),
    motion: Object.freeze({
      object: Object.freeze({
        ...input.motion.object,
        initialKineticEnergy: cloneQuantity(input.motion.object.initialKineticEnergy)
      }),
      interval: Object.freeze({
        ...input.motion.interval,
        start: cloneExact(input.motion.interval.start),
        end: cloneExact(input.motion.interval.end)
      }),
      netForce: Object.freeze({
        ...input.motion.netForce,
        magnitude: cloneExact(input.motion.netForce.magnitude),
        parameter: Object.freeze({
          ...input.motion.netForce.parameter,
          minimum: cloneExact(input.motion.netForce.parameter.minimum),
          maximum: cloneExact(input.motion.netForce.parameter.maximum),
          step: cloneExact(input.motion.netForce.parameter.step),
          default: cloneExact(input.motion.netForce.parameter.default)
        })
      })
    }),
    forcePositionGraph: Object.freeze({
      ...input.forcePositionGraph,
      positionAxis: cloneAxis(input.forcePositionGraph.positionAxis),
      forceAxis: cloneAxis(input.forcePositionGraph.forceAxis)
    }),
    canonicalResults: Object.freeze({
      work: cloneQuantity(input.canonicalResults.work),
      kineticEnergyChange: cloneQuantity(input.canonicalResults.kineticEnergyChange),
      finalKineticEnergy: cloneQuantity(input.canonicalResults.finalKineticEnergy)
    }),
    laws: Object.freeze({ ...input.laws }),
    preservation: Object.freeze([...input.preservation])
  });
}
