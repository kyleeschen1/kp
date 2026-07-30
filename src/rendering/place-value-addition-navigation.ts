import {
  KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS
} from "../semantic/place-value-addition-evaluation-tree.ts";
import {
  compileKpPlaceValueAdditionFoldProjection,
  createKpPlaceValueAdditionFoldIntent,
  kpPlaceValueAdditionOutlineAnchors,
  type KpPlaceValueAdditionFoldMode,
  type KpPlaceValueAdditionFoldProjection,
  type KpPlaceValueAdditionOutlineAnchor
} from "../semantic/place-value-addition-fold-plan.ts";
import {
  createKpReaderClockSample,
  type KpReaderClockSource
} from "../reader/runtime/playback-clock.ts";
import {
  createKpPlaceValueAdditionRuntimeSession,
  sampleKpPlaceValueAdditionRuntime,
  type KpPlaceValueAdditionRuntimeFrame,
  type KpPlaceValueAdditionRuntimeSession,
  type KpPlaceValueRuntimeView
} from "./place-value-addition-runtime.ts";

declare const kpPlaceValueNavigationBrand: unique symbol;

const sealedNavigations = new WeakSet<object>();

export interface KpPlaceValueAdditionNavigationSession {
  readonly schemaVersion: "kp.place-value-addition-navigation.v1";
  readonly runtime: KpPlaceValueAdditionRuntimeSession;
  readonly playbackAuthority: "editor-animation-player";
  readonly transportControls: readonly ["toggle"];
  readonly outlineAnchors: typeof kpPlaceValueAdditionOutlineAnchors;
  readonly frame: KpPlaceValueAdditionRuntimeFrame;
  readonly fold: KpPlaceValueAdditionFoldProjection;
  sampleProgress(input: {
    readonly progress: number;
    readonly source: KpReaderClockSource;
  }): KpPlaceValueAdditionRuntimeFrame;
  seekOutline(
    anchorId: KpPlaceValueAdditionOutlineAnchor["id"]
  ): KpPlaceValueAdditionRuntimeFrame;
  setView(
    view: KpPlaceValueRuntimeView
  ): KpPlaceValueAdditionRuntimeFrame;
  setViewportWidth(viewportWidth: number): KpPlaceValueAdditionRuntimeFrame;
  setFold(input: {
    readonly mode: KpPlaceValueAdditionFoldMode;
    readonly pinnedNodeIds?: readonly string[] | undefined;
  }): KpPlaceValueAdditionFoldProjection;
  toggleFold(nodeId: string): KpPlaceValueAdditionFoldProjection;
  readonly [kpPlaceValueNavigationBrand]: true;
}

/**
 * This adapter owns navigation history, not another animation clock. The
 * Animation Library's existing player remains the only play/pause authority;
 * its normalized progress is translated into the reader clock sample shared
 * by the written and base-ten projections.
 */
