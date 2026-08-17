import type { KpAnimationAsset } from "../../animation/asset.ts";
import type { KpLispBotanicalPresentationPlan } from "../../animation/lisp-botanical-presentation-plan.ts";
import {
  kpLispReconstructedGlobalProgress,
  sampleKpLispLambdaApplicationRuntimeFrame
} from "../../animation/lisp-lambda-application-runtime-frame.ts";
import type { KpEditorAnimationDescriptor } from "../../editor/animation-descriptor.ts";
import {
  createKpEditorAnimationPlaybackSession,
  reduceKpEditorAnimationPlaybackSession,
  type KpEditorAnimationPlaybackSession
} from "../../editor/animation-playback-session.ts";
import type { KpLispLambdaApplicationAsset } from "../../semantic/lisp-lambda-application-asset.ts";
import {
  KP_TUTORIAL_SCRUB_NEXT_EVENT,
  KP_TUTORIAL_SCRUB_PREVIOUS_EVENT,
  KP_TUTORIAL_SCRUB_REWIND_EVENT,
  KP_TUTORIAL_SCRUB_SEEK_EVENT,
  KP_TUTORIAL_SCRUB_TOGGLE_EVENT,
  type KpTutorialScrubSeekDetail
} from "../kp-tutorial-scrub-bar-events.ts";
import type { KpTutorialScrubBarElement } from "../kp-tutorial-scrub-bar.ts";
import { projectKpTutorialCumulativeMotion } from "../kp-tutorial-motion.ts";
import {
  isKpLispLessonMotionBlockId,
  kpLispLessonMotionBlocks,
  type KpLispLessonMotionBlockId
} from "./lisp-function-application-motion-blocks.ts";
import { projectKpLispLessonSalience } from "./lisp-function-application-salience.ts";
import type { KpLispLessonStageProjector } from
  "./lisp-function-application-stage-projector.ts";
import type { KpLispLessonReviewAdapter } from
  "./lisp-function-application-review-adapter.ts";

export { kpLispReconstructedGlobalProgress };

export interface KpLispLessonMotionController {
  readonly restore: (
    blockId: KpLispLessonMotionBlockId,
    localProgress: number
  ) => void;
  readonly projectScroll: (
    blockId: KpLispLessonMotionBlockId,
    localProgress: number
  ) => void;
  readonly snapshot: () => {
    readonly activeBlockId: KpLispLessonMotionBlockId;
    readonly localProgress: number;
    readonly globalProgress: number;
    readonly playbackStatus: KpEditorAnimationPlaybackSession["player"]["playbackStatus"];
  };
  readonly dispose: () => void;
}

export function projectKpLispBindAndReconstructProgress(
  localProgress: number
): number {
  return clamp(localProgress) * kpLispReconstructedGlobalProgress;
}

export function unprojectKpLispBindAndReconstructProgress(
  globalProgress: number
): number {
  return clamp(globalProgress / kpLispReconstructedGlobalProgress);
}

export function projectKpLispEvaluateAndGatherProgress(
  localProgress: number
): number {
  return kpLispReconstructedGlobalProgress +
    clamp(localProgress) * (1 - kpLispReconstructedGlobalProgress);
}

export function unprojectKpLispEvaluateAndGatherProgress(
  globalProgress: number
): number {
  return clamp(
    (globalProgress - kpLispReconstructedGlobalProgress) /
      (1 - kpLispReconstructedGlobalProgress)
  );
}

