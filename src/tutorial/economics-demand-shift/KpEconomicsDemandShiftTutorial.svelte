<script lang="ts">
  import { onDestroy, onMount, tick, untrack } from "svelte";

  import type { KpAnimationAsset } from "../../animation/asset.ts";
  import type { KpAnimationCatalogueEntry } from "../../editor/animation-catalogue-projection.ts";
  import type { KpAnimationCatalogueSurfaceHostability } from "../../editor/animation-catalogue-surface-hostability.ts";
  import type { KpEditorAnimationDescriptor } from "../../editor/animation-descriptor.ts";
  import {
    dispatchKpEditorAnimationPlaybackAction,
    getKpEditorAnimationPlaybackSession,
    KP_EDITOR_ANIMATION_FRAME_EVENT,
    KP_EDITOR_ANIMATION_LOAD_EVENT,
    replaceKpEditorAnimationPlaybackAsset
  } from "../../editor/animation-player-controller.ts";
  import type { KpEditorAnimationPlayerState } from "../../editor/animation-player-state.ts";
  import { renderKpEditorAnimationPlayerShell } from "../../editor/animation-player-shell.ts";
  import { mountKpAnimationCataloguePlayerHost } from "../../editor/animation-catalogue-player-host.ts";
  import {
    createKpEconomicsEquilibriumParameterState,
    createParameterizedEconomicsEquilibriumAnimation,
    kpEconomicsDemandInterceptParameter,
    writeKpEconomicsEquilibriumParameters
  } from "../../editor/economics-equilibrium-parameters.ts";
  import {
    kpEconomicsDemandShiftCheckpoints,
    stepKpEconomicsDemandShiftCheckpoint
  } from "./economics-demand-shift-checkpoints.ts";
  import type {
    KpEconomicsDemandShiftLesson,
    KpEconomicsDemandShiftLessonPassage
  } from "./economics-demand-shift-lesson-compiler.ts";
  import {
    resolveKpEconomicsDemandShiftInitialDestination,
    type KpEconomicsDemandShiftInitialDestination
  } from "./economics-demand-shift-deep-link.ts";
  import {
    projectKpInlineStickyLessonLayout,
    projectKpInlineStickyParagraph,
    projectKpInlineStickyParagraphMotionCorridor,
    projectKpTwoColumnScrollMotionCorridor,
    projectKpTwoColumnScrollSequence,
    kpEconomicsTwoColumnParagraphGapMaximumVh,
    kpEconomicsTwoColumnParagraphGapMinimumVh,
    kpEconomicsTwoColumnParagraphGapStepVh,
    normalizeKpEconomicsTwoColumnParagraphGapVh,
    writeKpEconomicsTwoColumnParagraphGapVh,
    writeKpEconomicsTwoColumnTextSide,
    type KpEconomicsDemandShiftPresentationLayout,
    type KpEconomicsTwoColumnTextSide,
    type KpInlineStickyParagraphProjection,
    type KpInlineStickyLessonFit
  } from "./economics-demand-shift-layout.ts";
  import {
    projectKpEconomicsGraphStrokeWidths,
    writeKpEconomicsGraphStrokeScale
  } from "./economics-demand-shift-graph-style.ts";
  import {
    findKpEconomicsMotionBlock,
    kpEconomicsMotionBlocks,
    projectKpEconomicsLessonMotion,
    type KpEconomicsMotionBlock,
    type KpEconomicsMotionBlockId
  } from "./economics-demand-shift-motion-blocks.ts";
  import {
    measureKpTutorialAttentionRegions,
    projectKpTutorialAttentionFrame,
    type KpTutorialAttentionFrame
  } from "../kp-tutorial-attention.ts";
  import {
    KpTutorialCueActivationObserver,
    KpTutorialDocumentCueGeometryCache,
    KpTutorialScrollCoordinator,
    projectKpTutorialActiveCueWindow,
    projectKpTutorialRebasedCorridor,
    type KpTutorialCoordinatedScrollProjection,
    type KpTutorialScrollCoordinatorMetrics,
    type KpTutorialMotionCorridor,
    type KpTutorialScrollBlockRegistration
  } from "../kp-tutorial-motion.ts";
  import {
    projectKpTutorialStageAssembly,
    projectKpTutorialSynchronizedLatch,
    projectKpTutorialUsableViewport,
    projectKpTutorialViewportAnchors
  } from "../kp-tutorial-usable-viewport.ts";
  import {
    KP_TUTORIAL_SCRUB_NEXT_EVENT,
    KP_TUTORIAL_SCRUB_PREVIOUS_EVENT,
    KP_TUTORIAL_SCRUB_REWIND_EVENT,
    KP_TUTORIAL_SCRUB_SEEK_EVENT,
    KP_TUTORIAL_SCRUB_TOGGLE_EVENT,
    type KpTutorialScrubBarElement,
    type KpTutorialScrubSeekDetail
  } from "../kp-tutorial-scrub-bar.ts";
  import {
    graphStrokeScaleSummary,
    KP_GRAPH_STYLE_TUNER_CHANGE_EVENT,
    kpGraphStrokeScaleMaximum,
    kpGraphStrokeScaleMinimum,
    kpGraphStrokeScaleStep,
    normalizeKpGraphStrokeScale,
    type KpGraphStyleTunerChangeDetail,
    type KpGraphStyleTunerElement
  } from "../kp-graph-style-tuner.ts";
  import type {
    KpTutorialTocElement
  } from "../kp-tutorial-toc-element.ts";
  import {
    createKpTutorialNavigationController,
    type KpTutorialNavigationController
  } from "../kp-tutorial-navigation.ts";
  import type {
    KpTutorialTocDestination
  } from "../kp-tutorial-toc.ts";
  import { serializeKpTutorialDestinationHash } from "../kp-tutorial-url.ts";
  import KpTutorialLessonShell from "../KpTutorialLessonShell.svelte";
  import KpInlineMath from "./KpInlineMath.svelte";
  import {
    resolveKpEconomicsDemandShiftTocDestination
  } from "./economics-demand-shift-toc.ts";
  import {
    kpEconomicsDemandShiftThemeIds,
    writeKpEconomicsDemandShiftTheme,
    type KpEconomicsDemandShiftTheme
  } from "./economics-demand-shift-theme.ts";

  type KpEconomicsTutorialMotionOwner = "untouched" | "scroll" | "manual";
  const kpEconomicsScrollStartEpsilon = 0.002;
  type KpEconomicsTutorialScrollTimelineStatus =
    | "idle"
    | "seeking"
    | "complete"
    | "rewound"
    | "manual"
    | "reduced-motion";

  interface KpEconomicsManualScrollRebase {
    readonly blockId: KpEconomicsMotionBlockId;
    readonly rawTravelAtTakeover: number;
    readonly manualProgress: number;
  }

  interface KpEconomicsNavigationResume {
    readonly blockId: KpEconomicsMotionBlockId;
    readonly progress: number;
  }

  interface KpEconomicsInlineParagraphFrame {
    readonly passageId: string;
    readonly motionBlockId: KpEconomicsMotionBlockId | undefined;
    readonly projection: KpInlineStickyParagraphProjection;
    readonly opacity: number;
    readonly ownsAttention: boolean;
  }

  interface KpEconomicsTwoColumnParagraphPresentation {
    readonly opacity: number;
    readonly salience: number;
  }

  interface KpEconomicsTwoColumnScrollGeometry {
    readonly approachStartRatio: number;
    readonly focusBottomRatio: number;
    readonly focusTopRatio: number;
    readonly horizontalBoundaryOffsetFromStageTopPx: number;
    readonly minimumEffectiveHeightRatio: number;
    readonly motionStartRatio: number;
    readonly stageCenterRatio: number;
    readonly stageCenterY: number;
    readonly stageTopY: number;
    readonly textAnchorY: number;
    readonly textDocumentOffsetFromStagePx: number;
    readonly usableViewportBottomPx: number;
    readonly usableViewportHeightPx: number;
    readonly usableViewportTopPx: number;
    readonly viewportHeightPx: number;
  }

  interface KpEconomicsTutorialRuntimePerformanceApi {
    readonly resetScrollCoordinator: () => void;
    readonly snapshotScrollCoordinator: () => KpTutorialScrollCoordinatorMetrics;
  }

  type KpEconomicsTutorialPerformanceWindow = Window & {
    __kpEconomicsPerformanceProbeRequested?: boolean | undefined;
    __kpEconomicsTutorialRuntimePerformance?:
      KpEconomicsTutorialRuntimePerformanceApi | undefined;
  };

  let {
    entry,
    descriptor,
    player: initialPlayer,
    animation,
    hostability,
    initialDemandIntercept,
    initialGraphStrokeScale,
    initialTheme,
    initialTwoColumnParagraphGapVh,
    initialTwoColumnTextSide,
    initialDestination,
    presentationLayout,
    lesson,
    motionScrubBarHtml,
    tocHtml,
    twoColumnParagraphs,
    verificationSurfaceHtml
  }: {
    readonly entry: KpAnimationCatalogueEntry;
    readonly descriptor: KpEditorAnimationDescriptor;
    readonly player: KpEditorAnimationPlayerState;
    readonly animation: KpAnimationAsset;
    readonly hostability: KpAnimationCatalogueSurfaceHostability;
    readonly initialDemandIntercept: number;
    readonly initialGraphStrokeScale: number;
    readonly initialTheme: KpEconomicsDemandShiftTheme;
    readonly initialTwoColumnParagraphGapVh: number;
    readonly initialTwoColumnTextSide: KpEconomicsTwoColumnTextSide;
    readonly initialDestination: KpEconomicsDemandShiftInitialDestination;
    readonly presentationLayout: KpEconomicsDemandShiftPresentationLayout;
    readonly lesson: KpEconomicsDemandShiftLesson;
    readonly motionScrubBarHtml: Readonly<Record<KpEconomicsMotionBlockId, string>>;
    readonly tocHtml: string;
    readonly twoColumnParagraphs:
      readonly KpEconomicsDemandShiftLessonPassage[];
    readonly verificationSurfaceHtml: string;
  } = $props();

  const initialDeepLink = untrack(() => initialDestination);
  const initial = untrack(() => ({
    progress: initialPlayer.progress,
    playbackStatus: initialPlayer.playbackStatus,
    playbackDirection: initialPlayer.direction,
    demandIntercept: initialDemandIntercept,
    playerHtml: renderKpEditorAnimationPlayerShell({
      descriptor,
      player: initialPlayer,
      chrome: "catalogue"
    })
  }));
  let shell = $state<HTMLElement | undefined>();
  let inlineStage = $state<HTMLElement | undefined>();
  let player = $state<HTMLElement | undefined>();
  let demandScrubBar = $state<KpTutorialScrubBarElement | undefined>();
  let supplyScrubBar = $state<KpTutorialScrubBarElement | undefined>();
  let graphStyleTuner = $state<KpGraphStyleTunerElement | undefined>();
  let tutorialToc = $state<KpTutorialTocElement | undefined>();
  let checkpointIndex = $state(initialDeepLink.checkpointIndex);
  let progress = $state(initial.progress);
  let playbackStatus = $state(initial.playbackStatus);
  let playbackDirection = $state(initial.playbackDirection);
  let demandIntercept = $state(initial.demandIntercept);
  let graphStrokeScale = $state(
    untrack(() => normalizeKpGraphStrokeScale(initialGraphStrokeScale))
  );
  let theme = $state(untrack(() => initialTheme));
  let twoColumnParagraphGapVh = $state(
    untrack(() => normalizeKpEconomicsTwoColumnParagraphGapVh(
      initialTwoColumnParagraphGapVh
    ))
  );
  let twoColumnTextSide = $state(untrack(() => initialTwoColumnTextSide));
  let ready = $state(false);
  let stageExpanded = $state(false);
  let explorationOpen = $state(false);
  let announcement = $state(
    initialDeepLink.destination === undefined
      ? "Initial market ready."
      : `Opened ${initialDeepLink.destination.kind} ${initialDeepLink.destination.id}.`
  );
  let motionOwner = $state<KpEconomicsTutorialMotionOwner>("untouched");
  let manualMotionBlock = $state<KpEconomicsMotionBlockId | undefined>();
  let scrollTimelineStatus = $state<KpEconomicsTutorialScrollTimelineStatus>(
    "idle"
  );
  let reducedMotion = $state(false);
  let attentionPassageId = $state<string | undefined>(
    kpEconomicsDemandShiftCheckpoints[initialDeepLink.checkpointIndex]!.passageId
  );
  let attentionCursorState = $state<
    KpTutorialAttentionFrame["state"]
  >("between-regions");
  let scrollCoordinatorStatus = $state<"pending" | "connected">("pending");
  let scrollActiveMotionBlock = $state<KpEconomicsMotionBlockId | "">(
    initialDeepLink.motion.activeBlockId
  );
  let inlineStickyFit = $state<KpInlineStickyLessonFit>("comfortable");
  let inlineStickyStageHeightPx = $state(320);
  let twoColumnStageTopPx = $state<number | undefined>();
  let inlineStickyStageState = $state<"embedded" | "pinned" | "released">(
    "embedded"
  );
  let inlineParagraphProjections = $state<
    Readonly<Record<string, KpInlineStickyParagraphProjection>>
  >({});
  let twoColumnParagraphPresentations = $state<Readonly<Record<
    string,
    KpEconomicsTwoColumnParagraphPresentation
  >>>({});
  let cachedTwoColumnScrollGeometry:
    KpEconomicsTwoColumnScrollGeometry | undefined;
  let reducedMotionQuery: MediaQueryList | undefined;
  let twoColumnGeometryQuery: MediaQueryList | undefined;
  let previousHistoryScrollRestoration: ScrollRestoration | undefined;
  let disposePlayerHost: (() => void) | undefined;
  let scrollCoordinator:
    KpTutorialScrollCoordinator<KpEconomicsMotionBlockId> | undefined;
  let cueGeometryCache: KpTutorialDocumentCueGeometryCache<string> | undefined;
  let cueActivationObserver: KpTutorialCueActivationObserver<string> | undefined;
  let cueMutationObserver: MutationObserver | undefined;
  let runtimePerformanceApi:
    KpEconomicsTutorialRuntimePerformanceApi | undefined;
  let navigationController: KpTutorialNavigationController | undefined;
  let latestScrollProjection:
    KpTutorialCoordinatedScrollProjection<KpEconomicsMotionBlockId> | undefined;
  let manualScrollRebase: KpEconomicsManualScrollRebase | undefined;
  let navigationProjectionPending = initialDeepLink.destination !== undefined;
  let navigationLockedScrollY: number | undefined;
  let navigationScrollIntent = false;
  let navigationResume = initialDeepLink.destination === undefined
    ? undefined
    : createNavigationResume(initialDeepLink);
  let currentSemanticDestination = $state(initialDeepLink.destination);
  let supplyPlaybackStatus = $state<"paused" | "playing" | "complete">(
    "paused"
  );
  let supplyPlaybackDirection = $state<"forward" | "rewind">("forward");
  let supplyPlaybackFrame: number | undefined;
  let supplyPlaybackLastMs: number | undefined;
  let inlineLayoutObserver: ResizeObserver | undefined;
  let suppressNextInlineLayoutObservation = false;
  const inlineSticky = untrack(() => presentationLayout === "inline-sticky");
  const twoColumnScroll = untrack(
    () => presentationLayout === "two-column-scroll"
  );
  const scrollPassageLayout = inlineSticky || twoColumnScroll;
  let lessonMotionProjection = $state(initialDeepLink.motion);
  const playerHtml = initial.playerHtml;
  let checkpoint = $derived(kpEconomicsDemandShiftCheckpoints[checkpointIndex]!);
  let semanticProgress = $derived(lessonMotionProjection.demandShiftProgress);
  let supplyMovementProgress = $derived(
    lessonMotionProjection.supplyMovementProgress
  );
  let reviewProgress = $derived(
    lessonMotionProjection.activeBlockId === "supply-movement"
      ? lessonMotionProjection.supplyMovementProgress
      : lessonMotionProjection.demandShiftProgress
  );
  let tocActiveDestination = $derived(
    resolveKpEconomicsDemandShiftTocDestination({
      lesson,
      passageId: checkpoint.passageId
    })
  );
  $effect(() => {
    tutorialToc?.setActiveDestination(tocActiveDestination);
  });
  $effect(() => {
    writeScrubBarAttributes(demandScrubBar, {
      progress: semanticProgress,
      "playback-status": playbackStatus,
      direction: playbackDirection,
      "controls-disabled": !ready,
      "previous-disabled": checkpointIndex === 0,
      "next-disabled": checkpointIndex ===
        kpEconomicsDemandShiftCheckpoints.length - 1,
      "manual-claimed": motionOwner === "manual" &&
        manualMotionBlock === "demand-shift"
    });
  });
  $effect(() => {
    writeScrubBarAttributes(supplyScrubBar, {
      progress: supplyMovementProgress,
      "playback-status": supplyPlaybackStatus,
      direction: supplyPlaybackDirection,
      "controls-disabled": !ready,
      "previous-disabled": supplyMovementProgress <= 0.001,
      "next-disabled": supplyMovementProgress >= 0.999,
      "manual-claimed": motionOwner === "manual" &&
        manualMotionBlock === "supply-movement"
    });
  });
  let supplyInterpretationStyle = $derived(
    `--kp-tutorial-supply-emphasis:${clamp(supplyMovementProgress / 0.18, 0, 1).toFixed(3)};` +
    `--kp-tutorial-supply-trace:${clamp((supplyMovementProgress - 0.12) / 0.46, 0, 1).toFixed(3)};` +
    `--kp-tutorial-supply-comparison:${clamp((supplyMovementProgress - 0.58) / 0.42, 0, 1).toFixed(3)}`
  );
  let stageComposition = $derived(lessonMotionProjection.composition);
  let graphStageSlot = $derived(
    stageComposition.slots.find(({ id }) => id === "graph-slot")!
  );
  let verificationStageSlot = $derived(
    stageComposition.slots.find(({ id }) => id === "verification-slot")!
  );
  let verificationStageSurface = $derived(
    stageComposition.surfaces.find(
      ({ id }) => id === "equilibrium-verification"
    )!
  );
  let stageCompositionStyle = $derived(
    `--kp-stage-graph-inline:${percent(graphStageSlot.rect.inline)};` +
    `--kp-stage-graph-block:${percent(graphStageSlot.rect.block)};` +
    `--kp-stage-graph-inline-size:${percent(graphStageSlot.rect.inlineSize)};` +
    `--kp-stage-graph-block-size:${percent(graphStageSlot.rect.blockSize)};` +
    `--kp-stage-verification-inline:${percent(verificationStageSlot.rect.inline)};` +
    `--kp-stage-verification-block:${percent(verificationStageSlot.rect.block)};` +
    `--kp-stage-verification-inline-size:${percent(verificationStageSlot.rect.inlineSize)};` +
    `--kp-stage-verification-block-size:${percent(verificationStageSlot.rect.blockSize)};` +
    `--kp-stage-aperture-inset:${percent(1 - stageComposition.aperture.openness)};` +
    `--kp-stage-verification-opacity:${stageComposition.progress.toFixed(3)};` +
    `--kp-stage-verification-travel:${percent(
      (verificationStageSurface.rect.inline - verificationStageSlot.rect.inline) /
        verificationStageSlot.rect.inlineSize
    )}`
  );
  let verificationReveal = $derived(lessonMotionProjection.verification);
  let verificationRevealStyle = $derived(
    `--kp-verification-supply-rule:${verificationReveal.groups["supply-rule"].toFixed(3)};` +
    `--kp-verification-supply-rule-clip:${percent(1 - verificationReveal.groups["supply-rule"])};` +
    `--kp-verification-equilibria:${verificationReveal.groups.equilibria.toFixed(3)};` +
    `--kp-verification-equilibria-clip:${percent(1 - verificationReveal.groups.equilibria)};` +
    `--kp-verification-changes:${verificationReveal.groups.changes.toFixed(3)};` +
    `--kp-verification-changes-clip:${percent(1 - verificationReveal.groups.changes)}`
  );
  let graphStrokeWidths = $derived(
    projectKpEconomicsGraphStrokeWidths(graphStrokeScale)
  );
  let graphStrokeStyle = $derived(
    `--kp-graph-stroke-scale:${graphStrokeScale.toFixed(2)};` +
    `--kp-graph-tuned-dark-stroke-width:${graphStrokeWidths.darkPx}px;` +
    `--kp-graph-tuned-dark-ghost-core-width:${graphStrokeWidths.darkGhostCorePx}px;` +
    `--kp-graph-tuned-light-stroke-width:${graphStrokeWidths.lightPx}px;` +
    `--kp-graph-tuned-light-ghost-core-width:${graphStrokeWidths.lightGhostCorePx}px`
  );
  let supplyInterpretationPhase = $derived(
    supplyMovementProgress <= 0.001
      ? "ready"
      : supplyMovementProgress < 0.58
        ? "tracing"
        : supplyMovementProgress < 0.999
          ? "comparing"
          : "verified"
  );

  function activateCheckpoint(
    index: number,
    source: "manual" | "scroll" = "manual"
  ): void {
    if (source === "manual") claimManualMotion("demand-shift");
    checkpointIndex = Math.max(
      0,
      Math.min(kpEconomicsDemandShiftCheckpoints.length - 1, index)
    );
    const next = kpEconomicsDemandShiftCheckpoints[checkpointIndex]!;
    announcement = `${next.label}. Animation at ${Math.round(next.progress * 100)} percent.`;
    // Scroll may prepare the pre-motion state, but it must never snap the
    // curves to a later frame. Only the authored clock or explicit controls
    // can advance the causal shift.
    if (source === "manual" || (
      motionOwner === "untouched" && next.progress === 0
    )) seek(next.progress);
  }

  function stepCheckpoint(direction: -1 | 1): void {
    activateCheckpoint(stepKpEconomicsDemandShiftCheckpoint({
      currentIndex: checkpointIndex,
      direction
    }));
  }

  function motionBlockFromEvent(event: Event): KpEconomicsMotionBlockId {
    return event.currentTarget instanceof HTMLElement &&
        event.currentTarget.dataset["kpTutorialMotionControls"] ===
          "supply-movement"
      ? "supply-movement"
      : "demand-shift";
  }

  function handlePreviousCheckpoint(event: Event): void {
    const blockId = motionBlockFromEvent(event);
    if (blockId === "demand-shift") {
      stepCheckpoint(-1);
      return;
    }
    stepSupplyCheckpoint(-1);
  }

  function handleNextCheckpoint(event: Event): void {
    const blockId = motionBlockFromEvent(event);
    if (blockId === "demand-shift") {
      stepCheckpoint(1);
      return;
    }
    stepSupplyCheckpoint(1);
  }

  function handleTogglePlayback(event: Event): void {
    const blockId = motionBlockFromEvent(event);
    const demandWasPlaying = player === undefined
      ? false
      : getKpEditorAnimationPlaybackSession(player)?.player.playbackStatus ===
        "playing";
    const supplyWasPlaying = supplyPlaybackStatus === "playing";
    claimManualMotion(blockId);
    if (blockId === "supply-movement") {
      if (supplyWasPlaying) return;
      toggleSupplyPlayback();
      return;
    }
    if (demandWasPlaying) return;
    if (player === undefined) return;
    const session = getKpEditorAnimationPlaybackSession(player);
    if (session === undefined) return;
    dispatchKpEditorAnimationPlaybackAction(
      player,
      session.player.direction === "rewind" &&
          session.player.playbackStatus !== "complete"
        ? { type: "rewind", nowMs: performance.now() }
        : { type: "forward", nowMs: performance.now() }
    );
  }

  function handleRewindPlayback(event: Event): void {
    const blockId = motionBlockFromEvent(event);
    claimManualMotion(blockId);
    if (blockId === "supply-movement") {
      startSupplyPlayback("rewind");
      return;
    }
    if (player === undefined) return;
    dispatchKpEditorAnimationPlaybackAction(player, {
      type: "rewind",
      nowMs: performance.now()
    });
  }

  function seek(nextProgress: number): void {
    if (!ready || player === undefined) return;
    const session = getKpEditorAnimationPlaybackSession(player);
    // The prose scrubber always represents semantic start-to-finish progress,
    // independent of the runtime's currently sampled direction.
    if (session?.player.direction === "rewind") {
      dispatchKpEditorAnimationPlaybackAction(player, { type: "reset" });
    }
    dispatchKpEditorAnimationPlaybackAction(player, {
      type: "seek",
      progress: nextProgress
    });
  }

  function applyManualMotionProgress(
    blockId: KpEconomicsMotionBlockId,
    nextProgress: number
  ): void {
    const localProgress = clamp(nextProgress, 0, 1);
    lessonMotionProjection = projectKpEconomicsLessonMotion({
      activeBlockId: blockId,
      localProgress
    });
    seek(lessonMotionProjection.demandShiftProgress);
    const rawTravel = latestScrollProjection?.blocks.find(
      ({ id }) => id === blockId
    )?.travel ?? 0;
    manualScrollRebase = {
      blockId,
      rawTravelAtTakeover: rawTravel,
      manualProgress: localProgress
    };
  }

  function stepSupplyCheckpoint(direction: -1 | 1): void {
    claimManualMotion("supply-movement");
    const checkpoints = findKpEconomicsMotionBlock("supply-movement")!
      .checkpoints;
    const currentIndex = checkpoints.reduce((nearest, candidate, index) =>
      Math.abs(candidate.progress - supplyMovementProgress) <
          Math.abs(checkpoints[nearest]!.progress - supplyMovementProgress)
        ? index
        : nearest
    , 0);
    const nextIndex = Math.max(
      0,
      Math.min(checkpoints.length - 1, currentIndex + direction)
    );
    applyManualMotionProgress(
      "supply-movement",
      checkpoints[nextIndex]!.progress
    );
  }

  function toggleSupplyPlayback(): void {
    if (supplyPlaybackStatus === "playing") {
      cancelSupplyPlayback();
      return;
    }
    startSupplyPlayback("forward");
  }

  function startSupplyPlayback(direction: "forward" | "rewind"): void {
    cancelSupplyPlayback();
    supplyPlaybackDirection = direction;
    if (direction === "forward" && supplyMovementProgress >= 0.999) {
      applyManualMotionProgress("supply-movement", 0);
    }
    supplyPlaybackStatus = "playing";
    supplyPlaybackLastMs = performance.now();
    supplyPlaybackFrame = requestAnimationFrame(tickSupplyPlayback);
  }

  function tickSupplyPlayback(nowMs: number): void {
    if (supplyPlaybackStatus !== "playing") return;
    const previousMs = supplyPlaybackLastMs ?? nowMs;
    supplyPlaybackLastMs = nowMs;
    const delta = Math.max(0, Math.min(64, nowMs - previousMs)) / 2400;
    const nextProgress = supplyMovementProgress +
      (supplyPlaybackDirection === "rewind" ? -delta : delta);
    applyManualMotionProgress("supply-movement", nextProgress);
    if (nextProgress <= 0 || nextProgress >= 1) {
      supplyPlaybackStatus = "complete";
      supplyPlaybackFrame = undefined;
      return;
    }
    supplyPlaybackFrame = requestAnimationFrame(tickSupplyPlayback);
  }

  function cancelSupplyPlayback(): void {
    if (supplyPlaybackFrame !== undefined) {
      cancelAnimationFrame(supplyPlaybackFrame);
      supplyPlaybackFrame = undefined;
    }
    supplyPlaybackLastMs = undefined;
    if (supplyPlaybackStatus === "playing") supplyPlaybackStatus = "paused";
  }

  function changeDemandIntercept(event: Event): void {
    if (!(event.currentTarget instanceof HTMLInputElement) || player === undefined) {
      return;
    }
    claimManualMotion("demand-shift");
    const state = createKpEconomicsEquilibriumParameterState(
      event.currentTarget.value
    );
    demandIntercept = state.demandInterceptAfter;
    replaceKpEditorAnimationPlaybackAsset(
      player,
      createParameterizedEconomicsEquilibriumAnimation(state).animation
    );
    const search = writeKpEconomicsEquilibriumParameters({
      search: window.location.search,
      state
    });
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search}${window.location.hash}`
    );
    announcement = `Exploration target set to demand intercept ${demandIntercept}.`;
  }

  function restoreLessonExample(): void {
    claimManualMotion("demand-shift");
    const state = createKpEconomicsEquilibriumParameterState(
      kpEconomicsDemandInterceptParameter.defaultValue
    );
    demandIntercept = state.demandInterceptAfter;
    if (player !== undefined) {
      replaceKpEditorAnimationPlaybackAsset(
        player,
        createParameterizedEconomicsEquilibriumAnimation(state).animation
      );
    }
    const search = writeKpEconomicsEquilibriumParameters({
      search: window.location.search,
      state
    });
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search}${window.location.hash}`
    );
    // Restoring model parameters must not steal prose attention from the
    // passage the learner is currently reading.
    seek(1);
    announcement = "Returned to the lesson example: demand intercept 14 to 18.";
  }

  function toggleTheme(): void {
    theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset["kpLessonTheme"] = theme;
    const search = writeKpEconomicsDemandShiftTheme({
      search: window.location.search,
      theme
    });
    // Theme is presentation state. Preserve the current semantic destination,
    // history transaction, and scroll position instead of navigating the lesson.
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${search}${window.location.hash}`
    );
    announcement = `${theme === "dark" ? "Dark" : "Light"} theme enabled.`;
    void invalidateGeometryAfterPresentationChange();
  }

  function handleGraphStyleTunerChange(event: Event): void {
    if (!(event instanceof CustomEvent)) return;
    const detail = event.detail as KpGraphStyleTunerChangeDetail | undefined;
    if (detail === undefined) return;
    graphStrokeScale = normalizeKpGraphStrokeScale(detail.strokeScale);
    const search = writeKpEconomicsGraphStrokeScale({
      search: window.location.search,
      scale: graphStrokeScale
    });
    // Tuning is reversible presentation state, not a new semantic location.
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${search}${window.location.hash}`
    );
    announcement = `Graph lines set to ${graphStrokeScale.toFixed(2)} times the default.`;
  }

  function handleFrame(event: Event): void {
    if (
      !(event instanceof CustomEvent) ||
      typeof event.detail !== "object" ||
      event.detail === null
    ) return;
    const detail = event.detail as {
      readonly direction?: unknown;
      readonly progress?: unknown;
      readonly playbackStatus?: unknown;
    };
    if (typeof detail.progress === "number") progress = detail.progress;
    if (detail.direction === "forward" || detail.direction === "rewind") {
      playbackDirection = detail.direction;
    }
    if (typeof detail.playbackStatus === "string") {
      playbackStatus =
        detail.playbackStatus as KpEditorAnimationPlayerState["playbackStatus"];
    }
    // The player reports demand-curve paint progress. Once lesson authority has
    // handed off to supply interpretation, a seek must not demote that state.
    if (lessonMotionProjection.activeBlockId === "demand-shift") {
      lessonMotionProjection = projectKpEconomicsLessonMotion({
        activeBlockId: "demand-shift",
        localProgress: playbackDirection === "rewind" ? 1 - progress : progress
      });
      if (motionOwner === "manual" && manualMotionBlock === "demand-shift") {
        manualScrollRebase = manualScrollRebase === undefined
          ? undefined
          : {
              ...manualScrollRebase,
              manualProgress: lessonMotionProjection.demandShiftProgress
            };
      }
    }
    if (
      detail.playbackStatus === "complete" &&
      detail.progress === 1 &&
      motionOwner === "scroll"
    ) {
      if (detail.direction === "rewind") {
        scrollTimelineStatus = "rewound";
        announcement = "Demand shift rewound to the initial equilibrium.";
      } else {
        scrollTimelineStatus = "complete";
        announcement = "Demand shift complete. Quantity 8 and price 10.";
      }
    }
  }

  function handleLoad(event: Event): void {
    if (
      !(event instanceof CustomEvent) ||
      (event.detail as { readonly status?: unknown })?.status !== "ready"
    ) return;
    ready = true;
    scrollCoordinator?.scheduleProjection();
  }

  function claimManualMotion(
    blockId: KpEconomicsMotionBlockId = scrollActiveMotionBlock ===
        "supply-movement"
      ? "supply-movement"
      : "demand-shift"
  ): void {
    // A control action must win even when it lands between a scroll event and
    // the coordinator's deferred reading-band projection.
    scrollCoordinator?.cancelPendingProjection();
    const session = player === undefined
      ? undefined
      : getKpEditorAnimationPlaybackSession(player);
    if (session?.player.playbackStatus === "playing") {
      dispatchKpEditorAnimationPlaybackAction(player!, {
        type: "pause",
        nowMs: performance.now()
      });
    }
    cancelSupplyPlayback();
    motionOwner = "manual";
    manualMotionBlock = blockId;
    scrollTimelineStatus = "manual";
    const currentProgress = blockId === "supply-movement"
      ? supplyMovementProgress
      : semanticProgress;
    const rawTravel = latestScrollProjection?.blocks.find(
      ({ id }) => id === blockId
    )?.travel ?? 0;
    manualScrollRebase = {
      blockId,
      rawTravelAtTakeover: rawTravel,
      manualProgress: currentProgress
    };
  }

  function handleReducedMotionChange(event: MediaQueryListEvent): void {
    reducedMotion = event.matches;
    if (motionOwner === "untouched") {
      scrollTimelineStatus = event.matches ? "reduced-motion" : "idle";
    }
  }

  function handleScrubBarSeek(event: Event): void {
    if (!(event instanceof CustomEvent)) return;
    const detail = event.detail as KpTutorialScrubSeekDetail | undefined;
    if (typeof detail?.progress !== "number") return;
    const blockId = motionBlockFromEvent(event);
    claimManualMotion(blockId);
    applyManualMotionProgress(blockId, detail.progress);
  }

  function collectScrollBlocks(): readonly KpTutorialScrollBlockRegistration<
    KpEconomicsMotionBlockId
  >[] {
    if (shell === undefined) return [];
    return kpEconomicsMotionBlocks.flatMap((block) => {
      const boundary = shell?.querySelector<HTMLElement>(
        `[data-kp-tutorial-motion-block="${block.id}"]`
      );
      const anchor = scrollPassageLayout
        ? scrollAnchorForMotionBoundary(boundary)
        : boundary?.querySelector<KpTutorialScrubBarElement>(
            "kp-tutorial-scrub-bar"
          );
      return anchor === undefined || anchor === null
        ? []
        : [{
            id: block.id,
            anchor,
            corridor: motionCorridorFor(block, anchor)
          }];
    });
  }

  function collectScrollCues(): readonly {
    readonly id: string;
    readonly anchor: HTMLElement;
  }[] {
    if (shell === undefined) return [];
    return [...shell.querySelectorAll<HTMLElement>("[data-kp-scroll-cue]")]
      .map((element, index) => ({
        id: element.dataset["kpEconomicsTutorialPassage"] ?? `cue-${index}`,
        anchor: element.querySelector<HTMLElement>("p") ?? element
      }));
  }

  function handleCoordinatedScroll(
    projection: KpTutorialCoordinatedScrollProjection<KpEconomicsMotionBlockId>
  ): void {
    latestScrollProjection = projection;
    updateInlineStickyStageProjection();
    const inlineParagraphFrames = updateInlineStickyParagraphProjections();
    const previousAttentionPassageId = attentionPassageId;
    const tutorialAttention = scrollPassageLayout &&
        inlineStickyFit !== "reading" &&
        inlineStickyStageState === "pinned"
      ? usesTwoColumnDesktopGeometry()
        ? updateTwoColumnAttention(inlineParagraphFrames)
        : updateInlineStickyAttention(inlineParagraphFrames)
      : updateReadingBandSelection(projection.readingBandY);
    const movedFromNavigation = navigationProjectionPending &&
      navigationScrollIntent &&
      navigationLockedScrollY !== undefined &&
      Math.abs(projection.scrollY - navigationLockedScrollY) > 0.5;
    if (navigationProjectionPending && !movedFromNavigation) {
      // Font, stage, and responsive layout settlement can move scrollY without
      // reader intent. Follow that geometry while retaining the exact semantic
      // jump; only a wheel, touch, or scroll key may hand ownership back.
      navigationLockedScrollY = projection.scrollY;
      const block = projection.blocks.find(
        ({ id }) => id === navigationResume?.blockId
      );
      if (block !== undefined && navigationResume !== undefined) {
        manualScrollRebase = {
          blockId: navigationResume.blockId,
          rawTravelAtTakeover: block.travel,
          manualProgress: navigationResume.progress
        };
      }
    }
    if (movedFromNavigation) {
      navigationProjectionPending = false;
      navigationLockedScrollY = undefined;
      navigationScrollIntent = false;
      navigationResume = undefined;
    }
    const active = tutorialAttention.activeMotionBlockId === undefined
      ? undefined
      : projection.blocks.find(
        ({ id }) => id === tutorialAttention.activeMotionBlockId
      );
    const activeScrubBar = active?.id === "supply-movement"
      ? supplyScrubBar
      : demandScrubBar;
    // Two-column prose is the sole state authority, including layout-only
    // frames that arrive after the scroll coordinator consumed its changed flag.
    if (
      active === undefined &&
      (
        twoColumnScroll ||
        projection.scrollChanged ||
        tutorialAttention.activePassageId !== previousAttentionPassageId
      ) &&
      !navigationProjectionPending &&
      tutorialAttention.activePassageId !== undefined
    ) {
      settleMotionOutsideAttentionBlock(tutorialAttention.activePassageId);
    }
    if (active !== undefined) {
      const distance = active.anchorTop - projection.readingBandY;
      activeScrubBar?.setReadingBandProjection({
        distance,
        proximity: clamp(1 - Math.abs(distance) / 96, 0, 1)
      });
      const manualCanResume = motionOwner === "manual" &&
        projection.scrollChanged;
      const mayProjectScroll = !navigationProjectionPending && (
        motionOwner !== "manual" || manualCanResume
      );
      if (!reducedMotion && ready && player !== undefined && mayProjectScroll && (
        motionOwner === "scroll" ||
        manualCanResume ||
        active.progress > kpEconomicsScrollStartEpsilon ||
        active.id === "supply-movement"
      )) {
        // Browser scroll positions can settle at a fractional CSS pixel. Snap
        // that residual to the semantic endpoint while preserving motion on
        // the first whole post-latch pixel.
        let localProgress = active.progress <= kpEconomicsScrollStartEpsilon
          ? 0
          : active.progress;
        if (manualScrollRebase?.blockId === active.id) {
          const block = findKpEconomicsMotionBlock(active.id)!;
          const boundary = shell?.querySelector<HTMLElement>(
            `[data-kp-tutorial-motion-block="${block.id}"]`
          );
          const paragraph = scrollAnchorForMotionBoundary(boundary);
          const rebased = projectKpTutorialRebasedCorridor({
            corridor: paragraph === undefined
              ? block.corridor
              : motionCorridorFor(block, paragraph),
            rawTravelAtTakeover: manualScrollRebase.rawTravelAtTakeover,
            manualProgress: manualScrollRebase.manualProgress,
            rawTravel: active.travel
          });
          localProgress = rebased.progress;
          if (rebased.travel <= 0.001 || rebased.travel >= 0.999) {
            manualScrollRebase = undefined;
          }
        } else if (manualCanResume) {
          manualScrollRebase = undefined;
        }
        lessonMotionProjection = projectKpEconomicsLessonMotion({
          activeBlockId: active.id,
          localProgress
        });
        if (manualCanResume) {
          cancelSupplyPlayback();
          demandScrubBar?.releaseManualControl();
          supplyScrubBar?.releaseManualControl();
          manualMotionBlock = undefined;
        }
        motionOwner = "scroll";
        scrollTimelineStatus = localProgress >= 0.999
          ? "complete"
          : localProgress <= 0.001
            ? "rewound"
            : "seeking";
        seek(lessonMotionProjection.demandShiftProgress);
      }
    }
  }

  function settleMotionOutsideAttentionBlock(passageId: string): void {
    if (passageId === "graph-at-rest") {
      settleMotionBoundary({
        activeBlockId: "demand-shift",
        localProgress: 0
      });
      return;
    }
    if (twoColumnScroll && passageId === "follow-shift") {
      settleMotionBoundary({
        activeBlockId: "demand-shift",
        localProgress: 1
      });
      return;
    }
    if (twoColumnScroll && passageId === "shift-versus-movement") {
      settleMotionBoundary({
        activeBlockId: "supply-movement",
        localProgress: 1
      });
      return;
    }
    if (twoColumnScroll && passageId === "movement-along-supply") {
      // This two-column-only interpretation follows the supply motion but is
      // absent from the canonical Markdown order. Give it the settled frame
      // explicitly so leaving the sticky corridor cannot snap at reflection.
      settleMotionBoundary({
        activeBlockId: "supply-movement",
        localProgress: 1
      });
      return;
    }
    const passageOrder = lesson.sections.flatMap(({ passages }) =>
      passages.map((passage) => passage.id)
    );
    const passageIndex = passageOrder.indexOf(passageId);
    const demandIndex = passageOrder.indexOf("follow-shift");
    const supplyIndex = passageOrder.indexOf("shift-versus-movement");
    if (passageIndex < 0 || demandIndex < 0 || supplyIndex < 0) return;

    const boundary = passageIndex < demandIndex
      ? { activeBlockId: "demand-shift" as const, localProgress: 0 }
      : passageIndex > supplyIndex
        ? { activeBlockId: "supply-movement" as const, localProgress: 1 }
        : passageIndex > demandIndex && passageIndex < supplyIndex
          ? { activeBlockId: "demand-shift" as const, localProgress: 1 }
          : undefined;
    if (boundary === undefined) return;

    settleMotionBoundary(boundary);
  }

  function settleMotionBoundary(boundary: {
    readonly activeBlockId: KpEconomicsMotionBlockId;
    readonly localProgress: number;
  }): void {
    // Prose outside a live transition owns an exact settled frame. This keeps
    // scroll, focus, and paint synchronized without event-history inference.
    lessonMotionProjection = projectKpEconomicsLessonMotion(boundary);
    seek(lessonMotionProjection.demandShiftProgress);
    cancelSupplyPlayback();
    demandScrubBar?.releaseManualControl();
    supplyScrubBar?.releaseManualControl();
    manualMotionBlock = undefined;
    manualScrollRebase = undefined;
    motionOwner = "scroll";
    scrollTimelineStatus = boundary.localProgress === 1
      ? "complete"
      : "rewound";
  }

  function updateTwoColumnAttention(
    paragraphFrames: readonly KpEconomicsInlineParagraphFrame[]
  ): KpTutorialAttentionFrame<string, string, KpEconomicsMotionBlockId> {
    const focusedParagraph = paragraphFrames.find(({ ownsAttention }) =>
      ownsAttention
    ) ?? paragraphFrames[0];
    const motionParagraph = paragraphFrames.find((frame) =>
      frame.motionBlockId !== undefined && (
        frame.ownsAttention || frame.projection.phase === "crossing"
      )
    );
    const passageId = focusedParagraph?.passageId;
    const motionBlockId = motionParagraph?.motionBlockId;
    if (passageId === undefined) {
      return updateReadingBandSelection(inlineStickyTopInset());
    }

    attentionPassageId = passageId;
    attentionCursorState = "within-region";
    scrollActiveMotionBlock = motionBlockId ?? "";
    if (checkpoint.passageId !== passageId) {
      const nextIndex = kpEconomicsDemandShiftCheckpoints.findIndex(
        (candidate) => candidate.passageId === passageId
      );
      if (nextIndex >= 0) activateCheckpoint(nextIndex, "scroll");
    }
    return Object.freeze({
      cursorY: inlineStickyTopInset(),
      state: "within-region",
      activeRegionId: passageId,
      activePassageId: passageId,
      ...(motionBlockId === undefined ? {} : { activeMotionBlockId: motionBlockId }),
      nearestRegionDistance: 0
    });
  }

  function updateInlineStickyAttention(
    paragraphFrames: readonly KpEconomicsInlineParagraphFrame[]
  ): KpTutorialAttentionFrame<string, string, KpEconomicsMotionBlockId> {
    const crossing = paragraphFrames.find(({ projection }) =>
      projection.phase === "crossing"
    );
    const latestPassed = paragraphFrames
      .filter(({ projection }) => projection.phase === "passed")
      .sort((left, right) =>
        Math.abs(left.projection.distanceFromStageBottomPx) -
          Math.abs(right.projection.distanceFromStageBottomPx)
      )[0];
    const nearestApproach = paragraphFrames
      .filter(({ projection }) =>
        projection.phase === "approach" || projection.phase === "below"
      )
      .sort((left, right) =>
        Math.abs(left.projection.distanceFromStageBottomPx) -
          Math.abs(right.projection.distanceFromStageBottomPx)
      )[0];
    // The paragraph physically crossing the stage boundary owns attention.
    // Between paragraphs, retain the latest completed paragraph until the next
    // one arrives instead of inventing a spacer-owned focus state.
    const focusedParagraph = crossing ?? latestPassed ?? nearestApproach;
    const passageId = focusedParagraph?.passageId;
    const motionBlockId = focusedParagraph?.motionBlockId;
    if (passageId === undefined) {
      return updateReadingBandSelection(inlineStickyHandoffStartY());
    }
    attentionPassageId = passageId;
    attentionCursorState = "within-region";
    scrollActiveMotionBlock = motionBlockId ?? "";
    if (checkpoint.passageId !== passageId) {
      const nextIndex = kpEconomicsDemandShiftCheckpoints.findIndex(
        (candidate) => candidate.passageId === passageId
      );
      if (nextIndex >= 0) activateCheckpoint(nextIndex, "scroll");
    }
    return Object.freeze({
      cursorY: inlineStickyHandoffStartY(),
      state: "within-region",
      activeRegionId: passageId,
      activePassageId: passageId,
      ...(motionBlockId === undefined ? {} : { activeMotionBlockId: motionBlockId }),
      nearestRegionDistance: 0
    });
  }

  function updateInlineStickyParagraphProjections(): readonly KpEconomicsInlineParagraphFrame[] {
    if (!scrollPassageLayout || shell === undefined || inlineStage === undefined) {
      return [];
    }
    const twoColumnDesktop = usesTwoColumnDesktopGeometry();
    const stageBounds = twoColumnDesktop
      ? undefined
      : inlineStage.getBoundingClientRect();
    const twoColumnGeometry = twoColumnDesktop
      ? readCachedTwoColumnScrollGeometry()
      : undefined;
    const cachedDocumentGeometry = twoColumnDesktop
      ? cueGeometryCache?.documentGeometry()
      : undefined;
    const cueWindow = cachedDocumentGeometry === undefined
      ? undefined
      : projectKpTutorialActiveCueWindow({
          geometry: cachedDocumentGeometry,
          scrollY: window.scrollY,
          viewportHeight: window.innerHeight,
          viewportAnchorRatio:
            twoColumnGeometry!.textAnchorY /
              twoColumnGeometry!.viewportHeightPx
        });
    const measurements = cueWindow === undefined
      ? [...shell.querySelectorAll<HTMLElement>("[data-kp-scroll-cue]")]
          .map((element) => {
            const paragraph = element.querySelector<HTMLElement>("p") ?? element;
            return {
              element,
              paragraphBounds: paragraph.getBoundingClientRect()
            };
          })
      : cueWindow.cues.map((geometry) => ({
          element: geometry.anchor.closest<HTMLElement>("[data-kp-scroll-cue]") ??
            geometry.anchor,
          paragraphBounds: {
            top: geometry.viewportTop,
            bottom: geometry.viewportBottom
          }
        }));
    const sequence = twoColumnDesktop
      ? projectKpTwoColumnScrollSequence({
          paragraphTopPx: measurements.map(
            ({ paragraphBounds }) => paragraphBounds.top
          ),
          paragraphBottomPx: measurements.map(
            ({ paragraphBounds }) => paragraphBounds.bottom
          ),
          indexOffset: cueWindow?.startIndex,
          previousParagraphTopPx: cueWindow !== undefined &&
              cueWindow.startIndex > 0
            ? cachedDocumentGeometry![cueWindow.startIndex - 1]!.documentTop -
              window.scrollY
            : undefined,
          focusTopPx: twoColumnGeometry!.textAnchorY,
          viewportHeightPx: twoColumnGeometry!.viewportHeightPx,
          approachStartRatio: twoColumnGeometry!.approachStartRatio,
          focusBottomRatio: twoColumnGeometry!.focusBottomRatio,
          minimumEffectiveHeightRatio:
            twoColumnGeometry!.minimumEffectiveHeightRatio,
          motionStartRatio: twoColumnGeometry!.motionStartRatio
        })
      : undefined;
    const frames = measurements.map((measurement, index): KpEconomicsInlineParagraphFrame => {
      const { element, paragraphBounds } = measurement;
      const passageId = element.dataset["kpEconomicsTutorialPassage"] ?? "";
      const motionBlockId = economicsMotionBlockId(
        element.dataset["kpTutorialMotionBlock"]
      );
      const sequenceParagraph = sequence?.paragraphs[index];
      const projection = sequenceParagraph ?? (inlineStickyFit === "reading"
        ? Object.freeze({
            phase: "below" as const,
            travel: 0,
            crossingProgress: 0,
            distanceFromStageBottomPx:
              paragraphBounds.top - (stageBounds?.bottom ?? 0)
          })
        : projectKpInlineStickyParagraph({
            paragraphTopPx: paragraphBounds.top,
            paragraphBottomPx: paragraphBounds.bottom,
            stageBottomPx: stageBounds?.bottom ?? 0,
            viewportHeightPx: window.innerHeight
          }));
      return {
        passageId,
        motionBlockId,
        projection,
        opacity: sequenceParagraph?.opacity ?? 1,
        ownsAttention: sequenceParagraph?.ownsAttention ?? false
      };
    });
    inlineParagraphProjections = Object.freeze(Object.fromEntries(frames.map(
      ({ passageId, projection }) => [passageId, projection]
    )));
    twoColumnParagraphPresentations = Object.freeze(Object.fromEntries(frames.map(
      ({ passageId, opacity }, index) => [passageId, Object.freeze({
        opacity,
        salience: sequence?.paragraphs[index]?.salience ?? 1
      })]
    )));
    return Object.freeze(frames);
  }

  function updateInlineStickyLayoutProjection(): void {
    if (!scrollPassageLayout || shell === undefined) return;
    cueGeometryCache?.invalidate();
    cueActivationObserver?.refresh();
    scrollCoordinator?.invalidateGeometry();
    const cues = [...shell.querySelectorAll<HTMLElement>(
      "[data-kp-scroll-cue]"
    )];
    const paragraph = cues[0]?.querySelector<HTMLElement>("p") ?? cues[0];
    const proseLineHeight = paragraph === undefined
      ? 28
      : Number.parseFloat(getComputedStyle(paragraph).lineHeight);
    const layout = projectKpInlineStickyLessonLayout({
      viewportWidthPx: window.innerWidth,
      viewportHeightPx: window.innerHeight,
      proseLineHeightPx: proseLineHeight
    });
    inlineStickyFit = layout.fit;
    inlineStickyStageHeightPx = usesTwoColumnDesktopGeometry()
      ? inlineStage?.getBoundingClientRect().height ??
        Math.round(window.innerHeight * 0.68)
      : layout.stageHeightPx;
    if (usesTwoColumnDesktopGeometry()) {
      const geometry = measureTwoColumnScrollGeometry();
      twoColumnStageTopPx = geometry.stageTopY;
      writeTwoColumnAssemblyGeometry(geometry);
    } else {
      cachedTwoColumnScrollGeometry = undefined;
      clearTwoColumnAssemblyGeometry();
    }
    updateInlineStickyStageProjection();
    updateInlineStickyParagraphProjections();
    scrollCoordinator?.scheduleProjection();
  }

  function updateInlineStickyStageProjection(): void {
    if (!scrollPassageLayout || inlineStage === undefined) return;
    if (inlineStickyFit === "reading") {
      inlineStickyStageState = "embedded";
      return;
    }
    const stageBounds = inlineStage.getBoundingClientRect();
    const passageBounds = inlineStage.closest<HTMLElement>(
      ".kp-economics-tutorial__motion-passage-body"
    )?.getBoundingClientRect();
    const top = inlineStickyTopInset();
    inlineStickyStageState = stageBounds.top > top + 1
      ? "embedded"
      : passageBounds !== undefined &&
          passageBounds.bottom <= stageBounds.bottom + 1
        ? "released"
        : "pinned";
  }

  function inlineStickyTopInset(): number {
    if (!usesTwoColumnDesktopGeometry()) return 0;
    return readCachedTwoColumnScrollGeometry().stageTopY;
  }

  function inlineStickyHandoffStartY(): number {
    if (usesTwoColumnDesktopGeometry()) {
      return readCachedTwoColumnScrollGeometry().textAnchorY;
    }
    const stageBottom = inlineStage?.getBoundingClientRect().bottom ??
      inlineStickyTopInset() + inlineStickyStageHeightPx;
    return stageBottom;
  }

  function motionCorridorFor(
    block: KpEconomicsMotionBlock,
    anchor: HTMLElement
  ): KpTutorialMotionCorridor {
    if (!scrollPassageLayout || inlineStickyFit === "reading") {
      return block.corridor;
    }
    if (usesTwoColumnDesktopGeometry()) {
      const geometry = readCachedTwoColumnScrollGeometry();
      const passage = anchor.closest<HTMLElement>(
        "[data-kp-two-column-scroll-paragraph]"
      );
      const previousPassage = passage?.previousElementSibling as
        HTMLElement | null | undefined;
      const previousParagraph = previousPassage?.querySelector<HTMLElement>("p");
      const paragraphDistancePx = previousParagraph === undefined ||
          previousParagraph === null
        ? window.innerHeight
        : anchor.getBoundingClientRect().top -
          previousParagraph.getBoundingClientRect().top;
      return projectKpTwoColumnScrollMotionCorridor({
        corridor: block.corridor,
        paragraphDistancePx,
        focusTopPx: geometry.textAnchorY,
        viewportHeightPx: geometry.viewportHeightPx,
        motionStartRatio: geometry.motionStartRatio
      });
    }
    return projectKpInlineStickyParagraphMotionCorridor({
      corridor: block.corridor,
      stageBottomPx: inlineStage?.getBoundingClientRect().bottom ??
        inlineStickyTopInset() + inlineStickyStageHeightPx,
      viewportHeightPx: window.innerHeight,
      paragraphHeightPx: anchor.offsetHeight
    });
  }

  function usesTwoColumnDesktopGeometry(): boolean {
    return twoColumnScroll && (twoColumnGeometryQuery ?? window.matchMedia(
      "(min-width: 60rem) and (min-height: 32rem)"
    )).matches;
  }

  async function invalidateGeometryAfterPresentationChange(): Promise<void> {
    await tick();
    updateInlineStickyLayoutProjection();
  }

  async function preserveCueAcrossLayoutChange(input: {
    readonly anchor: HTMLElement | undefined;
    readonly viewportTop: number | undefined;
    readonly gapVh: number;
  }): Promise<void> {
    // Apply the physical token in this input task so the scroll correction,
    // ResizeObserver invalidation, and coordinator request can coalesce.
    shell?.style.setProperty(
      "--kp-two-column-paragraph-gap-vh",
      String(input.gapVh)
    );
    if (
      input.anchor?.isConnected &&
      input.viewportTop !== undefined
    ) {
      const delta = input.anchor.getBoundingClientRect().top - input.viewportTop;
      if (Math.abs(delta) > 0.5) window.scrollBy({ top: delta, behavior: "auto" });
    }
    await tick();
    if (inlineLayoutObserver !== undefined && shell !== undefined) {
      suppressNextInlineLayoutObservation = true;
      for (const passage of shell.querySelectorAll<HTMLElement>(
        "[data-kp-scroll-cue]"
      )) inlineLayoutObserver.observe(passage);
    }
    updateInlineStickyLayoutProjection();
  }

  function handleResponsiveGeometryChange(): void {
    updateInlineStickyLayoutProjection();
  }

  function handleFontMetricsChange(): void {
    updateInlineStickyLayoutProjection();
  }

  function measureTwoColumnScrollGeometry(): KpEconomicsTwoColumnScrollGeometry {
    const style = shell === undefined ? undefined : getComputedStyle(shell);
    const ratio = (name: string, fallbackVh: number): number => {
      const value = Number.parseFloat(style?.getPropertyValue(name) ?? "");
      return clamp((Number.isFinite(value) ? value : fallbackVh) / 100, 0, 1);
    };
    const pixels = (name: string): number => {
      const value = Number.parseFloat(style?.getPropertyValue(name) ?? "");
      return Number.isFinite(value) ? Math.max(0, value) : 0;
    };
    const focusTopRatio = ratio("--kp-two-column-focus-top-vh", 35);
    const stageCenterRatio = ratio("--kp-two-column-stage-center-vh", 50);
    const viewport = projectKpTutorialUsableViewport({
      viewportHeightPx: window.innerHeight,
      persistentTopInsetPx: pixels("--kp-tutorial-persistent-top-inset"),
      persistentBottomInsetPx: pixels("--kp-tutorial-persistent-bottom-inset")
    });
    const anchors = projectKpTutorialViewportAnchors({
      viewport,
      textRatio: focusTopRatio,
      stageCenterRatio
    });
    const latch = projectKpTutorialSynchronizedLatch({
      viewport,
      anchors,
      stageBlockSizePx: inlineStickyStageHeightPx
    });
    const assembly = projectKpTutorialStageAssembly({
      latch,
      stageBlockSizePx: inlineStickyStageHeightPx,
      boundaryGapPx: pixels("--kp-two-column-boundary-gap")
    });
    // CSS owns the physical rhythm; enhancement reads the same numeric vh
    // tokens during layout invalidation, then every scroll frame consumes this
    // immutable snapshot instead of forcing a fresh style calculation.
    cachedTwoColumnScrollGeometry = Object.freeze({
      approachStartRatio: ratio("--kp-two-column-approach-start-vh", 78),
      focusBottomRatio: ratio("--kp-two-column-focus-bottom-vh", 50),
      focusTopRatio,
      horizontalBoundaryOffsetFromStageTopPx:
        assembly.horizontalBoundaryOffsetFromStageTopPx,
      minimumEffectiveHeightRatio: ratio(
        "--kp-two-column-minimum-effective-height-vh",
        23
      ),
      motionStartRatio: ratio("--kp-two-column-motion-start-vh", 62),
      stageCenterRatio,
      stageCenterY: latch.stageCenterY,
      stageTopY: latch.stageTopY,
      textAnchorY: latch.textY,
      textDocumentOffsetFromStagePx:
        latch.textDocumentOffsetFromStagePx,
      usableViewportBottomPx: viewport.bottomPx,
      usableViewportHeightPx: viewport.heightPx,
      usableViewportTopPx: viewport.topPx,
      viewportHeightPx: viewport.viewportHeightPx
    });
    return cachedTwoColumnScrollGeometry;
  }

  function readCachedTwoColumnScrollGeometry(): KpEconomicsTwoColumnScrollGeometry {
    if (cachedTwoColumnScrollGeometry !== undefined) {
      return cachedTwoColumnScrollGeometry;
    }
    // Mount establishes the CSS-backed snapshot before the coordinator starts.
    // This layout-free fallback keeps direct calls deterministic during setup.
    const viewport = projectKpTutorialUsableViewport({
      viewportHeightPx: window.innerHeight
    });
    const anchors = projectKpTutorialViewportAnchors({ viewport });
    const latch = projectKpTutorialSynchronizedLatch({
      viewport,
      anchors,
      stageBlockSizePx: inlineStickyStageHeightPx
    });
    const assembly = projectKpTutorialStageAssembly({
      latch,
      stageBlockSizePx: inlineStickyStageHeightPx
    });
    return Object.freeze({
      approachStartRatio: 0.78,
      focusBottomRatio: 0.5,
      focusTopRatio: anchors.textRatio,
      horizontalBoundaryOffsetFromStageTopPx:
        assembly.horizontalBoundaryOffsetFromStageTopPx,
      minimumEffectiveHeightRatio: 0.23,
      motionStartRatio: 0.62,
      stageCenterRatio: anchors.stageCenterRatio,
      stageCenterY: latch.stageCenterY,
      stageTopY: latch.stageTopY,
      textAnchorY: latch.textY,
      textDocumentOffsetFromStagePx:
        latch.textDocumentOffsetFromStagePx,
      usableViewportBottomPx: viewport.bottomPx,
      usableViewportHeightPx: viewport.heightPx,
      usableViewportTopPx: viewport.topPx,
      viewportHeightPx: viewport.viewportHeightPx
    });
  }

  function writeTwoColumnAssemblyGeometry(
    geometry: KpEconomicsTwoColumnScrollGeometry
  ): void {
    if (shell === undefined) return;
    // All enhanced physical tokens come from one projection. The graph and
    // divider may stick, while the document-owned bottom rule releases them;
    // their local sizes and terminal meeting point cannot drift independently.
    const properties = {
      "--kp-two-column-focus-top": geometry.textAnchorY,
      "--kp-two-column-stage-top": geometry.stageTopY,
      "--kp-two-column-stage-block-size": inlineStickyStageHeightPx,
      "--kp-two-column-entry-offset":
        geometry.textDocumentOffsetFromStagePx,
      "--kp-two-column-horizontal-boundary-offset":
        geometry.horizontalBoundaryOffsetFromStageTopPx
    } as const;
    for (const [name, value] of Object.entries(properties)) {
      shell.style.setProperty(name, `${value}px`);
    }
  }

  function clearTwoColumnAssemblyGeometry(): void {
    if (shell === undefined) return;
    for (const name of [
      "--kp-two-column-focus-top",
      "--kp-two-column-stage-top",
      "--kp-two-column-stage-block-size",
      "--kp-two-column-entry-offset",
      "--kp-two-column-horizontal-boundary-offset"
    ]) shell.style.removeProperty(name);
  }

  function updateReadingBandSelection(
    readingBandY: number = window.innerHeight * 0.38
  ): KpTutorialAttentionFrame<string, string, KpEconomicsMotionBlockId> {
    if (shell === undefined) {
      return projectKpTutorialAttentionFrame({ cursorY: readingBandY, regions: [] });
    }
    const passages = [...shell.querySelectorAll<HTMLElement>(
      "[data-kp-economics-tutorial-passage]"
    )];
    const frame = projectKpTutorialAttentionFrame({
      cursorY: readingBandY,
      regions: measureKpTutorialAttentionRegions(passages.map((passage) => {
        const passageId = passage.dataset["kpEconomicsTutorialPassage"] ?? "";
        const motionBlockId = economicsMotionBlockId(
          passage.dataset["kpTutorialMotionBlock"]
        );
        return {
          id: passageId,
          passageId,
          ...(motionBlockId === undefined ? {} : { motionBlockId }),
          element: passage
        };
      }))
    });
    attentionPassageId = frame.activePassageId;
    attentionCursorState = frame.state;
    scrollActiveMotionBlock = frame.activeMotionBlockId ?? "";
    const selectedPassage = frame.activePassageId;
    if (
      !navigationProjectionPending &&
      selectedPassage !== undefined &&
      selectedPassage !== checkpoint.passageId
    ) {
      const nextIndex = kpEconomicsDemandShiftCheckpoints.findIndex(
        (candidate) => candidate.passageId === selectedPassage
      );
      if (nextIndex >= 0) activateCheckpoint(nextIndex, "scroll");
    }
    return frame;
  }

  function economicsMotionBlockId(
    value: string | undefined
  ): KpEconomicsMotionBlockId | undefined {
    return value === "demand-shift" || value === "supply-movement"
      ? value
      : undefined;
  }

  function handleTutorialKeydown(event: KeyboardEvent): void {
    if (
      navigationProjectionPending &&
      ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "]
        .includes(event.key)
    ) navigationScrollIntent = true;
    if (
      player !== undefined &&
      event.target instanceof Node &&
      player.contains(event.target) &&
      [" ", "ArrowLeft", "ArrowRight", "Home", "End", "r", "R"].includes(
        event.key
      )
    ) claimManualMotion("demand-shift");
    if (
      !event.altKey ||
      (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
    ) return;
    event.preventDefault();
    const direction = event.key === "ArrowLeft" ? -1 : 1;
    if (scrollActiveMotionBlock === "supply-movement") {
      stepSupplyCheckpoint(direction);
    } else {
      stepCheckpoint(direction);
    }
  }

  onMount(() => {
    if (shell === undefined) return;
    player = shell.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player]"
    ) ?? undefined;
    if (player === undefined) return;
    tutorialToc = shell.querySelector<KpTutorialTocElement>(
      "kp-tutorial-toc"
    ) ?? undefined;
    demandScrubBar = shell.querySelector<KpTutorialScrubBarElement>(
      '[data-kp-tutorial-motion-controls="demand-shift"]'
    ) ?? undefined;
    supplyScrubBar = shell.querySelector<KpTutorialScrubBarElement>(
      '[data-kp-tutorial-motion-controls="supply-movement"]'
    ) ?? undefined;
    graphStyleTuner = shell.querySelector<KpGraphStyleTunerElement>(
      "kp-graph-style-tuner"
    ) ?? undefined;
    graphStyleTuner?.addEventListener(
      KP_GRAPH_STYLE_TUNER_CHANGE_EVENT,
      handleGraphStyleTunerChange
    );
    player.addEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, handleFrame);
    player.addEventListener(KP_EDITOR_ANIMATION_LOAD_EVENT, handleLoad);
    for (const scrubBar of [demandScrubBar, supplyScrubBar]) {
      scrubBar?.addEventListener(
        KP_TUTORIAL_SCRUB_TOGGLE_EVENT,
        handleTogglePlayback
      );
      scrubBar?.addEventListener(
        KP_TUTORIAL_SCRUB_REWIND_EVENT,
        handleRewindPlayback
      );
      scrubBar?.addEventListener(
        KP_TUTORIAL_SCRUB_PREVIOUS_EVENT,
        handlePreviousCheckpoint
      );
      scrubBar?.addEventListener(
        KP_TUTORIAL_SCRUB_NEXT_EVENT,
        handleNextCheckpoint
      );
      scrubBar?.addEventListener(
        KP_TUTORIAL_SCRUB_SEEK_EVENT,
        handleScrubBarSeek
      );
    }
    const performanceTarget = window as KpEconomicsTutorialPerformanceWindow;
    const profileScrollExecution =
      performanceTarget.__kpEconomicsPerformanceProbeRequested === true;
    twoColumnGeometryQuery = window.matchMedia(
      "(min-width: 60rem) and (min-height: 32rem)"
    );
    twoColumnGeometryQuery.addEventListener(
      "change",
      handleResponsiveGeometryChange
    );
    cueGeometryCache = new KpTutorialDocumentCueGeometryCache(
      window,
      collectScrollCues
    );
    cueActivationObserver = new KpTutorialCueActivationObserver(
      window,
      collectScrollCues,
      { onActivationChange: () => scrollCoordinator?.scheduleProjection() }
    );
    cueActivationObserver.connect();
    scrollCoordinator = new KpTutorialScrollCoordinator<KpEconomicsMotionBlockId>(
      window,
      collectScrollBlocks,
      handleCoordinatedScroll,
      { profileExecution: profileScrollExecution }
    );
    if (profileScrollExecution) {
      runtimePerformanceApi = Object.freeze({
        resetScrollCoordinator: () => scrollCoordinator?.resetMetrics(),
        snapshotScrollCoordinator: () => scrollCoordinator?.snapshotMetrics() ?? {
          scrollEvents: 0,
          resizeEvents: 0,
          scheduleRequests: 0,
          coalescedRequests: 0,
          requestedFrames: 0,
          executedFrames: 0,
          registrationReads: 0,
          layoutReads: 0,
          totalExecutionMs: 0,
          longestExecutionMs: 0
        }
      });
      performanceTarget.__kpEconomicsTutorialRuntimePerformance =
        runtimePerformanceApi;
    }
    scrollCoordinator.connect();
    scrollCoordinatorStatus = "connected";
    if (scrollPassageLayout) {
      inlineLayoutObserver = new ResizeObserver(() => {
        if (suppressNextInlineLayoutObservation) {
          suppressNextInlineLayoutObservation = false;
          return;
        }
        updateInlineStickyLayoutProjection();
      });
      for (const passage of shell.querySelectorAll<HTMLElement>(
        "[data-kp-scroll-cue]"
      )) inlineLayoutObserver.observe(passage);
      cueMutationObserver = new MutationObserver(() => {
        cueGeometryCache?.invalidate();
        cueActivationObserver?.refresh();
        scrollCoordinator?.invalidateGeometry();
      });
      const cueHost = shell.querySelector<HTMLElement>(
        ".kp-economics-tutorial__motion-passage-prose"
      );
      if (cueHost !== null) {
        cueMutationObserver.observe(cueHost, { childList: true });
      }
      window.addEventListener("resize", updateInlineStickyLayoutProjection);
      updateInlineStickyLayoutProjection();
    }
    if (tutorialToc !== undefined) {
      navigationController = createKpTutorialNavigationController({
        root: shell,
        toc: tutorialToc,
        resolve: resolveNavigationTarget,
        restore: restoreNavigationTarget,
        scroll: scrollToSemanticDestination,
        projectTocDestination: (target, destination) =>
          destination.kind === "checkpoint"
            ? { kind: "block", id: target.motion.activeBlockId }
            : destination,
        onApplied: ({ destination }) => {
          currentSemanticDestination = destination;
          announcement = `Opened ${destination.kind} ${destination.id}.`;
        }
      });
      navigationController.connect();
    }
    if (
      initialDeepLink.destination === undefined ||
      navigationController?.apply(initialDeepLink.destination, {
        source: "initial",
        scroll: true
      }) !== true
    ) scrollToSemanticDestination(initialDeepLink);
    window.addEventListener("keydown", handleTutorialKeydown);
    window.addEventListener("wheel", handleNavigationScrollIntent, {
      passive: true
    });
    window.addEventListener("touchmove", handleNavigationScrollIntent, {
      passive: true
    });
    disposePlayerHost = mountKpAnimationCataloguePlayerHost({
      shell,
      entry,
      descriptor,
      hostability,
      animation
    });
    reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    previousHistoryScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    reducedMotion = reducedMotionQuery.matches;
    if (reducedMotion && motionOwner === "untouched") {
      scrollTimelineStatus = "reduced-motion";
    }
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
    document.fonts.addEventListener("loadingdone", handleFontMetricsChange);
    void document.fonts.ready.then(() => {
      handleFontMetricsChange();
      scrollCoordinator?.scheduleProjection();
    });
    scrollCoordinator.scheduleProjection();
  });

  onDestroy(() => {
    const performanceTarget = window as KpEconomicsTutorialPerformanceWindow;
    if (
      performanceTarget.__kpEconomicsTutorialRuntimePerformance ===
      runtimePerformanceApi
    ) delete performanceTarget.__kpEconomicsTutorialRuntimePerformance;
    scrollCoordinator?.disconnect();
    cueActivationObserver?.disconnect();
    navigationController?.dispose();
    cancelSupplyPlayback();
    player?.removeEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, handleFrame);
    player?.removeEventListener(KP_EDITOR_ANIMATION_LOAD_EVENT, handleLoad);
    for (const scrubBar of [demandScrubBar, supplyScrubBar]) {
      scrubBar?.removeEventListener(
        KP_TUTORIAL_SCRUB_TOGGLE_EVENT,
        handleTogglePlayback
      );
      scrubBar?.removeEventListener(
        KP_TUTORIAL_SCRUB_REWIND_EVENT,
        handleRewindPlayback
      );
      scrubBar?.removeEventListener(
        KP_TUTORIAL_SCRUB_PREVIOUS_EVENT,
        handlePreviousCheckpoint
      );
      scrubBar?.removeEventListener(
        KP_TUTORIAL_SCRUB_NEXT_EVENT,
        handleNextCheckpoint
      );
      scrubBar?.removeEventListener(
        KP_TUTORIAL_SCRUB_SEEK_EVENT,
        handleScrubBarSeek
      );
    }
    graphStyleTuner?.removeEventListener(
      KP_GRAPH_STYLE_TUNER_CHANGE_EVENT,
      handleGraphStyleTunerChange
    );
    window.removeEventListener("keydown", handleTutorialKeydown);
    window.removeEventListener("wheel", handleNavigationScrollIntent);
    window.removeEventListener("touchmove", handleNavigationScrollIntent);
    window.removeEventListener("resize", updateInlineStickyLayoutProjection);
    inlineLayoutObserver?.disconnect();
    cueMutationObserver?.disconnect();
    reducedMotionQuery?.removeEventListener("change", handleReducedMotionChange);
    twoColumnGeometryQuery?.removeEventListener(
      "change",
      handleResponsiveGeometryChange
    );
    document.fonts.removeEventListener("loadingdone", handleFontMetricsChange);
    if (previousHistoryScrollRestoration !== undefined) {
      window.history.scrollRestoration = previousHistoryScrollRestoration;
    }
    disposePlayerHost?.();
  });

  function clamp(value: number, minimum: number, maximum: number): number {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function percent(value: number): string {
    return `${(value * 100).toFixed(4)}%`;
  }

  function toggleTwoColumnTextSide(): void {
    const nextSide = twoColumnTextSide === "right" ? "left" : "right";
    twoColumnTextSide = nextSide;
    const search = writeKpEconomicsTwoColumnTextSide({
      search: window.location.search,
      side: nextSide
    });
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${search}${window.location.hash}`
    );
    announcement = `Text moved to the ${nextSide} of the graph.`;
    void invalidateGeometryAfterPresentationChange();
  }

  function changeTwoColumnParagraphGap(event: Event): void {
    if (!(event.currentTarget instanceof HTMLInputElement)) return;
    const activeAnchor = shell === undefined
      ? undefined
      : [...shell.querySelectorAll<HTMLElement>("[data-kp-scroll-cue]")]
        .find(({ dataset }) =>
          dataset["kpEconomicsTutorialPassage"] === attentionPassageId
        );
    const viewportTop = activeAnchor?.getBoundingClientRect().top;
    // The tuner owns this one reversible resize transaction. Reconnect after
    // Svelte settles so ResizeObserver cannot duplicate its invalidation.
    inlineLayoutObserver?.disconnect();
    twoColumnParagraphGapVh = normalizeKpEconomicsTwoColumnParagraphGapVh(
      Number(event.currentTarget.value)
    );
    const search = writeKpEconomicsTwoColumnParagraphGapVh({
      search: window.location.search,
      gapVh: twoColumnParagraphGapVh
    });
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${search}${window.location.hash}`
    );
    announcement = `Paragraph spacing set to ${twoColumnParagraphGapVh} viewport-height units.`;
    void preserveCueAcrossLayoutChange({
      anchor: activeAnchor,
      viewportTop,
      gapVh: twoColumnParagraphGapVh
    });
  }

  function scrollToSemanticDestination(
    destination: KpEconomicsDemandShiftInitialDestination
  ): void {
    if (shell === undefined) {
      return;
    }
    if (destination.destination === undefined) {
      window.scrollTo({ top: 0, behavior: "auto" });
      navigationLockedScrollY = window.scrollY;
      return;
    }
    if (destination.motionScroll !== undefined) {
      const block = findKpEconomicsMotionBlock(
        destination.motionScroll.blockId
      )!;
      const boundary = shell.querySelector<HTMLElement>(
        `[data-kp-tutorial-motion-block="${destination.motionScroll.blockId}"]`
      ) ?? undefined;
      const anchor = scrollPassageLayout
        ? scrollAnchorForMotionBoundary(boundary)
        : destination.motionScroll.blockId === "supply-movement"
          ? supplyScrubBar
          : demandScrubBar;
      if (anchor === undefined) return;
      const corridor = motionCorridorFor(block, anchor);
      const start = corridor.startViewportRatio * window.innerHeight;
      const end = corridor.endViewportRatio * window.innerHeight;
      const endpointInset = destination.motionScroll.travel <= 0.001
        ? 2
        : destination.motionScroll.travel >= 0.999
          ? -2
          : 0;
      const desiredTop = start -
        destination.motionScroll.travel * (start - end) + endpointInset;
      window.scrollTo({
        top: Math.max(
          0,
          window.scrollY + anchor.getBoundingClientRect().top - desiredTop
        ),
        behavior: "auto"
      });
      navigationLockedScrollY = window.scrollY;
      return;
    }
    shell.querySelector<HTMLElement>(
      `#${destination.targetElementId}`
    )?.scrollIntoView({ block: "start", behavior: "auto" });
    navigationLockedScrollY = window.scrollY;
  }

  function handleNavigationScrollIntent(): void {
    if (navigationProjectionPending) navigationScrollIntent = true;
  }

  function scrollAnchorForMotionBoundary(
    boundary: HTMLElement | null | undefined
  ): HTMLElement | undefined {
    if (boundary === undefined || boundary === null) return undefined;
    return boundary.querySelector<HTMLElement>("p") ?? boundary;
  }

  function resolveNavigationTarget(
    destination: KpTutorialTocDestination
  ): KpEconomicsDemandShiftInitialDestination | undefined {
    const next = resolveKpEconomicsDemandShiftInitialDestination({
      lesson,
      hash: serializeKpTutorialDestinationHash(destination)
    });
    return next.destination?.kind === destination.kind &&
      next.destination.id === destination.id
      ? next
      : undefined;
  }

  function restoreNavigationTarget(
    next: KpEconomicsDemandShiftInitialDestination
  ): void {
    scrollCoordinator?.cancelPendingProjection();
    const session = player === undefined
      ? undefined
      : getKpEditorAnimationPlaybackSession(player);
    if (session?.player.playbackStatus === "playing") {
      dispatchKpEditorAnimationPlaybackAction(player!, {
        type: "pause",
        nowMs: performance.now()
      });
    }
    cancelSupplyPlayback();
    navigationProjectionPending = true;
    navigationScrollIntent = false;
    navigationResume = createNavigationResume(next);
    checkpointIndex = next.checkpointIndex;
    lessonMotionProjection = next.motion;
    scrollActiveMotionBlock = next.motion.activeBlockId;
    motionOwner = "untouched";
    manualMotionBlock = undefined;
    manualScrollRebase = undefined;
    scrollTimelineStatus = "idle";
    playbackDirection = "forward";
    supplyPlaybackDirection = "forward";
    supplyPlaybackStatus = "paused";
    seek(next.motion.demandShiftProgress);
    scrollCoordinator?.scheduleProjection();
  }

  function createNavigationResume(
    destination: KpEconomicsDemandShiftInitialDestination
  ): KpEconomicsNavigationResume {
    const block = destination.motion.blocks.find(
      ({ id }) => id === destination.motion.activeBlockId
    )!;
    return {
      blockId: destination.motion.activeBlockId,
      progress: block.progress
    };
  }

  function writeScrubBarAttributes(
    scrubBar: KpTutorialScrubBarElement | undefined,
    attributes: Readonly<Record<string, string | number | boolean>>
  ): void {
    if (scrubBar === undefined) return;
    for (const [name, value] of Object.entries(attributes)) {
      scrubBar.setAttribute(name, String(value));
    }
  }

