import type { KpSchemeCheckpointProjection } from
  "../semantic/scheme-factorial-checkpoint-projector.ts";
import type {
  KpSchemeCallReturnedEvent,
  KpSchemePrimitiveAppliedEvent,
  KpSchemeTrace
} from "../semantic/scheme-factorial-trace.ts";

export interface KpSchemeReturnStep {
  readonly id: string;
  readonly index: number;
  readonly returnEventId: string;
  readonly incomingValueId: string;
  readonly shellContinuationId: string;
  readonly applicationExpressionId: string;
  readonly multiplicationEventId: string | null;
  readonly outgoingValueId: string;
  readonly exactResult: number;
}

export interface KpSchemeReturnChoreography {
  readonly schemaVersion: "kp.scheme-factorial-return-choreography.v1";
  readonly baseCheckpointId: string;
  readonly baseValueId: string;
  readonly baseExactInteger: 1;
  readonly carrierId: "scheme-factorial.return-carrier";
  readonly steps: readonly KpSchemeReturnStep[];
  readonly finalValueId: string;
  readonly finalExactInteger: 6;
}

export interface KpSchemeReturnSample {
  readonly progress: number;
  readonly phase: "base-hold" | "travel" | "reopen" | "multiply" | "settled";
  readonly activeStepIndex: number;
  readonly carrierValueId: string;
  readonly carrierExactInteger: number;
  readonly travelProgress: number;
  readonly shellReopenProgress: number;
  readonly productRevealProgress: number;
  readonly resolvedStepCount: number;
}

export function compileKpSchemeFactorialReturnChoreography(input: {
  readonly trace: KpSchemeTrace;
  readonly checkpoints: KpSchemeCheckpointProjection;
}): KpSchemeReturnChoreography {
  const base = input.checkpoints.checkpoints.find(({ id }) =>
    id.endsWith("base-case"));
  if (base === undefined) throw new Error("Missing factorial base checkpoint.");
  const baseValue = base.material.find(({ kind }) => kind === "value")
    ?.runtimeIds[0];
  if (baseValue === undefined) throw new Error("Base checkpoint has no value.");
  const returns = input.trace.events.filter(
    (event): event is KpSchemeCallReturnedEvent => event.kind === "call-returned"
  );
  const firstBaseReturnIndex = returns.findIndex(({ resultValueId }) =>
    resultValueId === baseValue);
  if (firstBaseReturnIndex < 0) {
    throw new Error("Base value does not cross a call-return boundary.");
  }
  const cascadeReturns = returns.slice(firstBaseReturnIndex + 1);
  const products = input.trace.events.filter(
    (event): event is KpSchemePrimitiveAppliedEvent =>
      event.kind === "primitive-applied" && event.primitive === "*"
  );
  if (cascadeReturns.length !== 3 || products.length !== 3) {
    throw new Error("Factorial return cascade requires three products and returns.");
  }
  const steps = products.map((product, index) => {
    const returned = cascadeReturns[index]!;
    const incomingValueId = product.argumentValueIds[1]!;
    const exactResult = exactInteger(input.trace, product.resultValueId);
    const shellContinuationId = input.trace.snapshots[product.index]?.state
      .activeContinuationId;
    if (shellContinuationId === null || shellContinuationId === undefined) {
      throw new Error("Multiplication result has no waiting shell continuation.");
    }
    if (returned.resultValueId !== product.resultValueId) {
      throw new Error("Return step must carry the local multiplication result.");
    }
    return Object.freeze({
      id: `scheme-factorial.return-step.${index}`,
      index,
      returnEventId: returned.id,
      incomingValueId,
      shellContinuationId,
      applicationExpressionId: product.applicationExpressionId,
      multiplicationEventId: product.id,
      outgoingValueId: product.resultValueId,
      exactResult
    });
  });
  return Object.freeze({
    schemaVersion: "kp.scheme-factorial-return-choreography.v1",
    baseCheckpointId: base.id,
    baseValueId: baseValue,
    baseExactInteger: 1,
    carrierId: "scheme-factorial.return-carrier",
    steps: Object.freeze(steps),
    finalValueId: steps.at(-1)!.outgoingValueId,
    finalExactInteger: 6
  });
}

export function sampleKpSchemeFactorialReturn(
  choreography: KpSchemeReturnChoreography,
  progress: number
): KpSchemeReturnSample {
  const value = clamp(progress);
  const holdEnd = 0.18;
  if (value <= holdEnd) {
    return sample(value, "base-hold", 0, choreography.baseValueId, 1,
      0, 0, 0, 0);
  }
  const cascade = (value - holdEnd) / (1 - holdEnd);
  const scaled = Math.min(choreography.steps.length,
    cascade * choreography.steps.length);
  const activeStepIndex = Math.min(choreography.steps.length - 1,
    Math.floor(scaled));
  const local = value === 1 ? 1 : scaled % 1;
  const step = choreography.steps[activeStepIndex]!;
  const incomingExact = activeStepIndex === 0
    ? choreography.baseExactInteger
    : choreography.steps[activeStepIndex - 1]!.exactResult;
  const travelProgress = interval(local, 0, 0.38);
  const shellReopenProgress = interval(local, 0.28, 0.68);
  // Each product settles before its local interval ends, leaving a readable
  // checkpoint instead of exposing the result for only one boundary sample.
  const productRevealProgress = interval(local, 0.62, 0.86);
  const productSettled = productRevealProgress === 1;
  const resolvedStepCount = activeStepIndex + Number(productSettled);
  const settled = value === 1;
  return sample(
    value,
    settled ? "settled" : productRevealProgress > 0
      ? "multiply" : shellReopenProgress > 0 ? "reopen" : "travel",
    activeStepIndex,
    productSettled ? step.outgoingValueId : step.incomingValueId,
    productSettled ? step.exactResult : incomingExact,
    travelProgress,
    shellReopenProgress,
    productRevealProgress,
    resolvedStepCount
  );
}

function sample(
  progress: number,
  phase: KpSchemeReturnSample["phase"],
  activeStepIndex: number,
  carrierValueId: string,
  carrierExactInteger: number,
  travelProgress: number,
  shellReopenProgress: number,
  productRevealProgress: number,
  resolvedStepCount: number
): KpSchemeReturnSample {
  return Object.freeze({
    progress: round(progress),
    phase,
    activeStepIndex,
    carrierValueId,
    carrierExactInteger,
    travelProgress,
    shellReopenProgress,
    productRevealProgress,
    resolvedStepCount
  });
}

function exactInteger(trace: KpSchemeTrace, valueId: string): number {
  const value = trace.snapshots.at(-1)?.state.values.find(({ id }) =>
    id === valueId);
  if (value?.kind !== "integer") throw new Error(`Expected integer ${valueId}.`);
  return value.exactInteger;
}

function interval(value: number, start: number, end: number): number {
  return round(Math.max(0, Math.min(1, (value - start) / (end - start))));
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Scheme return progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
