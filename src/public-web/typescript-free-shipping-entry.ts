import "../rendering/typescript-refactor.css";
import "./typescript-free-shipping-public.css";

import { sampleKpTypeScriptRefactorMotionFrame } from
  "../animation/typescript-refactor-motion-frame.ts";
import {
  createKpTypeScriptRefactorTokenProgram,
  sampleKpTypeScriptRefactorTokenTheater
} from "../animation/typescript-refactor-token-theater.ts";
import { createKpReaderTimelinePlaybackClock } from
  "../reader/runtime/timeline-playback-clock.ts";
import { renderKpTypeScriptRefactorDomFrame } from
  "../rendering/typescript-refactor-dom-session.ts";
import { kpTypeScriptFreeShippingPublicPath } from
  "./typescript-free-shipping-route.ts";
import { createKpTypeScriptFreeShippingRuntimeProjection } from
  "./typescript-free-shipping-runtime.ts";

const exemplar = createKpTypeScriptFreeShippingRuntimeProjection();
type KpDevelopmentToolbarClient = typeof import(
  "../dev-toolbar/development-toolbar-bootstrap.ts"
);
type KpDevelopmentReviewClient = typeof import(
  "./typescript-free-shipping-dev-review.ts"
);
const loadDevelopmentChrome:
  | (() => Promise<readonly [KpDevelopmentToolbarClient,
      KpDevelopmentReviewClient]>)
  | undefined = import.meta.env.DEV
    ? () => Promise.all([
        import("../dev-toolbar/development-toolbar-bootstrap.ts"),
        import("./typescript-free-shipping-dev-review.ts")
      ])
    : undefined;

export function mountKpTypeScriptFreeShippingPublicLesson(input: {
  readonly root: ParentNode;
  readonly ownerWindow?: Window | undefined;
}): () => void {
  const ownerDocument = input.root instanceof Document
    ? input.root
    : input.root.ownerDocument;
  if (ownerDocument === null) {
    throw new Error("Public TypeScript lesson needs a document.");
  }
  const ownerWindow = input.ownerWindow ?? ownerDocument.defaultView;
  if (ownerWindow === null) throw new Error("Public TypeScript lesson needs a window.");
  const stage = required<HTMLElement>(
    input.root,
    "[data-kp-typescript-refactor-stage]"
  );
  const stageHost = required<HTMLElement>(
    input.root,
    "[data-kp-public-typescript-stage]"
  );
  const play = required<HTMLButtonElement>(
    input.root,
    "[data-kp-public-typescript-play]"
  );
  const seek = required<HTMLInputElement>(
    input.root,
    "[data-kp-public-typescript-seek]"
  );
  const output = required<HTMLOutputElement>(
    input.root,
    "[data-kp-public-typescript-progress]"
  );
  const checkpointLinks = [
    ...input.root.querySelectorAll<HTMLAnchorElement>(
      "[data-kp-public-typescript-checkpoint]"
    )
  ];
  const reducedMotion = ownerWindow.matchMedia("(prefers-reduced-motion: reduce)");
  const checkpoints = new Map(exemplar.score.stages.map((checkpoint) => [
    checkpoint.id,
    checkpoint.checkpointMs / exemplar.score.durationMs
  ]));
  const tokenProgram = createKpTypeScriptRefactorTokenProgram(
    exemplar.semantics
  );
  const initial = progressFromLocation(ownerWindow.location, checkpoints);
  const clock = createKpReaderTimelinePlaybackClock({
    id: "public.typescript.free-shipping.clock",
    durationMs: exemplar.score.durationMs,
    initialProgress: initial,
    ownerWindow
  });

  const render = (): void => {
    const progress = clock.getSnapshot().progress;
    const motion = sampleKpTypeScriptRefactorMotionFrame({
      score: exemplar.score,
      progress,
      reducedMotion: reducedMotion.matches
    });
    const theater = sampleKpTypeScriptRefactorTokenTheater({
      program: tokenProgram,
      plan: exemplar.motionPlan,
      score: exemplar.score,
      progress,
      reducedMotion: reducedMotion.matches
    });
    renderKpTypeScriptRefactorDomFrame(
      stage,
      { motion, theater },
      exemplar.accessibility.title
    );
    seek.value = String(progress);
    output.value = `${Math.round(progress * 100)}%`;
    play.textContent = clock.getStatus() === "playing"
      ? "Pause"
      : progress >= 0.999
        ? "Replay"
        : "Play";
    stageHost.dataset["kpPublicTypescriptProgress"] = progress.toFixed(4);
    stageHost.dataset["kpPublicTypescriptCheckpoint"] =
      motion.stage.stageId;
    checkpointLinks.forEach((link) => {
      const current = link.dataset["kpPublicTypescriptCheckpoint"] ===
        motion.stage.stageId;
      if (current) link.setAttribute("aria-current", "step");
      else link.removeAttribute("aria-current");
    });
  };
  const unsubscribe = clock.subscribe(render);
  const directSeek = (progress: number, updateUrl: boolean): void => {
    clock.seek(reducedMotion.matches ? nearestCheckpoint(progress) : progress,
      updateUrl ? "url" : "controls");
    if (updateUrl) writeCheckpointUrl(ownerWindow, checkpointAt(progress));
  };
  const onPlay = (): void => {
    if (clock.getStatus() === "playing") {
      clock.pause();
      render();
      return;
    }
    if (clock.getSnapshot().progress >= 0.999) clock.seek(0);
    if (reducedMotion.matches) {
      directSeek(nextCheckpoint(clock.getSnapshot().progress), true);
      return;
    }
    clock.play({ direction: "forward", stopAt: 1 });
    render();
  };
  const onSeek = (): void => directSeek(Number(seek.value), false);
  const onCheckpoint = (event: Event): void => {
    const link = event.currentTarget as HTMLAnchorElement;
    const id = link.dataset["kpPublicTypescriptCheckpoint"];
    const progress = id === undefined ? undefined : checkpoints.get(id);
    if (id === undefined || progress === undefined) return;
    event.preventDefault();
    directSeek(progress, true);
  };
  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (event.target instanceof HTMLInputElement) return;
    event.preventDefault();
    directSeek(event.key === "ArrowRight"
      ? nextCheckpoint(clock.getSnapshot().progress)
      : previousCheckpoint(clock.getSnapshot().progress), true);
  };
  const onPopState = (): void => directSeek(
    progressFromLocation(ownerWindow.location, checkpoints),
    false
  );
  const onMotionPreference = (): void => directSeek(
    clock.getSnapshot().progress,
    false
  );

  play.disabled = false;
  seek.disabled = false;
  play.addEventListener("click", onPlay);
  seek.addEventListener("input", onSeek);
  checkpointLinks.forEach((link) => link.addEventListener("click", onCheckpoint));
  stageHost.addEventListener("keydown", onKeydown);
  ownerWindow.addEventListener("popstate", onPopState);
  reducedMotion.addEventListener("change", onMotionPreference);
  stageHost.dataset["kpPublicTypescriptEnhanced"] = "true";
  // URL restoration paints one endpoint immediately; it never replays history.
  clock.seek(initial, "url");
  render();

  return () => {
    unsubscribe();
    clock.dispose();
    play.removeEventListener("click", onPlay);
    seek.removeEventListener("input", onSeek);
    checkpointLinks.forEach((link) =>
      link.removeEventListener("click", onCheckpoint));
    stageHost.removeEventListener("keydown", onKeydown);
    ownerWindow.removeEventListener("popstate", onPopState);
    reducedMotion.removeEventListener("change", onMotionPreference);
    delete stageHost.dataset["kpPublicTypescriptEnhanced"];
  };
}

