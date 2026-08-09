import "../kp-tutorial-foundation.css";
import "../kp-tutorial-progress-rail.css";
import "../kp-tutorial-scrub-bar.css";

import {
  createKpSupplyDemandEquilibriumModel
} from "../../../domains/economics/supply-demand-equilibrium-model.ts";
import {
  createEconomicsEquilibriumAnimationAsset
} from "../../animation/economics-equilibrium-adapter.ts";
import {
  sampleKpEconomicsEquilibriumRuntimeFrame
} from "../../animation/economics-equilibrium-runtime-frame.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../../animation/runtime-sampler.ts";
import {
  createKpEditorGraphSvgViewportModel
} from "../../editor/graph-svg-viewport-lifecycle.ts";
import {
  createKpEconomicsEquilibriumRuntimeSession
} from "../../rendering/economics-equilibrium-runtime-session.ts";
import {
  renderKpEconomicsRetainedInlineLatex
} from "../../rendering/economics-equilibrium-retained-math.ts";
import {
  findKpEconomicsMotionBlock,
  kpEconomicsMotionBlocks,
  projectKpEconomicsLessonMotion,
  type KpEconomicsMotionBlockId
} from "./economics-demand-shift-motion-blocks.ts";
import {
  KP_TUTORIAL_SCRUB_NEXT_EVENT,
  KP_TUTORIAL_SCRUB_PREVIOUS_EVENT,
  KP_TUTORIAL_SCRUB_REWIND_EVENT,
  KP_TUTORIAL_SCRUB_SEEK_EVENT,
  KP_TUTORIAL_SCRUB_TOGGLE_EVENT,
  type KpTutorialScrubSeekDetail
} from "../kp-tutorial-scrub-bar-events.ts";
import {
  defineKpTutorialScrubBar
} from "../kp-tutorial-scrub-bar.ts";
import {
  defineKpTutorialProgressRail
} from "../kp-tutorial-progress-rail.ts";
import {
  defineKpTutorialToc,
  type KpTutorialTocElement
} from "../kp-tutorial-toc-element.ts";
import type {
  KpTutorialTocDestination
} from "../kp-tutorial-toc.ts";
import {
  createKpTutorialNavigationController
} from "../kp-tutorial-navigation.ts";
import {
  parseKpTutorialDestinationHash
} from "../kp-tutorial-url.ts";
import {
  isKpEconomicsNavigationActionDetail,
  KP_ECONOMICS_NAVIGATION_ACTION_EVENT,
  resolveKpEconomicsNavigationAction,
  type KpEconomicsNavigationActionDetail
} from "./economics-demand-shift-navigation-actions.ts";
import {
  kpEconomicsDemandShiftDeckScenes,
  projectKpEconomicsDeckMotionScalar,
  readKpEconomicsDemandShiftDeckSceneIndex,
  writeKpEconomicsDemandShiftDeckScene
} from "./economics-demand-shift-deck.ts";
import {
  readKpEconomicsDemandShiftView
} from "./economics-demand-shift-view.ts";
import type { KpEconomicsDemandShiftRouteHandoff } from
  "./economics-demand-shift-route-handoff.ts";

interface KpPublishedEconomicsPlayback {
  blockId: KpEconomicsMotionBlockId;
  progress: number;
  status: "paused" | "playing";
}

interface KpPublishedEconomicsDestination {
  readonly blockId: KpEconomicsMotionBlockId;
  readonly destination: KpTutorialTocDestination;
  readonly element: HTMLElement;
  readonly progress: number;
}

const enhancementSessions = new WeakMap<HTMLElement, () => void>();
const playbackDurationMs = 2_400;
const deckTransitionDurationMs = 1_600;

/**
 * Adopts the build-published lesson in place. This deliberately owns only
 * behavior: HTML, semantic IDs, controls, and SVG geometry remain compiler
 * output so Svelte is optional composition rather than semantic authority.
 */
