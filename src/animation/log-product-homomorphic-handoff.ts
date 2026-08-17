import type { KpFunctionWrapMotionWindow } from "./function-wrap-motif.ts";
import {
  isKpCompiledLogProductOperation,
  type KpCompiledLogProductOperation
} from "../semantic/log-product-transformation-compiler.ts";
import type { SelectorCorrespondenceRecord } from "../semantic/correspondence.ts";

const APPLICATION_FISSION_RECORD_ID =
  "correspondence.log-product.application-fission" as const;
const OPERATOR_FISSION_RECORD_ID =
  "correspondence.log-product.operator-fission" as const;
const PRODUCT_DERIVES_SUM_RECORD_ID =
  "correspondence.log-product.product-derives-sum" as const;
const MAX_OPERATOR_VACANCY = 0.270_001;
const STRUCTURAL_RECEPTION_WINDOW = window(0.44, 0.48);
// Derived operators and connectors are one syntax-resolution cohort. Giving
// either separate timing falsely turns the additive relation into a new beat.
const SYNTAX_PRESENCE_WINDOW = window(0.54, 0.62);
const SYNTAX_EXPANSION_WINDOW = window(0.55, 0.64);

// Cardinality changes semantic bindings, not the causal phrase. This profile
// is the single tuning point for every log-product handoff caller.
export const kpLogProductHomomorphicHandoffTiming = Object.freeze({
  id: "timing.log-product.homomorphic-decomposition.v1" as const,
  operatorSourceContraction: window(0.18, 0.28),
  operatorSourceRelease: window(0.24, 0.32),
  operatorTargetPresence: SYNTAX_PRESENCE_WINDOW,
  operatorTargetExpansion: SYNTAX_EXPANSION_WINDOW,
  payloadTransit: window(0.2, 0.44),
  enclosureSourceRelease: window(0.12, 0.2),
  enclosureTargetPresence: STRUCTURAL_RECEPTION_WINDOW,
  enclosureTransit: window(0.48, 0.64),
  connectorTargetPresence: SYNTAX_PRESENCE_WINDOW,
  connectorTargetExpansion: SYNTAX_EXPANSION_WINDOW,
  targetHold: window(0.64, 1)
});

export interface KpLogProductHomomorphicHandoff {
  readonly schemaVersion: "kp.log-product-homomorphic-handoff.v1";
  readonly kind: "log-product-homomorphic-handoff";
  readonly maturity: "candidate";
  readonly transformationId: string;
  readonly factorCount: number;
  readonly timingProfileId: typeof kpLogProductHomomorphicHandoffTiming.id;
  readonly applicationCorrespondenceRecordId:
    "correspondence.log-product.application-fission";
  readonly operatorHandoff: {
    readonly topology: "matched-dissolve-to-derived-successors";
    readonly sourceExit: "collapse-to-point";
    readonly targetEntry: "expand-from-point";
    readonly receptionSynchronization: "closure-coupled";
    readonly correspondenceRecordId:
      "correspondence.log-product.operator-fission";
    readonly sourceEntityId: string;
    readonly targetEntityIds: readonly string[];
    readonly sourceContractionWindow: KpFunctionWrapMotionWindow;
    readonly sourceReleaseWindow: KpFunctionWrapMotionWindow;
    readonly targetPresenceWindow: KpFunctionWrapMotionWindow;
    readonly targetExpansionWindow: KpFunctionWrapMotionWindow;
  };
  readonly payloadHandoff: {
    readonly topology: "ordered-continuity";
    readonly correspondences: readonly {
      readonly correspondenceRecordId: string;
      readonly sourceEntityId: string;
      readonly targetEntityId: string;
    }[];
    readonly transitWindow: KpFunctionWrapMotionWindow;
  };
  readonly enclosureHandoff: {
    readonly topology: "source-scope-clears-before-derived-scopes";
    readonly correspondenceRecordIds: readonly [string, string];
    readonly sourceEntityIds: readonly [string, string];
    readonly targetEntityIds: readonly string[];
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
    readonly sourceEntityIds: readonly string[];
    readonly targetEntityIds: readonly string[];
    readonly targetEntry: "expand-from-point";
    readonly synchronization: "with-derived-operators";
    readonly receptionWindow: KpFunctionWrapMotionWindow;
    readonly expansionWindow: KpFunctionWrapMotionWindow;
  };
  readonly targetHoldWindow: KpFunctionWrapMotionWindow;
}

