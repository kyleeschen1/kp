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
import { kpLispLessonMotionBlocks } from "./lisp-function-application-motion-blocks.ts";

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

export function createKpLispBindAndReconstructController(input: {
  readonly root: HTMLElement;
  readonly animation: KpAnimationAsset;
  readonly descriptor: KpEditorAnimationDescriptor;
  readonly source: KpLispLambdaApplicationAsset;
  readonly plan: KpLispBotanicalPresentationPlan;
}): { readonly dispose: () => void } {
  const view = input.root.ownerDocument.defaultView;
  if (view === null) throw new Error("Lisp motion controls require a browser view.");
  const stage = required<HTMLElement>(input.root, "[data-kp-lisp-stage-host]");
  const scrub = required<KpTutorialScrubBarElement>(
    input.root,
    '[data-kp-tutorial-motion-controls="bind-and-reconstruct"]'
  );
  const checkpoints = kpLispLessonMotionBlocks[0]!.checkpoints;
  let session = createKpEditorAnimationPlaybackSession({
    descriptor: input.descriptor,
    animation: input.animation,
    progress: 0
  });
  let request: number | undefined;

  const render = (): void => {
    const global = semanticProgress(session);
    const local = unprojectKpLispBindAndReconstructProgress(global);
    stage.innerHTML = renderKpLispBotanicalStageHtml({
      frame: sampleKpLispLambdaApplicationRuntimeFrame({
        asset: input.source,
        progress: global
      }),
      plan: input.plan,
      reducedMotion: view.matchMedia("(prefers-reduced-motion: reduce)").matches
    });
    input.root.dataset["kpLispTutorialProgress"] = global.toFixed(4);
    scrub.setAttribute("controls-disabled", "false");
    scrub.setAttribute("progress", local.toFixed(4));
    scrub.setAttribute("playback-status", session.player.playbackStatus);
    scrub.setAttribute("direction", session.player.direction);
    scrub.setAttribute("previous-disabled", String(local <= 0.001));
    scrub.setAttribute("next-disabled", String(local >= 0.999));
  };

  const seek = (local: number): void => {
    const global = projectKpLispBindAndReconstructProgress(local);
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
    const boundary = session.player.direction === "forward"
      ? global >= kpLispReconstructedGlobalProgress
      : global <= 0;
    if (boundary) {
      seek(session.player.direction === "forward" ? 1 : 0);
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

  const owns = (event: Event): boolean =>
    event.target instanceof Element && event.target.closest(
      '[data-kp-tutorial-motion-controls="bind-and-reconstruct"]'
    ) === scrub;

  const onSeek = (event: Event): void => {
    if (!owns(event)) return;
    seek((event as CustomEvent<KpTutorialScrubSeekDetail>).detail.progress);
  };
  const onToggle = (event: Event): void => {
    if (!owns(event)) return;
    if (session.player.playbackStatus === "playing") {
      session = reduceKpEditorAnimationPlaybackSession(session, {
        type: "pause",
        nowMs: view.performance.now()
      });
      cancel();
      render();
    } else {
      if (unprojectKpLispBindAndReconstructProgress(semanticProgress(session)) >= 0.999) {
        seek(0);
      }
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
    if (!owns(event)) return;
    session = reduceKpEditorAnimationPlaybackSession(session, {
      type: "rewind",
      nowMs: view.performance.now()
    });
    cancel();
    render();
    request = view.requestAnimationFrame(tick);
  };
  const onNext = (event: Event): void => {
    if (!owns(event)) return;
    const local = unprojectKpLispBindAndReconstructProgress(semanticProgress(session));
    seek(checkpoints.find(({ progress }) => progress > local + 0.001)?.progress ?? 1);
  };
  const onPrevious = (event: Event): void => {
    if (!owns(event)) return;
    const local = unprojectKpLispBindAndReconstructProgress(semanticProgress(session));
    seek([...checkpoints].reverse().find(({ progress }) => progress < local - 0.001)?.progress ?? 0);
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
