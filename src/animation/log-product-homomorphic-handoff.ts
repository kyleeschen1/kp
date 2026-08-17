import type { KpFunctionWrapMotionWindow } from "./function-wrap-motif.ts";
import {
  isKpCompiledLogProductOperation,
  type KpCompiledLogProductOperation
} from "../semantic/log-product-transformation-compiler.ts";
import type { SelectorCorrespondenceRecord } from "../semantic/correspondence.ts";

const BINARY_LOG_PRODUCT_FAMILY_ID = "family.log-product.xy";
const APPLICATION_FISSION_RECORD_ID =
  "correspondence.log-product.application-fission" as const;
const OPERATOR_FISSION_RECORD_ID =
  "correspondence.log-product.operator-fission" as const;
const PRODUCT_DERIVES_SUM_RECORD_ID =
  "correspondence.log-product.product-derives-sum" as const;

const binaryHandoffWindows = Object.freeze({
  operatorTargetPresence: window(0.14, 0.22),
  operatorTransit: window(0.22, 0.72),
  operatorSourceRelease: window(0.22, 0.34),
  payloadTransit: window(0.16, 0.48),
  enclosureSourceRelease: window(0.08, 0.16),
  enclosureTargetPresence: window(0.48, 0.54),
  enclosureTransit: window(0.54, 0.72),
  relationReception: window(0.66, 0.72),
  targetHold: window(0.72, 1)
});

export interface KpBinaryLogProductHomomorphicHandoff {
  readonly schemaVersion: "kp.log-product-homomorphic-handoff.v1";
  readonly kind: "log-product-homomorphic-handoff";
  readonly maturity: "candidate";
  readonly transformationId: string;
  readonly applicationCorrespondenceRecordId:
    "correspondence.log-product.application-fission";
  readonly operatorHandoff: {
    readonly topology: "source-overlaps-derived-successors";
    readonly correspondenceRecordId:
      "correspondence.log-product.operator-fission";
    readonly sourceEntityId: string;
    readonly targetEntityIds: readonly [string, string];
    readonly targetPresenceWindow: KpFunctionWrapMotionWindow;
    readonly transitWindow: KpFunctionWrapMotionWindow;
    readonly sourceReleaseWindow: KpFunctionWrapMotionWindow;
  };
  readonly payloadHandoff: {
    readonly topology: "ordered-continuity";
    readonly correspondences: readonly [
      {
        readonly correspondenceRecordId: string;
        readonly sourceEntityId: string;
        readonly targetEntityId: string;
      },
      {
        readonly correspondenceRecordId: string;
        readonly sourceEntityId: string;
        readonly targetEntityId: string;
      }
    ];
    readonly transitWindow: KpFunctionWrapMotionWindow;
  };
  readonly enclosureHandoff: {
    readonly topology: "source-scope-clears-before-derived-scopes";
    readonly correspondenceRecordIds: readonly [string, string];
    readonly sourceEntityIds: readonly [string, string];
    readonly targetEntityIds: readonly [string, string, string, string];
    readonly reception: "horizontal-squeeze";
    readonly sizeBehavior: "native-size";
    readonly targetPresenceWindow: KpFunctionWrapMotionWindow;
    readonly transitWindow: KpFunctionWrapMotionWindow;
    readonly sourceReleaseWindow: KpFunctionWrapMotionWindow;
  };
  readonly relationHandoff: {
    readonly topology: "product-derives-additive-structure";
    readonly correspondenceRecordId:
      "correspondence.log-product.product-derives-sum";
    readonly sourceEntityIds: readonly [string];
    readonly targetEntityIds: readonly [string, string];
    readonly synchronization: "with-derived-operators";
    readonly receptionWindow: KpFunctionWrapMotionWindow;
  };
  readonly targetHoldWindow: KpFunctionWrapMotionWindow;
}

const compiledHandoffs = new WeakSet<object>();

/**
 * The compiler preserves occurrence truth while authoring visual continuity:
 * one source application derives distinct successors, but their paint must
 * overlap long enough to read as the same logarithm concept penetrating the
 * product structure.
 */
