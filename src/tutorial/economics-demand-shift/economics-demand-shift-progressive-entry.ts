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
  parseKpTutorialDestinationHash
} from "../kp-tutorial-url.ts";

interface KpPublishedEconomicsPlayback {
  blockId: KpEconomicsMotionBlockId;
  progress: number;
  status: "paused" | "playing";
}

const enhancementSessions = new WeakMap<HTMLElement, () => void>();
const playbackDurationMs = 2_400;

/**
 * Adopts the build-published lesson in place. This deliberately owns only
 * behavior: HTML, semantic IDs, controls, and SVG geometry remain compiler
 * output so Svelte is optional composition rather than semantic authority.
 */
export async function enhanceKpEconomicsDemandShiftPublication(input: {
  readonly root: HTMLElement;
  readonly search: string;
  readonly hash: string;
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
  const model = createKpSupplyDemandEquilibriumModel();
  const animation = createEconomicsEquilibriumAnimationAsset(model);
  const viewport = createKpEditorGraphSvgViewportModel(animation);
  const initialDestination = resolvePublishedDestination({
    root: publicationRoot,
    hash: input.hash
  });
  const playback: KpPublishedEconomicsPlayback = {
    blockId: initialDestination.blockId,
    progress: initialDestination.progress,
    status: "paused"
  };
  const initialRuntimeFrame = economicsFrame(
    animation,
    model,
    projectKpEconomicsLessonMotion({
      activeBlockId: initialDestination.blockId,
      localProgress: initialDestination.progress
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

  defineKpTutorialScrubBar();
  defineKpTutorialProgressRail();
  defineKpTutorialToc();
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
    syncControls(publicationRoot, playback, motion.blocks);
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
  const onHashChange = (): void => {
    const destination = resolvePublishedDestination({
      root: publicationRoot,
      hash: window.location.hash
    });
    stopPlayback();
    apply(destination.blockId, destination.progress);
    const toc = publicationRoot.querySelector<KpTutorialTocElement>(
      "kp-tutorial-toc"
    );
    if (destination.destination !== undefined) {
      toc?.setActiveDestination(destination.destination);
    }
  };

  publicationRoot.addEventListener(KP_TUTORIAL_SCRUB_SEEK_EVENT, onSeek);
  publicationRoot.addEventListener(KP_TUTORIAL_SCRUB_TOGGLE_EVENT, onToggle);
  publicationRoot.addEventListener(KP_TUTORIAL_SCRUB_REWIND_EVENT, onRewind);
  publicationRoot.addEventListener(
    KP_TUTORIAL_SCRUB_PREVIOUS_EVENT,
    onPrevious
  );
  publicationRoot.addEventListener(KP_TUTORIAL_SCRUB_NEXT_EVENT, onNext);
  window.addEventListener("hashchange", onHashChange);
  apply(playback.blockId, playback.progress);
  onHashChange();

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    stopPlayback();
    publicationRoot.removeEventListener(KP_TUTORIAL_SCRUB_SEEK_EVENT, onSeek);
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
    window.removeEventListener("hashchange", onHashChange);
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
  readonly hash: string;
}): {
  readonly blockId: KpEconomicsMotionBlockId;
  readonly destination: KpTutorialTocDestination | undefined;
  readonly progress: number;
} {
  const destination = parseKpTutorialDestinationHash(input.hash);
  if (destination?.kind === "block") {
    const block = findKpEconomicsMotionBlock(destination.id);
    if (block !== undefined) {
      return { blockId: block.id, destination, progress: 0 };
    }
  }
  if (destination?.kind === "checkpoint") {
    for (const block of kpEconomicsMotionBlocks) {
      const checkpoint = block.checkpoints.find(
        ({ id }) => id === destination.id
      );
      if (checkpoint !== undefined) {
        return { blockId: block.id, destination, progress: checkpoint.progress };
      }
    }
  }
  if (destination?.kind === "section") {
    const section = input.root.querySelector<HTMLElement>(
      `#kp-section-${CSS.escape(destination.id)}`
    );
    if (section !== null) {
      const precedingBlocks = kpEconomicsMotionBlocks.filter((block) => {
        const element = input.root.querySelector(
          `#kp-block-${CSS.escape(block.id)}`
        );
        return element !== null && Boolean(
          element.compareDocumentPosition(section) &
            Node.DOCUMENT_POSITION_FOLLOWING
        );
      });
      const settled = precedingBlocks.at(-1);
      return settled === undefined
        ? { blockId: "demand-shift", destination, progress: 0 }
        : { blockId: settled.id, destination, progress: 1 };
    }
  }
  return {
    blockId: "demand-shift",
    destination,
    progress: 0
  };
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
