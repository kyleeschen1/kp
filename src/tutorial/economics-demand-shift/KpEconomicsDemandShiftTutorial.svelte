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
  import { renderKpTutorialProgressRail } from
    "../kp-tutorial-progress-rail-renderer.ts";
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
  import { projectKpEconomicsSalience } from
    "./economics-demand-shift-salience-adapter.ts";
  import {
    projectKpEconomicsSalienceCssProperties,
    serializeKpEconomicsSalienceCssProperties
  } from "./economics-demand-shift-salience-style.ts";
  import {
    kpEconomicsMotionStationPhaseBoundaries,
    kpEconomicsOrdinaryStationPhaseBoundaries,
    projectKpEconomicsStationPhase
  } from "./economics-animation-station-phase.ts";
  import type {
    KpEconomicsDemandShiftLesson,
    KpEconomicsDemandShiftLessonPassage
  } from "./economics-demand-shift-lesson-compiler.ts";
  import {
    resolveKpEconomicsDemandShiftInitialDestination,
    type KpEconomicsDemandShiftInitialDestination
  } from "./economics-demand-shift-deep-link.ts";
  import {
    projectKpAnimationStationEntrance,
    projectKpAnimationStationGeometry,
    projectKpAnimationStationMotionCorridor,
    projectKpInlineStickyLessonLayout,
    projectKpInlineStickyParagraph,
    projectKpInlineStickyParagraphMotionCorridor,
    projectKpTwoColumnScrollMotionCorridor,
    projectKpTwoColumnScrollSequence,
    kpEconomicsTwoColumnParagraphGapDefaultVh,
    writeKpEconomicsTwoColumnTextSide,
    type KpEconomicsDemandShiftPresentationLayout,
    type KpEconomicsMotionBridgeDwellProfile,
    type KpEconomicsScrollScrubStrategy,
    type KpEconomicsTwoColumnTextSide,
    type KpAnimationStationGeometryProjection,
    type KpInlineStickyParagraphProjection,
    type KpInlineStickyLessonFit
  } from "./economics-demand-shift-layout.ts";
  import {
    findKpEconomicsMotionBlock,
    kpEconomicsMotionBlocks,
    localKpEconomicsMotionProgress,
    projectKpEconomicsLessonMotion,
    projectKpEconomicsLessonPlayhead,
    projectKpEconomicsPlayerProgress,
    type KpEconomicsMotionBlock,
    type KpEconomicsMotionBlockId,
    type KpEconomicsLessonMotionProjection
  } from "./economics-demand-shift-motion-blocks.ts";
  import {
    commitKpEconomicsMotionPresentation,
    type KpEconomicsMotionPresentationOwner
  } from "./economics-demand-shift-motion-presentation.ts";
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
    resolveKpTutorialCorridorTravelForProgress,
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
    projectKpTutorialProseMotionGeometry
  } from "../kp-tutorial-motion-bridge-geometry.ts";
  import type {
    KpTutorialMotionBridgeAuthoring
  } from "../kp-tutorial-motion-bridge-authoring.ts";
  import {
    resolveKpTutorialMotionBridgeBeforeEllipsis
  } from "../kp-tutorial-motion-bridge-static.ts";
  import type {
    KpTutorialSemanticTransitAuthoringBundle
  } from "../kp-tutorial-semantic-transit-authoring.ts";
  import {
    KpTutorialSemanticTransitProxyLayer
  } from "../kp-tutorial-semantic-transit-layer.ts";
  import {
    KpTutorialSemanticTransitGeometryCache,
    projectKpTutorialSemanticTransitGeometry,
    projectKpTutorialSemanticTransitPresentation,
    projectKpTutorialSemanticTransitTransform
  } from "../kp-tutorial-semantic-transit-geometry.ts";
  import {
    projectKpTutorialScrollPassagePhase,
    type KpTutorialScrollPassagePhase,
    type KpTutorialScrollPassageTimeline
  } from "../kp-tutorial-motion-passage-lifecycle.ts";
  import {
    KP_TUTORIAL_SCRUB_NEXT_EVENT,
    KP_TUTORIAL_SCRUB_PREVIOUS_EVENT,
    KP_TUTORIAL_SCRUB_REWIND_EVENT,
    KP_TUTORIAL_SCRUB_SEEK_EVENT,
    KP_TUTORIAL_SCRUB_TOGGLE_EVENT,
    type KpTutorialScrubBarElement,
    type KpTutorialScrubSeekDetail
  } from "../kp-tutorial-scrub-bar.ts";
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
  import type KpEconomicsPassageEditor from "./KpEconomicsPassageEditor.svelte";
  import KpInlineMath from "./KpInlineMath.svelte";
  import type {
    KpEconomicsLessonDraftState
  } from "./economics-demand-shift-lesson-draft.ts";
  import {
    resolveKpEconomicsDemandShiftTocDestination
  } from "./economics-demand-shift-toc.ts";
  import {
    kpEconomicsDemandShiftThemeIds,
    writeKpEconomicsDemandShiftTheme,
    type KpEconomicsDemandShiftTheme
  } from "./economics-demand-shift-theme.ts";
  import {
    projectKpEconomicsMotionBridgeCorridor
  } from "./economics-demand-shift-motion-bridge.ts";
  type KpEconomicsTutorialMotionOwner = "untouched" | "scroll" | "manual";
  const kpEconomicsScrollStartEpsilon = 0.002;
  const kpEconomicsScrollLatchEpsilonPx = 1;
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
    readonly ownsAttention: boolean;
  }

  interface KpEconomicsTwoColumnParagraphPresentation {
    readonly salience: number;
  }

  interface KpEconomicsTwoColumnScrollGeometry {
    readonly approachStartRatio: number;
    readonly focusBottomRatio: number;
    readonly focusTopRatio: number;
    readonly horizontalBoundaryOffsetFromStageTopPx: number;
    readonly minimumEffectiveHeightRatio: number;
    readonly motionStartRatio: number;
    readonly motionBridgeDistancePx: number;
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
    initialTheme,
    initialTwoColumnTextSide,
    initialDestination,
    presentationLayout,
    scrubStrategy,
    motionBridgeDwellProfile,
    lesson,
    motionBridgeHtml,
    semanticTransit,
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
    readonly initialTheme: KpEconomicsDemandShiftTheme;
    readonly initialTwoColumnTextSide: KpEconomicsTwoColumnTextSide;
    readonly initialDestination: KpEconomicsDemandShiftInitialDestination;
    readonly presentationLayout: KpEconomicsDemandShiftPresentationLayout;
    readonly scrubStrategy: KpEconomicsScrollScrubStrategy;
    readonly motionBridgeDwellProfile: KpEconomicsMotionBridgeDwellProfile;
    readonly lesson: KpEconomicsDemandShiftLesson;
    readonly motionBridgeHtml?: Readonly<Record<string, string>> | undefined;
    readonly semanticTransit?: KpTutorialSemanticTransitAuthoringBundle | undefined;
    readonly motionScrubBarHtml: Readonly<Record<KpEconomicsMotionBlockId, string>>;
    readonly tocHtml: string;
    readonly twoColumnParagraphs:
      readonly KpEconomicsDemandShiftLessonPassage[];
    readonly verificationSurfaceHtml: string;
  } = $props();

  const animationStationProgressRailHtml = Object.freeze(Object.fromEntries(
    kpEconomicsMotionBlocks.map((block) => [
      block.id,
      renderKpTutorialProgressRail({
        blockId: block.id,
        label: `${block.label} animation progress`,
        initialLabel: block.checkpoints[0]?.label ?? "Ready"
      })
    ])
  ) as Record<KpEconomicsMotionBlockId, string>);

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
  let motionStyleOwner = $state<HTMLElement | undefined>();
  let verificationAperture = $state<HTMLElement | undefined>();
  let verificationSurface = $state<HTMLElement | undefined>();
  let player = $state<HTMLElement | undefined>();
  let demandScrubBar = $state<KpTutorialScrubBarElement | undefined>();
  let supplyScrubBar = $state<KpTutorialScrubBarElement | undefined>();
  let demandProgressRail: HTMLElement | undefined;
  let supplyProgressRail: HTMLElement | undefined;
  let tutorialToc = $state<KpTutorialTocElement | undefined>();
  let checkpointIndex = $state(initialDeepLink.checkpointIndex);
  // Playback changes every frame. This retained record is deliberately not a
  // Svelte rune: the player event commits its owned nodes directly.
  const playbackRuntime = {
    progress: initial.progress,
    status: initial.playbackStatus,
    direction: initial.playbackDirection
  };
  let demandIntercept = $state(initial.demandIntercept);
  let theme = $state(untrack(() => initialTheme));
  const twoColumnParagraphGapVh = kpEconomicsTwoColumnParagraphGapDefaultVh;
  let twoColumnTextSide = $state(untrack(() => initialTwoColumnTextSide));
  let lessonDraft = $state<KpEconomicsLessonDraftState | undefined>();
  let lessonDraftRuntime:
    typeof import("./economics-demand-shift-lesson-draft.ts") | undefined;
  let editableTwoColumnParagraphs = $state(untrack(() => twoColumnParagraphs));
  let lessonEditorOpen = $state(false);
  let lessonEditorModalOpen = $state(false);
  let LessonPassageEditor = $state<
    typeof KpEconomicsPassageEditor | undefined
  >();
  let lessonEditorGeometryRefreshPending = false;
  let lessonEditorCompileRevision = 0;
  let lessonEditorValidation = $state("");
  let selectedLessonDraftPassage = $derived(
    lessonDraft?.passages.find(({ id }) => id === lessonDraft?.selectedPassageId)
  );
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
  let twoColumnPassagePhase = $state<KpTutorialScrollPassagePhase>(
    "ordinary-document"
  );
  let cachedTwoColumnScrollGeometry:
    KpEconomicsTwoColumnScrollGeometry | undefined;
  let cachedAnimationStationGeometry:
    KpAnimationStationGeometryProjection | undefined;
  let cachedTwoColumnPassageTimeline:
    KpTutorialScrollPassageTimeline | undefined;
  let reducedMotionQuery: MediaQueryList | undefined;
  let twoColumnGeometryQuery: MediaQueryList | undefined;
  let previousHistoryScrollRestoration: ScrollRestoration | undefined;
  let disposePlayerHost: (() => void) | undefined;
  let scrollCoordinator:
    KpTutorialScrollCoordinator<KpEconomicsMotionBlockId> | undefined;
  let cueGeometryCache: KpTutorialDocumentCueGeometryCache<string> | undefined;
  let cueActivationObserver: KpTutorialCueActivationObserver<string> | undefined;
  let cueMutationObserver: MutationObserver | undefined;
  let semanticTransitProxyLayer:
    KpTutorialSemanticTransitProxyLayer | undefined;
  let semanticTransitGeometryCache:
    KpTutorialSemanticTransitGeometryCache | undefined;
  let semanticTransitProxyId: string | undefined;
  let semanticTransitSourcePassageId: string | undefined;
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
  let inlineLayoutObserver: ResizeObserver | undefined;
  const inlineSticky = untrack(() => presentationLayout === "inline-sticky");
  const animationStation = untrack(
    () => presentationLayout === "animation-station"
  );
  const twoColumnScroll = untrack(
    () => presentationLayout === "two-column-scroll"
  );
  const scrollPassageLayout = inlineSticky || animationStation ||
    twoColumnScroll;
  const motionBridge = untrack(() => scrubStrategy === "motion-bridge" &&
      motionBridgeHtml?.["demand-increase"] !== undefined
    ? lesson.proseMotion?.find((record): record is KpTutorialMotionBridgeAuthoring =>
        record.kind === "motion-bridge" && record.id === "demand-increase"
      )
    : undefined);
  const motionBridgeBeforePassage = untrack(() => motionBridge === undefined
    ? undefined
    : twoColumnParagraphs.find(({ id }) => id === motionBridge.beforePassageId));
  const motionBridgeAfterPassage = untrack(() => motionBridge === undefined
    ? undefined
    : twoColumnParagraphs.find(({ id }) => id === motionBridge.afterPassageId));
  const motionBridgeEnabled = motionBridge !== undefined &&
    motionBridgeBeforePassage !== undefined &&
    motionBridgeAfterPassage !== undefined;
  const motionBridgeBeforeEllipsis = untrack(() =>
    resolveKpTutorialMotionBridgeBeforeEllipsis(
      motionBridgeBeforePassage?.paragraphs[0]?.html ?? ""
    )
  );
  let motionBridgeDistancePx = $state(0);
  const lessonMotionProjection: KpEconomicsLessonMotionProjection =
    initialDeepLink.motion;
  const playerHtml = initial.playerHtml;
  let checkpoint = $derived(kpEconomicsDemandShiftCheckpoints[checkpointIndex]!);
  const semanticSalienceStyle = untrack(() =>
    serializeKpEconomicsSalienceCssProperties(
    projectKpEconomicsSalienceCssProperties({
      theme,
      projection: projectKpEconomicsSalience({
        ...lessonMotionProjection.scene,
        focusTarget: animationStation ? "market" : checkpoint.attention.target
      })
    })
  ));
  const semanticProgress = lessonMotionProjection.demandShiftProgress;
  const supplyMovementProgress = lessonMotionProjection.supplyMovementProgress;
  const reviewProgress =
    lessonMotionProjection.activeBlockId === "supply-movement"
      ? lessonMotionProjection.supplyMovementProgress
      : lessonMotionProjection.demandShiftProgress;
  let tocActiveDestination = $derived(
    resolveKpEconomicsDemandShiftTocDestination({
      lesson,
      passageId: checkpoint.passageId
    })
  );
  $effect(() => {
    tutorialToc?.setActiveDestination(tocActiveDestination);
  });
  const supplyInterpretationStyle =
    `--kp-tutorial-supply-emphasis:${clamp(supplyMovementProgress / 0.18, 0, 1).toFixed(3)};` +
    `--kp-tutorial-supply-trace:${clamp((supplyMovementProgress - 0.12) / 0.46, 0, 1).toFixed(3)};` +
    `--kp-tutorial-supply-comparison:${clamp((supplyMovementProgress - 0.58) / 0.42, 0, 1).toFixed(3)}`;
  const stageComposition = lessonMotionProjection.composition;
  const graphStageSlot = stageComposition.slots.find(
    ({ id }) => id === "graph-slot"
  )!;
  const verificationStageSlot = stageComposition.slots.find(
    ({ id }) => id === "verification-slot"
  )!;
  const verificationStageSurface =
    stageComposition.surfaces.find(
      ({ id }) => id === "equilibrium-verification"
    )!;
  const stageCompositionStyle =
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
    )}`;
  const verificationReveal = lessonMotionProjection.verification;
  const verificationRevealStyle =
    `--kp-verification-supply-rule:${verificationReveal.groups["supply-rule"].toFixed(3)};` +
    `--kp-verification-supply-rule-clip:${percent(1 - verificationReveal.groups["supply-rule"])};` +
    `--kp-verification-equilibria:${verificationReveal.groups.equilibria.toFixed(3)};` +
    `--kp-verification-equilibria-clip:${percent(1 - verificationReveal.groups.equilibria)};` +
    `--kp-verification-changes:${verificationReveal.groups.changes.toFixed(3)};` +
    `--kp-verification-changes-clip:${percent(1 - verificationReveal.groups.changes)}`;
  const supplyInterpretationPhase =
    supplyMovementProgress <= 0.001
      ? "ready"
      : supplyMovementProgress < 0.58
        ? "tracing"
        : supplyMovementProgress < 0.999
          ? "comparing"
          : "verified";
  const motionRuntime = {
    projection: lessonMotionProjection,
    semanticProgress,
    supplyMovementProgress,
    reviewProgress,
    stageComposition,
    verificationReveal,
    supplyInterpretationPhase
  };

  function motionPresentationOwner():
    KpEconomicsMotionPresentationOwner | undefined {
    if (
      shell === undefined ||
      player === undefined ||
      motionStyleOwner === undefined ||
      verificationAperture === undefined ||
      verificationSurface === undefined
    ) return undefined;
    return {
      root: shell,
      player,
      styleOwner: motionStyleOwner,
      stableGraphSlot: twoColumnScroll,
      aperture: verificationAperture,
      verificationSurface,
      motionBridge: shell.querySelector<HTMLElement>("kp-motion-bridge") ??
        undefined
    };
  }

  function commitLessonMotionProjection(
    next: KpEconomicsLessonMotionProjection,
    direction: "forward" | "rewind" = playbackRuntime.direction
  ): void {
    motionRuntime.projection = next;
    motionRuntime.semanticProgress = next.demandShiftProgress;
    motionRuntime.supplyMovementProgress = next.supplyMovementProgress;
    motionRuntime.reviewProgress = localKpEconomicsMotionProgress(next);
    motionRuntime.stageComposition = next.composition;
    motionRuntime.verificationReveal = next.verification;
    motionRuntime.supplyInterpretationPhase =
      motionRuntime.supplyMovementProgress <= 0.001
      ? "ready"
      : motionRuntime.supplyMovementProgress < 0.58
        ? "tracing"
        : motionRuntime.supplyMovementProgress < 0.999
          ? "comparing"
          : "verified";
    const owner = motionPresentationOwner();
    if (owner !== undefined) {
      commitKpEconomicsMotionPresentation({
        owner,
        projection: next,
        theme,
        focusTarget: animationStation
          ? "market"
          : kpEconomicsDemandShiftCheckpoints[checkpointIndex]!.attention.target,
        playbackDirection: direction
      });
    }
    syncMotionScrubBars();
  }

  function syncMotionScrubBars(): void {
    const activeBlock = motionRuntime.projection.activeBlockId;
    writeScrubBarAttributes(demandScrubBar, {
      progress: motionRuntime.semanticProgress,
      "playback-status": activeBlock === "demand-shift"
        ? playbackRuntime.status
        : "paused",
      direction: playbackRuntime.direction,
      "controls-disabled": !ready,
      "previous-disabled": checkpointIndex === 0,
      "next-disabled": checkpointIndex ===
        kpEconomicsDemandShiftCheckpoints.length - 1,
      "manual-claimed": motionOwner === "manual" &&
        manualMotionBlock === "demand-shift"
    });
    writeScrubBarAttributes(supplyScrubBar, {
      progress: motionRuntime.supplyMovementProgress,
      "playback-status": activeBlock === "supply-movement"
        ? playbackRuntime.status
        : "paused",
      direction: playbackRuntime.direction,
      "controls-disabled": !ready,
      "previous-disabled": motionRuntime.supplyMovementProgress <= 0.001,
      "next-disabled": motionRuntime.supplyMovementProgress >= 0.999,
      "manual-claimed": motionOwner === "manual" &&
        manualMotionBlock === "supply-movement"
    });
    writeProgressRailAttributes(
      demandProgressRail,
      findKpEconomicsMotionBlock("demand-shift")!,
      motionRuntime.semanticProgress
    );
    writeProgressRailAttributes(
      supplyProgressRail,
      findKpEconomicsMotionBlock("supply-movement")!,
      motionRuntime.supplyMovementProgress
    );
  }

  function writeProgressRailAttributes(
    rail: HTMLElement | undefined,
    block: KpEconomicsMotionBlock,
    progress: number
  ): void {
    if (rail === undefined) return;
    const label = [...block.checkpoints].reverse().find(
      (candidate) => candidate.progress <= progress + 0.001
    )?.label ?? block.checkpoints[0]!.label;
    const serializedProgress = progress.toFixed(4);
    if (rail.getAttribute("progress") !== serializedProgress) {
      rail.setAttribute("progress", serializedProgress);
    }
    if (rail.getAttribute("progress-label") !== label) {
      rail.setAttribute("progress-label", label);
    }
  }

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
    else commitLessonMotionProjection(motionRuntime.projection);
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
    claimManualMotion(blockId);
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
    commitLessonMotionProjection(projectKpEconomicsLessonMotion({
      activeBlockId: blockId,
      localProgress: blockId === "supply-movement"
        ? motionRuntime.supplyMovementProgress
        : motionRuntime.semanticProgress
    }));
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
    if (player === undefined) return;
    commitLessonMotionProjection(projectKpEconomicsLessonMotion({
      activeBlockId: blockId,
      localProgress: blockId === "supply-movement"
        ? motionRuntime.supplyMovementProgress
        : motionRuntime.semanticProgress
    }));
    dispatchKpEditorAnimationPlaybackAction(player, {
      type: "rewind",
      nowMs: performance.now()
    });
  }

  function seek(nextProgress: number): void {
    if (!ready || player === undefined) return;
    const session = getKpEditorAnimationPlaybackSession(player);
    const direction = session?.player.direction ?? "forward";
    dispatchKpEditorAnimationPlaybackAction(player, {
      type: "seek",
      progress: projectKpEconomicsPlayerProgress({
        direction,
        localProgress: nextProgress
      })
    });
  }

  function applyManualMotionProgress(
    blockId: KpEconomicsMotionBlockId,
    nextProgress: number
  ): void {
    const localProgress = clamp(nextProgress, 0, 1);
    const next = projectKpEconomicsLessonMotion({
      activeBlockId: blockId,
      localProgress
    });
    commitLessonMotionProjection(next);
    seek(localProgress);
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
      Math.abs(candidate.progress - motionRuntime.supplyMovementProgress) <
          Math.abs(
            checkpoints[nearest]!.progress -
              motionRuntime.supplyMovementProgress
          )
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
    // Asset replacement resamples the current shared playhead; it must not
    // invent a seek that advances whichever lesson block owns attention.
    announcement = "Returned to the lesson example: demand intercept 14 to 18.";
  }

  function toggleLessonEditor(): void {
    lessonEditorOpen = !lessonEditorOpen;
    if (!lessonEditorOpen) lessonEditorModalOpen = false;
    if (lessonEditorOpen) void loadLessonEditor();
    scheduleLessonEditorGeometryRefresh();
  }

  async function loadLessonEditor(): Promise<void> {
    if (LessonPassageEditor === undefined || lessonDraftRuntime === undefined) {
      const [componentModule, draftModule] = await Promise.all([
        import("./KpEconomicsPassageEditor.svelte"),
        import("./economics-demand-shift-lesson-draft.ts")
      ]);
      LessonPassageEditor = componentModule.default;
      lessonDraftRuntime = draftModule;
    }
    if (lessonDraft === undefined) {
      const serialized = window.localStorage.getItem(
        lessonDraftRuntime.kpEconomicsLessonDraftStorageKey
      );
      const retained = lessonDraftRuntime.readKpEconomicsLessonDraft({
        serialized,
        publicationPassages: twoColumnParagraphs
      });
      lessonDraft = retained ?? lessonDraftRuntime.createKpEconomicsLessonDraft(
        twoColumnParagraphs
      );
      if (retained !== undefined) {
        void compileAndPresentLessonDraft(retained);
      } else if (serialized !== null) {
        lessonEditorValidation =
          lessonDraftRuntime.kpEconomicsLessonDraftMessages.invalidStored;
      }
    }
    if (attentionPassageId !== undefined && lessonDraft !== undefined &&
        lessonDraft.passages.some(({ id }) => id === attentionPassageId)) {
      lessonDraft = lessonDraftRuntime.selectKpEconomicsLessonDraftPassage(
        lessonDraft,
        attentionPassageId
      );
    }
    scheduleLessonEditorGeometryRefresh();
  }

  function selectLessonDraftPassage(passageId: string): void {
    if (!lessonEditorOpen || lessonDraftRuntime === undefined ||
        lessonDraft === undefined) return;
    lessonDraft = lessonDraftRuntime.selectKpEconomicsLessonDraftPassage(
      lessonDraft,
      passageId
    );
    lessonEditorModalOpen = true;
    persistLessonDraft(lessonDraft);
  }

  function closeLessonEditorModal(): void {
    lessonEditorModalOpen = false;
    scrollCoordinator?.scheduleProjection();
  }

  function updateLessonDraftSource(sourceText: string): void {
    if (lessonDraftRuntime === undefined || lessonDraft === undefined) return;
    const next = lessonDraftRuntime.updateKpEconomicsLessonDraftSource({
      draft: lessonDraft,
      passageId: lessonDraft.selectedPassageId,
      sourceText
    });
    lessonDraft = next;
    persistLessonDraft(next);
    compileAndPresentLessonDraft(next);
  }

  function persistLessonDraft(draft: KpEconomicsLessonDraftState): void {
    if (lessonDraftRuntime === undefined) return;
    try {
      window.localStorage.setItem(
        lessonDraftRuntime.kpEconomicsLessonDraftStorageKey,
        lessonDraftRuntime.serializeKpEconomicsLessonDraft(draft)
      );
    } catch {
      lessonEditorValidation =
        lessonDraftRuntime.kpEconomicsLessonDraftMessages.persistenceFailed;
    }
  }

  async function compileAndPresentLessonDraft(
    draft: KpEconomicsLessonDraftState
  ): Promise<void> {
    const revision = ++lessonEditorCompileRevision;
    try {
      const { compileKpEconomicsLessonDraftPassages } = await import(
        "./economics-demand-shift-lesson-draft-compiler.ts"
      );
      const compiled = compileKpEconomicsLessonDraftPassages(draft);
      if (revision !== lessonEditorCompileRevision) return;
      editableTwoColumnParagraphs = compiled;
      lessonEditorValidation =
        lessonDraftRuntime!.kpEconomicsLessonDraftMessages.compiled;
      scheduleLessonEditorGeometryRefresh();
    } catch (error) {
      if (revision !== lessonEditorCompileRevision) return;
      lessonEditorValidation = error instanceof Error
        ? error.message
        : lessonDraftRuntime!.kpEconomicsLessonDraftMessages.compileFailed;
    }
  }

  function scheduleLessonEditorGeometryRefresh(): void {
    if (lessonEditorGeometryRefreshPending) return;
    lessonEditorGeometryRefreshPending = true;
    void tick().then(() => {
      lessonEditorGeometryRefreshPending = false;
      updateInlineStickyLayoutProjection();
    });
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
    commitLessonMotionProjection(motionRuntime.projection);
    void invalidateGeometryAfterPresentationChange();
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
    if (typeof detail.progress === "number") {
      playbackRuntime.progress = detail.progress;
    }
    if (detail.direction === "forward" || detail.direction === "rewind") {
      playbackRuntime.direction = detail.direction;
    }
    if (typeof detail.playbackStatus === "string") {
      playbackRuntime.status =
        detail.playbackStatus as KpEditorAnimationPlayerState["playbackStatus"];
    }
    ensureSemanticTransitProxyLayer();
    const playhead = projectKpEconomicsLessonPlayhead({
      activeBlockId: motionRuntime.projection.activeBlockId,
      direction: playbackRuntime.direction,
      playerProgress: playbackRuntime.progress
    });
    commitLessonMotionProjection(playhead.motion, playbackRuntime.direction);
    if (
      motionOwner === "manual" &&
      manualMotionBlock === playhead.activeBlockId
    ) {
      manualScrollRebase = manualScrollRebase === undefined
        ? undefined
        : {
            ...manualScrollRebase,
            manualProgress: playhead.localProgress
          };
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
    commitLessonMotionProjection(motionRuntime.projection);
    ensureSemanticTransitProxyLayer();
    // Player hydration installs screen-space labels after the coordinator's
    // first document measurement. Refresh once at that lifecycle boundary.
    scrollCoordinator?.invalidateGeometry();
    scrollCoordinator?.scheduleProjection();
  }

  function ensureSemanticTransitProxyLayer(): void {
    if (
      animationStation ||
      semanticTransitProxyLayer !== undefined ||
      semanticTransit === undefined ||
      shell === undefined
    ) return;
    const transit = semanticTransit.transits[0];
    if (transit === undefined) return;
    const reference = semanticTransit.textReferences.find(
      ({ id }) => id === transit.sourceReferenceId
    );
    const object = semanticTransit.stageObjects.find(
      ({ id }) => id === transit.destinationObjectId
    );
    if (reference === undefined || object === undefined) return;
    const source = shell.querySelector<HTMLElement>(
      `[data-kp-tutorial-text-reference="${reference.id}"]`
    );
    const destination = shell.querySelector<HTMLElement>(
      `[data-kp-tutorial-stage-object="${object.id}"]`
    );
    const stage = destination?.closest<HTMLElement>(
      `[data-kp-tutorial-stage="${object.stageId}"]`
    );
    if (
      source === null ||
      destination === null ||
      stage === null ||
      stage === undefined
    ) return;
    semanticTransitProxyLayer = new KpTutorialSemanticTransitProxyLayer(shell);
    semanticTransitProxyLayer.mountProxy({
      transitId: transit.id,
      source
    });
    semanticTransitProxyId = transit.id;
    semanticTransitSourcePassageId = reference.passageId;
    semanticTransitGeometryCache =
      new KpTutorialSemanticTransitGeometryCache(
        window,
        () => ({ source, destination, stage }),
        {
          onInvalidated: () => {
            hideSemanticTransitProxy("geometry-pending");
            scrollCoordinator?.scheduleProjection();
          }
        }
      );
    semanticTransitGeometryCache.connect();
    shell.dataset["kpEconomicsSemanticTransitLayer"] = "ready";
  }

  function updateSemanticTransitProxy(
    frames: readonly KpEconomicsInlineParagraphFrame[]
  ): void {
    if (
      semanticTransitProxyLayer === undefined ||
      semanticTransitGeometryCache === undefined ||
      semanticTransitProxyId === undefined ||
      semanticTransitSourcePassageId === undefined
    ) return;
    const progress = frames.find(
      ({ passageId }) => passageId === semanticTransitSourcePassageId
    )?.projection.crossingProgress ?? 0;
    const presentation = projectKpTutorialSemanticTransitPresentation({
      desktopLayout: usesTwoColumnDesktopGeometry(),
      reducedMotion
    });
    shell!.dataset["kpEconomicsSemanticTransitProgress"] =
      progress.toFixed(4);
    if (presentation !== "animated") {
      semanticTransitProxyLayer.hideProxy(
        semanticTransitProxyId,
        presentation,
        progress
      );
      shell!.dataset["kpEconomicsSemanticTransitState"] = presentation;
      return;
    }
    const geometry = semanticTransitGeometryCache.geometry();
    const projection = projectKpTutorialSemanticTransitGeometry({
      geometry,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    });
    semanticTransitProxyLayer.paintProxy(
      semanticTransitProxyId,
      projectKpTutorialSemanticTransitTransform({ projection, progress })
    );
    shell!.dataset["kpEconomicsSemanticTransitState"] = "animated";
    shell!.dataset["kpEconomicsSemanticTransitGeometryReads"] = String(
      semanticTransitGeometryCache.measurementReads()
    );
  }

  function hideSemanticTransitProxy(
    state: "geometry-pending" | "phone-static" | "reduced-motion-static"
  ): void {
    if (
      semanticTransitProxyLayer === undefined ||
      semanticTransitProxyId === undefined
    ) return;
    semanticTransitProxyLayer.hideProxy(semanticTransitProxyId, state);
    if (shell !== undefined) {
      shell.dataset["kpEconomicsSemanticTransitState"] = state;
    }
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
    motionOwner = "manual";
    manualMotionBlock = blockId;
    scrollTimelineStatus = "manual";
    const currentProgress = blockId === "supply-movement"
      ? motionRuntime.supplyMovementProgress
      : motionRuntime.semanticProgress;
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
    if (event.matches) hideSemanticTransitProxy("reduced-motion-static");
    updateInlineStickyLayoutProjection();
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
    if (lessonEditorModalOpen) return;
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
    const activeMotionBlockId = animationStation
      ? projection.activeBlockId
      : tutorialAttention.activeMotionBlockId;
    const active = activeMotionBlockId === undefined
      ? undefined
      : projection.blocks.find(
        ({ id }) => id === activeMotionBlockId
      );
    if (animationStation && active !== undefined) {
      scrollActiveMotionBlock = active.id;
    }
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
      activeScrubBar?.setAttribute(
        "data-kp-tutorial-scrub-anchor-top",
        active.anchorTop.toFixed(3)
      );
      activeScrubBar?.setAttribute(
        "data-kp-tutorial-scrub-reading-band",
        projection.readingBandY.toFixed(3)
      );
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
        const nextMotion = projectKpEconomicsLessonMotion({
          activeBlockId: active.id,
          localProgress
        });
        commitLessonMotionProjection(nextMotion);
        if (manualCanResume) {
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
        seek(localProgress);
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
    commitLessonMotionProjection(projectKpEconomicsLessonMotion(boundary));
    seek(boundary.localProgress);
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
    const activeGapProjection = latestScrollProjection?.blocks.find(
      ({ travel }) => travel > 0 && travel < 1
    );
    const activeGapPassageId = activeGapProjection?.id === "demand-shift"
      ? "follow-shift"
      : activeGapProjection?.id === "supply-movement"
        ? "shift-versus-movement"
        : undefined;
    // The paired prose may trade attention during the gap, but the one
    // semantic bridge remains motion owner until its after anchor settles.
    const motionParagraph = activeGapProjection === undefined
      ? paragraphFrames.find((frame) =>
          frame.motionBlockId !== undefined && (
            frame.ownsAttention || frame.projection.phase === "crossing"
          )
        )
      : paragraphFrames.find(({ passageId }) =>
          passageId === activeGapPassageId
        );
    const passageId = focusedParagraph?.passageId;
    const motionBlockId = motionParagraph?.motionBlockId;
    if (passageId === undefined) {
      return updateReadingBandSelection(inlineStickyTopInset());
    }

    attentionPassageId = passageId;
    attentionCursorState = "within-region";
    scrollActiveMotionBlock = motionBlockId ?? "";
    const checkpointPassageId = activeGapPassageId ?? passageId;
    if (checkpoint.passageId !== checkpointPassageId) {
      const nextIndex = kpEconomicsDemandShiftCheckpoints.findIndex(
        (candidate) => candidate.passageId === checkpointPassageId
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
    const cueCount = cachedDocumentGeometry?.length ?? measurements.length;
    const sequence = twoColumnDesktop
      ? projectKpTwoColumnScrollSequence({
          paragraphTopPx: measurements.map(
            ({ paragraphBounds }) => paragraphBounds.top
          ),
          paragraphBottomPx: measurements.map(
            ({ paragraphBounds }) => paragraphBounds.bottom
          ),
          indexOffset: cueWindow?.startIndex,
          totalParagraphCount: cueCount,
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
    if (twoColumnDesktop && cachedTwoColumnPassageTimeline !== undefined) {
      twoColumnPassagePhase = projectKpTutorialScrollPassagePhase({
        scrollY: window.scrollY,
        timeline: cachedTwoColumnPassageTimeline
      }).phase;
    }
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
            stageBottomPx: animationStation
              ? readCachedAnimationStationGeometry().graphBottomY
              : stageBounds?.bottom ?? 0,
            viewportHeightPx: window.innerHeight
          }));
      if (animationStation) {
        const stationGeometry = readCachedAnimationStationGeometry();
        if (motionBlockId === undefined) {
          const stationPhase = projectKpEconomicsStationPhase({
            passageId,
            cueKind: "ordinary",
            anchorPx: paragraphBounds.top,
            boundaries:
              kpEconomicsOrdinaryStationPhaseBoundaries(stationGeometry),
            beforeCheckpointId: "market-initial",
            afterCheckpointId: "market-initial"
          });
          element.dataset["kpAnimationStationPhase"] = stationPhase.phase;
          element.dataset["kpAnimationStationOwnership"] =
            stationPhase.ownership;
          element.dataset["kpAnimationStationActivePassage"] =
            stationPhase.activePassageId ?? "";
        } else {
          const block = findKpEconomicsMotionBlock(motionBlockId)!;
          const transitionAnchor = scrollAnchorForMotionBoundary(element);
          const scrollBlock = latestScrollProjection?.blocks.find(
            ({ id }) => id === motionBlockId
          );
          const stationPhase = projectKpEconomicsStationPhase({
            passageId,
            cueKind: "motion",
            anchorPx: transitionAnchor?.getBoundingClientRect().top ??
              paragraphBounds.top,
            boundaries: kpEconomicsMotionStationPhaseBoundaries(
              stationGeometry
            ),
            beforeCheckpointId: block.checkpoints[0]!.id,
            afterCheckpointId: block.checkpoints.at(-1)!.id,
            motionBlockId,
            projectedSemanticProgress: scrollBlock?.progress
          });
          element.dataset["kpAnimationStationPhase"] = stationPhase.phase;
          element.dataset["kpAnimationStationOwnership"] =
            stationPhase.ownership;
          element.dataset["kpAnimationStationActivePassage"] =
            stationPhase.activePassageId ?? "";
        }
      }
      return {
        passageId,
        motionBlockId,
        projection,
        ownsAttention: sequenceParagraph?.ownsAttention ?? false
      };
    });
    inlineParagraphProjections = Object.freeze(Object.fromEntries(frames.map(
      ({ passageId, projection }) => [passageId, projection]
    )));
    twoColumnParagraphPresentations = Object.freeze(Object.fromEntries(frames.map(
      ({ passageId }, index) => [passageId, Object.freeze({
        salience: sequence?.paragraphs[index]?.salience ?? 1
      })]
    )));
    updateSemanticTransitProxy(frames);
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
    // The station becomes an ordinary embedded reading sequence when spatial
    // coordination is unavailable or intentionally reduced.
    inlineStickyFit = animationStation && (
      window.innerWidth <= 760 || reducedMotion
    )
      ? "reading"
      : layout.fit;
    if (animationStation) {
      cachedAnimationStationGeometry = measureAnimationStationGeometry();
      inlineStickyStageHeightPx =
        cachedAnimationStationGeometry.railHeightPx;
      writeAnimationStationGeometry(cachedAnimationStationGeometry);
    } else {
      cachedAnimationStationGeometry = undefined;
      inlineStickyStageHeightPx = usesTwoColumnDesktopGeometry()
        ? inlineStage?.getBoundingClientRect().height ??
          Math.round(window.innerHeight * 0.68)
        : layout.stageHeightPx;
    }
    if (usesTwoColumnDesktopGeometry()) {
      const geometry = measureTwoColumnScrollGeometry();
      twoColumnStageTopPx = geometry.stageTopY;
      motionBridgeDistancePx = motionBridgeEnabled
        ? geometry.motionBridgeDistancePx
        : 0;
      writeTwoColumnAssemblyGeometry(geometry);
      cachedTwoColumnPassageTimeline = measureTwoColumnPassageTimeline(
        geometry
      );
    } else {
      cachedTwoColumnScrollGeometry = undefined;
      cachedTwoColumnPassageTimeline = undefined;
      motionBridgeDistancePx = 0;
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
    if (animationStation) {
      writeAnimationStationEntrance(projectKpAnimationStationEntrance({
        stageTopPx: stageBounds.top,
        geometry: readCachedAnimationStationGeometry(),
        latchTolerancePx: kpEconomicsScrollLatchEpsilonPx
      }));
    }
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
    if (animationStation) {
      return readCachedAnimationStationGeometry().railTopY;
    }
    if (!usesTwoColumnDesktopGeometry()) return 0;
    return readCachedTwoColumnScrollGeometry().stageTopY;
  }

  function inlineStickyHandoffStartY(): number {
    if (animationStation) {
      return readCachedAnimationStationGeometry().graphBottomY;
    }
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
      if (motionBridge?.motionBlockId === block.id) {
        return projectKpEconomicsMotionBridgeCorridor({
          bridge: motionBridge,
          viewportHeightPx: geometry.viewportHeightPx,
          readingAnchorPx: geometry.textAnchorY,
          distancePx: geometry.motionBridgeDistancePx,
          dwellProfile: motionBridgeDwellProfile
        });
      }
      const passage = anchor.closest<HTMLElement>(
        "[data-kp-two-column-scroll-paragraph]"
      );
      const previousPassage = passage?.previousElementSibling as
        HTMLElement | null | undefined;
      const previousParagraph = previousPassage?.matches("kp-motion-bridge")
        ? previousPassage.querySelector<HTMLElement>(
            "[data-kp-motion-bridge-after] p"
          )
        : previousPassage?.querySelector<HTMLElement>("p");
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
    if (animationStation) {
      const geometry = readCachedAnimationStationGeometry();
      return projectKpAnimationStationMotionCorridor({
        corridor: block.corridor,
        // The non-sticky runway keeps moving while its child seam pins, so
        // native scroll remains the clock even though the visible line holds.
        motionStartPx: geometry.graphBottomY,
        viewportHeightPx: window.innerHeight,
        runwayPx: geometry.motionDistancePx,
        settleRunwayPx: geometry.motionSettleDistancePx
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

  function measureAnimationStationGeometry():
  KpAnimationStationGeometryProjection {
    const style = shell === undefined ? undefined : getComputedStyle(shell);
    const pixels = (name: string): number => {
      const value = Number.parseFloat(style?.getPropertyValue(name) ?? "");
      return Number.isFinite(value) ? Math.max(0, value) : 0;
    };
    const number = (name: string, fallback: number): number => {
      const value = Number.parseFloat(style?.getPropertyValue(name) ?? "");
      return Number.isFinite(value) ? value : fallback;
    };
    const viewport = projectKpTutorialUsableViewport({
      viewportHeightPx: window.innerHeight,
      persistentTopInsetPx: pixels("--kp-tutorial-persistent-top-inset"),
      persistentBottomInsetPx: pixels("--kp-tutorial-persistent-bottom-inset")
    });
    return projectKpAnimationStationGeometry({
      viewportHeightPx: viewport.viewportHeightPx,
      usableTopPx: viewport.topPx,
      usableBottomPx: viewport.bottomPx,
      rhythm: {
        cuePinDistanceRatio: Math.max(0, Math.min(1,
          number("--kp-animation-station-reading-hold-vh", 10) / 100
        )),
        motionDistanceRatio: Math.max(0, Math.min(1,
          number("--kp-animation-station-motion-corridor-vh", 28) / 100
        )),
        motionSettleDistanceRatio: Math.max(0, Math.min(1,
          number("--kp-animation-station-motion-settle-vh", 4) / 100
        ))
      }
    });
  }

  function readCachedAnimationStationGeometry():
  KpAnimationStationGeometryProjection {
    return cachedAnimationStationGeometry ?? projectKpAnimationStationGeometry({
      viewportHeightPx: window.innerHeight
    });
  }

  function writeAnimationStationGeometry(
    geometry: KpAnimationStationGeometryProjection
  ): void {
    if (shell === undefined) return;
    const properties = {
      "--kp-animation-station-usable-top": geometry.usableTopPx,
      "--kp-animation-station-usable-bottom": geometry.usableBottomPx,
      "--kp-animation-station-usable-height": geometry.usableHeightPx,
      "--kp-animation-station-rail-top": geometry.railTopY,
      "--kp-animation-station-rail-height": geometry.railHeightPx,
      "--kp-animation-station-graph-offset":
        geometry.graphTopY - geometry.railTopY,
      "--kp-animation-station-graph-height": geometry.graphHeightPx,
      "--kp-animation-station-graph-bottom": geometry.graphBottomY,
      "--kp-animation-station-beat": geometry.beatDistancePx
    } as const;
    for (const [name, value] of Object.entries(properties)) {
      shell.style.setProperty(name, `${value}px`);
    }
  }

  function writeAnimationStationEntrance(
    projection: ReturnType<typeof projectKpAnimationStationEntrance>
  ): void {
    if (shell === undefined) return;
    shell.dataset["kpAnimationStationEntrancePhase"] = projection.phase;
    shell.style.setProperty(
      "--kp-animation-station-stage-latch-progress",
      projection.stageProgress.toFixed(4)
    );
    shell.style.setProperty(
      "--kp-animation-station-rail-entrance",
      projection.railPresence.toFixed(4)
    );
  }

  async function invalidateGeometryAfterPresentationChange(): Promise<void> {
    await tick();
    updateInlineStickyLayoutProjection();
  }

  function handleResponsiveGeometryChange(): void {
    updateInlineStickyLayoutProjection();
  }

  function handleFontMetricsChange(): void {
    if (scrollPassageLayout) {
      updateInlineStickyLayoutProjection();
      return;
    }
    // Split prose still moves when its real font settles, even though it does
    // not need the inline-sticky layout projection.
    scrollCoordinator?.invalidateGeometry();
  }

  function measureTwoColumnScrollGeometry(): KpEconomicsTwoColumnScrollGeometry {
    const style = shell === undefined ? undefined : getComputedStyle(shell);
    const ratio = (name: string, fallbackVh: number): number => {
      const value = Number.parseFloat(style?.getPropertyValue(name) ?? "");
      return clamp((Number.isFinite(value) ? value : fallbackVh) / 100, 0, 1);
    };
    const unitRatio = (name: string, fallback: number): number => {
      const value = Number.parseFloat(style?.getPropertyValue(name) ?? "");
      return clamp(Number.isFinite(value) ? value : fallback, 0, 1);
    };
    const pixels = (name: string): number => {
      const value = Number.parseFloat(style?.getPropertyValue(name) ?? "");
      return Number.isFinite(value) ? Math.max(0, value) : 0;
    };
    const focusTopRatio = ratio("--kp-two-column-focus-top-vh", 35);
    const stageCenterRatio = ratio("--kp-two-column-stage-center-vh", 50);
    const proseMotionGeometry = projectKpTutorialProseMotionGeometry({
      viewportHeightPx: window.innerHeight,
      persistentTopInsetPx: pixels("--kp-tutorial-persistent-top-inset"),
      persistentBottomInsetPx: pixels("--kp-tutorial-persistent-bottom-inset"),
      readingAnchorRatio: focusTopRatio,
      timing: {
        ordinaryBeatApproachRatio: unitRatio(
          "--kp-tutorial-ordinary-beat-approach-ratio",
          0.14
        ),
        bridgeDistanceRatios: {
          short: unitRatio(
            "--kp-tutorial-motion-bridge-distance-short-ratio",
            0.32
          ),
          standard: unitRatio(
            "--kp-tutorial-motion-bridge-distance-standard-ratio",
            0.5
          ),
          extended: unitRatio(
            "--kp-tutorial-motion-bridge-distance-extended-ratio",
            0.8
          )
        }
      }
    });
    const viewport = proseMotionGeometry.viewport;
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
      motionBridgeDistancePx:
        proseMotionGeometry.bridgeDistancePx[motionBridge?.distance ?? "standard"],
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
      motionBridgeDistancePx: viewport.heightPx * 0.5,
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

  function measureTwoColumnPassageTimeline(
    geometry: KpEconomicsTwoColumnScrollGeometry
  ): KpTutorialScrollPassageTimeline | undefined {
    const cues = cueGeometryCache?.documentGeometry();
    const first = cues?.[0];
    const last = cues?.at(-1);
    const demandBlock = findKpEconomicsMotionBlock("demand-shift");
    const demandBoundary = shell?.querySelector<HTMLElement>(
      '[data-kp-tutorial-motion-block="demand-shift"]'
    );
    const demandAnchor = scrollAnchorForMotionBoundary(demandBoundary);
    const passageBody = inlineStage?.closest<HTMLElement>(
      ".kp-economics-tutorial__motion-passage-body"
    );
    if (
      first === undefined ||
      last === undefined ||
      demandBlock === undefined ||
      demandAnchor === undefined ||
      passageBody === undefined ||
      passageBody === null
    ) return undefined;

    const demandCorridor = motionCorridorFor(demandBlock, demandAnchor);
    const demandDocumentTop =
      demandAnchor.getBoundingClientRect().top + window.scrollY;
    const bodyDocumentBottom =
      passageBody.getBoundingClientRect().bottom + window.scrollY;
    const entryLatchScrollY = first.documentTop - geometry.textAnchorY -
      kpEconomicsScrollLatchEpsilonPx;
    const motionStartScrollY = Math.max(
      entryLatchScrollY,
      demandDocumentTop -
        demandCorridor.startViewportRatio * geometry.viewportHeightPx
    );
    const terminalLatchScrollY = Math.max(
      motionStartScrollY,
      last.documentTop - geometry.textAnchorY -
        kpEconomicsScrollLatchEpsilonPx
    );
    const releaseScrollY = Math.max(
      terminalLatchScrollY,
      bodyDocumentBottom -
        (geometry.stageTopY + inlineStickyStageHeightPx) -
        kpEconomicsScrollLatchEpsilonPx
    );
    return Object.freeze({
      entryLatchScrollY,
      motionStartScrollY,
      terminalLatchScrollY,
      releaseScrollY
    });
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
    demandProgressRail = shell.querySelector<HTMLElement>(
      '[data-kp-tutorial-progress-rail="demand-shift"]'
    ) ?? undefined;
    supplyProgressRail = shell.querySelector<HTMLElement>(
      '[data-kp-tutorial-progress-rail="supply-movement"]'
    ) ?? undefined;
    syncMotionScrubBars();
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
    ensureSemanticTransitProxyLayer();
    reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    previousHistoryScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    reducedMotion = reducedMotionQuery.matches;
    if (reducedMotion && motionOwner === "untouched") {
      scrollTimelineStatus = "reduced-motion";
    }
    reducedMotionQuery.addEventListener("change", handleReducedMotionChange);
    if (animationStation && reducedMotion) {
      updateInlineStickyLayoutProjection();
    }
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
    semanticTransitProxyLayer?.dispose();
    semanticTransitGeometryCache?.disconnect();
    semanticTransitProxyLayer = undefined;
    semanticTransitGeometryCache = undefined;
    semanticTransitProxyId = undefined;
    semanticTransitSourcePassageId = undefined;
    if (shell !== undefined) {
      delete shell.dataset["kpEconomicsSemanticTransitLayer"];
      delete shell.dataset["kpEconomicsSemanticTransitProgress"];
      delete shell.dataset["kpEconomicsSemanticTransitGeometryReads"];
      delete shell.dataset["kpEconomicsSemanticTransitState"];
    }
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
      const blockProgress = destination.motion.blocks.find(
        ({ id }) => id === destination.motionScroll!.blockId
      )?.progress ?? 0;
      const destinationTravel = resolveKpTutorialCorridorTravelForProgress({
        corridor,
        progress: blockProgress,
        preferredTravel: destination.motionScroll.travel
      });
      const start = corridor.startViewportRatio * window.innerHeight;
      const end = corridor.endViewportRatio * window.innerHeight;
      const endpointInset = destinationTravel <= 0.001
        ? 2
        : destinationTravel >= 0.999
          ? -2
          : 0;
      const desiredTop = start -
        destinationTravel * (start - end) + endpointInset;
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
    if (animationStation) {
      return boundary.querySelector<HTMLElement>(
        "[data-kp-animation-station-transition]"
      ) ?? boundary;
    }
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
    navigationProjectionPending = true;
    navigationScrollIntent = false;
    navigationResume = createNavigationResume(next);
    checkpointIndex = next.checkpointIndex;
    scrollActiveMotionBlock = next.motion.activeBlockId;
    motionOwner = "untouched";
    manualMotionBlock = undefined;
    manualScrollRebase = undefined;
    scrollTimelineStatus = "idle";
    if (player !== undefined) {
      dispatchKpEditorAnimationPlaybackAction(player, { type: "reset" });
    }
    playbackRuntime.direction = "forward";
    playbackRuntime.status = "idle";
    commitLessonMotionProjection(next.motion, "forward");
    seek(localKpEconomicsMotionProgress(next.motion));
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
      const serialized = String(value);
      if (scrubBar.getAttribute(name) !== serialized) {
        scrubBar.setAttribute(name, serialized);
      }
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
      bind:this={motionStyleOwner}
      class="kp-economics-tutorial__player-host"
      data-kp-animation-catalogue-stage
      data-kp-animation-catalogue-stage-persistent="true"
      data-kp-economics-stage="economics-stage"
      data-kp-tutorial-stage="demand-shift-graph"
      data-kp-economics-stage-outer-geometry="fixed"
      data-kp-economics-screen-space-labels={scrollPassageLayout ? "true" : undefined}
      aria-busy={!ready}
    >
      {@html playerHtml}
      <div
        bind:this={verificationAperture}
        class="kp-economics-tutorial__verification-aperture"
        data-kp-economics-stage-aperture="verification-aperture"
        data-kp-economics-stage-aperture-edge={stageComposition.aperture.edge}
        data-kp-economics-stage-aperture-openness={stageComposition.aperture.openness.toFixed(3)}
        aria-hidden="true"
      >
        <div
          bind:this={verificationSurface}
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
  scrollCue: boolean,
  motionBridgePosition?: "before" | "after"
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
    data-kp-motion-bridge-before={motionBridgePosition === "before"
      ? passage.id
      : undefined}
    data-kp-motion-bridge-after={motionBridgePosition === "after"
      ? passage.id
      : undefined}
    data-kp-lesson-passage-role={passage.role}
    data-kp-scroll-cue={scrollCue ? true : undefined}
    data-kp-inline-sticky-cue={scrollCue ? true : undefined}
    data-kp-two-column-scroll-paragraph={twoColumnScroll && scrollCue
      ? true
      : undefined}
    data-kp-animation-station-cue={animationStation && scrollCue
      ? "true"
      : undefined}
    data-kp-inline-sticky-passage-role={scrollCue ? passage.role : undefined}
    data-kp-inline-sticky-paragraph-phase={inlineParagraphProjection?.phase}
    data-kp-inline-sticky-scene-travel={inlineParagraphProjection?.travel.toFixed(4)}
    data-kp-inline-sticky-crossing-progress={inlineParagraphProjection?.crossingProgress.toFixed(4)}
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
    style={twoColumnParagraphPresentation !== undefined
      ? `--kp-two-column-paragraph-salience:${twoColumnParagraphPresentation.salience}`
      : undefined}
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
        <p>
          {#if motionBridgePosition === "after"}
            <span
              class="kp-tutorial-motion-bridge__ellipsis kp-tutorial-motion-bridge__ellipsis--after"
              aria-hidden="true"
            >…</span>
          {/if}
          <span class="kp-economics-tutorial__passage-ink">{@html paragraph.html}</span>
          {#if motionBridgePosition === "before"}
            <span
              class="kp-tutorial-motion-bridge__ellipsis kp-tutorial-motion-bridge__ellipsis--before"
              aria-hidden="true"
            >{motionBridgeBeforeEllipsis}</span>
          {/if}
        </p>
      {/each}
    {/if}
    {#if animationStation && renderedMotionBlock !== undefined}
      <div
        class="kp-economics-tutorial__transition-runway"
        data-kp-animation-station-transition={renderedMotionBlock.id}
        aria-label={`${renderedMotionBlock.label} scroll transition`}
      >
        {@html animationStationProgressRailHtml[renderedMotionBlock.id]}
      </div>
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
    {#if lessonEditorOpen && lessonDraft !== undefined &&
        twoColumnScroll && scrollCue}
      <button
        type="button"
        class="kp-economics-tutorial__passage-select"
        aria-label={`Edit passage ${passage.id}`}
        aria-pressed={lessonEditorModalOpen &&
          lessonDraft.selectedPassageId === passage.id}
        data-kp-economics-passage-select={passage.id}
        onclick={() => selectLessonDraftPassage(passage.id)}
      >Edit</button>
    {/if}
  </div>
{/snippet}

{#snippet demandShiftMotionBridge()}
  {#if motionBridge !== undefined &&
      motionBridgeBeforePassage !== undefined &&
      motionBridgeAfterPassage !== undefined}
    <kp-motion-bridge
      class="kp-tutorial-motion-bridge"
      data-kp-motion-bridge={motionBridge.id}
      data-kp-motion-bridge-distance={motionBridge.distance}
      data-kp-motion-block={motionBridge.motionBlockId}
      data-kp-motion-from-checkpoint={motionBridge.fromCheckpointId}
      data-kp-motion-to-checkpoint={motionBridge.toCheckpointId}
      data-kp-motion-bridge-enhanced={motionBridgeDistancePx > 0
        ? "true"
        : undefined}
      style={motionBridgeDistancePx > 0
        ? `--kp-tutorial-motion-bridge-distance-px:${motionBridgeDistancePx}px;--kp-tutorial-motion-bridge-progress:${semanticProgress}`
        : undefined}
    >
      {@render lessonPassage(motionBridgeBeforePassage, true, "before")}
      <span class="kp-tutorial-motion-bridge__rail" aria-hidden="true">
        <span class="kp-tutorial-motion-bridge__rail-progress"></span>
      </span>
      {@render lessonPassage(motionBridgeAfterPassage, true, "after")}
    </kp-motion-bridge>
  {/if}
{/snippet}

<KpTutorialLessonShell
  bind:root={shell}
  rootClass={`kp-economics-tutorial${scrollPassageLayout
    ? " kp-economics-tutorial--inline-sticky"
    : ""}${twoColumnScroll
    ? " kp-economics-tutorial--two-column-scroll"
    : ""}${animationStation
    ? " kp-economics-tutorial--animation-station"
    : ""}${stageExpanded
    ? " kp-economics-tutorial--stage-expanded"
    : ""}`}
  layoutClass="kp-economics-tutorial__layout"
  proseClass="kp-economics-tutorial__prose"
  proseLabel="Economics lesson"
  stageClass="kp-economics-tutorial__stage"
  stageLabel="Persistent supply and demand stage"
  attributes={{
    // Data attributes use strings so the review and test root exists in the
    // server-rendered document before client enhancement attaches.
    "data-kp-economics-demand-shift-tutorial": "true",
    "data-kp-economics-tutorial-layout": presentationLayout,
    "data-kp-economics-tutorial-scrub-strategy": scrubStrategy,
    "data-kp-economics-motion-bridge-dwell": motionBridgeDwellProfile,
    "data-kp-economics-motion-bridge-artifact":
      motionBridgeHtml?.["demand-increase"] === undefined ? "" : "demand-increase",
    "data-kp-economics-motion-bridge-progress": motionBridgeEnabled
      ? semanticProgress.toFixed(3)
      : "",
    "data-kp-economics-two-column-text-side": twoColumnTextSide,
    "data-kp-economics-two-column-paragraph-gap-vh": twoColumnParagraphGapVh,
    "data-kp-economics-tutorial-theme": theme,
    "data-kp-economics-lesson-editor-open": lessonEditorOpen
      ? "true"
      : "false",
    "data-kp-economics-lesson-editor-selected": lessonEditorOpen &&
        lessonDraft !== undefined
      ? lessonDraft.selectedPassageId
      : "",
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
    "data-kp-economics-tutorial-passage-phase": twoColumnScroll
      ? twoColumnPassagePhase
      : "",
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
    "data-kp-tutorial-review-playback-direction": initial.playbackDirection,
    "data-kp-tutorial-review-evidence": JSON.stringify(
      twoColumnScroll
        ? {
            themeId: kpEconomicsDemandShiftThemeIds[theme],
            tuning: {
              "two-column-text-side": twoColumnTextSide,
              "motion-bridge-dwell": motionBridgeDwellProfile
            }
          }
        : { themeId: kpEconomicsDemandShiftThemeIds[theme] }
    )
  }}
  style={`${semanticSalienceStyle};${supplyInterpretationStyle};${stageCompositionStyle};${verificationRevealStyle};--kp-two-column-paragraph-gap-vh:${twoColumnParagraphGapVh}`}
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
              {#if !twoColumnScroll && !animationStation}
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
                <span
                  class="kp-economics-tutorial__column-divider"
                  data-kp-economics-column-divider
                  aria-hidden="true"
                ></span>
                <div class="kp-economics-tutorial__motion-passage-prose">
                  {#each (twoColumnScroll || animationStation
                    ? editableTwoColumnParagraphs
                    : section.passages.filter(({ role }) => role !== "reflection")) as passage}
                    {#if motionBridgeEnabled &&
                        passage.id === motionBridge?.beforePassageId}
                      {@render demandShiftMotionBridge()}
                    {:else if !motionBridgeEnabled ||
                        passage.id !== motionBridge?.afterPassageId}
                      {@render lessonPassage(
                        passage,
                        true
                      )}
                    {/if}
                  {/each}
                </div>
              </div>
              <div
                class="kp-economics-tutorial__motion-passage-gate kp-economics-tutorial__motion-passage-gate--exit"
                aria-hidden="true"
              ></div>
            </div>
            {#each section.passages.filter(({ role }) =>
              role === "reflection") as passage}
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
      <button
        class="kp-economics-tutorial__column-toggle"
        type="button"
        aria-pressed={lessonEditorOpen}
        data-kp-economics-lesson-editor-toggle
        onclick={toggleLessonEditor}
      >{lessonEditorOpen ? "Done" : "Edit"}</button>
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

{#if lessonEditorOpen && lessonEditorModalOpen && lessonDraft !== undefined &&
    selectedLessonDraftPassage !== undefined &&
    LessonPassageEditor !== undefined}
  <LessonPassageEditor
    id={selectedLessonDraftPassage.id}
    value={selectedLessonDraftPassage.sourceText}
    draft={lessonDraft}
    validation={lessonEditorValidation}
    onChange={updateLessonDraftSource}
    onClose={closeLessonEditorModal}
  />
{/if}