export async function enhanceKpEconomicsDemandShiftPublication(input: {
  readonly root: HTMLElement;
  readonly search: string;
  readonly hash: string;
  readonly handoff?: KpEconomicsDemandShiftRouteHandoff | undefined;
}): Promise<() => void> {
  const extant = enhancementSessions.get(input.root);
  if (extant !== undefined) return extant;

  const publicationRoot = requiredElement<HTMLElement>(
    input.root,
    "[data-kp-economics-static-publication]"
  );
  const svg = requiredElement<SVGSVGElement>(
    publicationRoot,
    "[data-kp-editor-graph-svg]"
  );
  const content = requiredElement<SVGGElement>(
    svg,
    "[data-kp-editor-graph-content]"
  );
  const stage = requiredElement<HTMLElement>(
    publicationRoot,
    "[data-kp-economics-static-stage]"
  );
  const accessibleState = requiredElement<HTMLElement>(
    publicationRoot,
    "[data-kp-economics-accessible-state]"
  );
  const stageCaption = requiredElement<HTMLElement>(
    publicationRoot,
    "[data-kp-economics-stage-caption]"
  );
  const model = createKpSupplyDemandEquilibriumModel();
  const animation = createEconomicsEquilibriumAnimationAsset(model);
  const viewport = createKpEditorGraphSvgViewportModel(animation);
  const parsedInitialDestination = parseKpTutorialDestinationHash(input.hash);
  const deckEnabled = readKpEconomicsDemandShiftView(input.search) === "deck";
  let deckSceneIndex = readKpEconomicsDemandShiftDeckSceneIndex(input.search);
  const initialDeckScene = kpEconomicsDemandShiftDeckScenes[deckSceneIndex]!;
  const initialDestination = parsedInitialDestination === undefined
    ? undefined
    : resolvePublishedDestination({
      root: publicationRoot,
      destination: parsedInitialDestination
    });
  const playback: KpPublishedEconomicsPlayback = {
    blockId: input.handoff?.blockId ?? (deckEnabled
      ? initialDeckScene.target.blockId
      : initialDestination?.blockId ?? "demand-shift"),
    progress: input.handoff?.progress ?? (deckEnabled
      ? initialDeckScene.target.progress
      : initialDestination?.progress ?? 0),
    status: "paused"
  };
  const initialRuntimeFrame = economicsFrame(
    animation,
    model,
    projectKpEconomicsLessonMotion({
      activeBlockId: playback.blockId,
      localProgress: playback.progress
    }).demandShiftProgress
  );
  const runtimeSession = createKpEconomicsEquilibriumRuntimeSession({
    content,
    frame: initialRuntimeFrame,
    viewport,
    renderInlineLatex: renderKpEconomicsRetainedInlineLatex
  });
  let disposed = false;
  let animationFrame: number | undefined;
  let playbackStartedAt = 0;
  let playbackStartedProgress = 0;
  let accessibleStateKey = "";
  let deckTransitionStartedAt = 0;
  let deckTransitionFromScalar = 0;
  let deckTransitionToScalar = 0;

  defineKpTutorialScrubBar();
  defineKpTutorialProgressRail();
  defineKpTutorialToc();
  const toc = requiredElement<KpTutorialTocElement>(
    publicationRoot,
    "kp-tutorial-toc"
  );
  toc.observeReadingOutline();
  input.root.dataset["kpEconomicsDemandShiftTutorialMounted"] = "true";
  publicationRoot.dataset["kpEconomicsDemandShiftTutorial"] = "published";
  publicationRoot.dataset["kpEconomicsStaticEnhancement"] = "ready";

  const apply = (
    blockId: KpEconomicsMotionBlockId,
    progress: number
  ): void => {
    playback.blockId = blockId;
    playback.progress = boundedProgress(progress);
    const motion = projectKpEconomicsLessonMotion({
      activeBlockId: playback.blockId,
      localProgress: playback.progress
    });
    const frame = economicsFrame(
      animation,
      model,
      motion.demandShiftProgress
    );
    runtimeSession.apply({ frame, viewport });
    svg.dataset["kpEditorGraphProgress"] = String(
      motion.demandShiftProgress
    );
    svg.dataset["kpEditorGraphDirection"] = "forward";
    stage.dataset["kpEconomicsStaticStageState"] = motion.scene.market;
    publicationRoot.dataset["kpEconomicsTutorialMotionBlock"] = blockId;
    publicationRoot.dataset["kpEconomicsTutorialMotionProgress"] =
      playback.progress.toFixed(3);
    publicationRoot.dataset["kpEconomicsTutorialSupplyMovementProgress"] =
      motion.supplyMovementProgress.toFixed(3);
    publicationRoot.style.setProperty(
      "--kp-tutorial-supply-emphasis",
      boundedProgress(motion.supplyMovementProgress / 0.18).toFixed(3)
    );
    publicationRoot.style.setProperty(
      "--kp-tutorial-supply-trace",
      boundedProgress(
        (motion.supplyMovementProgress - 0.12) / 0.46
      ).toFixed(3)
    );
    const caption = motion.supplyMovementProgress >= 1
      ? "Demand shifted; the trace confirms movement along unchanged supply."
      : motion.supplyMovementProgress > 0
        ? "Tracing movement between equilibria along unchanged supply."
        : motion.demandShiftProgress >= 1
          ? "New equilibrium after demand increases."
          : motion.demandShiftProgress > 0
            ? "Demand is shifting while supply remains fixed."
            : "Initial supply and demand equilibrium before demand increases.";
    // The caption is checkpoint language, not a moving readout. Retain its
    // text node across frames so semantic playback does not rebuild live DOM.
    if (stageCaption.textContent !== caption) stageCaption.textContent = caption;
    accessibleStateKey = syncAccessibleState(
      accessibleState,
      playback,
      accessibleStateKey
    );
    syncControls(publicationRoot, playback, motion.blocks);
  };

  const deck = requiredElement<HTMLElement>(
    publicationRoot,
    "[data-kp-economics-deck]"
  );
  const deckTrack = requiredElement<HTMLElement>(
    deck,
    "[data-kp-economics-deck-track]"
  );
  const deckCount = requiredElement<HTMLOutputElement>(
    deck,
    "[data-kp-economics-deck-count]"
  );
  const deckProgress = requiredElement<HTMLProgressElement>(
    deck,
    "[data-kp-economics-deck-progress]"
  );
  const deckPrevious = requiredElement<HTMLButtonElement>(
    deck,
    "[data-kp-economics-deck-previous]"
  );
  const deckNext = requiredElement<HTMLButtonElement>(
    deck,
    "[data-kp-economics-deck-next]"
  );

  const syncDeck = (progress = deckSceneIndex + 1): void => {
    deckTrack.style.setProperty(
      "--kp-economics-deck-scene-index",
      String(deckSceneIndex)
    );
    for (const [index, scene] of [...deckTrack.querySelectorAll<HTMLElement>(
      "[data-kp-economics-deck-scene]"
    )].entries()) {
      scene.dataset["kpEconomicsDeckSceneActive"] = String(
        index === deckSceneIndex
      );
      if (index === deckSceneIndex) {
        scene.setAttribute("aria-current", "step");
      } else {
        scene.removeAttribute("aria-current");
      }
    }
    deckCount.value = `${deckSceneIndex + 1} of ${kpEconomicsDemandShiftDeckScenes.length}`;
    deckProgress.value = progress;
    deckProgress.textContent = deckCount.value;
    deckPrevious.disabled = deckSceneIndex === 0;
    deckNext.textContent = deckSceneIndex ===
        kpEconomicsDemandShiftDeckScenes.length - 1
      ? "Read the full lesson"
      : "Continue";
    publicationRoot.dataset["kpEconomicsDeckScene"] =
      kpEconomicsDemandShiftDeckScenes[deckSceneIndex]!.id;
  };

  const stopPlayback = (): void => {
    if (animationFrame !== undefined) cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
    playback.status = "paused";
  };

  const tick = (now: number): void => {
    if (disposed || playback.status !== "playing") return;
    const elapsed = Math.max(0, now - playbackStartedAt);
    const progress = playbackStartedProgress +
      elapsed / playbackDurationMs;
    if (progress >= 1) {
      stopPlayback();
      apply(playback.blockId, 1);
      return;
    }
    apply(playback.blockId, progress);
    animationFrame = requestAnimationFrame(tick);
  };

  const applyDeckScalar = (scalar: number): void => {
    const bounded = Math.max(0, Math.min(2, scalar));
    if (bounded <= 1) {
      apply("demand-shift", bounded);
    } else {
      apply("supply-movement", bounded - 1);
    }
  };

  const tickDeck = (now: number): void => {
    if (disposed || playback.status !== "playing") return;
    const duration = deckTransitionDurationMs * Math.max(
      0.5,
      Math.abs(deckTransitionToScalar - deckTransitionFromScalar)
    );
    const linear = boundedProgress((now - deckTransitionStartedAt) / duration);
    const eased = 1 - Math.pow(1 - linear, 3);
    applyDeckScalar(
      deckTransitionFromScalar +
        (deckTransitionToScalar - deckTransitionFromScalar) * eased
    );
    const direction = deckTransitionToScalar >= deckTransitionFromScalar
      ? 1
      : -1;
    syncDeck(deckSceneIndex + 1 - direction * (1 - eased));
    if (linear >= 1) {
      stopPlayback();
      applyDeckScalar(deckTransitionToScalar);
      syncDeck();
      return;
    }
    animationFrame = requestAnimationFrame(tickDeck);
  };

  const selectDeckScene = (
    nextIndex: number,
    animate: boolean,
    updateLocation: boolean
  ): void => {
    const boundedIndex = Math.max(0, Math.min(
      kpEconomicsDemandShiftDeckScenes.length - 1,
      Math.trunc(nextIndex)
    ));
    const previousIndex = deckSceneIndex;
    const fromScalar = playback.blockId === "demand-shift"
      ? playback.progress
      : 1 + playback.progress;
    deckSceneIndex = boundedIndex;
    const target = kpEconomicsDemandShiftDeckScenes[deckSceneIndex]!;
    const toScalar = projectKpEconomicsDeckMotionScalar(target);
    stopPlayback();
    syncDeck(previousIndex + 1);
    if (updateLocation) {
      const search = writeKpEconomicsDemandShiftDeckScene({
        search: window.location.search,
        sceneIndex: deckSceneIndex
      });
      window.history.replaceState(
        window.history.state,
        "",
        `${window.location.pathname}${search}`
      );
    }
    if (!animate || fromScalar === toScalar ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      applyDeckScalar(toScalar);
      syncDeck();
      return;
    }
    deckTransitionFromScalar = fromScalar;
    deckTransitionToScalar = toScalar;
    deckTransitionStartedAt = performance.now();
    playback.status = "playing";
    animationFrame = requestAnimationFrame(tickDeck);
  };

  const onDeckPrevious = (): void => {
    selectDeckScene(deckSceneIndex - 1, true, true);
  };
  const onDeckNext = (): void => {
    if (deckSceneIndex >= kpEconomicsDemandShiftDeckScenes.length - 1) {
      publicationRoot.querySelector<HTMLElement>(
        "[data-kp-economics-reader-seam]"
      )?.scrollIntoView({ block: "start", behavior: "smooth" });
      return;
    }
    selectDeckScene(deckSceneIndex + 1, true, true);
  };

  const barForEvent = (event: Event): HTMLElement | undefined => {
    if (!(event.target instanceof Element)) return undefined;
    return event.target.closest<HTMLElement>(
      "kp-tutorial-scrub-bar[data-kp-tutorial-motion-controls]"
    ) ?? undefined;
  };

  const blockForEvent = (event: Event): KpEconomicsMotionBlockId | undefined => {
    const id = barForEvent(event)?.dataset["kpTutorialMotionControls"];
    return findKpEconomicsMotionBlock(id)?.id;
  };

  const onSeek = (event: Event): void => {
    if (!(event instanceof CustomEvent)) return;
    const blockId = blockForEvent(event);
    if (blockId === undefined) return;
    stopPlayback();
    apply(
      blockId,
      (event as CustomEvent<KpTutorialScrubSeekDetail>).detail.progress
    );
  };

  const onToggle = (event: Event): void => {
    const blockId = blockForEvent(event);
    if (blockId === undefined) return;
    if (playback.status === "playing" && playback.blockId === blockId) {
      stopPlayback();
      apply(blockId, playback.progress);
      return;
    }
    const continuingProgress = playback.blockId === blockId
      ? playback.progress
      : 0;
    stopPlayback();
    playback.blockId = blockId;
    playbackStartedProgress = continuingProgress >= 0.999
      ? 0
      : continuingProgress;
    playback.progress = playbackStartedProgress;
    playback.status = "playing";
    playbackStartedAt = performance.now();
    apply(blockId, playback.progress);
    animationFrame = requestAnimationFrame(tick);
  };

  const onRewind = (event: Event): void => {
    const blockId = blockForEvent(event);
    if (blockId === undefined) return;
    stopPlayback();
    apply(blockId, 0);
  };

  const stepCheckpoint = (event: Event, direction: -1 | 1): void => {
    const blockId = blockForEvent(event);
    if (blockId === undefined) return;
    stepBlockCheckpoint(blockId, direction);
  };

  const stepBlockCheckpoint = (
    blockId: KpEconomicsMotionBlockId,
    direction: -1 | 1
  ): void => {
    const block = findKpEconomicsMotionBlock(blockId);
    if (block === undefined) return;
    stopPlayback();
    const epsilon = 0.001;
    const ordered = direction > 0
      ? block.checkpoints
      : [...block.checkpoints].reverse();
    const checkpoint = ordered.find(({ progress }) => direction > 0
      ? progress > playback.progress + epsilon
      : progress < playback.progress - epsilon
    );
    apply(block.id, checkpoint?.progress ?? (direction > 0 ? 1 : 0));
  };

  const onPrevious = (event: Event): void => stepCheckpoint(event, -1);
  const onNext = (event: Event): void => stepCheckpoint(event, 1);
  const onKeydown = (event: KeyboardEvent): void => {
    if (
      !event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
      (event.key !== "ArrowLeft" && event.key !== "ArrowRight") ||
      isEditableTarget(event.target)
    ) return;
    event.preventDefault();
    stepBlockCheckpoint(
      playback.blockId,
      event.key === "ArrowLeft" ? -1 : 1
    );
  };
  const navigationController = createKpTutorialNavigationController({
    root: publicationRoot,
    toc,
    resolve: (destination) => resolvePublishedDestination({
      root: publicationRoot,
      destination
    }),
    restore: (destination) => {
      stopPlayback();
      apply(destination.blockId, destination.progress);
    },
    scroll: (destination) => {
      destination.element.scrollIntoView({ block: "start", behavior: "auto" });
    },
    projectTocDestination: (target, destination) =>
      destination.kind === "checkpoint"
        ? { kind: "block", id: target.blockId }
        : destination
  });
  const onNavigationAction = (event: Event): void => {
    if (!(event instanceof CustomEvent) ||
        !isKpEconomicsNavigationActionDetail(event.detail)) return;
    const detail = event.detail as KpEconomicsNavigationActionDetail;
    const destination = resolveKpEconomicsNavigationAction({
      action: detail.action,
      blockId: detail.blockId ?? playback.blockId
    });
    if (destination !== undefined && navigationController.navigate(destination)) {
      event.preventDefault();
    }
  };

  navigationController.connect();

  const restoreInitialDestination = (): void => {
    stopPlayback();
    if (deckEnabled) {
      selectDeckScene(deckSceneIndex, false, false);
      if (input.handoff !== undefined) {
        apply(input.handoff.blockId, input.handoff.progress);
      }
      return;
    }
    if (initialDestination === undefined) {
      apply(
        input.handoff?.blockId ?? "demand-shift",
        input.handoff?.progress ?? 0
      );
      return;
    }
    navigationController.apply(initialDestination.destination, {
      source: "initial",
      scroll: true
    });
    if (input.handoff !== undefined) {
      apply(input.handoff.blockId, input.handoff.progress);
    }
  };

  publicationRoot.addEventListener(KP_TUTORIAL_SCRUB_SEEK_EVENT, onSeek);
  deckPrevious.addEventListener("click", onDeckPrevious);
  deckNext.addEventListener("click", onDeckNext);
  publicationRoot.addEventListener(KP_TUTORIAL_SCRUB_TOGGLE_EVENT, onToggle);
  publicationRoot.addEventListener(KP_TUTORIAL_SCRUB_REWIND_EVENT, onRewind);
  publicationRoot.addEventListener(
    KP_TUTORIAL_SCRUB_PREVIOUS_EVENT,
    onPrevious
  );
  publicationRoot.addEventListener(KP_TUTORIAL_SCRUB_NEXT_EVENT, onNext);
  publicationRoot.addEventListener(
    KP_ECONOMICS_NAVIGATION_ACTION_EVENT,
    onNavigationAction
  );
  publicationRoot.ownerDocument.defaultView?.addEventListener(
    "keydown",
    onKeydown
  );
  restoreInitialDestination();

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    stopPlayback();
    publicationRoot.removeEventListener(KP_TUTORIAL_SCRUB_SEEK_EVENT, onSeek);
    deckPrevious.removeEventListener("click", onDeckPrevious);
    deckNext.removeEventListener("click", onDeckNext);
    publicationRoot.removeEventListener(
      KP_TUTORIAL_SCRUB_TOGGLE_EVENT,
      onToggle
    );
    publicationRoot.removeEventListener(
      KP_TUTORIAL_SCRUB_REWIND_EVENT,
      onRewind
    );
    publicationRoot.removeEventListener(
      KP_TUTORIAL_SCRUB_PREVIOUS_EVENT,
      onPrevious
    );
    publicationRoot.removeEventListener(
      KP_TUTORIAL_SCRUB_NEXT_EVENT,
      onNext
    );
    publicationRoot.removeEventListener(
      KP_ECONOMICS_NAVIGATION_ACTION_EVENT,
      onNavigationAction
    );
    publicationRoot.ownerDocument.defaultView?.removeEventListener(
      "keydown",
      onKeydown
    );
    navigationController.dispose();
    toc.stopObservingReadingOutline();
    // Teardown restores the deterministic publication state without deleting
    // any adopted light-DOM node.
    const initial = economicsFrame(animation, model, 0);
    runtimeSession.apply({ frame: initial, viewport });
    runtimeSession.dispose();
    delete input.root.dataset["kpEconomicsDemandShiftTutorialMounted"];
    delete publicationRoot.dataset["kpEconomicsDemandShiftTutorial"];
    delete publicationRoot.dataset["kpEconomicsStaticEnhancement"];
    enhancementSessions.delete(input.root);
  };
  enhancementSessions.set(input.root, dispose);
  return dispose;
}