export function compileKpBinaryLogProductHomomorphicHandoff(
  operation: KpCompiledLogProductOperation
): KpBinaryLogProductHomomorphicHandoff {
  if (!isKpCompiledLogProductOperation(operation)) {
    throw new Error(
      "Log-product homomorphic handoff requires nominal compiler authority."
    );
  }
  if (operation.contract.family.id !== BINARY_LOG_PRODUCT_FAMILY_ID) {
    throw new Error(
      "Log-product homomorphic handoff is limited to the binary visual exemplar."
    );
  }
  const records = operation.transformation.correspondenceMap?.records;
  if (records === undefined) {
    throw new Error("Log-product homomorphic handoff requires correspondence authority.");
  }
  requireFanOut(
    records,
    APPLICATION_FISSION_RECORD_ID,
    2
  );
  const operator = requireFanOut(
    records,
    OPERATOR_FISSION_RECORD_ID,
    2
  );
  const openShell = requireFanOut(
    records,
    "correspondence.log-product.open-shell-fission",
    2
  );
  const closeShell = requireFanOut(
    records,
    "correspondence.log-product.close-shell-fission",
    2
  );
  const relation = requireFanOut(
    records,
    PRODUCT_DERIVES_SUM_RECORD_ID,
    2
  );
  const payloadRecords = operation.contract.family.factors.map(({ name }) =>
    requireOneToOne(
      records,
      `correspondence.log-product.${name}-argument-continuity`
    )
  );
  if (payloadRecords.length !== 2) {
    throw new Error("Binary log-product handoff requires exactly two payloads.");
  }
  const handoff = Object.freeze({
    schemaVersion: "kp.log-product-homomorphic-handoff.v1" as const,
    kind: "log-product-homomorphic-handoff" as const,
    maturity: "candidate" as const,
    transformationId: operation.transformation.id,
    applicationCorrespondenceRecordId: APPLICATION_FISSION_RECORD_ID,
    operatorHandoff: Object.freeze({
      topology: "source-overlaps-derived-successors" as const,
      correspondenceRecordId: OPERATOR_FISSION_RECORD_ID,
      sourceEntityId: operator.sourceSelectorIds[0]!,
      targetEntityIds: Object.freeze([
        operator.targetSelectorIds[0]!,
        operator.targetSelectorIds[1]!
      ]) as readonly [string, string],
      targetPresenceWindow: binaryHandoffWindows.operatorTargetPresence,
      transitWindow: binaryHandoffWindows.operatorTransit,
      sourceReleaseWindow: binaryHandoffWindows.operatorSourceRelease
    }),
    payloadHandoff: Object.freeze({
      topology: "ordered-continuity" as const,
      correspondences: Object.freeze(payloadRecords.map((record) => Object.freeze({
        correspondenceRecordId: record.id,
        sourceEntityId: record.sourceSelectorIds[0]!,
        targetEntityId: record.targetSelectorIds[0]!
      }))) as KpBinaryLogProductHomomorphicHandoff["payloadHandoff"]["correspondences"],
      transitWindow: binaryHandoffWindows.payloadTransit
    }),
    enclosureHandoff: Object.freeze({
      topology: "source-scope-clears-before-derived-scopes" as const,
      correspondenceRecordIds: Object.freeze([
        openShell.id,
        closeShell.id
      ]) as readonly [string, string],
      sourceEntityIds: Object.freeze([
        openShell.sourceSelectorIds[0]!,
        closeShell.sourceSelectorIds[0]!
      ]) as readonly [string, string],
      targetEntityIds: Object.freeze([
        openShell.targetSelectorIds[0]!,
        closeShell.targetSelectorIds[0]!,
        openShell.targetSelectorIds[1]!,
        closeShell.targetSelectorIds[1]!
      ]) as readonly [string, string, string, string],
      reception: "horizontal-squeeze" as const,
      sizeBehavior: "native-size" as const,
      targetPresenceWindow: binaryHandoffWindows.enclosureTargetPresence,
      transitWindow: binaryHandoffWindows.enclosureTransit,
      sourceReleaseWindow: binaryHandoffWindows.enclosureSourceRelease
    }),
    relationHandoff: Object.freeze({
      topology: "product-derives-additive-structure" as const,
      correspondenceRecordId: PRODUCT_DERIVES_SUM_RECORD_ID,
      sourceEntityIds: Object.freeze([
        relation.sourceSelectorIds[0]!
      ]) as readonly [string],
      targetEntityIds: Object.freeze([
        relation.targetSelectorIds[0]!,
        relation.targetSelectorIds[1]!
      ]) as readonly [string, string],
      synchronization: "with-derived-operators" as const,
      receptionWindow: binaryHandoffWindows.relationReception
    }),
    targetHoldWindow: binaryHandoffWindows.targetHold
  }) satisfies KpBinaryLogProductHomomorphicHandoff;
  assertCoverageOrdering(handoff);
  compiledHandoffs.add(handoff);
  return handoff;
}