const compiledHandoffs = new WeakSet<object>();

/**
 * The compiler preserves occurrence truth while authoring visual continuity:
 * one source application derives distinct successors. A matched dissolve
 * preserves that concept while keeping source syntax, payload transit, and
 * target reception out of one another's spatial corridors.
 */
export function compileKpLogProductHomomorphicHandoff(
  operation: KpCompiledLogProductOperation
): KpLogProductHomomorphicHandoff {
  if (!isKpCompiledLogProductOperation(operation)) {
    throw new Error(
      "Log-product homomorphic handoff requires nominal compiler authority."
    );
  }
  const factorCount = operation.contract.family.factors.length;
  const records = operation.transformation.correspondenceMap?.records;
  if (records === undefined) {
    throw new Error("Log-product homomorphic handoff requires correspondence authority.");
  }
  requireFanOut(
    records,
    APPLICATION_FISSION_RECORD_ID,
    factorCount
  );
  const operator = requireFanOut(
    records,
    OPERATOR_FISSION_RECORD_ID,
    factorCount
  );
  const openShell = requireFanOut(
    records,
    "correspondence.log-product.open-shell-fission",
    factorCount
  );
  const closeShell = requireFanOut(
    records,
    "correspondence.log-product.close-shell-fission",
    factorCount
  );
  const relation = requireFanOut(
    records,
    PRODUCT_DERIVES_SUM_RECORD_ID,
    factorCount
  );
  const payloadRecords = operation.contract.family.factors.map(({ name }) =>
    requireOneToOne(
      records,
      `correspondence.log-product.${name}-argument-continuity`
    )
  );
  if (payloadRecords.length !== factorCount || factorCount < 2) {
    throw new Error("Log-product handoff requires every ordered factor payload.");
  }
  const handoff = Object.freeze({
    schemaVersion: "kp.log-product-homomorphic-handoff.v1" as const,
    kind: "log-product-homomorphic-handoff" as const,
    maturity: "candidate" as const,
    transformationId: operation.transformation.id,
    factorCount,
    timingProfileId: kpLogProductHomomorphicHandoffTiming.id,
    applicationCorrespondenceRecordId: APPLICATION_FISSION_RECORD_ID,
    operatorHandoff: Object.freeze({
      topology: "matched-dissolve-to-derived-successors" as const,
      sourceExit: "collapse-to-point" as const,
      targetEntry: "expand-from-point" as const,
      receptionSynchronization: "closure-coupled" as const,
      correspondenceRecordId: OPERATOR_FISSION_RECORD_ID,
      sourceEntityId: operator.sourceSelectorIds[0]!,
      targetEntityIds: Object.freeze([...operator.targetSelectorIds]),
      sourceContractionWindow:
        kpLogProductHomomorphicHandoffTiming.operatorSourceContraction,
      sourceReleaseWindow:
        kpLogProductHomomorphicHandoffTiming.operatorSourceRelease,
      targetPresenceWindow:
        kpLogProductHomomorphicHandoffTiming.operatorTargetPresence,
      targetExpansionWindow:
        kpLogProductHomomorphicHandoffTiming.operatorTargetExpansion
    }),
    payloadHandoff: Object.freeze({
      topology: "ordered-continuity" as const,
      correspondences: Object.freeze(payloadRecords.map((record) => Object.freeze({
        correspondenceRecordId: record.id,
        sourceEntityId: record.sourceSelectorIds[0]!,
        targetEntityId: record.targetSelectorIds[0]!
      }))),
      transitWindow: kpLogProductHomomorphicHandoffTiming.payloadTransit
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
      targetEntityIds: Object.freeze(operation.contract.family.factors.flatMap(
        (_, index) => [
          openShell.targetSelectorIds[index]!,
          closeShell.targetSelectorIds[index]!
        ]
      )),
      reception: "horizontal-squeeze" as const,
      sizeBehavior: "native-size" as const,
      targetPresenceWindow:
        kpLogProductHomomorphicHandoffTiming.enclosureTargetPresence,
      transitWindow: kpLogProductHomomorphicHandoffTiming.enclosureTransit,
      sourceReleaseWindow:
        kpLogProductHomomorphicHandoffTiming.enclosureSourceRelease
    }),
    relationHandoff: Object.freeze({
      topology: "product-derives-additive-structure" as const,
      correspondenceRecordId: PRODUCT_DERIVES_SUM_RECORD_ID,
      sourceEntityIds: Object.freeze([
        relation.sourceSelectorIds[0]!
      ]) as readonly [string],
      targetEntityIds: Object.freeze([...relation.targetSelectorIds]),
      targetEntry: "expand-from-point" as const,
      synchronization: "with-derived-operators" as const,
      receptionWindow:
        kpLogProductHomomorphicHandoffTiming.connectorTargetPresence,
      expansionWindow:
        kpLogProductHomomorphicHandoffTiming.connectorTargetExpansion
    }),
    targetHoldWindow: kpLogProductHomomorphicHandoffTiming.targetHold
  }) satisfies KpLogProductHomomorphicHandoff;
  assertCoverageOrdering(handoff);
  compiledHandoffs.add(handoff);
  return handoff;
}

