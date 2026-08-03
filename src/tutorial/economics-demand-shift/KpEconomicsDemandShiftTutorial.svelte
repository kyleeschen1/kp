<script lang="ts">
  import { onDestroy, onMount, untrack } from "svelte";

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
    findKpEconomicsDemandShiftCheckpointIndex,
    kpEconomicsDemandShiftCheckpoints,
    selectKpEconomicsDemandShiftPlaybackCheckpointId,
    selectKpEconomicsReadingBandPassage,
    stepKpEconomicsDemandShiftCheckpoint
  } from "./economics-demand-shift-checkpoints.ts";
  import type {
    KpEconomicsDemandShiftLesson
  } from "./economics-demand-shift-lesson-compiler.ts";
  import {
    findKpEconomicsMotionBlock,
    kpEconomicsMotionBlocks,
    projectKpEconomicsLessonMotion,
    type KpEconomicsMotionBlockId
  } from "./economics-demand-shift-motion-blocks.ts";
  import {
    projectKpEconomicsRebasedCorridor
  } from "./economics-demand-shift-scroll-corridor.ts";
  import {
    KpEconomicsTutorialScrollCoordinator,
    type KpEconomicsCoordinatedScrollProjection,
    type KpEconomicsScrollBlockRegistration
  } from "./economics-demand-shift-scroll-coordinator.ts";
  import {
    KP_TUTORIAL_SCRUB_NEXT_EVENT,
    KP_TUTORIAL_SCRUB_PREVIOUS_EVENT,
    KP_TUTORIAL_SCRUB_REWIND_EVENT,
    KP_TUTORIAL_SCRUB_SEEK_EVENT,
    KP_TUTORIAL_SCRUB_TOGGLE_EVENT,
    type KpTutorialScrubBarElement,
    type KpTutorialScrubSeekDetail
  } from "../kp-tutorial-scrub-bar.ts";
  import KpInlineMath from "./KpInlineMath.svelte";

  type KpEconomicsTutorialMotionOwner = "untouched" | "scroll" | "manual";
  type KpEconomicsTutorialScrollTimelineStatus =
    | "idle"
    | "seeking"
    | "complete"
    | "rewound"
    | "manual"
    | "reduced-motion";

  interface KpEconomicsTutorialAttentionProjection {
    readonly spotlightVisible: boolean;
    readonly spotlightX: number;
    readonly spotlightY: number;
    readonly pageVeilVisible: boolean;
    readonly viewportWidth: number;
    readonly viewportHeight: number;
    readonly passageX: number;
    readonly passageY: number;
    readonly passageWidth: number;
    readonly passageHeight: number;
    readonly stageX: number;
    readonly stageY: number;
    readonly stageWidth: number;
    readonly stageHeight: number;
  }

  interface KpEconomicsManualScrollRebase {
    readonly blockId: KpEconomicsMotionBlockId;
    readonly rawTravelAtTakeover: number;
    readonly manualProgress: number;
  }

  const emptyAttentionProjection: KpEconomicsTutorialAttentionProjection = {
    spotlightVisible: false,
    spotlightX: 0,
    spotlightY: 0,
    pageVeilVisible: false,
    viewportWidth: 0,
    viewportHeight: 0,
    passageX: 0,
    passageY: 0,
    passageWidth: 0,
    passageHeight: 0,
    stageX: 0,
    stageY: 0,
    stageWidth: 0,
    stageHeight: 0
  };

  let {
    entry,
    descriptor,
    player: initialPlayer,
    animation,
    hostability,
    initialDemandIntercept,
    lesson
  }: {
    readonly entry: KpAnimationCatalogueEntry;
    readonly descriptor: KpEditorAnimationDescriptor;
    readonly player: KpEditorAnimationPlayerState;
    readonly animation: KpAnimationAsset;
    readonly hostability: KpAnimationCatalogueSurfaceHostability;
    readonly initialDemandIntercept: number;
    readonly lesson: KpEconomicsDemandShiftLesson;
  } = $props();

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
  let player = $state<HTMLElement | undefined>();
  let demandScrubBar = $state<KpTutorialScrubBarElement | undefined>();
  let supplyScrubBar = $state<KpTutorialScrubBarElement | undefined>();
  let checkpointIndex = $state(0);
  let progress = $state(initial.progress);
  let playbackStatus = $state(initial.playbackStatus);
  let playbackDirection = $state(initial.playbackDirection);
  let demandIntercept = $state(initial.demandIntercept);
  let ready = $state(false);
  let stageExpanded = $state(false);
  let explorationOpen = $state(false);
  let announcement = $state("Initial market ready.");
  let motionOwner = $state<KpEconomicsTutorialMotionOwner>("untouched");
  let manualMotionBlock = $state<KpEconomicsMotionBlockId | undefined>();
  let scrollTimelineStatus = $state<KpEconomicsTutorialScrollTimelineStatus>(
    "idle"
  );
  let reducedMotion = $state(false);
  let readingBandProximity = $state(0);
  let scrollCoordinatorStatus = $state<"pending" | "connected">("pending");
  let scrollActiveMotionBlock = $state("");
  let attentionFrame: number | undefined;
  let attentionResizeObserver: ResizeObserver | undefined;
  let reducedMotionQuery: MediaQueryList | undefined;
  let attentionProjection = $state(emptyAttentionProjection);
  let disposePlayerHost: (() => void) | undefined;
  let scrollCoordinator: KpEconomicsTutorialScrollCoordinator | undefined;
  let latestScrollProjection: KpEconomicsCoordinatedScrollProjection | undefined;
  let manualScrollRebase: KpEconomicsManualScrollRebase | undefined;
  let supplyPlaybackStatus = $state<"paused" | "playing" | "complete">(
    "paused"
  );
  let supplyPlaybackDirection = $state<"forward" | "rewind">("forward");
  let supplyPlaybackFrame: number | undefined;
  let supplyPlaybackLastMs: number | undefined;
  let lessonMotionProjection = $state(projectKpEconomicsLessonMotion({
    activeBlockId: "demand-shift",
    localProgress: initial.playbackDirection === "rewind"
      ? 1 - initial.progress
      : initial.progress
  }));
  const playerHtml = initial.playerHtml;
  let checkpoint = $derived(kpEconomicsDemandShiftCheckpoints[checkpointIndex]!);
  let equationsVisible = $derived(
    checkpoint.id === "equation-check" ||
    checkpoint.id === "scope" ||
    checkpoint.id === "synthesis" ||
    checkpoint.id === "explore"
  );
  let semanticProgress = $derived(lessonMotionProjection.demandShiftProgress);
  let supplyMovementProgress = $derived(
    lessonMotionProjection.supplyMovementProgress
  );
  let visualCheckpoint = $derived(
    checkpoint.passageId === "follow-shift"
      ? kpEconomicsDemandShiftCheckpoints[
          findKpEconomicsDemandShiftCheckpointIndex(
            selectKpEconomicsDemandShiftPlaybackCheckpointId(semanticProgress)
          )
        ]!
      : checkpoint
  );
  let readingBandStyle = $derived(
    `--kp-tutorial-reading-band-proximity:${readingBandProximity.toFixed(3)};` +
    `--kp-tutorial-reading-band-opacity:${(0.18 + 0.72 * readingBandProximity).toFixed(3)};` +
    `--kp-tutorial-reading-band-scale:${(0.78 + 0.28 * readingBandProximity).toFixed(3)}`
  );
  let spotlightStyle = $derived(
    `--kp-tutorial-spotlight-x:${attentionProjection.spotlightX}px;` +
    `--kp-tutorial-spotlight-y:${attentionProjection.spotlightY}px;` +
    `--kp-tutorial-spotlight-radius:${visualCheckpoint.attention.spotlightRadius}px`
  );
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
    `--kp-stage-verification-travel:${percent(
      (verificationStageSurface.rect.inline - verificationStageSlot.rect.inline) /
        verificationStageSlot.rect.inlineSize
    )}`
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
    scheduleAttentionProjection();
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
    scheduleAttentionProjection();
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
    scheduleAttentionProjection();
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
    if (scrollActiveMotionBlock !== "supply-movement") {
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
    scheduleAttentionProjection();
  }

  function handleLoad(event: Event): void {
    if (
      !(event instanceof CustomEvent) ||
      (event.detail as { readonly status?: unknown })?.status !== "ready"
    ) return;
    ready = true;
    scrollCoordinator?.scheduleProjection();
    scheduleAttentionProjection();
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

  function scheduleAttentionProjection(): void {
    if (attentionFrame !== undefined) return;
    attentionFrame = requestAnimationFrame(() => {
      attentionFrame = undefined;
      updateAttentionProjection();
    });
  }

  function updateAttentionProjection(): void {
    if (shell === undefined) {
      attentionProjection = emptyAttentionProjection;
      return;
    }
    const playerHost = shell.querySelector<HTMLElement>(
      ".kp-economics-tutorial__player-host"
    );
    const passage = shell.querySelector<HTMLElement>(
      `[data-kp-economics-tutorial-passage="${checkpoint.passageId}"]`
    );
    const stage = shell.querySelector<HTMLElement>(
      ".kp-economics-tutorial__stage-card"
    );
    const target = playerHost === null
      ? null
      : playerHost.querySelector<Element>(
          visualCheckpoint.attention.targetSelector
        );
    if (
      playerHost === null ||
      passage === null ||
      stage === null ||
      target === null
    ) {
      attentionProjection = emptyAttentionProjection;
      return;
    }

    const playerHostRect = playerHost.getBoundingClientRect();
    const passageRect = passage.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const targetPoint = resolveAttentionTargetPoint(
      target,
      visualCheckpoint.attention.targetAnchor
    );
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const passageFocusRect = projectAttentionFocusRect(
      passageRect,
      10,
      viewportWidth,
      viewportHeight
    );
    const stageFocusRect = projectAttentionFocusRect(
      stageRect,
      12,
      viewportWidth,
      viewportHeight
    );
    const passageIsVisible = passageRect.bottom > 0 &&
      passageRect.top < viewportHeight;
    const stageIsVisible = stageRect.bottom > 0 && stageRect.top < viewportHeight;

    attentionProjection = {
      spotlightVisible: playerHostRect.width > 0 && playerHostRect.height > 0,
      spotlightX: clamp(
        targetPoint.x - playerHostRect.left,
        0,
        playerHostRect.width
      ),
      spotlightY: clamp(
        targetPoint.y - playerHostRect.top,
        0,
        playerHostRect.height
      ),
      pageVeilVisible: viewportWidth > 760 && passageIsVisible && stageIsVisible,
      viewportWidth,
      viewportHeight,
      passageX: passageFocusRect.x,
      passageY: passageFocusRect.y,
      passageWidth: passageFocusRect.width,
      passageHeight: passageFocusRect.height,
      stageX: stageFocusRect.x,
      stageY: stageFocusRect.y,
      stageWidth: stageFocusRect.width,
      stageHeight: stageFocusRect.height
    };
  }

  function collectScrollBlocks(): readonly KpEconomicsScrollBlockRegistration[] {
    if (shell === undefined) return [];
    return kpEconomicsMotionBlocks.flatMap((block) => {
      const boundary = shell?.querySelector<HTMLElement>(
        `[data-kp-tutorial-motion-block="${block.id}"]`
      );
      const anchor = boundary?.querySelector<KpTutorialScrubBarElement>(
        "kp-tutorial-scrub-bar"
      );
      return anchor === undefined || anchor === null
        ? []
        : [{ id: block.id, anchor, corridor: block.corridor }];
    });
  }

  function handleCoordinatedScroll(
    projection: KpEconomicsCoordinatedScrollProjection
  ): void {
    latestScrollProjection = projection;
    scrollActiveMotionBlock = projection.activeBlockId ?? "";
    const active = projection.blocks.find(({ ownsScroll }) => ownsScroll);
    const activeScrubBar = active?.id === "supply-movement"
      ? supplyScrubBar
      : demandScrubBar;
    if (active !== undefined && activeScrubBar !== undefined) {
      const distance = active.anchorTop - projection.readingBandY;
      activeScrubBar.setReadingBandProjection({
        distance,
        proximity: clamp(1 - Math.abs(distance) / 96, 0, 1)
      });
      const manualCanResume = motionOwner === "manual" &&
        projection.scrollChanged;
      const mayProjectScroll = motionOwner !== "manual" || manualCanResume;
      if (!reducedMotion && ready && player !== undefined && mayProjectScroll && (
        motionOwner === "scroll" ||
        manualCanResume ||
        active.progress > 0.001 ||
        active.id === "supply-movement"
      )) {
        let localProgress = active.progress;
        if (manualScrollRebase?.blockId === active.id) {
          const block = findKpEconomicsMotionBlock(active.id)!;
          const rebased = projectKpEconomicsRebasedCorridor({
            corridor: block.corridor,
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
    updateReadingBandSelection();
    updateAttentionProjection();
  }

  function updateReadingBandSelection(): void {
    if (shell === undefined) return;
    const passages = [...shell.querySelectorAll<HTMLElement>(
      "[data-kp-economics-tutorial-passage]"
    )];
    const tops = Object.fromEntries(passages.map((passage) => [
      passage.dataset["kpEconomicsTutorialPassage"] ?? "",
      passage.getBoundingClientRect().top
    ]));
    const readingBandY = window.innerHeight * 0.38;
    const activeScrubBar = scrollActiveMotionBlock === "supply-movement"
      ? supplyScrubBar
      : demandScrubBar;
    const motionDividerTop = activeScrubBar?.getBoundingClientRect().top;
    const motionDividerDistance = motionDividerTop === undefined
      ? Number.POSITIVE_INFINITY
      : Math.abs(motionDividerTop - readingBandY);
    const nearestPassageDistance = Math.min(
      motionDividerDistance,
      ...Object.values(tops).map((top) => Math.abs(top - readingBandY))
    );
    readingBandProximity = Number.isFinite(nearestPassageDistance)
      ? clamp(1 - nearestPassageDistance / 96, 0, 1)
      : 0;
    // At the document boundary the final passage cannot physically reach the
    // reading band, so bottom settlement explicitly selects it.
    const atBottom = window.scrollY + window.innerHeight >=
      document.documentElement.scrollHeight - 2;
    let selectedPassage: string;
    if (motionDividerDistance <= 48) {
      // The divider is its own reading anchor: the introducing paragraph
      // keeps prose focus until the interpretation itself reaches the band.
      selectedPassage = scrollActiveMotionBlock === "supply-movement"
        ? "shift-versus-movement"
        : "follow-shift";
    } else if (atBottom) {
      selectedPassage = passages.at(-1)
        ?.dataset["kpEconomicsTutorialPassage"] ?? checkpoint.passageId;
    } else {
      selectedPassage = selectKpEconomicsReadingBandPassage({
        currentPassageId: checkpoint.passageId,
        readingBandY,
        passageTops: tops
      });
    }
    if (selectedPassage !== checkpoint.passageId) {
      const nextIndex = kpEconomicsDemandShiftCheckpoints.findIndex(
        (candidate) => candidate.passageId === selectedPassage
      );
      if (nextIndex >= 0) activateCheckpoint(nextIndex, "scroll");
    }
  }

  function handleTutorialKeydown(event: KeyboardEvent): void {
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
    scrollCoordinator = new KpEconomicsTutorialScrollCoordinator(
      window,
      collectScrollBlocks,
      handleCoordinatedScroll
    );
    scrollCoordinator.connect();
    scrollCoordinatorStatus = "connected";
    window.addEventListener("keydown", handleTutorialKeydown);
    disposePlayerHost = mountKpAnimationCataloguePlayerHost({
      shell,
      entry,
      hostability,
      animation
    });
    attentionResizeObserver = new ResizeObserver(scheduleAttentionProjection);
    attentionResizeObserver.observe(shell);
    const playerHost = shell.querySelector<HTMLElement>(
      ".kp-economics-tutorial__player-host"
    );
    if (playerHost !== null) attentionResizeObserver.observe(playerHost);
    reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion = reducedMotionQuery.matches;
    if (reducedMotion && motionOwner === "untouched") {
      scrollTimelineStatus = "reduced-motion";
    }
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
    void document.fonts.ready.then(() => {
      scrollCoordinator?.scheduleProjection();
      scheduleAttentionProjection();
    });
    scrollCoordinator.scheduleProjection();
    scheduleAttentionProjection();
  });

  onDestroy(() => {
    scrollCoordinator?.disconnect();
    cancelSupplyPlayback();
    if (attentionFrame !== undefined) cancelAnimationFrame(attentionFrame);
    attentionResizeObserver?.disconnect();
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
    window.removeEventListener("keydown", handleTutorialKeydown);
    reducedMotionQuery?.removeEventListener("change", handleReducedMotionChange);
    disposePlayerHost?.();
  });

  function resolveAttentionTargetPoint(
    target: Element,
    anchor: number
  ): { readonly x: number; readonly y: number } {
    // A curve's bounding-box center often coincides with equilibrium. Project
    // the authored anchor so the spotlight identifies the curve itself.
    if (target instanceof SVGLineElement) {
      const matrix = target.getScreenCTM();
      const svg = target.ownerSVGElement;
      if (matrix !== null && svg !== null) {
        const point = svg.createSVGPoint();
        point.x = Number(target.getAttribute("x1")) * (1 - anchor) +
          Number(target.getAttribute("x2")) * anchor;
        point.y = Number(target.getAttribute("y1")) * (1 - anchor) +
          Number(target.getAttribute("y2")) * anchor;
        const projected = point.matrixTransform(matrix);
        return { x: projected.x, y: projected.y };
      }
    }
    const targetRect = target.getBoundingClientRect();
    return {
      x: targetRect.left + targetRect.width / 2,
      y: targetRect.top + targetRect.height / 2
    };
  }

  function clamp(value: number, minimum: number, maximum: number): number {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function percent(value: number): string {
    return `${(value * 100).toFixed(4)}%`;
  }

  function projectAttentionFocusRect(
    rect: DOMRect,
    inset: number,
    viewportWidth: number,
    viewportHeight: number
  ): {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  } {
    const x = clamp(rect.left - inset, 0, viewportWidth);
    const y = clamp(rect.top - inset, 0, viewportHeight);
    const right = clamp(rect.right + inset, 0, viewportWidth);
    const bottom = clamp(rect.bottom + inset, 0, viewportHeight);
    return {
      x,
      y,
      width: Math.max(0, right - x),
      height: Math.max(0, bottom - y)
    };
  }
</script>

<main
  bind:this={shell}
  class="kp-economics-tutorial"
  class:kp-economics-tutorial--stage-expanded={stageExpanded}
  data-kp-economics-demand-shift-tutorial
  data-kp-animation-catalogue
  data-kp-animation-catalogue-selection={entry.animationId}
  data-kp-economics-demand-intercept={demandIntercept}
  data-kp-economics-tutorial-checkpoint={checkpoint.id}
  data-kp-economics-tutorial-passage={checkpoint.passageId}
  data-kp-economics-tutorial-focus-profile={visualCheckpoint.attention.profile}
  data-kp-economics-tutorial-focus-target={visualCheckpoint.attention.target}
  data-kp-economics-tutorial-equations={equationsVisible ? "visible" : "quiet"}
  data-kp-economics-tutorial-motion-owner={motionOwner}
  data-kp-economics-tutorial-manual-block={manualMotionBlock ?? ""}
  data-kp-economics-tutorial-scroll-timeline={scrollTimelineStatus}
  data-kp-economics-tutorial-scroll-coordinator={scrollCoordinatorStatus}
  data-kp-economics-tutorial-scroll-active-block={scrollActiveMotionBlock}
  data-kp-economics-tutorial-demand-progress={lessonMotionProjection.demandShiftProgress.toFixed(3)}
  data-kp-economics-tutorial-supply-movement-progress={supplyMovementProgress.toFixed(3)}
  data-kp-economics-tutorial-scene-market={lessonMotionProjection.scene.market}
  data-kp-economics-tutorial-scene-presentation={lessonMotionProjection.scene.presentation}
  data-kp-economics-tutorial-supply-interpretation={supplyInterpretationPhase}
  data-kp-economics-stage-composition-phase={stageComposition.phase}
  data-kp-economics-stage-composition-progress={stageComposition.progress.toFixed(3)}
  style={`${supplyInterpretationStyle};${stageCompositionStyle}`}
>
  <h1 class="kp-economics-tutorial__visually-hidden">
    Economics demand-shift tutorial
  </h1>

  <span
    class="kp-economics-tutorial__reading-band-marker"
    data-kp-economics-tutorial-reading-band
    data-kp-reading-band-state={readingBandProximity >= 0.94 ? "crossing" : "tracking"}
    style={readingBandStyle}
    aria-hidden="true"
  ></span>

  <div class="kp-economics-tutorial__layout">
    <article class="kp-economics-tutorial__prose" aria-label="Economics lesson">
      <header class="kp-economics-tutorial__intro">
        <p class="kp-economics-tutorial__eyebrow">{lesson.kicker}</p>
        <p class="kp-economics-tutorial__question">{lesson.title}</p>
        <p class="kp-economics-tutorial__assumption">{lesson.assumption}</p>
      </header>

      {#each lesson.sections as section, sectionIndex}
        <section aria-labelledby={`kp-econ-heading-${sectionIndex}`}>
          <h3 id={`kp-econ-heading-${sectionIndex}`}>{section.heading}</h3>

          {#each section.passages as passage}
            {@const renderedMotionBlock = findKpEconomicsMotionBlock(
              passage.motionBlockId
            )}
            <div
              class="kp-economics-tutorial__passage"
              class:kp-economics-tutorial__passage--active={checkpoint.passageId === passage.id}
              class:kp-economics-tutorial__motion-block={renderedMotionBlock !== undefined}
              class:kp-economics-tutorial__prediction={passage.id === "prediction"}
              class:kp-economics-tutorial__equation-check={passage.id === "equation-check"}
              class:kp-economics-tutorial__synthesis={passage.id === "synthesis"}
              data-kp-economics-tutorial-passage={passage.id}
              data-kp-tutorial-motion-block={renderedMotionBlock?.id}
              role={renderedMotionBlock === undefined ? undefined : "group"}
              aria-label={renderedMotionBlock === undefined
                ? undefined
                : `${renderedMotionBlock.label} animation step`}
            >
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
                  <p>{@html paragraph.html}</p>
                {/each}
              {/if}
              {#if renderedMotionBlock?.id === "demand-shift"}
                <kp-tutorial-scrub-bar
                  bind:this={demandScrubBar}
                  data-kp-tutorial-motion-controls="demand-shift"
                  data-kp-economics-tutorial-motion-divider
                  progress={semanticProgress}
                  playback-status={playbackStatus}
                  direction={playbackDirection}
                  controls-disabled={ready ? "false" : "true"}
                  previous-disabled={checkpointIndex === 0 ? "true" : "false"}
                  next-disabled={checkpointIndex === kpEconomicsDemandShiftCheckpoints.length - 1 ? "true" : "false"}
                  manual-claimed={motionOwner === "manual" &&
                      manualMotionBlock === "demand-shift" ? "true" : "false"}
                ></kp-tutorial-scrub-bar>
              {:else if renderedMotionBlock?.id === "supply-movement"}
                <kp-tutorial-scrub-bar
                  bind:this={supplyScrubBar}
                  data-kp-tutorial-motion-controls="supply-movement"
                  data-kp-economics-tutorial-motion-divider
                  progress={supplyMovementProgress}
                  playback-status={supplyPlaybackStatus}
                  direction={supplyPlaybackDirection}
                  controls-disabled={ready ? "false" : "true"}
                  previous-disabled={supplyMovementProgress <= 0.001 ? "true" : "false"}
                  next-disabled={supplyMovementProgress >= 0.999 ? "true" : "false"}
                  manual-claimed={motionOwner === "manual" &&
                      manualMotionBlock === "supply-movement" ? "true" : "false"}
                ></kp-tutorial-scrub-bar>
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
          {/each}
        </section>
      {/each}

      <footer class="kp-economics-tutorial__footer">
        <a href={`/?artifact=${entry.animationId}`}>Open the animation catalogue</a>
      </footer>
    </article>

    <aside
      class="kp-economics-tutorial__stage"
      aria-label="Persistent supply and demand stage"
    >
      <div class="kp-economics-tutorial__stage-card">
        <header class="kp-economics-tutorial__stage-header">
          <div>
            <p>Current focus</p>
            <strong>{checkpoint.label}</strong>
          </div>
          <button
            type="button"
            class="kp-economics-tutorial__expand"
            aria-expanded={stageExpanded}
            aria-label={stageExpanded ? "Return stage to compact size" : "Expand stage"}
            onclick={() => stageExpanded = !stageExpanded}
          >{stageExpanded ? "Compact" : "Expand"}</button>
        </header>

        <div
          class="kp-economics-tutorial__player-host"
          data-kp-animation-catalogue-stage
          data-kp-animation-catalogue-stage-persistent="true"
          data-kp-economics-stage="economics-stage"
          data-kp-economics-stage-outer-geometry="fixed"
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
            ></div>
          </div>
          <div
            class="kp-economics-tutorial__spotlight"
            data-kp-economics-tutorial-spotlight
            data-kp-attention-spotlight-visible={attentionProjection.spotlightVisible}
            style={spotlightStyle}
            aria-hidden="true"
          ></div>
        </div>

      </div>
    </aside>
  </div>

  <svg
    class="kp-economics-tutorial__page-veil"
    class:kp-economics-tutorial__page-veil--visible={attentionProjection.pageVeilVisible}
    data-kp-economics-tutorial-page-veil
    data-kp-attention-page-veil-visible={attentionProjection.pageVeilVisible}
    width={attentionProjection.viewportWidth}
    height={attentionProjection.viewportHeight}
    aria-hidden="true"
  >
    <defs>
      <filter
        id="kp-economics-tutorial-page-veil-soften"
        x="-20%"
        y="-20%"
        width="140%"
        height="140%"
      >
        <feGaussianBlur stdDeviation="10"></feGaussianBlur>
      </filter>
      <mask
        id="kp-economics-tutorial-page-veil-mask"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width={attentionProjection.viewportWidth}
        height={attentionProjection.viewportHeight}
      >
        <rect
          width={attentionProjection.viewportWidth}
          height={attentionProjection.viewportHeight}
          fill="white"
        ></rect>
        <g filter="url(#kp-economics-tutorial-page-veil-soften)">
          <rect
            data-kp-attention-page-veil-passage
            x={attentionProjection.passageX}
            y={attentionProjection.passageY}
            width={attentionProjection.passageWidth}
            height={attentionProjection.passageHeight}
            rx="16"
            fill="black"
          ></rect>
          <rect
            data-kp-attention-page-veil-stage
            x={attentionProjection.stageX}
            y={attentionProjection.stageY}
            width={attentionProjection.stageWidth}
            height={attentionProjection.stageHeight}
            rx="18"
            fill="black"
          ></rect>
        </g>
      </mask>
    </defs>
    <rect
      class="kp-economics-tutorial__page-veil-wash"
      width={attentionProjection.viewportWidth}
      height={attentionProjection.viewportHeight}
      mask="url(#kp-economics-tutorial-page-veil-mask)"
    ></rect>
  </svg>

  <p class="kp-economics-tutorial__announcement" aria-live="polite">
    {announcement}
  </p>
  <div data-kp-animation-catalogue-review-dock aria-hidden="true"></div>
</main>