</script>

{#snippet economicsStage()}
  <div class="kp-economics-tutorial__stage-card">
    <button
      type="button"
      class="kp-economics-tutorial__expand"
      aria-expanded={stageExpanded}
      aria-label={stageExpanded ? "Return stage to compact size" : "Expand stage"}
      onclick={() => stageExpanded = !stageExpanded}
    >{stageExpanded ? "Compact" : "Expand"}</button>

    <div
      class="kp-economics-tutorial__player-host"
      data-kp-animation-catalogue-stage
      data-kp-animation-catalogue-stage-persistent="true"
      data-kp-economics-stage="economics-stage"
      data-kp-economics-stage-outer-geometry="fixed"
      data-kp-economics-screen-space-labels={scrollPassageLayout ? "true" : undefined}
      aria-busy={!ready}
    >
      {@html playerHtml}
      <div
        class="kp-economics-tutorial__verification-aperture"
        data-kp-economics-stage-aperture="verification-aperture"
        data-kp-economics-stage-aperture-edge={stageComposition.aperture.edge}
        data-kp-economics-stage-aperture-openness={stageComposition.aperture.openness.toFixed(3)}
        aria-hidden="true"
      >
        <div
          class="kp-economics-tutorial__verification-surface"
          data-kp-economics-stage-surface="equilibrium-verification"
          data-kp-economics-stage-slot="verification-slot"
          data-kp-economics-stage-surface-lifecycle={verificationStageSurface.lifecycle}
        >{@html verificationSurfaceHtml}</div>
      </div>
    </div>
  </div>
{/snippet}

{#snippet lessonPassage(
  passage: KpEconomicsDemandShiftLessonPassage,
  scrollCue: boolean
)}
  {@const renderedMotionBlock = findKpEconomicsMotionBlock(
    passage.motionBlockId
  )}
  {@const inlineParagraphProjection = scrollCue
    ? inlineParagraphProjections[passage.id]
    : undefined}
  {@const twoColumnParagraphPresentation = twoColumnScroll && scrollCue
    ? twoColumnParagraphPresentations[passage.id]
    : undefined}
  <div
    class="kp-economics-tutorial__passage"
    class:kp-economics-tutorial__passage--active={attentionPassageId === passage.id}
    class:kp-economics-tutorial__motion-block={renderedMotionBlock !== undefined}
    class:kp-tutorial-shell__motion-block={renderedMotionBlock !== undefined}
    class:kp-economics-tutorial__prediction={passage.id === "prediction"}
    class:kp-economics-tutorial__equation-check={passage.id === "equation-check"}
    class:kp-economics-tutorial__synthesis={passage.id === "synthesis"}
    data-kp-economics-tutorial-passage={passage.id}
    data-kp-lesson-passage-role={passage.role}
    data-kp-scroll-cue={scrollCue ? true : undefined}
    data-kp-inline-sticky-cue={scrollCue ? true : undefined}
    data-kp-two-column-scroll-paragraph={twoColumnScroll && scrollCue
      ? true
      : undefined}
    data-kp-inline-sticky-passage-role={scrollCue ? passage.role : undefined}
    data-kp-inline-sticky-paragraph-phase={inlineParagraphProjection?.phase}
    data-kp-inline-sticky-scene-travel={inlineParagraphProjection?.travel.toFixed(4)}
    data-kp-inline-sticky-crossing-progress={inlineParagraphProjection?.crossingProgress.toFixed(4)}
    data-kp-two-column-paragraph-opacity={twoColumnParagraphPresentation?.opacity.toFixed(4)}
    data-kp-two-column-paragraph-salience={twoColumnParagraphPresentation?.salience.toFixed(4)}
    data-kp-tutorial-motion-block={renderedMotionBlock?.id}
    id={renderedMotionBlock === undefined
      ? undefined
      : `kp-block-${renderedMotionBlock.id}`}
    data-kp-tutorial-destination={renderedMotionBlock === undefined
      ? undefined
      : "block"}
    data-kp-tutorial-destination-id={renderedMotionBlock?.id}
    role={renderedMotionBlock === undefined ? undefined : "group"}
    aria-label={renderedMotionBlock === undefined
      ? undefined
      : `${renderedMotionBlock.label} animation step`}
    style={twoColumnParagraphPresentation === undefined
      ? undefined
      : `--kp-two-column-paragraph-opacity:${twoColumnParagraphPresentation.opacity};--kp-two-column-paragraph-salience:${twoColumnParagraphPresentation.salience}`
    }
  >
    {#if renderedMotionBlock !== undefined}
      {#each renderedMotionBlock.checkpoints as motionCheckpoint}
        <span
          class="kp-economics-tutorial__checkpoint-anchor"
          id={`kp-checkpoint-${motionCheckpoint.id}`}
          data-kp-tutorial-destination="checkpoint"
          data-kp-tutorial-destination-id={motionCheckpoint.id}
          data-kp-tutorial-destination-block={renderedMotionBlock.id}
          aria-hidden="true"
        ></span>
      {/each}
    {/if}
    {#if passage.id === "prediction"}
      <p>{@html passage.paragraphs[0]!.html}</p>
      <details>
        <summary>Reveal what happens at the old price</summary>
        <p>{@html passage.paragraphs[1]!.html}</p>
      </details>
    {:else if passage.id === "synthesis"}
      <p class="kp-economics-tutorial__synthesis-question">
        {@html passage.paragraphs[0]!.html}
      </p>
      <details>
        <summary>Reveal the model explanation</summary>
        <p>{@html passage.paragraphs[1]!.html}</p>
      </details>
    {:else}
      {#each passage.paragraphs as paragraph}
        <p><span class="kp-economics-tutorial__passage-ink">{@html paragraph.html}</span></p>
      {/each}
    {/if}
    {#if !scrollPassageLayout && renderedMotionBlock?.id === "demand-shift"}
      {@html motionScrubBarHtml["demand-shift"]}
    {:else if !scrollPassageLayout && renderedMotionBlock?.id === "supply-movement"}
      {@html motionScrubBarHtml["supply-movement"]}
    {/if}
    {#if passage.id === "explore"}
      <details class="kp-economics-tutorial__explore" bind:open={explorationOpen}>
        <summary>Explore another demand shift</summary>
        <div class="kp-economics-tutorial__explore-panel">
          <label>
            New demand intercept
            <input
              type="range"
              min={kpEconomicsDemandInterceptParameter.minimum}
              max={kpEconomicsDemandInterceptParameter.maximum}
              step={kpEconomicsDemandInterceptParameter.step}
              value={demandIntercept}
              oninput={changeDemandIntercept}
            />
            <output><KpInlineMath latex={String(demandIntercept)} /></output>
          </label>
          <button type="button" onclick={restoreLessonExample}>
            Return to lesson example
          </button>
        </div>
      </details>
    {/if}
  </div>
{/snippet}

<KpTutorialLessonShell
  bind:root={shell}
  rootClass={`kp-economics-tutorial${scrollPassageLayout
    ? " kp-economics-tutorial--inline-sticky"
    : ""}${twoColumnScroll
    ? " kp-economics-tutorial--two-column-scroll"
    : ""}${stageExpanded
    ? " kp-economics-tutorial--stage-expanded"
    : ""}`}
  layoutClass="kp-economics-tutorial__layout"
  proseClass="kp-economics-tutorial__prose"
  proseLabel="Economics lesson"
  stageClass="kp-economics-tutorial__stage"
  stageLabel="Persistent supply and demand stage"
  attributes={{
    "data-kp-economics-demand-shift-tutorial": true,
    "data-kp-economics-tutorial-layout": presentationLayout,
    "data-kp-economics-two-column-text-side": twoColumnTextSide,
    "data-kp-economics-two-column-paragraph-gap-vh": twoColumnParagraphGapVh,
    "data-kp-economics-graph-stroke-scale": graphStrokeScale.toFixed(2),
    "data-kp-economics-tutorial-theme": theme,
    "data-kp-inline-sticky-fit": inlineStickyFit,
    "data-kp-inline-sticky-stage-state": inlineStickyStageState,
    "data-kp-animation-catalogue": true,
    "data-kp-animation-catalogue-selection": entry.animationId,
    "data-kp-economics-demand-intercept": demandIntercept,
    "data-kp-economics-tutorial-checkpoint": checkpoint.id,
    "data-kp-economics-tutorial-passage": checkpoint.passageId,
    "data-kp-economics-tutorial-attention-passage": attentionPassageId ?? "",
    "data-kp-economics-tutorial-attention-state": attentionCursorState,
    "data-kp-economics-tutorial-motion-owner": motionOwner,
    "data-kp-economics-tutorial-manual-block": manualMotionBlock ?? "",
    "data-kp-economics-tutorial-scroll-timeline": scrollTimelineStatus,
    "data-kp-economics-tutorial-scroll-coordinator": scrollCoordinatorStatus,
    "data-kp-economics-tutorial-scroll-active-block": scrollActiveMotionBlock,
    "data-kp-economics-tutorial-initial-destination": currentSemanticDestination === undefined
      ? ""
      : `${currentSemanticDestination.kind}:${currentSemanticDestination.id}`,
    "data-kp-economics-tutorial-demand-progress": lessonMotionProjection.demandShiftProgress.toFixed(3),
    "data-kp-economics-tutorial-supply-movement-progress": supplyMovementProgress.toFixed(3),
    "data-kp-economics-tutorial-scene-market": lessonMotionProjection.scene.market,
    "data-kp-economics-tutorial-scene-presentation": lessonMotionProjection.scene.presentation,
    "data-kp-economics-tutorial-supply-interpretation": supplyInterpretationPhase,
    "data-kp-economics-stage-composition-phase": stageComposition.phase,
    "data-kp-economics-stage-composition-progress": stageComposition.progress.toFixed(3),
    "data-kp-economics-verification-reveal": verificationReveal.phase,
    "data-kp-tutorial-review-root": true,
    "data-kp-tutorial-review-document-id": "lesson.economics.demand-shift",
    "data-kp-tutorial-review-document-version": "1.0.0",
    "data-kp-tutorial-review-asset-id": entry.animationId,
    "data-kp-tutorial-review-renderer": "economics-equilibrium-graph",
    "data-kp-tutorial-review-passage": attentionPassageId ?? checkpoint.passageId,
    "data-kp-tutorial-review-motion-block": lessonMotionProjection.activeBlockId,
    "data-kp-tutorial-review-checkpoint": checkpoint.id,
    "data-kp-tutorial-review-progress": reviewProgress.toFixed(4),
    "data-kp-tutorial-review-motion-authority": motionOwner,
    "data-kp-tutorial-review-playback-direction": lessonMotionProjection.activeBlockId === "supply-movement"
      ? supplyPlaybackDirection
      : playbackDirection,
    "data-kp-tutorial-review-evidence": JSON.stringify(
      twoColumnScroll
        ? {
            themeId: kpEconomicsDemandShiftThemeIds[theme],
            tuning: {
              "two-column-text-side": twoColumnTextSide,
              "graph-stroke-scale": graphStrokeScale.toFixed(2),
              "paragraph-gap-vh": String(twoColumnParagraphGapVh)
            }
          }
        : { themeId: kpEconomicsDemandShiftThemeIds[theme] }
    )
  }}
  style={`${supplyInterpretationStyle};${stageCompositionStyle};${verificationRevealStyle};${graphStrokeStyle};--kp-two-column-paragraph-gap-vh:${twoColumnParagraphGapVh}`}
>
  {#snippet before()}
    <h1 class="kp-tutorial-shell__visually-hidden kp-economics-tutorial__visually-hidden">
      Economics demand-shift tutorial
    </h1>

    <span
      class="kp-economics-tutorial__reading-band-marker"
      data-kp-economics-tutorial-reading-band
      data-kp-reading-band-state={attentionCursorState === "within-region"
        ? "crossing"
        : "tracking"}
      aria-hidden="true"
    ></span>
  {/snippet}

  {#snippet prose()}
      <header class="kp-tutorial-shell__intro kp-economics-tutorial__intro">
        <p class="kp-tutorial-shell__eyebrow kp-economics-tutorial__eyebrow">{lesson.kicker}</p>
        <p class="kp-tutorial-shell__question kp-economics-tutorial__question">{lesson.title}</p>
        <p class="kp-tutorial-shell__assumption kp-economics-tutorial__assumption">{lesson.assumption}</p>
      </header>

      {@html tocHtml}

      {#each lesson.sections as section}
        <section
          id={`kp-section-${section.id}`}
          data-kp-tutorial-destination="section"
          data-kp-tutorial-destination-id={section.id}
          aria-labelledby={`kp-heading-${section.id}`}
        >
          <h3 id={`kp-heading-${section.id}`}>{section.heading}</h3>

          {#if scrollPassageLayout && section.id === "market-clearing"}
            <div
              class="kp-economics-tutorial__motion-passage"
              data-kp-motion-passage="demand-change"
            >
              {#if !twoColumnScroll}
                <header class="kp-economics-tutorial__motion-passage-gate kp-economics-tutorial__motion-passage-gate--entrance">
                  <p>A change in demand</p>
                  <span aria-hidden="true">↓</span>
                </header>
              {/if}
              <div class="kp-economics-tutorial__motion-passage-body">
                <aside
                  bind:this={inlineStage}
                  class="kp-economics-tutorial__stage kp-economics-tutorial__stage--inline"
                  style:--kp-two-column-stage-anchor-top={twoColumnStageTopPx ===
                    undefined ? undefined : `${twoColumnStageTopPx}px`}
                  aria-label="Sticky supply and demand continuous-canvas proof"
                  data-kp-inline-sticky-stage
                >
                  {@render economicsStage()}
                </aside>
                <div class="kp-economics-tutorial__motion-passage-prose">
                  {#each (twoColumnScroll
                    ? twoColumnParagraphs
                    : section.passages.filter(({ role }) => role !== "reflection")) as passage}
                    {@render lessonPassage(passage, true)}
                  {/each}
                </div>
              </div>
              <div
                class="kp-economics-tutorial__motion-passage-gate kp-economics-tutorial__motion-passage-gate--exit"
                aria-hidden="true"
              ></div>
            </div>
            {#each section.passages.filter(({ role }) => role === "reflection") as passage}
              {@render lessonPassage(passage, false)}
            {/each}
          {:else}
            {#each section.passages as passage}
              {@render lessonPassage(passage, false)}
            {/each}
          {/if}
        </section>
      {/each}

      <footer class="kp-economics-tutorial__footer">
        <a href={`/?artifact=${entry.animationId}`}>Open the animation catalogue</a>
      </footer>
  {/snippet}

  {#snippet stage()}
    {#if !scrollPassageLayout}
      {@render economicsStage()}
    {/if}
  {/snippet}

  {#snippet after()}
  <p class="kp-economics-tutorial__announcement" aria-live="polite">
    {announcement}
  </p>
  <div class="kp-economics-tutorial__bottom-controls">
    {#if twoColumnScroll}
      <button
        class="kp-economics-tutorial__column-toggle"
        type="button"
        aria-label={`Text is on the ${twoColumnTextSide}; move it to the ${twoColumnTextSide === "right" ? "left" : "right"}`}
        aria-pressed={twoColumnTextSide === "left"}
        data-kp-economics-column-toggle
        onclick={toggleTwoColumnTextSide}
      >
        <span aria-hidden="true">⇄</span>
        <span>Text {twoColumnTextSide}</span>
      </button>
      <kp-graph-style-tuner
        stroke-scale={graphStrokeScale.toFixed(2)}
        data-kp-economics-graph-style-tuner
      >
        <details class="kp-economics-tutorial__line-tuner">
          <summary>Lines</summary>
          <div class="kp-economics-tutorial__line-tuner-panel">
            <label for="kp-economics-line-width">Stroke multiplier</label>
            <input
              id="kp-economics-line-width"
              type="range"
              min={kpGraphStrokeScaleMinimum}
              max={kpGraphStrokeScaleMaximum}
              step={kpGraphStrokeScaleStep}
              value={graphStrokeScale.toFixed(2)}
              data-kp-graph-style-tuner-stroke
            />
            <output
              for="kp-economics-line-width"
              data-kp-graph-style-tuner-output
            >{graphStrokeScaleSummary(graphStrokeScale)}</output>
          </div>
        </details>
      </kp-graph-style-tuner>
      <details
        class="kp-economics-tutorial__line-tuner kp-economics-tutorial__spacing-tuner"
        data-kp-economics-spacing-tuner
      >
        <summary>Spacing</summary>
        <div class="kp-economics-tutorial__line-tuner-panel">
          <label for="kp-economics-paragraph-gap">Paragraph gap</label>
          <input
            id="kp-economics-paragraph-gap"
            type="range"
            min={kpEconomicsTwoColumnParagraphGapMinimumVh}
            max={kpEconomicsTwoColumnParagraphGapMaximumVh}
            step={kpEconomicsTwoColumnParagraphGapStepVh}
            value={twoColumnParagraphGapVh}
            data-kp-economics-spacing-tuner-input
            oninput={changeTwoColumnParagraphGap}
          />
          <output for="kp-economics-paragraph-gap">
            {twoColumnParagraphGapVh}vh
          </output>
        </div>
      </details>
    {/if}
    <button
      class="kp-economics-tutorial__theme-toggle"
      type="button"
      aria-label="Dark mode"
      aria-pressed={theme === "dark"}
      data-kp-economics-theme-toggle
      onclick={toggleTheme}
    >
      <span class="kp-economics-tutorial__theme-toggle-track" aria-hidden="true">
        <span class="kp-economics-tutorial__theme-toggle-thumb"></span>
      </span>
      <span>Dark mode</span>
    </button>
  </div>
  {/snippet}
</KpTutorialLessonShell>