function progressFromLocation(
  location: Location,
  checkpoints: ReadonlyMap<string, number>
): number {
  const id = new URLSearchParams(location.search).get("checkpoint");
  return id === null ? 0 : checkpoints.get(id) ?? 0;
}

function checkpointAt(progress: number): string {
  return exemplar.score.stages.reduce((selected, candidate) => {
    const candidateProgress = candidate.checkpointMs / exemplar.score.durationMs;
    const selectedProgress = selected.checkpointMs / exemplar.score.durationMs;
    return Math.abs(candidateProgress - progress) <
      Math.abs(selectedProgress - progress) ? candidate : selected;
  }).id;
}

function nearestCheckpoint(progress: number): number {
  const id = checkpointAt(progress);
  return exemplar.score.stages.find(({ id: candidate }) => candidate === id)!
    .checkpointMs / exemplar.score.durationMs;
}

function nextCheckpoint(progress: number): number {
  return exemplar.score.stages
    .map(({ checkpointMs }) => checkpointMs / exemplar.score.durationMs)
    .find((candidate) => candidate > progress + 0.0001) ?? 1;
}

function previousCheckpoint(progress: number): number {
  return exemplar.score.stages
    .map(({ checkpointMs }) => checkpointMs / exemplar.score.durationMs)
    .filter((candidate) => candidate < progress - 0.0001)
    .at(-1) ?? 0;
}

function writeCheckpointUrl(ownerWindow: Window, checkpointId: string): void {
  const url = new URL(kpTypeScriptFreeShippingPublicPath, ownerWindow.location.href);
  url.searchParams.set("checkpoint", checkpointId);
  url.hash = "refactor-stage";
  ownerWindow.history.pushState({}, "", url);
}

function required<Element extends globalThis.Element>(
  root: ParentNode,
  selector: string
): Element {
  const element = root.querySelector<Element>(selector);
  if (element === null) throw new Error(`Missing public lesson element ${selector}.`);
  return element;
}

const root = document.querySelector<HTMLElement>("[data-kp-public-typescript-lesson]");
if (root !== null) {
  const dispose = mountKpTypeScriptFreeShippingPublicLesson({ root });
  let disposeChrome = (): void => undefined;
  if (loadDevelopmentChrome !== undefined) {
    void loadDevelopmentChrome().then(([toolbar, review]) => {
      const toolbarSession = toolbar.mountKpDevelopmentToolbar(window);
      const disposeReview = review.mountKpTypeScriptFreeShippingDevReview(window);
      disposeChrome = () => {
        disposeReview();
        toolbarSession.dispose();
      };
    });
  }
  window.addEventListener("pagehide", () => {
    dispose();
    disposeChrome();
  }, { once: true });
}
