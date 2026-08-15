import {
  kpCanonicalLogExponentLifecycles,
  type KpLogExponentLifecyclePlan
} from "./log-exponent-lifecycle.ts";
import type { KpChoreographyLifecycleRecord } from "./choreography-lifecycle.ts";

export type KpLogExponentInterpolationKind =
  | "measured-continuant-transfer"
  | "causal-structural-entry"
  | "causal-structural-exit";

export type KpLogExponentInterpolationChannel =
  | "measured-position"
  | "measured-scale"
  | "semantic-presence";

export interface KpLogExponentInterpolationObligation {
  readonly id: string;
  readonly operationId: string;
  readonly lifecycleRecordId: string;
  readonly kind: KpLogExponentInterpolationKind;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly channels: readonly KpLogExponentInterpolationChannel[];
  readonly motionRequirement: "required-in-full-motion";
  readonly reducedMotion: "seek-directly-to-semantic-endpoint";
  readonly terminalGuarantee:
    | "arrive-before-target-ownership"
    | "entry-caused-by-operation"
    | "retire-after-continuants-depart";
  readonly synchronizationGroupId?: string | undefined;
}

declare const kpLogExponentInterpolationAuthority: unique symbol;
const compiledPrograms = new WeakSet<object>();

export interface KpCompiledLogExponentInterpolationProgram {
  readonly schemaVersion: "kp.compiled-log-exponent-interpolation-program.v1";
  readonly id: "interpolation.log-exponent.solve-two-power-x";
  readonly obligations: readonly KpLogExponentInterpolationObligation[];
  readonly [kpLogExponentInterpolationAuthority]: true;
}

export function compileKpLogExponentInterpolationProgram(
  lifecycles: readonly KpLogExponentLifecyclePlan[] =
    kpCanonicalLogExponentLifecycles
): KpCompiledLogExponentInterpolationProgram {
  const obligations = Object.freeze(lifecycles.flatMap((plan) =>
    plan.lifecycle.records.map((record) => obligation(plan.operationId, record))
  ));
  const expectedCount = lifecycles.reduce(
    (count, plan) => count + plan.lifecycle.records.length,
    0
  );
  if (
    obligations.length !== expectedCount ||
    new Set(obligations.map(({ lifecycleRecordId }) => lifecycleRecordId)).size !==
      expectedCount
  ) {
    throw new Error("Every log-exponent lifecycle record requires exactly one interpolation obligation.");
  }
  const compiled = Object.freeze({
    schemaVersion: "kp.compiled-log-exponent-interpolation-program.v1" as const,
    id: "interpolation.log-exponent.solve-two-power-x" as const,
    obligations
  }) as KpCompiledLogExponentInterpolationProgram;
  compiledPrograms.add(compiled);
  return compiled;
}

export function isKpCompiledLogExponentInterpolationProgram(
  value: unknown
): value is KpCompiledLogExponentInterpolationProgram {
  return typeof value === "object" && value !== null && compiledPrograms.has(value);
}

export const kpCanonicalLogExponentInterpolationProgram =
  compileKpLogExponentInterpolationProgram();

function obligation(
  operationId: string,
  record: KpChoreographyLifecycleRecord
): KpLogExponentInterpolationObligation {
  const common = {
    id: `obligation.${record.id}`,
    operationId,
    lifecycleRecordId: record.id,
    sourceEntityIds: Object.freeze([...record.sourceEntityIds]),
    targetEntityIds: Object.freeze([...record.targetEntityIds]),
    motionRequirement: "required-in-full-motion" as const,
    reducedMotion: "seek-directly-to-semantic-endpoint" as const
  };
  switch (record.kind) {
    case "continuant": {
      const changesScale = record.id.endsWith("unknown-x") ||
        record.id.includes("log-base-value") ||
        record.id.includes("log-right-value");
      return Object.freeze({
        ...common,
        kind: "measured-continuant-transfer" as const,
        channels: Object.freeze([
          "measured-position" as const,
          ...(changesScale ? ["measured-scale" as const] : [])
        ]),
        terminalGuarantee: "arrive-before-target-ownership" as const
      });
    }
    case "introduction":
      return Object.freeze({
        ...common,
        kind: "causal-structural-entry" as const,
        channels: Object.freeze([
          "semantic-presence" as const,
          "measured-scale" as const
        ]),
        terminalGuarantee: "entry-caused-by-operation" as const,
        ...(record.targetEntityIds.length > 1
          ? {
              synchronizationGroupId:
                `synchronization.${operationId}.balanced-introduction`
            }
          : {})
      });
    case "elimination":
      return Object.freeze({
        ...common,
        kind: "causal-structural-exit" as const,
        channels: Object.freeze([
          "semantic-presence" as const,
          "measured-scale" as const
        ]),
        terminalGuarantee: "retire-after-continuants-depart" as const
      });
    case "copy":
    case "successor":
    case "artifact":
    case "annotation":
    case "disclosure":
      throw new Error(
        `Canonical log-exponent interpolation does not admit lifecycle ${record.kind}.`
      );
  }
}