function syncAccessibleState(
  element: HTMLElement,
  playback: KpPublishedEconomicsPlayback,
  previousKey: string
): string {
  const block = findKpEconomicsMotionBlock(playback.blockId);
  if (block === undefined) return previousKey;
  const checkpoint = [...block.checkpoints].reverse().find(
    ({ progress }) => progress <= playback.progress + 0.001
  ) ?? block.checkpoints[0]!;
  const key = `${block.id}:${checkpoint.id}`;
  if (key === previousKey) return key;
  element.textContent = `${block.label}. ${checkpoint.label}. ${checkpoint.description}`;
  return key;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable ||
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement;
}

function syncControls(
  root: ParentNode,
  playback: KpPublishedEconomicsPlayback,
  projections: readonly {
    readonly id: KpEconomicsMotionBlockId;
    readonly progress: number;
  }[]
): void {
  for (const projection of projections) {
    const block = findKpEconomicsMotionBlock(projection.id);
    if (block === undefined) continue;
    const checkpoint = [...block.checkpoints].reverse().find(
      ({ progress }) => progress <= projection.progress + 0.001
    ) ?? block.checkpoints[0]!;
    const status = playback.status === "playing" &&
        playback.blockId === projection.id
      ? "playing"
      : "paused";
    const scrub = root.querySelector<HTMLElement>(
      `kp-tutorial-scrub-bar[data-kp-tutorial-motion-controls="${projection.id}"]`
    );
    scrub?.setAttribute("controls-disabled", "false");
    scrub?.setAttribute("progress", String(projection.progress));
    scrub?.setAttribute("playback-status", status);
    scrub?.setAttribute(
      "previous-disabled",
      String(projection.progress <= 0.001)
    );
    scrub?.setAttribute(
      "next-disabled",
      String(projection.progress >= 0.999)
    );
    const rail = root.querySelector<HTMLElement>(
      `kp-tutorial-progress-rail[data-kp-tutorial-progress-rail="${projection.id}"]`
    );
    rail?.setAttribute("progress", String(projection.progress));
    rail?.setAttribute("progress-label", checkpoint.label);
  }
}

