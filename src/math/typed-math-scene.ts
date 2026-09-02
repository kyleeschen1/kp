import {
  resolveKpSemanticSelection,
  type KpSemanticOptic,
  type KpSemanticOpticCardinality,
  type KpSemanticSelection
} from "./typed-semantic-optics.ts";
import type {
  KpDerivativeMatrix,
  KpTypedEquation,
  KpTypedFunction,
  KpTypedMathValue
} from "./typed-semantic-math.ts";

export type KpRecoverableMathObject =
  | KpTypedMathValue
  | KpTypedFunction
  | KpTypedEquation
  | KpDerivativeMatrix;

export interface KpTypedMathSceneStep {
  readonly id: string;
  readonly objects: readonly KpRecoverableMathObject[];
}

export interface KpTypedMathSceneTimeline {
  readonly schemaVersion: "kp.typed-math-scene-timeline.v1";
  readonly id: string;
  readonly steps: readonly KpTypedMathSceneStep[];
}

export interface KpTypedMathSceneHandle<Value extends KpRecoverableMathObject> {
  readonly schemaVersion: "kp.typed-math-scene-handle.v1";
  readonly objectId: string;
  readonly kind: Value["kind"];
  readonly shapeFingerprint: string;
  readonly matches: (candidate: KpRecoverableMathObject) => candidate is Value;
}

export type KpTypedMathSceneRecoveryErrorCode =
  | "object-not-found"
  | "shape-mismatch"
  | "step-not-found";

export class KpTypedMathSceneRecoveryError extends Error {
  readonly code: KpTypedMathSceneRecoveryErrorCode;

  constructor(code: KpTypedMathSceneRecoveryErrorCode, message: string) {
    super(message);
    this.name = "KpTypedMathSceneRecoveryError";
    this.code = code;
  }
}

export function createKpTypedMathSceneTimeline(input: {
  readonly id: string;
  readonly steps: readonly KpTypedMathSceneStep[];
}): KpTypedMathSceneTimeline {
  requireText(input.id, "Typed math scene timeline id");
  requireUniqueIds(input.steps, `Typed math scene timeline ${input.id} steps`);
  const steps = input.steps.map((step) => {
    requireText(step.id, `Typed math scene timeline ${input.id} step id`);
    requireUniqueIds(step.objects, `Typed math scene step ${step.id} objects`);
    return Object.freeze({ id: step.id, objects: Object.freeze([...step.objects]) });
  });
  return Object.freeze({
    schemaVersion: "kp.typed-math-scene-timeline.v1" as const,
    id: input.id,
    steps: Object.freeze(steps)
  });
}

export function createKpTypedMathSceneHandle<
  const Value extends KpRecoverableMathObject
>(value: Value): KpTypedMathSceneHandle<Value> {
  const fingerprint = mathObjectFingerprint(value);
  return Object.freeze({
    schemaVersion: "kp.typed-math-scene-handle.v1" as const,
    objectId: value.id,
    kind: value.kind,
    shapeFingerprint: fingerprint,
    matches(candidate: KpRecoverableMathObject): candidate is Value {
      return candidate.id === value.id && candidate.kind === value.kind &&
        mathObjectFingerprint(candidate) === fingerprint;
    }
  });
}

/** Lookup is snapshot-based so arbitrary navigation never replays earlier motion. */
export function recoverKpTypedMathObjectAtStep<
  Value extends KpRecoverableMathObject
>(
  timeline: KpTypedMathSceneTimeline,
  stepId: string,
  handle: KpTypedMathSceneHandle<Value>
): Value {
  const step = timeline.steps.find(({ id }) => id === stepId);
  if (step === undefined) {
    throw new KpTypedMathSceneRecoveryError(
      "step-not-found",
      `Typed math scene ${timeline.id} has no step ${stepId}.`
    );
  }
  const candidate = step.objects.find(({ id }) => id === handle.objectId);
  if (candidate === undefined) {
    throw new KpTypedMathSceneRecoveryError(
      "object-not-found",
      `Typed math scene step ${stepId} has no object ${handle.objectId}.`
    );
  }
  if (!handle.matches(candidate)) {
    throw new KpTypedMathSceneRecoveryError(
      "shape-mismatch",
      `Typed math scene object ${handle.objectId} changed kind or shape at ${stepId}.`
    );
  }
  return candidate;
}

export function resolveKpSemanticSelectionAtStep<
  Root extends KpRecoverableMathObject,
  Focus,
  Cardinality extends KpSemanticOpticCardinality
>(input: {
  readonly timeline: KpTypedMathSceneTimeline;
  readonly stepId: string;
  readonly handle: KpTypedMathSceneHandle<Root>;
  readonly optic: KpSemanticOptic<Root, Focus, Cardinality>;
}): KpSemanticSelection<Root, Focus, Cardinality> {
  return resolveKpSemanticSelection(
    recoverKpTypedMathObjectAtStep(input.timeline, input.stepId, input.handle),
    input.optic
  );
}

function mathObjectFingerprint(value: KpRecoverableMathObject): string {
  switch (value.kind) {
    case "scalar-expression":
    case "scalar-parameter":
      return `${value.kind}:scalar`;
    case "typed-vector":
      return `${value.kind}:${value.size}`;
    case "typed-matrix":
      return `${value.kind}:${value.rowCount}x${value.columnCount}`;
    case "typed-function":
      return `${value.kind}:${value.parameters.length}:${mathTypeFingerprint(value.output.type)}`;
    case "typed-equation":
      return `${value.kind}:scalar=scalar`;
    case "derivative-matrix":
      return `${value.kind}:${value.derivativeKind}:` +
        `${value.matrix.rowCount}x${value.matrix.columnCount}`;
  }
}

function mathTypeFingerprint(type: KpTypedMathValue["type"]): string {
  switch (type.kind) {
    case "scalar":
      return "scalar";
    case "vector":
      return `vector:${type.size}`;
    case "matrix":
      return `matrix:${type.rows}x${type.columns}`;
  }
}

function requireUniqueIds(
  values: readonly { readonly id: string }[],
  label: string
): void {
  const ids = new Set<string>();
  values.forEach(({ id }) => {
    requireText(id, `${label} id`);
    if (ids.has(id)) throw new Error(`${label} repeat ${id}.`);
    ids.add(id);
  });
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) throw new Error(`${label} must not be empty.`);
}