export function createKpLispLessonMotionController(input: {
  readonly root: HTMLElement;
  readonly animation: KpAnimationAsset;
  readonly descriptor: KpEditorAnimationDescriptor;
  readonly source: KpLispLambdaApplicationAsset;
  readonly plan: KpLispBotanicalPresentationPlan;
  readonly stageProjector: KpLispLessonStageProjector;
  readonly review?: KpLispLessonReviewAdapter | undefined;
}): KpLispLessonMotionController {
  const view = input.root.ownerDocument.defaultView;
  if (view === null) throw new Error("Lisp motion controls require a browser view.");
  const stage = required<HTMLElement>(input.root, "[data-kp-lisp-stage-host]");
  const reducedMotionQuery = view.matchMedia("(prefers-reduced-motion: reduce)");
  const scrubs = Object.fromEntries(kpLispLessonMotionBlocks.map(({ id }) => [
    id,
    required<KpTutorialScrubBarElement>(
      input.root,
      `[data-kp-tutorial-motion-controls="${id}"]`
    )
  ])) as Record<KpLispLessonMotionBlockId, KpTutorialScrubBarElement>;
  let session = createKpEditorAnimationPlaybackSession({
    descriptor: input.descriptor,
    animation: input.animation,
    progress: 0
  });
  let activeBlockId: KpLispLessonMotionBlockId = "structure";
  let motionOwner: "untouched" | "navigation" | "scroll" | "manual" =
    "untouched";
  let request: number | undefined;
  let stageVisible = true;
  const review = input.review;

  const render = (): void => {
    const local = sessionProgress(session);
    const global = projectKpLispLessonRuntimeProgress(activeBlockId, local);
    const frame = sampleKpLispLambdaApplicationRuntimeFrame({
      asset: input.source,
      progress: global
    });
    const salience = projectKpLispLessonSalience({
      frame,
      plan: input.plan,
      activeBlockId,
      localProgress: local
    });
    stage.innerHTML = input.stageProjector.render({
      runtimeFrame: frame,
      activeBlockId,
      localProgress: local,
      availableWidthPx: stageWidth(stage),
      reducedMotion: reducedMotionQuery.matches
    });
    const reviewProjection = review?.project({
      activeBlockId,
      localProgress: local
    });
    input.root.dataset["kpLispTutorialProgress"] = global.toFixed(4);
    input.root.dataset["kpLispTutorialLocalProgress"] = local.toFixed(4);
    input.root.dataset["kpLispTutorialStageRenderer"] =
      input.stageProjector.rendererKind;
    input.root.dataset["kpLispTutorialActiveMotionBlock"] = activeBlockId;
    input.root.dataset["kpLispTutorialMotionOwner"] = motionOwner;
    if (reviewProjection !== undefined) {
      input.root.dataset["kpTutorialReviewMotionBlock"] = activeBlockId;
      input.root.dataset["kpTutorialReviewProgress"] = local.toFixed(4);
      input.root.dataset["kpTutorialReviewCheckpoint"] =
        reviewProjection.checkpointId;
      input.root.dataset["kpTutorialReviewMotionAuthority"] = motionOwner;
      input.root.dataset["kpTutorialReviewPlaybackDirection"] =
        session.player.direction;
    }
    // Reduced motion is a user preference, so it remains observable even when
    // navigation or manual controls own the current semantic checkpoint.
    if (reducedMotionQuery.matches) {
      input.root.dataset["kpLispTutorialScrollTimeline"] = "reduced-motion";
    } else if (motionOwner === "manual") {
      input.root.dataset["kpLispTutorialScrollTimeline"] = "manual";
    } else if (motionOwner === "navigation") {
      input.root.dataset["kpLispTutorialScrollTimeline"] = "navigation";
    }
    // Salience remains semantic evidence while visible stage emphasis is
    // intentionally paused until the lesson establishes a better grammar.
    input.root.dataset["kpLispTutorialStagePassage"] = salience.activePassageId;
    const cumulative = projectKpTutorialCumulativeMotion({
      blocks: kpLispLessonMotionBlocks,
      activeBlockId,
      localProgress: local
    });
    for (const block of kpLispLessonMotionBlocks) {
      const control = scrubs[block.id];
      const blockLocal = cumulative.find(({ id }) => id === block.id)!.progress;
      control.setAttribute("controls-disabled", "false");
      control.setAttribute("progress", blockLocal.toFixed(4));
      control.setAttribute(
        "playback-status",
        block.id === activeBlockId ? session.player.playbackStatus : "paused"
      );
      control.setAttribute("direction", session.player.direction);
      control.setAttribute("previous-disabled", String(blockLocal <= 0.001));
      control.setAttribute("next-disabled", String(blockLocal >= 0.999));
      control.setAttribute(
        "manual-claimed",
        String(motionOwner === "manual" && block.id === activeBlockId)
      );
    }
  };

  const seek = (
    blockId: KpLispLessonMotionBlockId,
    local: number
  ): void => {
    activeBlockId = blockId;
    session = reduceKpEditorAnimationPlaybackSession(session, {
      type: "seek",
      progress: session.player.direction === "rewind"
        ? 1 - clamp(local)
        : clamp(local)
    });
    cancel();
    render();
  };

  const tick = (nowMs: number): void => {
    request = undefined;
    projectSamplerCount();
    session = reduceKpEditorAnimationPlaybackSession(session, {
      type: "tick",
      nowMs
    });
    const local = sessionProgress(session);
    const boundary = session.player.direction === "forward"
      ? local >= 1
      : local <= 0;
    if (boundary) {
      seek(activeBlockId, session.player.direction === "forward" ? 1 : 0);
      return;
    }
    render();
    if (session.player.playbackStatus === "playing") {
      scheduleTick();
    }
  };

  const cancel = (): void => {
    if (request !== undefined) view.cancelAnimationFrame(request);
    request = undefined;
    projectSamplerCount();
  };

  const scheduleTick = (): void => {
    if (request !== undefined || !stageVisible || view.document.hidden) return;
    request = view.requestAnimationFrame(tick);
    projectSamplerCount();
  };

  const projectSamplerCount = (): void => {
    input.root.dataset["kpLispTutorialActiveSamplers"] =
      request === undefined ? "0" : "1";
  };

  const suspendPlayback = (reason: "offscreen" | "document-hidden"): void => {
    input.root.dataset["kpLispTutorialPlaybackVisibility"] = reason;
    if (session.player.playbackStatus !== "playing") {
      cancel();
      return;
    }
    session = reduceKpEditorAnimationPlaybackSession(session, {
      type: "pause",
      nowMs: view.performance.now()
    });
    cancel();
    render();
  };

  const setOwner = (
    owner: typeof motionOwner,
    blockId: KpLispLessonMotionBlockId
  ): void => {
    motionOwner = owner;
    activeBlockId = blockId;
    if (owner !== "manual") {
      for (const control of Object.values(scrubs)) control.releaseManualControl();
    }
  };

  const blockForEvent = (event: Event): KpLispLessonMotionBlockId | undefined => {
    if (!(event.target instanceof Element)) return undefined;
    const control = event.target.closest<HTMLElement>(
      "[data-kp-tutorial-motion-controls]"
    );
    const id = control?.dataset["kpTutorialMotionControls"];
    return isKpLispLessonMotionBlockId(id) ? id : undefined;
  };

  const onSeek = (event: Event): void => {
    const blockId = blockForEvent(event);
    if (blockId === undefined) return;
    setOwner("manual", blockId);
    seek(blockId, (event as CustomEvent<KpTutorialScrubSeekDetail>).detail.progress);
  };
  const onToggle = (event: Event): void => {
    const blockId = blockForEvent(event);
    if (blockId === undefined) return;
    const changedBlock = blockId !== activeBlockId;
    const targetProgress = displayedProgress(blockId);
    setOwner("manual", blockId);
    if (session.player.playbackStatus === "playing" && !changedBlock) {
      session = reduceKpEditorAnimationPlaybackSession(session, {
        type: "pause",
        nowMs: view.performance.now()
      });
      cancel();
      render();
    } else {
      cancel();
      if (changedBlock || targetProgress >= 0.999) {
        seek(blockId, targetProgress >= 0.999 ? 0 : targetProgress);
      }
      activeBlockId = blockId;
      session = reduceKpEditorAnimationPlaybackSession(session, {
        type: "forward",
        nowMs: view.performance.now()
      });
      cancel();
      render();
      scheduleTick();
    }
  };
  const onRewind = (event: Event): void => {
    const blockId = blockForEvent(event);
    if (blockId === undefined) return;
    const changedBlock = blockId !== activeBlockId;
    const targetProgress = displayedProgress(blockId);
    setOwner("manual", blockId);
    if (changedBlock) {
      seek(blockId, targetProgress);
    }
    activeBlockId = blockId;
    session = reduceKpEditorAnimationPlaybackSession(session, {
      type: "rewind",
      nowMs: view.performance.now()
    });
    cancel();
    render();
    scheduleTick();
  };
  const onNext = (event: Event): void => {
    const blockId = blockForEvent(event);
    if (blockId === undefined) return;
    const local = displayedProgress(blockId);
    setOwner("manual", blockId);
    const checkpoints = kpLispLessonMotionBlocks.find(({ id }) => id === blockId)!.checkpoints;
    seek(blockId, checkpoints.find(({ progress }) => progress > local + 0.001)?.progress ?? 1);
  };
  const onPrevious = (event: Event): void => {
    const blockId = blockForEvent(event);
    if (blockId === undefined) return;
    const local = displayedProgress(blockId);
    setOwner("manual", blockId);
    const checkpoints = kpLispLessonMotionBlocks.find(({ id }) => id === blockId)!.checkpoints;
    seek(blockId, [...checkpoints].reverse().find(({ progress }) => progress < local - 0.001)?.progress ?? 0);
  };

  input.root.addEventListener(KP_TUTORIAL_SCRUB_SEEK_EVENT, onSeek);
  input.root.addEventListener(KP_TUTORIAL_SCRUB_TOGGLE_EVENT, onToggle);
  input.root.addEventListener(KP_TUTORIAL_SCRUB_REWIND_EVENT, onRewind);
  input.root.addEventListener(KP_TUTORIAL_SCRUB_NEXT_EVENT, onNext);
  input.root.addEventListener(KP_TUTORIAL_SCRUB_PREVIOUS_EVENT, onPrevious);
  const resizeObserver = new ResizeObserver(() => render());
  resizeObserver.observe(stage);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    stageVisible = entry?.isIntersecting ?? false;
    if (stageVisible) {
      input.root.dataset["kpLispTutorialPlaybackVisibility"] = "visible";
    } else {
      suspendPlayback("offscreen");
    }
  });
  visibilityObserver.observe(stage);
  const onVisibilityChange = (): void => {
    if (view.document.hidden) suspendPlayback("document-hidden");
  };
  view.document.addEventListener("visibilitychange", onVisibilityChange);
  reducedMotionQuery.addEventListener("change", render);
  input.root.dataset["kpLispTutorialPlaybackVisibility"] = "visible";
  projectSamplerCount();
  render();

  return Object.freeze({
    restore: (blockId: KpLispLessonMotionBlockId, local: number) => {
      setOwner("navigation", blockId);
      seek(blockId, local);
    },
    projectScroll: (blockId: KpLispLessonMotionBlockId, local: number) => {
      setOwner("scroll", blockId);
      seek(blockId, local);
      input.root.dataset["kpLispTutorialScrollTimeline"] = local <= 0.001
        ? "rewound"
        : local >= 0.999
          ? "complete"
          : "seeking";
    },
    snapshot: () => {
      const local = sessionProgress(session);
      return Object.freeze({
        activeBlockId,
        localProgress: local,
        globalProgress: projectKpLispLessonRuntimeProgress(activeBlockId, local),
        playbackStatus: session.player.playbackStatus
      });
    },
    dispose: () => {
      cancel();
      input.root.removeEventListener(KP_TUTORIAL_SCRUB_SEEK_EVENT, onSeek);
      input.root.removeEventListener(KP_TUTORIAL_SCRUB_TOGGLE_EVENT, onToggle);
      input.root.removeEventListener(KP_TUTORIAL_SCRUB_REWIND_EVENT, onRewind);
      input.root.removeEventListener(KP_TUTORIAL_SCRUB_NEXT_EVENT, onNext);
      input.root.removeEventListener(KP_TUTORIAL_SCRUB_PREVIOUS_EVENT, onPrevious);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      view.document.removeEventListener("visibilitychange", onVisibilityChange);
      reducedMotionQuery.removeEventListener("change", render);
    }
  });

  function displayedProgress(blockId: KpLispLessonMotionBlockId): number {
    return projectKpTutorialCumulativeMotion({
      blocks: kpLispLessonMotionBlocks,
      activeBlockId,
      localProgress: sessionProgress(session)
    }).find(({ id }) => id === blockId)!.progress;
  }
}

function stageWidth(stage: HTMLElement): number {
  return stage.getBoundingClientRect().width ||
    stage.parentElement?.getBoundingClientRect().width || 720;
}

export function projectKpLispLessonRuntimeProgress(
  blockId: KpLispLessonMotionBlockId,
  local: number
): number {
  if (blockId === "structure") {
    clamp(local);
    return 0;
  }
  return blockId === "evaluation"
    ? projectKpLispEvaluateAndGatherProgress(local)
    : projectKpLispBindAndReconstructProgress(local);
}

function sessionProgress(session: KpEditorAnimationPlaybackSession): number {
  return session.player.direction === "rewind"
    ? 1 - session.player.progress
    : session.player.progress;
}

function required<ElementType extends Element>(root: ParentNode, selector: string): ElementType {
  const element = root.querySelector<ElementType>(selector);
  if (element === null) throw new Error(`Lisp tutorial is missing ${selector}.`);
  return element;
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) throw new Error("Lisp motion progress must be finite.");
  return Math.min(1, Math.max(0, value));
}
