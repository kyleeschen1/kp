import {
  KP_EXACT_FRACTION_FOLDABLE_NODE_IDS,
  createKpExactFractionQuantityFoldIntent,
  type KpExactFractionQuantityFoldMode
} from "../semantic/exact-fraction-quantity-evaluation-tree.ts";
import type {
  KpExactFractionQuantityViewKind
} from "../semantic/exact-fraction-quantity-view-obligations.ts";

export const KP_EXACT_FRACTION_LIBRARY_QUERY_PARAMS = Object.freeze({
  progress: "exactProgress",
  activeView: "exactView",
  foldMode: "exactFold",
  pins: "exactPins"
});

export interface KpExactFractionQuantityLibraryState {
  readonly progress: number;
  readonly activeView: KpExactFractionQuantityViewKind;
  readonly foldMode: KpExactFractionQuantityFoldMode;
  readonly pinnedNodeIds: readonly string[];
}

const views = Object.freeze([
  "symbolic",
  "partitioned-circle",
  "fraction-bar",
  "number-line"
] as const);
const foldModes = Object.freeze([
  "expanded",
  "collapsed",
  "automatic",
  "pinned"
] as const);

export function createKpExactFractionQuantityLibraryState(
  input: Partial<KpExactFractionQuantityLibraryState> = {}
): KpExactFractionQuantityLibraryState {
  const progress = normalizeProgress(input.progress ?? 0);
  const activeView = input.activeView ?? "symbolic";
  if (!(views as readonly string[]).includes(activeView)) {
    throw new Error(`Unknown exact-fraction view ${activeView}.`);
  }
  const foldMode = input.foldMode ?? "automatic";
  if (!(foldModes as readonly string[]).includes(foldMode)) {
    throw new Error(`Unknown exact-fraction fold mode ${foldMode}.`);
  }
  const pinnedNodeIds = Object.freeze([...(input.pinnedNodeIds ?? [])]);
  createKpExactFractionQuantityFoldIntent({
    mode: foldMode,
    ...(foldMode === "pinned" ? { pinnedNodeIds } : {})
  });
  return Object.freeze({
    progress,
    activeView,
    foldMode,
    pinnedNodeIds: foldMode === "pinned"
      ? pinnedNodeIds
      : Object.freeze([])
  });
}

export function readKpExactFractionQuantityLibraryState(
  search: string
): KpExactFractionQuantityLibraryState {
  const params = new URLSearchParams(search);
  const progressValue = Number(
    params.get(KP_EXACT_FRACTION_LIBRARY_QUERY_PARAMS.progress) ?? 0
  ) / 1_000;
  const activeView = params.get(
    KP_EXACT_FRACTION_LIBRARY_QUERY_PARAMS.activeView
  );
  const foldMode = params.get(
    KP_EXACT_FRACTION_LIBRARY_QUERY_PARAMS.foldMode
  );
  const pins = uniqueStrings(
    (params.get(KP_EXACT_FRACTION_LIBRARY_QUERY_PARAMS.pins) ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter((value) =>
        (KP_EXACT_FRACTION_FOLDABLE_NODE_IDS as readonly string[])
          .includes(value)
      )
  );
  const normalizedFoldMode = isFoldMode(foldMode) &&
    (foldMode !== "pinned" || pins.length > 0)
    ? foldMode
    : "automatic";
  return createKpExactFractionQuantityLibraryState({
    progress: Number.isFinite(progressValue) ? progressValue : 0,
    activeView: isView(activeView) ? activeView : "symbolic",
    foldMode: normalizedFoldMode,
    ...(normalizedFoldMode === "pinned" ? { pinnedNodeIds: pins } : {})
  });
}

export function writeKpExactFractionQuantityLibraryState(input: {
  readonly search: string;
  readonly state: KpExactFractionQuantityLibraryState;
}): string {
  const state = createKpExactFractionQuantityLibraryState(input.state);
  const params = new URLSearchParams(input.search);
  params.set(
    KP_EXACT_FRACTION_LIBRARY_QUERY_PARAMS.progress,
    String(Math.round(state.progress * 1_000))
  );
  params.set(
    KP_EXACT_FRACTION_LIBRARY_QUERY_PARAMS.activeView,
    state.activeView
  );
  params.set(
    KP_EXACT_FRACTION_LIBRARY_QUERY_PARAMS.foldMode,
    state.foldMode
  );
  if (state.foldMode === "pinned") {
    params.set(
      KP_EXACT_FRACTION_LIBRARY_QUERY_PARAMS.pins,
      state.pinnedNodeIds.join(",")
    );
  } else {
    params.delete(KP_EXACT_FRACTION_LIBRARY_QUERY_PARAMS.pins);
  }
  const serialized = params.toString();
  return serialized.length === 0 ? "" : `?${serialized}`;
}

function normalizeProgress(progress: number): number {
  if (!Number.isFinite(progress)) {
    throw new Error("Exact-fraction library progress must be finite.");
  }
  // URLs store manifest permille, so callers never author raw scroll pixels or
  // a second timeline coordinate.
  return Math.round(Math.max(0, Math.min(1, progress)) * 1_000) / 1_000;
}

function isView(
  value: string | null
): value is KpExactFractionQuantityViewKind {
  return value !== null && (views as readonly string[]).includes(value);
}

function isFoldMode(
  value: string | null
): value is KpExactFractionQuantityFoldMode {
  return value !== null && (foldModes as readonly string[]).includes(value);
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}
