import type { KpAnimationAsset } from "../../animation/asset.ts";
import type { KpLispBotanicalPresentationPlan } from "../../animation/lisp-botanical-presentation-plan.ts";
import { sampleKpLispLambdaApplicationRuntimeFrame } from "../../animation/lisp-lambda-application-runtime-frame.ts";
import type { KpEditorAnimationDescriptor } from "../../editor/animation-descriptor.ts";
import {
  createKpEditorAnimationPlaybackSession,
  reduceKpEditorAnimationPlaybackSession,
  type KpEditorAnimationPlaybackSession
} from "../../editor/animation-playback-session.ts";
import { renderKpLispBotanicalStageHtml } from "../../rendering/lisp-botanical-stage-html.ts";
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
import {
  kpLispLessonMotionBlocks,
  type KpLispLessonMotionBlockId
} from "./lisp-function-application-motion-blocks.ts";

export const kpLispReconstructedGlobalProgress = 0.74;

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
}): { readonly dispose: () => void } {
  const view = input.root.ownerDocument.defaultView;
  if (view === null) throw new Error("Lisp motion controls require a browser view.");
  const stage = required<HTMLElement>(input.root, "[data-kp-lisp-stage-host]");
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
  let activeBlockId: KpLispLessonMotionBlockId = "bind-and-reconstruct";
  let request: number | undefined;

  const render = (): void => {
    const global = semanticProgress(session);
    stage.innerHTML = renderKpLispBotanicalStageHtml({
      frame: sampleKpLispLambdaApplicationRuntimeFrame({
        asset: input.source,
        progress: global
      }),
      plan: input.plan,
      reducedMotion: view.matchMedia("(prefers-reduced-motion: reduce)").matches
    });
    input.root.dataset["kpLispTutorialProgress"] = global.toFixed(4);
    input.root.dataset["kpLispTutorialActiveMotionBlock"] = activeBlockId;
    for (const block of kpLispLessonMotionBlocks) {
      const control = scrubs[block.id];
      const blockLocal = localProgress(block.id, global);
      control.setAttribute("controls-disabled", "false");
      control.setAttribute("progress", blockLocal.toFixed(4));
      control.setAttribute(
        "playback-status",
        block.id === activeBlockId ? session.player.playbackStatus : "paused"
      );
      control.setAttribute("direction", session.player.direction);
      control.setAttribute("previous-disabled", String(blockLocal <= 0.001));
      control.setAttribute("next-disabled", String(blockLocal >= 0.999));
    }
  };

  const seek = (
    blockId: KpLispLessonMotionBlockId,
    local: number
  ): void => {
    activeBlockId = blockId;
    const global = globalProgress(blockId, local);
    session = reduceKpEditorAnimationPlaybackSession(session, {
      type: "seek",
      progress: session.player.direction === "rewind" ? 1 - global : global
    });
    cancel();
    render();
  };

  const tick = (nowMs: number): void => {
    session = reduceKpEditorAnimationPlaybackSession(session, {
      type: "tick",
      nowMs
    });
    const global = semanticProgress(session);
    const bounds = blockBounds(activeBlockId);
    const boundary = session.player.direction === "forward"
      ? global >= bounds.end
      : global <= bounds.start;
    if (boundary) {
      seek(activeBlockId, session.player.direction === "forward" ? 1 : 0);
      return;
    }
    render();
    if (session.player.playbackStatus === "playing") {
      request = view.requestAnimationFrame(tick);
    }
  };

  const cancel = (): void => {
    if (request !== undefined) view.cancelAnimationFrame(request);
    request = undefined;
  };

  const blockForEvent = (event: Event): KpLispLessonMotionBlockId | undefined => {
    if (!(event.target instanceof Element)) return undefined;
    const control = event.target.closest<HTMLElement>(
      "[data-kp-tutorial-motion-controls]"
    );
    const id = control?.dataset["kpTutorialMotionControls"];
    return id === "bind-and-reconstruct" || id === "evaluate-and-gather"
      ? id
      : undefined;
  };

  const onSeek = (event: Event): void => {
    const blockId = blockForEvent(event);
    if (blockId === undefined) return;
    seek(blockId, (event as CustomEvent<KpTutorialScrubSeekDetail>).detail.progress);
  };
  const onToggle = (event: Event): void => {
    const blockId = blockForEvent(event);
    if (blockId === undefined) return;
    if (session.player.playbackStatus === "playing" && blockId === activeBlockId) {
      session = reduceKpEditorAnimationPlaybackSession(session, {
        type: "pause",
        nowMs: view.performance.now()
      });
      cancel();
      render();
    } else {
      cancel();
      const local = localProgress(blockId, semanticProgress(session));
      if (blockId !== activeBlockId || local >= 0.999) {
        seek(blockId, local >= 0.999 ? 0 : local);
      }
      activeBlockId = blockId;
      session = reduceKpEditorAnimationPlaybackSession(session, {
        type: "forward",
        nowMs: view.performance.now()
      });
      cancel();
      render();
      request = view.requestAnimationFrame(tick);
    }
  };
  const onRewind = (event: Event): void => {
    const blockId = blockForEvent(event);
    if (blockId === undefined) return;
    if (blockId !== activeBlockId) {
      seek(blockId, localProgress(blockId, semanticProgress(session)));
    }
    activeBlockId = blockId;
    session = reduceKpEditorAnimationPlaybackSession(session, {
      type: "rewind",
      nowMs: view.performance.now()
    });
    cancel();
    render();
    request = view.requestAnimationFrame(tick);
  };
  const onNext = (event: Event): void => {
    const blockId = blockForEvent(event);
    if (blockId === undefined) return;
    const local = localProgress(blockId, semanticProgress(session));
    const checkpoints = kpLispLessonMotionBlocks.find(({ id }) => id === blockId)!.checkpoints;
    seek(blockId, checkpoints.find(({ progress }) => progress > local + 0.001)?.progress ?? 1);
  };
  const onPrevious = (event: Event): void => {
    const blockId = blockForEvent(event);
    if (blockId === undefined) return;
    const local = localProgress(blockId, semanticProgress(session));
    const checkpoints = kpLispLessonMotionBlocks.find(({ id }) => id === blockId)!.checkpoints;
    seek(blockId, [...checkpoints].reverse().find(({ progress }) => progress < local - 0.001)?.progress ?? 0);
  };

  input.root.addEventListener(KP_TUTORIAL_SCRUB_SEEK_EVENT, onSeek);
  input.root.addEventListener(KP_TUTORIAL_SCRUB_TOGGLE_EVENT, onToggle);
  input.root.addEventListener(KP_TUTORIAL_SCRUB_REWIND_EVENT, onRewind);
  input.root.addEventListener(KP_TUTORIAL_SCRUB_NEXT_EVENT, onNext);
  input.root.addEventListener(KP_TUTORIAL_SCRUB_PREVIOUS_EVENT, onPrevious);
  render();

  return Object.freeze({
    dispose: () => {
      cancel();
      input.root.removeEventListener(KP_TUTORIAL_SCRUB_SEEK_EVENT, onSeek);
      input.root.removeEventListener(KP_TUTORIAL_SCRUB_TOGGLE_EVENT, onToggle);
      input.root.removeEventListener(KP_TUTORIAL_SCRUB_REWIND_EVENT, onRewind);
      input.root.removeEventListener(KP_TUTORIAL_SCRUB_NEXT_EVENT, onNext);
      input.root.removeEventListener(KP_TUTORIAL_SCRUB_PREVIOUS_EVENT, onPrevious);
    }
  });
}

function globalProgress(
  blockId: KpLispLessonMotionBlockId,
  local: number
): number {
  return blockId === "evaluate-and-gather"
    ? projectKpLispEvaluateAndGatherProgress(local)
    : projectKpLispBindAndReconstructProgress(local);
}

function localProgress(
  blockId: KpLispLessonMotionBlockId,
  global: number
): number {
  return blockId === "evaluate-and-gather"
    ? unprojectKpLispEvaluateAndGatherProgress(global)
    : unprojectKpLispBindAndReconstructProgress(global);
}

function blockBounds(blockId: KpLispLessonMotionBlockId): {
  readonly start: number;
  readonly end: number;
} {
  return blockId === "evaluate-and-gather"
    ? { start: kpLispReconstructedGlobalProgress, end: 1 }
    : { start: 0, end: kpLispReconstructedGlobalProgress };
}

function semanticProgress(session: KpEditorAnimationPlaybackSession): number {
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
