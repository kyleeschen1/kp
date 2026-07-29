import type {
  KpNormalizedRational
} from "../../domains/math/exact-rational.ts";
import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../reader/compiler/exact-fraction-quantity-preservation-manifest.ts";
import {
  createKpExactFractionQuantityTrace,
  type KpExactFractionForm,
  type KpExactFractionQuantitySelectionState,
  type KpExactFractionQuantityTrace
} from "../semantic/exact-fraction-quantity-trace.ts";

export type KpExactFractionQuantityDirection = "forward" | "rewind";

export interface KpExactFractionQuantitySelectionTransition {
  readonly sourceSelectionIds: readonly string[];
  readonly targetSelectionIds: readonly string[];
  readonly atomicPartIds: readonly string[];
  readonly lifecycle: "persist" | "fission" | "fusion";
  readonly exactMeasure: KpNormalizedRational;
}

export interface KpExactFractionQuantityNeutralFrame {
  readonly schemaVersion: "kp.exact-fraction-quantity-neutral-frame.v1";
  readonly id: string;
  readonly traceId: string;
  readonly unitId: string;
  readonly direction: KpExactFractionQuantityDirection;
  readonly progress: number;
  readonly progressPermille: number;
  readonly beat: {
    readonly index: number;
    readonly id: string;
    readonly operation:
      KpExactFractionQuantityTrace["beats"][number]["operation"];
    readonly startPermille: number;
    readonly endPermille: number;
    readonly localProgress: number;
  };
  readonly sourceStateId: string;
  readonly targetStateId: string;
  readonly settledStateId?: string | undefined;
  readonly sourceSymbolicForms: readonly KpExactFractionForm[];
  readonly targetSymbolicForms: readonly KpExactFractionForm[];
  readonly sourceSelections:
    readonly KpExactFractionQuantitySelectionState[];
  readonly targetSelections:
    readonly KpExactFractionQuantitySelectionState[];
  readonly atomicPartIds: readonly string[];
  readonly selectionTransitions:
    readonly KpExactFractionQuantitySelectionTransition[];
  readonly focusSelectionIds: readonly string[];
  readonly exactTotal: KpNormalizedRational;
  readonly rendererNeutral: true;
}

export function sampleKpExactFractionQuantityNeutralFrame(input: {
  readonly progress: number;
  readonly direction?: KpExactFractionQuantityDirection | undefined;
  readonly trace?: KpExactFractionQuantityTrace | undefined;
}): KpExactFractionQuantityNeutralFrame {
  const trace = input.trace ?? createKpExactFractionQuantityTrace();
  const progress = normalizeProgress(input.progress);
  const progressPermille = progress * 1_000;
  const beatIndex = manifest.pacing.findIndex(
    ({ endPermille }) => progressPermille <= endPermille
  );
  const index = beatIndex < 0 ? manifest.pacing.length - 1 : beatIndex;
  const pacing = manifest.pacing[index]!;
  const beat = trace.beats[index]!;
  const targetState = trace.states[index]!;
  const sourceState = trace.states[Math.max(0, index - 1)]!;
  const duration = pacing.endPermille - pacing.startPermille;
  const localProgress = duration === 0
    ? 1
    : clamp01(
      (progressPermille - pacing.startPermille) / duration
    );
  const transitions = selectionTransitions(trace, index);
  const focusSelectionIds = uniqueStrings(
    transitions.flatMap(({ sourceSelectionIds, targetSelectionIds }) => [
      ...sourceSelectionIds,
      ...targetSelectionIds
    ])
  );

  return Object.freeze({
    schemaVersion: "kp.exact-fraction-quantity-neutral-frame.v1",
    id: `frame.exact-fraction-quantity.${formatProgress(progressPermille)}`,
    traceId: trace.id,
    unitId: trace.unitId,
    direction: input.direction ?? "forward",
    progress,
    progressPermille,
    beat: Object.freeze({
      index,
      id: beat.id,
      operation: beat.operation,
      startPermille: pacing.startPermille,
      endPermille: pacing.endPermille,
      localProgress
    }),
    sourceStateId: sourceState.id,
    targetStateId: targetState.id,
    ...(localProgress === 1
      ? { settledStateId: targetState.id }
      : {}),
    sourceSymbolicForms: sourceState.symbolicForms,
    targetSymbolicForms: targetState.symbolicForms,
    sourceSelections: sourceState.selections,
    targetSelections: targetState.selections,
    atomicPartIds: manifest.atomicPartIds,
    selectionTransitions: transitions,
    focusSelectionIds: Object.freeze(focusSelectionIds),
    exactTotal: targetState.exactTotal,
    rendererNeutral: true
  });
}

function selectionTransitions(
  trace: KpExactFractionQuantityTrace,
  index: number
): readonly KpExactFractionQuantitySelectionTransition[] {
  const source = trace.states[Math.max(0, index - 1)]!;
  const target = trace.states[index]!;
  const byId = (state: typeof source, id: string) =>
    state.selections.find(({ selectionId }) => selectionId === id);
  const transition = (
    sourceSelectionIds: readonly string[],
    targetSelectionIds: readonly string[],
    atomicPartIds: readonly string[],
    lifecycle: KpExactFractionQuantitySelectionTransition["lifecycle"],
    exactMeasure: KpNormalizedRational
  ): KpExactFractionQuantitySelectionTransition => Object.freeze({
    sourceSelectionIds: Object.freeze([...sourceSelectionIds]),
    targetSelectionIds: Object.freeze([...targetSelectionIds]),
    atomicPartIds: Object.freeze([...atomicPartIds]),
    lifecycle,
    exactMeasure
  });

  switch (index) {
    case 0:
      return Object.freeze(target.selections.map((selection) =>
        transition(
          [selection.selectionId],
          [selection.selectionId],
          selection.atomicPartIds,
          "persist",
          selection.exactMeasure
        )
      ));
    case 1: {
      const oneThird = source.selections[0]!;
      const oneSixth = source.selections[1]!;
      const twoSixths = target.selections[0]!;
      return Object.freeze([
        transition(
          [oneThird.selectionId],
          [twoSixths.selectionId],
          oneThird.atomicPartIds,
          "fission",
          oneThird.exactMeasure
        ),
        transition(
          [oneSixth.selectionId],
          [oneSixth.selectionId],
          oneSixth.atomicPartIds,
          "persist",
          oneSixth.exactMeasure
        )
      ]);
    }
    case 2:
      return Object.freeze(target.selections.map((selection) => {
        const prior = byId(source, selection.selectionId);
        if (prior === undefined) {
          throw new Error(
            `Aligned selection ${selection.selectionId} lacks its source.`
          );
        }
        return transition(
          [prior.selectionId],
          [selection.selectionId],
          selection.atomicPartIds,
          "persist",
          selection.exactMeasure
        );
      }));
    case 3: {
      const merged = target.selections[0]!;
      return Object.freeze([transition(
        source.selections.map(({ selectionId }) => selectionId),
        [merged.selectionId],
        merged.atomicPartIds,
        "fusion",
        merged.exactMeasure
      )]);
    }
    case 4: {
      const threeSixths = source.selections[0]!;
      const half = target.selections[0]!;
      return Object.freeze([transition(
        [threeSixths.selectionId],
        [half.selectionId],
        half.atomicPartIds,
        "fusion",
        half.exactMeasure
      )]);
    }
    default:
      throw new Error(`Unknown exact fraction beat index ${index}.`);
  }
}

function normalizeProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return clamp01(progress);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function formatProgress(progressPermille: number): string {
  return progressPermille.toFixed(3).replace(/\./gu, "-");
}