function economicsFrame(
  animation: ReturnType<typeof createEconomicsEquilibriumAnimationAsset>,
  model: ReturnType<typeof createKpSupplyDemandEquilibriumModel>,
  progress: number
) {
  return sampleKpEconomicsEquilibriumRuntimeFrame({
    animation,
    model,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      direction: "forward",
      progress
    })
  });
}

function resolvePublishedDestination(input: {
  readonly root: HTMLElement;
  readonly destination: KpTutorialTocDestination;
}): KpPublishedEconomicsDestination | undefined {
  const destination = input.destination;
  const elementId = `kp-${destination.kind}-${destination.id}`;
  const element = input.root.querySelector<HTMLElement>(
    `#${CSS.escape(elementId)}`
  );
  if (element === null) return undefined;
  if (destination.kind === "block") {
    const block = findKpEconomicsMotionBlock(destination.id);
    if (block !== undefined) {
      return { blockId: block.id, destination, element, progress: 0 };
    }
  }
  if (destination.kind === "checkpoint") {
    for (const block of kpEconomicsMotionBlocks) {
      const checkpoint = block.checkpoints.find(
        ({ id }) => id === destination.id
      );
      if (checkpoint !== undefined) {
        return {
          blockId: block.id,
          destination,
          element,
          progress: checkpoint.progress
        };
      }
    }
  }
  if (destination.kind === "section") {
    const precedingBlocks = kpEconomicsMotionBlocks.filter((block) => {
        const blockElement = input.root.querySelector(
          `#kp-block-${CSS.escape(block.id)}`
        );
        return blockElement !== null && Boolean(
          blockElement.compareDocumentPosition(element) &
            Node.DOCUMENT_POSITION_FOLLOWING
        );
      });
    const settled = precedingBlocks.at(-1);
    return settled === undefined
      ? { blockId: "demand-shift", destination, element, progress: 0 }
      : { blockId: settled.id, destination, element, progress: 1 };
  }
  return undefined;
}

function requiredElement<ElementType extends Element>(
  root: ParentNode,
  selector: string
): ElementType {
  const element = root.querySelector<ElementType>(selector);
  if (element === null) {
    throw new Error(`Published economics lesson is missing ${selector}.`);
  }
  return element;
}

function boundedProgress(progress: number): number {
  return Number.isFinite(progress) ? Math.max(0, Math.min(1, progress)) : 0;
}