export function createKpPlaceValueAdditionNavigationSession(input: {
  readonly viewportWidth: number;
  readonly selectedView?: KpPlaceValueRuntimeView | undefined;
}): KpPlaceValueAdditionNavigationSession {
  if (!Number.isFinite(input.viewportWidth) || input.viewportWidth <= 0) {
    throw new Error(
      "Place-value navigation requires a positive viewport width."
    );
  }
  const runtime = createKpPlaceValueAdditionRuntimeSession();
  let viewportWidth = input.viewportWidth;
  let progress = 0;
  let sequence = 0;
  let selectedView = input.selectedView ?? "written";
  let fold = compileKpPlaceValueAdditionFoldProjection({
    intent: createKpPlaceValueAdditionFoldIntent({ mode: "automatic" }),
    detailBudget: "balanced"
  });
  let frame = sampleKpPlaceValueAdditionRuntime({
    session: runtime,
    clock: createKpReaderClockSample({
      source: "initial",
      progress: 0,
      previousProgress: 0,
      sequence
    }),
    viewportWidth,
    selectedView
  });

  const sample = (
    nextProgress: number,
    source: KpReaderClockSource,
    checkpointId?: string | undefined
  ): KpPlaceValueAdditionRuntimeFrame => {
    const normalized = requireProgress(nextProgress);
    sequence += 1;
    frame = sampleKpPlaceValueAdditionRuntime({
      session: runtime,
      clock: createKpReaderClockSample({
        source,
        progress: normalized,
        previousProgress: progress,
        sequence,
        settled: checkpointId !== undefined,
        ...(checkpointId === undefined ? {} : { checkpointId })
      }),
      viewportWidth,
      selectedView
    });
    progress = normalized;
    return frame;
  };

  const navigation = Object.freeze({
    schemaVersion: "kp.place-value-addition-navigation.v1" as const,
    runtime,
    playbackAuthority: "editor-animation-player" as const,
    transportControls: Object.freeze(["toggle"] as const),
    outlineAnchors: kpPlaceValueAdditionOutlineAnchors,
    get frame() {
      return frame;
    },
    get fold() {
      return fold;
    },
    sampleProgress(request: {
      readonly progress: number;
      readonly source: KpReaderClockSource;
    }) {
      return sample(request.progress, request.source);
    },
    seekOutline(anchorId: KpPlaceValueAdditionOutlineAnchor["id"]) {
      const anchor = requireAnchor(anchorId);
      const next = sample(
        anchor.progressPermille / 1_000,
        "controls",
        anchor.id
      );
      if (
        next.stableState.id !== anchor.stateId ||
        next.clock.checkpointId !== anchor.id
      ) {
        throw new Error(
          `Outline ${anchor.id} did not resolve its stable semantic state.`
        );
      }
      return next;
    },
    setView(view: KpPlaceValueRuntimeView) {
      if (view !== "written" && view !== "base-ten") {
        throw new Error(`Unknown place-value view ${String(view)}.`);
      }
      selectedView = view;
      return sample(progress, "controls");
    },
    setViewportWidth(nextViewportWidth: number) {
      if (
        !Number.isFinite(nextViewportWidth) ||
        nextViewportWidth <= 0
      ) {
        throw new Error(
          "Place-value navigation viewport width must be positive."
        );
      }
      viewportWidth = nextViewportWidth;
      return sample(progress, "controls");
    },
    setFold(request: {
      readonly mode: KpPlaceValueAdditionFoldMode;
      readonly pinnedNodeIds?: readonly string[] | undefined;
    }) {
      fold = compileKpPlaceValueAdditionFoldProjection({
        intent: createKpPlaceValueAdditionFoldIntent(request)
      });
      return fold;
    },
    toggleFold(nodeId: string) {
      if (!KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS.includes(
        nodeId as typeof KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS[number]
      )) {
        throw new Error(`Cannot fold unknown place-value group ${nodeId}.`);
      }
      const expanded = new Set(fold.expandedNodeIds);
      if (expanded.has(nodeId)) expanded.delete(nodeId);
      else expanded.add(nodeId);
      const pinnedNodeIds =
        KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS.filter((id) =>
          expanded.has(id)
        );
      fold = compileKpPlaceValueAdditionFoldProjection({
        intent: createKpPlaceValueAdditionFoldIntent(
          pinnedNodeIds.length === 0
            ? { mode: "collapsed" }
            : pinnedNodeIds.length ===
                KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS.length
              ? { mode: "expanded" }
              : { mode: "pinned", pinnedNodeIds }
        )
      });
      return fold;
    }
  });
  sealedNavigations.add(navigation);
  return navigation as unknown as KpPlaceValueAdditionNavigationSession;
}

export function isKpPlaceValueAdditionNavigationSession(
  value: unknown
): value is KpPlaceValueAdditionNavigationSession {
  return typeof value === "object" &&
    value !== null &&
    sealedNavigations.has(value);
}

function requireAnchor(
  id: string
): KpPlaceValueAdditionOutlineAnchor {
  const anchor = kpPlaceValueAdditionOutlineAnchors.find(
    (candidate) => candidate.id === id
  );
  if (anchor === undefined) {
    throw new Error(`Unknown place-value outline anchor ${id}.`);
  }
  return anchor;
}

function requireProgress(value: number): number {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(
      "Place-value navigation progress must be finite and normalized."
    );
  }
  return value;
}
