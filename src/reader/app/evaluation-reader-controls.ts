import type {
  KpEquationStageLayoutIntent,
  KpReaderEvaluationFoldMode,
  KpReaderEvaluationFoldUrlState,
  KpReaderRuntimeRouteDescriptor
} from "../runtime/public-api.ts";

export interface KpEvaluationReaderControls {
  readonly readStageLayoutIntent: () => KpEquationStageLayoutIntent;
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

export interface KpEvaluationReaderProjection {
  readonly mode: KpReaderEvaluationFoldMode;
  readonly expandedNodeIds: readonly string[];
  readonly collapsedNodeIds: readonly string[];
  readonly disclosures: readonly {
    readonly label: string;
    readonly hiddenOperationIds: readonly string[];
  }[];
}

export interface KpEvaluationReaderTimelinePhase {
  readonly nodeId: string;
  readonly operationIds: readonly string[];
  readonly detail: string;
}

export interface KpEvaluationReaderTimeline {
  readonly totalBeats: number;
  readonly phases: readonly KpEvaluationReaderTimelinePhase[];
  readonly checkpoints: Readonly<Record<string, number>>;
}

export interface KpEvaluationReaderTimelineSample {
  readonly activeNodeId: string;
  readonly phaseProgress: number;
}

export interface KpEvaluationReaderAdapter<
  TCheckpoint extends string,
  TProjection extends KpEvaluationReaderProjection,
  TTimeline extends KpEvaluationReaderTimeline,
  TSample extends KpEvaluationReaderTimelineSample,
  TLayout extends KpEquationStageLayoutIntent
> {
  readonly decodeUrl: (
    input: string | URL,
    route: KpReaderRuntimeRouteDescriptor
  ) => KpReaderEvaluationFoldUrlState<TCheckpoint>;
  readonly compileProjection: (input: {
    readonly mode: KpReaderEvaluationFoldMode;
    readonly pinnedNodeIds: readonly string[];
    readonly viewport: "wide" | "phone";
  }) => TProjection;
  readonly compileTimeline: (projection: TProjection) => TTimeline;
  readonly sampleTimeline: (input: {
    readonly timeline: TTimeline;
    readonly progress: number;
  }) => TSample;
  readonly planLayout: (input: {
    readonly projection: TProjection;
    readonly viewport: "wide" | "phone";
  }) => TLayout;
  readonly projectAnimationProgress: (input: {
    readonly timeline: TTimeline;
    readonly sample: TSample;
  }) => number;
  readonly resolveLayoutPolicy: (input: {
    readonly layout: TLayout;
    readonly timeline: TTimeline;
    readonly sample: TSample;
    readonly animationProgress: number;
  }) => string;
  readonly encodeUrl: (
    baseUrl: string | URL,
    route: KpReaderRuntimeRouteDescriptor,
    state: KpReaderEvaluationFoldUrlState<TCheckpoint>
  ) => string;
}

export function mountKpEvaluationReaderControls<
  TCheckpoint extends string,
  TProjection extends KpEvaluationReaderProjection,
  TTimeline extends KpEvaluationReaderTimeline,
  TSample extends KpEvaluationReaderTimelineSample,
  TLayout extends KpEquationStageLayoutIntent
>(input: {
  readonly root: ParentNode;
  readonly stage: HTMLElement;
  readonly route: KpReaderRuntimeRouteDescriptor;
  readonly initialUrl: string | URL;
  readonly adapter: KpEvaluationReaderAdapter<
    TCheckpoint,
    TProjection,
    TTimeline,
    TSample,
    TLayout
  >;
  readonly onChange: () => void;
}): KpEvaluationReaderControls {
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
  const decoded = input.adapter.decodeUrl(input.initialUrl, input.route);
  let mode = decoded.foldMode;
  let pinnedNodeIds = [...decoded.pinnedNodeIds];
  let projection = compileProjection();

  modeSelect.value = mode;
  modeSelect.addEventListener("change", onModeChange);
  for (const button of buttons) button.addEventListener("click", onPinToggle);
  syncPresentation();

  function viewport(): "wide" | "phone" {
    return window.innerWidth > 880 ? "wide" : "phone";
  }

  function compileProjection(): TProjection {
    return input.adapter.compileProjection({
      mode,
      pinnedNodeIds,
      viewport: viewport()
    });
  }

  function onModeChange(): void {
    const nextMode = modeSelect.value as KpReaderEvaluationFoldMode;
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
    const timeline = input.adapter.compileTimeline(projection);
    const layout = input.adapter.planLayout({
      projection,
      viewport: viewport()
    });
    input.stage.dataset["kpReaderFoldMode"] = mode;
    input.stage.dataset["kpReaderFoldExpanded"] =
      projection.expandedNodeIds.join(",");
    input.stage.dataset["kpReaderFoldCollapsed"] =
      projection.collapsedNodeIds.join(",");
    input.stage.dataset["kpReaderFoldPinned"] = pinnedNodeIds.join(",");
    input.stage.dataset["kpReaderFoldTotalBeats"] = String(timeline.totalBeats);
    input.stage.dataset["kpReaderFoldViewport"] =
      "viewport" in layout && typeof layout.viewport === "string"
        ? layout.viewport
        : viewport();
    const hiddenOperationCount = projection.disclosures.reduce(
      (sum, disclosure) => sum + disclosure.hiddenOperationIds.length,
      0
    );
    status.value = projection.disclosures.length === 0
      ? "All evaluation details are expanded"
      : `Folded: ${hiddenOperationCount} operations; ${
          projection.disclosures.map((disclosure) =>
          `${disclosure.label} (${disclosure.hiddenOperationIds.length} operations)`
        ).join("; ")
        }. All operations remain in the transcript.`;
    for (const button of buttons) {
      const nodeId = buttonNodeId(button);
      button.setAttribute(
        "aria-pressed",
        String(nodeId !== undefined && pinnedNodeIds.includes(nodeId))
      );
    }
  }

  return Object.freeze({
    readStageLayoutIntent() {
      return input.adapter.planLayout({
        projection,
        viewport: viewport()
      });
    },
    projectAnimationProgress(semanticProgress: number) {
      const timeline = input.adapter.compileTimeline(projection);
      const sample = input.adapter.sampleTimeline({
        timeline,
        progress: semanticProgress
      });
      const phase = timeline.phases.find(
        ({ nodeId }) => nodeId === sample.activeNodeId
      );
      if (phase === undefined) {
        throw new Error(`Unknown evaluation timeline phase ${sample.activeNodeId}.`);
      }
      const layout = input.adapter.planLayout({
        projection,
        viewport: viewport()
      });
      const animationProgress = input.adapter.projectAnimationProgress({
        timeline,
        sample
      });
      input.stage.dataset["kpReaderFoldActiveNode"] = sample.activeNodeId;
      input.stage.dataset["kpReaderFoldPhaseDetail"] = phase.detail;
      input.stage.dataset["kpReaderFoldLayoutPolicy"] =
        input.adapter.resolveLayoutPolicy({
          layout,
          timeline,
          sample,
          animationProgress
        });
      return Math.min(1, Math.max(0, animationProgress));
    },
    resolveCheckpointProgressPermille(
      checkpointId: string,
      fallbackProgressPermille: number
    ) {
      const timeline = input.adapter.compileTimeline(projection);
      const exact = resolveCheckpoint(timeline.checkpoints, checkpointId);
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
    }: Parameters<KpEvaluationReaderControls["encodeHref"]>[0]) {
      const timeline = input.adapter.compileTimeline(projection);
      const sample = input.adapter.sampleTimeline({
        timeline,
        progress: progressPermille / 1_000
      });
      const state: KpReaderEvaluationFoldUrlState<TCheckpoint> = {
        checkpoint: checkpoint<TCheckpoint>(
          timeline.checkpoints as Readonly<Record<TCheckpoint, number>>,
          checkpointId,
          progressPermille
        ),
        progressPermille,
        direction: direction === "rewind" ? "inverse" : "forward",
        foldMode: mode,
        activeNodeId: sample.activeNodeId,
        collapsedNodeIds: projection.collapsedNodeIds,
        pinnedNodeIds
      };
      return input.adapter.encodeUrl(baseUrl, input.route, state);
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

function resolveCheckpoint(
  checkpoints: Readonly<Record<string, number>>,
  checkpointId: string | undefined
): number | undefined {
  if (checkpointId === undefined) return undefined;
  return Object.entries(checkpoints).find(
    ([id]) => checkpointId === id || checkpointId.endsWith(`.${id}`)
  )?.[1];
}

function checkpoint<TCheckpoint extends string>(
  checkpoints: Readonly<Record<TCheckpoint, number>>,
  checkpointId: string | undefined,
  progressPermille: number
): TCheckpoint {
  const exact = Object.keys(checkpoints).find(
    (id) => checkpointId === id || checkpointId?.endsWith(`.${id}`) === true
  ) as TCheckpoint | undefined;
  if (exact !== undefined) return exact;
  const progress = progressPermille / 1_000;
  const entries = Object.entries(checkpoints) as [TCheckpoint, number][];
  return entries.reduce(
    (selected, entry) =>
      entry[1] <= progress && entry[1] >= selected[1] ? entry : selected,
    entries[0]!
  )[0];
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
