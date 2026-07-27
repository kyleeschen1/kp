import {
  createKpFoldableDistributionFoldIntent,
  type KpFoldableDistributionFoldMode
} from "../../semantic/foldable-distribution-fold-intent.ts";
import {
  compileKpFoldableDistributionAdaptiveProjection,
  compileKpFoldableDistributionStaticProjection,
  type KpFoldableDistributionProjection
} from "../../semantic/foldable-distribution-fold-projection.ts";
import {
  compileKpFoldableDistributionFoldTimeline,
  sampleKpFoldableDistributionTimeline
} from "../../semantic/foldable-distribution-fold-timeline.ts";
import {
  planKpFoldableDistributionLayout,
  decodeKpFoldableDistributionUrl,
  encodeKpFoldableDistributionUrl,
  type KpFoldableDistributionCheckpoint,
  type KpFoldableDistributionUrlState,
  type KpReaderRuntimeRouteDescriptor
} from "../runtime/public-api.ts";

export interface KpFoldableDistributionReaderControls {
  readonly projectAnimationProgress: (semanticProgress: number) => number;
  readonly resolveCheckpointProgressPermille: (
    checkpointId: string,
    fallbackProgressPermille: number
  ) => number;
  readonly encodeHref: (input: {
    readonly baseUrl: string | URL;
    readonly checkpointId?: string | undefined;
    readonly progressPermille: number;
    readonly direction: "forward" | "rewind";
  }) => string;
  readonly refreshViewport: () => void;
  readonly dispose: () => void;
}

type KpFoldableDistributionHrefInput = Parameters<
  KpFoldableDistributionReaderControls["encodeHref"]
>[0];