export function isKpLogProductHomomorphicHandoff(
  value: unknown
): value is KpLogProductHomomorphicHandoff {
  return typeof value === "object" && value !== null && compiledHandoffs.has(value);
}

export function measureKpLogProductCarrierCoverage(
  handoff: KpLogProductHomomorphicHandoff,
  progress: number
): Readonly<{
  sourcePresence: number;
  targetPresence: number;
}> {
  if (!isKpLogProductHomomorphicHandoff(handoff)) {
    throw new Error("Carrier coverage requires a compiled log-product handoff.");
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
  handoff: KpLogProductHomomorphicHandoff
): void {
  if (
    handoff.enclosureHandoff.sourceReleaseWindow.end !==
      handoff.payloadHandoff.transitWindow.start ||
    handoff.payloadHandoff.transitWindow.end !==
      handoff.enclosureHandoff.targetPresenceWindow.start ||
    handoff.enclosureHandoff.targetPresenceWindow.end !==
      handoff.enclosureHandoff.transitWindow.start ||
    handoff.operatorHandoff.sourceContractionWindow.start >
      handoff.operatorHandoff.sourceReleaseWindow.start ||
    handoff.operatorHandoff.sourceContractionWindow.end >
      handoff.operatorHandoff.sourceReleaseWindow.end ||
    handoff.operatorHandoff.sourceReleaseWindow.end >
      handoff.operatorHandoff.targetPresenceWindow.start ||
    handoff.operatorHandoff.targetPresenceWindow.start -
      handoff.operatorHandoff.sourceReleaseWindow.end >
        MAX_OPERATOR_VACANCY ||
    handoff.payloadHandoff.transitWindow.end >
      handoff.operatorHandoff.targetPresenceWindow.start ||
    handoff.relationHandoff.receptionWindow.start !==
      handoff.operatorHandoff.targetPresenceWindow.start ||
    handoff.relationHandoff.receptionWindow.end !==
      handoff.operatorHandoff.targetPresenceWindow.end ||
    handoff.relationHandoff.expansionWindow.start !==
      handoff.operatorHandoff.targetExpansionWindow.start ||
    handoff.relationHandoff.expansionWindow.end !==
      handoff.operatorHandoff.targetExpansionWindow.end ||
    handoff.operatorHandoff.targetPresenceWindow.start >
      handoff.operatorHandoff.targetExpansionWindow.start ||
    handoff.operatorHandoff.targetPresenceWindow.end >
      handoff.operatorHandoff.targetExpansionWindow.end ||
    handoff.operatorHandoff.targetPresenceWindow.start <=
      handoff.enclosureHandoff.transitWindow.start ||
    handoff.operatorHandoff.targetExpansionWindow.end !==
      handoff.enclosureHandoff.transitWindow.end ||
    handoff.operatorHandoff.targetPresenceWindow.start >
      handoff.enclosureHandoff.transitWindow.end ||
    handoff.payloadHandoff.transitWindow.end >
      handoff.targetHoldWindow.start ||
    handoff.operatorHandoff.targetPresenceWindow.end >
      handoff.targetHoldWindow.start ||
    handoff.operatorHandoff.targetExpansionWindow.end >
      handoff.targetHoldWindow.start ||
    handoff.enclosureHandoff.transitWindow.end >
      handoff.targetHoldWindow.start ||
    handoff.targetHoldWindow.start !==
      handoff.enclosureHandoff.transitWindow.end
  ) {
    throw new Error(
      "Homomorphic handoff requires a bounded operator match-dissolve, clear payload corridor, synchronized syntax reception, and final hold."
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
