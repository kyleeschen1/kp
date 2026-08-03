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
    kpEconomicsMotionBlocks
  } from "./economics-demand-shift-motion-blocks.ts";
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
  let scrubBar = $state<KpTutorialScrubBarElement | undefined>();
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
  const playerHtml = initial.playerHtml;
  let checkpoint = $derived(kpEconomicsDemandShiftCheckpoints[checkpointIndex]!);
  let equationsVisible = $derived(
    checkpoint.id === "equation-check" ||
    checkpoint.id === "scope" ||
    checkpoint.id === "synthesis" ||
    checkpoint.id === "explore"
  );
  let semanticProgress = $derived(
    playbackDirection === "rewind" ? 1 - progress : progress
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

  function activateCheckpoint(
    index: number,
    source: "manual" | "scroll" = "manual"
  ): void {
    if (source === "manual") claimManualMotion();
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

  function selectPreviousCheckpoint(): void {
    stepCheckpoint(-1);
  }

  function selectNextCheckpoint(): void {
    stepCheckpoint(1);
  }

  function togglePlayback(): void {
    claimManualMotion();
    if (player === undefined) return;
    const session = getKpEditorAnimationPlaybackSession(player);
    if (session === undefined) return;
    if (session.player.playbackStatus === "playing") {
      dispatchKpEditorAnimationPlaybackAction(player, {
        type: "pause",
        nowMs: performance.now()
      });
      return;
    }
    dispatchKpEditorAnimationPlaybackAction(
      player,
      session.player.direction === "rewind" &&
          session.player.playbackStatus !== "complete"
        ? { type: "rewind", nowMs: performance.now() }
        : { type: "forward", nowMs: performance.now() }
    );
  }

  function rewindPlayback(): void {
    claimManualMotion();
    if (player === undefined) return;
    dispatchKpEditorAnimationPlaybackAction(player, {
      type: "rewind",
      nowMs: performance.now()
    });
  }

  function scrub(nextProgress: number): void {
    claimManualMotion();
    seek(nextProgress);
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

  function changeDemandIntercept(event: Event): void {
    if (!(event.currentTarget instanceof HTMLInputElement) || player === undefined) {
      return;
    }
    claimManualMotion();
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
    claimManualMotion();
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

  function claimManualMotion(): void {
    // A control action must win even when it lands between a scroll event and
    // the coordinator's deferred reading-band projection.
    scrollCoordinator?.cancelPendingProjection();
    motionOwner = "manual";
    scrollTimelineStatus = "manual";
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
    if (typeof detail?.progress === "number") scrub(detail.progress);
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
    scrollActiveMotionBlock = projection.activeBlockId ?? "";
    const active = projection.blocks.find(({ ownsScroll }) => ownsScroll);
    if (active?.id === "demand-shift" && scrubBar !== undefined) {
      const distance = active.anchorTop - projection.readingBandY;
      scrubBar.setReadingBandProjection({
        distance,
        proximity: clamp(1 - Math.abs(distance) / 96, 0, 1)
      });
      if (
        !reducedMotion &&
        ready &&
        player !== undefined &&
        motionOwner !== "manual" &&
        (motionOwner === "scroll" || active.progress > 0.001)
      ) {
        motionOwner = "scroll";
        scrollTimelineStatus = active.progress >= 0.999
          ? "complete"
          : active.progress <= 0.001
            ? "rewound"
            : "seeking";
        seek(active.progress);
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
    const motionDividerTop = scrubBar?.getBoundingClientRect().top;
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
      selectedPassage = "follow-shift";
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
    ) claimManualMotion();
    if (
      !event.altKey ||
      (event.key !== "ArrowLeft" && event.key !== "ArrowRight")
    ) return;
    event.preventDefault();
    stepCheckpoint(event.key === "ArrowLeft" ? -1 : 1);
  }

  onMount(() => {
    if (shell === undefined) return;
    player = shell.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player]"
    ) ?? undefined;
    if (player === undefined) return;
    player.addEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, handleFrame);
    player.addEventListener(KP_EDITOR_ANIMATION_LOAD_EVENT, handleLoad);
    scrubBar?.addEventListener(KP_TUTORIAL_SCRUB_TOGGLE_EVENT, togglePlayback);
    scrubBar?.addEventListener(KP_TUTORIAL_SCRUB_REWIND_EVENT, rewindPlayback);
    scrubBar?.addEventListener(
      KP_TUTORIAL_SCRUB_PREVIOUS_EVENT,
      selectPreviousCheckpoint
    );
    scrubBar?.addEventListener(
      KP_TUTORIAL_SCRUB_NEXT_EVENT,
      selectNextCheckpoint
    );
    scrubBar?.addEventListener(KP_TUTORIAL_SCRUB_SEEK_EVENT, handleScrubBarSeek);
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
    if (attentionFrame !== undefined) cancelAnimationFrame(attentionFrame);
    attentionResizeObserver?.disconnect();
    player?.removeEventListener(KP_EDITOR_ANIMATION_FRAME_EVENT, handleFrame);
    player?.removeEventListener(KP_EDITOR_ANIMATION_LOAD_EVENT, handleLoad);
    scrubBar?.removeEventListener(KP_TUTORIAL_SCRUB_TOGGLE_EVENT, togglePlayback);
    scrubBar?.removeEventListener(KP_TUTORIAL_SCRUB_REWIND_EVENT, rewindPlayback);
    scrubBar?.removeEventListener(
      KP_TUTORIAL_SCRUB_PREVIOUS_EVENT,
      selectPreviousCheckpoint
    );
    scrubBar?.removeEventListener(
      KP_TUTORIAL_SCRUB_NEXT_EVENT,
      selectNextCheckpoint
    );
    scrubBar?.removeEventListener(KP_TUTORIAL_SCRUB_SEEK_EVENT, handleScrubBarSeek);
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
  data-kp-economics-tutorial-scroll-timeline={scrollTimelineStatus}
  data-kp-economics-tutorial-scroll-coordinator={scrollCoordinatorStatus}
  data-kp-economics-tutorial-scroll-active-block={scrollActiveMotionBlock}
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
            {@const renderedMotionBlock = passage.motionBlockId === "demand-shift"
              ? findKpEconomicsMotionBlock(passage.motionBlockId)
              : undefined}
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
                  bind:this={scrubBar}
                  data-kp-economics-tutorial-motion-divider
                  progress={semanticProgress}
                  playback-status={playbackStatus}
                  direction={playbackDirection}
                  controls-disabled={ready ? "false" : "true"}
                  previous-disabled={checkpointIndex === 0 ? "true" : "false"}
                  next-disabled={checkpointIndex === kpEconomicsDemandShiftCheckpoints.length - 1 ? "true" : "false"}
                  manual-claimed={motionOwner === "manual" ? "true" : "false"}
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
          aria-busy={!ready}
        >
          {@html playerHtml}
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