export function mountKpFoldableDistributionReaderControls(input: {
  readonly root: ParentNode;
  readonly stage: HTMLElement;
  readonly route: KpReaderRuntimeRouteDescriptor;
  readonly initialUrl: string | URL;
  readonly onChange: () => void;
}): KpFoldableDistributionReaderControls {
  const modeSelect = requireElement<HTMLSelectElement>(
    input.root,
    "[data-kp-reader-fold-mode]"
  );
  const status = requireElement<HTMLOutputElement>(
    input.root,
    "[data-kp-reader-fold-status]"
  );
  const buttons = [
    ...input.root.querySelectorAll<HTMLButtonElement>(
      "[data-kp-reader-fold-node]"
    )
  ];
  const decoded = decodeKpFoldableDistributionUrl(
    input.initialUrl,
    input.route
  );
  let mode = decoded.foldMode;
  let pinnedNodeIds = [...decoded.pinnedNodeIds];
  let projection = compileProjection();

  modeSelect.value = mode;
  modeSelect.addEventListener("change", onModeChange);
  for (const button of buttons) button.addEventListener("click", onPinToggle);
  syncPresentation();

  function compileProjection(): KpFoldableDistributionProjection {
    const intent = createKpFoldableDistributionFoldIntent({
      mode,
      ...(mode === "pinned" ? { pinnedNodeIds } : {})
    });
    if (mode === "expanded" || mode === "collapsed") {
      return compileKpFoldableDistributionStaticProjection(intent);
    }
    return compileKpFoldableDistributionAdaptiveProjection({
      intent,
      detailBudget: window.innerWidth > 880 ? "roomy" : "compact"
    });
  }

  function onModeChange(): void {
    const nextMode = modeSelect.value as KpFoldableDistributionFoldMode;
    if (nextMode === "pinned" && pinnedNodeIds.length === 0) {
      const first = buttonNodeId(buttons[0]);
      if (first !== undefined) pinnedNodeIds = [first];
    }
    mode = nextMode;
    if (mode !== "pinned") pinnedNodeIds = [];
    projection = compileProjection();
    syncPresentation();
    input.onChange();
  }

  function onPinToggle(event: Event): void {
    const nodeId = buttonNodeId(event.currentTarget);
    if (nodeId === undefined) return;
    const pins = new Set(mode === "pinned" ? pinnedNodeIds : []);
    if (pins.has(nodeId)) pins.delete(nodeId);
    else pins.add(nodeId);
    if (pins.size === 0) {
      mode = "automatic";
      pinnedNodeIds = [];
    } else {
      mode = "pinned";
      pinnedNodeIds = [...pins];
    }
    modeSelect.value = mode;
    projection = compileProjection();
    syncPresentation();
    input.onChange();
  }

  function syncPresentation(): void {
    const timeline = compileKpFoldableDistributionFoldTimeline(projection);
    const layout = planKpFoldableDistributionLayout({
      projection,
      viewport: window.innerWidth > 880 ? "wide" : "phone"
    });
    input.stage.dataset["kpReaderFoldMode"] = mode;
    input.stage.dataset["kpReaderFoldExpanded"] =
      projection.expandedNodeIds.join(",");
    input.stage.dataset["kpReaderFoldCollapsed"] =
      projection.collapsedNodeIds.join(",");
    input.stage.dataset["kpReaderFoldPinned"] = pinnedNodeIds.join(",");
    input.stage.dataset["kpReaderFoldTotalBeats"] = String(timeline.totalBeats);
    input.stage.dataset["kpReaderFoldViewport"] = layout.viewport;
    status.value = projection.disclosures.length === 0
      ? "Distribution and product details are expanded"
      : `Folded: ${projection.disclosures.map((disclosure) =>
          `${disclosure.label} (${disclosure.hiddenOperationIds.length} operations)`
        ).join("; ")}. All operations remain in the transcript.`;
    for (const button of buttons) {
      const nodeId = buttonNodeId(button);
      button.setAttribute(
        "aria-pressed",
        String(nodeId !== undefined && pinnedNodeIds.includes(nodeId))
      );
    }
  }

  return Object.freeze({
    projectAnimationProgress(semanticProgress: number) {
      const timeline = compileKpFoldableDistributionFoldTimeline(projection);
      const sample = sampleKpFoldableDistributionTimeline({
        timeline,
        progress: semanticProgress
      });
      const phaseIndex = timeline.phases.findIndex(
        ({ nodeId }) => nodeId === sample.activeNodeId
      );
      if (phaseIndex < 0) {
        throw new Error(`Unknown fold timeline phase ${sample.activeNodeId}.`);
      }
      input.stage.dataset["kpReaderFoldActiveNode"] = sample.activeNodeId;
      input.stage.dataset["kpReaderFoldPhaseDetail"] =
        timeline.phases[phaseIndex]!.detail;
      input.stage.dataset["kpReaderFoldLayoutPolicy"] =
        planKpFoldableDistributionLayout({
          projection,
          viewport: window.innerWidth > 880 ? "wide" : "phone"
        }).phases[phaseIndex]!.policy;
      return Math.min(
        1,
        Math.max(0, (phaseIndex + sample.phaseProgress) / timeline.phases.length)
      );
    },
    resolveCheckpointProgressPermille(
      checkpointId: string,
      fallbackProgressPermille: number
    ) {
      const timeline = compileKpFoldableDistributionFoldTimeline(projection);
      const normalizedCheckpointId = checkpointId.replace(/^beat\./, "");
      const exact = Object.entries(timeline.checkpoints).find(
        ([id]) => id === normalizedCheckpointId
      )?.[1];
      // Fold durations vary by presentation mode, so authored integer
      // permilles cannot be the exact operation boundary in every projection.
      return exact === undefined
        ? fallbackProgressPermille
        : exact * 1_000;
    },
    encodeHref({
      baseUrl,
      checkpointId,
      progressPermille,
      direction
    }: KpFoldableDistributionHrefInput) {
      const timeline = compileKpFoldableDistributionFoldTimeline(projection);
      const sample = sampleKpFoldableDistributionTimeline({
        timeline,
        progress: progressPermille / 1_000
      });
      const state: KpFoldableDistributionUrlState = {
        checkpoint: checkpoint(checkpointId, progressPermille),
        progressPermille,
        direction: direction === "rewind" ? "inverse" : "forward",
        foldMode: mode,
        activeNodeId: sample.activeNodeId,
        collapsedNodeIds: projection.collapsedNodeIds,
        pinnedNodeIds
      };
      return encodeKpFoldableDistributionUrl(baseUrl, input.route, state);
    },
    refreshViewport() {
      projection = compileProjection();
      syncPresentation();
    },
    dispose() {
      modeSelect.removeEventListener("change", onModeChange);
      for (const button of buttons) {
        button.removeEventListener("click", onPinToggle);
      }
    }
  });
}

function checkpoint(
  checkpointId: string | undefined,
  progressPermille: number
): KpFoldableDistributionCheckpoint {
  const normalized = checkpointId?.replace(/^beat\./, "");
  if (
    normalized === "factored" ||
    normalized === "distributed" ||
    normalized === "products-evaluated" ||
    normalized === "grouped" ||
    normalized === "coefficient-factored" ||
    normalized === "collected"
  ) {
    return normalized;
  }
  if (progressPermille >= 913) return "collected";
  if (progressPermille >= 738) return "coefficient-factored";
  if (progressPermille >= 555) return "grouped";
  if (progressPermille >= 345) return "products-evaluated";
  if (progressPermille >= 115) return "distributed";
  return "factored";
}

function buttonNodeId(value: EventTarget | null | undefined):
  string | undefined {
  return value instanceof HTMLElement
    ? value.dataset["kpReaderFoldNode"]
    : undefined;
}

function requireElement<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Missing reader control ${selector}.`);
  return element;
}