export function isKpBinaryLogProductHomomorphicHandoff(
  value: unknown
): value is KpBinaryLogProductHomomorphicHandoff {
  return typeof value === "object" && value !== null && compiledHandoffs.has(value);
}

export function measureKpBinaryLogProductCarrierCoverage(
  handoff: KpBinaryLogProductHomomorphicHandoff,
  progress: number
): Readonly<{
  sourcePresence: number;
  targetPresence: number;
}> {
  if (!isKpBinaryLogProductHomomorphicHandoff(handoff)) {
    throw new Error("Carrier coverage requires a compiled binary handoff.");
  }
  return Object.freeze({
    sourcePresence: 1 - sampleWindow(
      handoff.operatorHandoff.sourceReleaseWindow,
      progress
    ),
    targetPresence: sampleWindow(
      handoff.operatorHandoff.targetPresenceWindow,
      progress
    )
  });
}

function requireFanOut(
  records: readonly SelectorCorrespondenceRecord[],
  id: string,
  targetCount: number
): SelectorCorrespondenceRecord {
  const record = requireRecord(records, id);
  if (
    record.relation !== "fan-out" ||
    record.sourceSelectorIds.length !== 1 ||
    record.targetSelectorIds.length !== targetCount
  ) {
    throw new Error(`${id} must be a one-to-${targetCount} fan-out.`);
  }
  return record;
}

function requireOneToOne(
  records: readonly SelectorCorrespondenceRecord[],
  id: string
): SelectorCorrespondenceRecord {
  const record = requireRecord(records, id);
  if (
    record.relation !== "role-change" ||
    record.sourceSelectorIds.length !== 1 ||
    record.targetSelectorIds.length !== 1
  ) {
    throw new Error(`${id} must preserve one ordered payload occurrence.`);
  }
  return record;
}

function requireRecord(
  records: readonly SelectorCorrespondenceRecord[],
  id: string
): SelectorCorrespondenceRecord {
  const matches = records.filter((record) => record.id === id);
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one correspondence ${id}.`);
  }
  return matches[0]!;
}

function assertCoverageOrdering(
  handoff: KpBinaryLogProductHomomorphicHandoff
): void {
  if (
    handoff.operatorHandoff.targetPresenceWindow.end >
      handoff.operatorHandoff.sourceReleaseWindow.start ||
    handoff.enclosureHandoff.sourceReleaseWindow.end >
      handoff.payloadHandoff.transitWindow.start ||
    handoff.payloadHandoff.transitWindow.end >
      handoff.enclosureHandoff.targetPresenceWindow.start ||
    handoff.relationHandoff.receptionWindow.end !==
      handoff.operatorHandoff.transitWindow.end ||
    handoff.payloadHandoff.transitWindow.end >
      handoff.targetHoldWindow.start ||
    handoff.operatorHandoff.transitWindow.end >
      handoff.targetHoldWindow.start ||
    handoff.enclosureHandoff.transitWindow.end >
      handoff.targetHoldWindow.start
  ) {
    throw new Error(
      "Homomorphic handoff requires continuous operator coverage, a clear payload corridor, synchronized relation settlement, and a final hold."
    );
  }
}

function sampleWindow(
  motionWindow: KpFunctionWrapMotionWindow,
  progress: number
): number {
  if (!Number.isFinite(progress)) {
    throw new Error("Homomorphic handoff progress must be finite.");
  }
  const bounded = Math.max(0, Math.min(1, progress));
  if (bounded <= motionWindow.start) return 0;
  if (bounded >= motionWindow.end) return 1;
  const local = (bounded - motionWindow.start) /
    (motionWindow.end - motionWindow.start);
  return local * local * (3 - 2 * local);
}

function window(start: number, end: number): KpFunctionWrapMotionWindow {
  if (!(start >= 0 && start < end && end <= 1)) {
    throw new Error("Homomorphic handoff windows must be ordered within the unit interval.");
  }
  return Object.freeze({ start, end });
}
