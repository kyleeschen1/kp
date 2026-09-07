/// <reference types="vite/client" />

import instruction from "./typescript-instruction.generated.json" with { type: "json" };
import { sampleKpTypeScriptRefactorMotionFrame } from
  "../../animation/typescript-refactor-motion-frame.ts";
import {
  createKpTypeScriptRefactorTokenProgram,
  sampleKpTypeScriptRefactorTokenTheater
} from "../../animation/typescript-refactor-token-theater.ts";
import { createKpReaderTimelinePlaybackClock } from
  "../../reader/runtime/timeline-playback-clock.ts";
import { renderKpTypeScriptRefactorCodeHtml } from
  "../../rendering/typescript-refactor-code-html.ts";
import { renderKpTypeScriptRefactorDomFrame } from
  "../../rendering/typescript-refactor-dom-session.ts";
import { kpTypeScriptFreeShippingPublicPath } from
  "../../public-web/typescript-free-shipping-route.ts";
import { createKpTypeScriptFreeShippingRuntimeProjection } from
  "../../public-web/typescript-free-shipping-runtime.ts";
import { renderKpFocusDeckScaffold } from "../focus-deck-scaffold.ts";
import {
  findKpTypeScriptFocusCardBeatIndexFromHash,
  kpTypeScriptFocusCardBeatHash,
  readKpTypeScriptFocusCardBeatIndexFromHash,
  sampleKpTypeScriptFocusCardPosition,
  type KpTypeScriptFocusCardBeatV1,
  type KpTypeScriptFocusCardScoreV1
} from "./kinetic-figure-typescript-focus-card-model.ts";

const progressTolerance = 0.0001;

export interface KpTypeScriptFocusCardAuthority {
  readonly runtime: ReturnType<
    typeof createKpTypeScriptFreeShippingRuntimeProjection
  >;
  readonly score: KpTypeScriptFocusCardScoreV1;
}

export interface KpTypeScriptFocusCardSession {
  dispose(): void;
}

interface PendingMotion {
  readonly targetIndex: number;
  readonly sourceProgress: number;
  readonly targetProgress: number;
  readonly direction: "forward" | "rewind";
}

type CursorMotion = "immediate" | "transition";

export function createKpTypeScriptFocusCardAuthority():
KpTypeScriptFocusCardAuthority {
  const runtime = createKpTypeScriptFreeShippingRuntimeProjection();
  return Object.freeze({
    runtime,
    score: instruction.score as KpTypeScriptFocusCardScoreV1
  });
}

export function renderKpTypeScriptFocusCard(input: {
  readonly authority: KpTypeScriptFocusCardAuthority;
  readonly initialIndex: number;
}): string {
  const { runtime, score } = input.authority;
  const initialIndex = boundedIndex(input.initialIndex, score.beats.length);
  const initial = score.beats[initialIndex]!;
  const runtimeStage = requireRuntimeStage(runtime, initial.stageId);
  const motion = sampleKpTypeScriptRefactorMotionFrame({
    score: runtime.score,
    progress: initial.timelineProgress
  });
  const code = renderKpTypeScriptRefactorCodeHtml({
    semantics: runtime.semantics,
    stageId: runtimeStage.id,
    narration: runtimeStage.narration,
    activeProjectionId: motion.accessibleProjectionId,
    focusSelectorIds: runtimeStage.focusSelectorIds,
    theme: "light",
    accessibleDescription:
      `${runtime.accessibility.title}. ${runtimeStage.narration}`
  });
  return `<section class="kp-typescript-focus-card-section" aria-labelledby="kp-typescript-focus-card-title">
    <header class="kp-supply-tax-page__intro kp-typescript-focus-card__intro">
      <p>Focus Deck · TypeScript</p>
      <h1 id="kp-typescript-focus-card-title">How do two rules become one?</h1>
    </header>
    ${renderKpFocusDeckScaffold({
      id: "focus-deck.programming.typescript-free-shipping.v1",
      ariaLabel: "TypeScript extract-helper Focus Deck",
      activeBeatSlug: initial.slug,
      headerTrailingHtml:
        `<a class="kp-typescript-focus-card__source-link" href="${kpTypeScriptFreeShippingPublicPath}#refactor-stage">Read the article</a>`,
      stageHtml: `<figure class="kp-focus-deck__stage kp-typescript-focus-card__stage" data-kp-typescript-focus-card-stage>
        <figcaption class="kp-focus-deck__visually-hidden">Two duplicated free-shipping conditions become one named TypeScript helper while program behavior remains unchanged.</figcaption>
        ${code}
      </figure>`,
      beats: score.beats.map((beat) => ({
        slug: beat.slug,
        title: beat.title,
        html: (instruction.phraseHtml as Readonly<Record<string, string>>)[beat.id]!,
        domId: beat.id,
        attributes: {
          "data-kp-typescript-focus-card-beat": beat.slug,
          "data-kp-typescript-stage-id": beat.stageId,
          "data-kp-typescript-source-block-id": beat.sourceBlockId,
          "data-kp-typescript-timeline-progress":
            beat.timelineProgress.toFixed(6)
        }
      })),
      rootAttributes: {
        "data-kp-typescript-focus-card": true,
        "data-kp-typescript-animation-id": runtime.id,
        "data-kp-typescript-focus-card-transition": "settled",
        "data-kp-typescript-focus-card-timeline-progress":
          initial.timelineProgress.toFixed(6),
        "data-kp-typescript-focus-card-deck-position":
          initialIndex.toFixed(4),
        "data-kp-typescript-focus-card-source-block": initial.sourceBlockId
      },
      replayAttributes: {
        "data-kp-typescript-focus-card-replay": true
      },
      replayHidden: !initial.ownsMotionFromPrevious,
      classAliases: {
        root: "kp-typescript-focus-card"
      }
    })}
  </section>`;
}

export function readKpTypeScriptFocusCardInitialIndex(
  authority: KpTypeScriptFocusCardAuthority,
  hash: string
): number {
  return readKpTypeScriptFocusCardBeatIndexFromHash(authority.score, hash);
}

export function mountKpTypeScriptFocusCard(input: {
  readonly root: ParentNode;
  readonly authority: KpTypeScriptFocusCardAuthority;
}): KpTypeScriptFocusCardSession {
  const { runtime, score } = input.authority;
  const deck = requiredElement<HTMLElement>(input.root,
    "[data-kp-typescript-focus-card]");
  const stage = requiredElement<HTMLElement>(deck,
    "[data-kp-typescript-refactor-stage]");
  const viewport = requiredElement<HTMLElement>(deck,
    "[data-kp-focus-deck-viewport]");
  const scrubber = requiredElement<HTMLInputElement>(deck,
    "[data-kp-focus-deck-scrubber]");
  const scrubberField = requiredElement<HTMLElement>(deck,
    ".kp-focus-deck__scrubber");
  const previous = requiredElement<HTMLButtonElement>(deck,
    "[data-kp-focus-deck-previous]");
  const next = requiredElement<HTMLButtonElement>(deck,
    "[data-kp-focus-deck-next]");
  const replay = requiredElement<HTMLButtonElement>(deck,
    "[data-kp-typescript-focus-card-replay]");
  const ownerDocument = deck.ownerDocument;
  const ownerWindow = ownerDocument.defaultView;
  if (ownerWindow === null) {
    throw new Error("TypeScript Focus Deck requires a browser window.");
  }
  const reducedMotion = ownerWindow.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  const tokenProgram = createKpTypeScriptRefactorTokenProgram(
    runtime.semantics
  );
  let activeIndex = readKpTypeScriptFocusCardBeatIndexFromHash(
    score,
    ownerWindow.location.hash
  );
  const clock = createKpReaderTimelinePlaybackClock({
    id: "clock.focus-deck.programming.typescript-free-shipping.v1",
    durationMs: runtime.score.durationMs,
    initialProgress: score.beats[activeIndex]!.timelineProgress,
    ownerWindow
  });
  let pendingMotion: PendingMotion | undefined;
  let disposed = false;

  const cursorTrack = ownerDocument.createElement("span");
  cursorTrack.dataset["kpTypescriptFocusCardCursorTrack"] = "true";
  cursorTrack.setAttribute("aria-hidden", "true");
  const cursor = ownerDocument.createElement("span");
  cursor.dataset["kpTypescriptFocusCardCursor"] = "true";
  cursorTrack.append(cursor);
  scrubberField.append(cursorTrack);
  deck.dataset["kpTypescriptFocusCardCursorEnhanced"] = "true";

  const renderFrame = (): void => {
    const progress = clock.getSnapshot().progress;
    const motion = sampleKpTypeScriptRefactorMotionFrame({
      score: runtime.score,
      progress,
      reducedMotion: reducedMotion.matches
    });
    const theater = sampleKpTypeScriptRefactorTokenTheater({
      program: tokenProgram,
      plan: runtime.motionPlan,
      score: runtime.score,
      progress,
      reducedMotion: reducedMotion.matches
    });
    renderKpTypeScriptRefactorDomFrame(
      stage,
      { motion, theater },
      runtime.accessibility.title
    );
    deck.dataset["kpTypescriptFocusCardTimelineProgress"] =
      progress.toFixed(6);
  };

  const projectPosition = (
    requestedPosition: number,
    cursorMotion: CursorMotion
  ): void => {
    const sample = sampleKpTypeScriptFocusCardPosition(
      score,
      requestedPosition
    );
    const percent = sample.position /
      Math.max(1, score.beats.length - 1) * 100;
    scrubber.value = sample.position.toFixed(4);
    scrubber.style.setProperty(
      "--kp-focus-deck-scrubber-progress",
      `${percent.toFixed(3)}%`
    );
    deck.dataset["kpTypescriptFocusCardCursorMotion"] = cursorMotion;
    cursor.style.setProperty(
      "--kp-typescript-focus-card-cursor-progress",
      `${percent.toFixed(3)}%`
    );
    deck.dataset["kpTypescriptFocusCardDeckPosition"] =
      sample.position.toFixed(4);
    // A code frame may be meaningfully scrubbed between checkpoints, but prose
    // is a semantic beat rather than interpolated paint. Keep one complete
    // passage visible instead of exposing two clipped half-pages.
    viewport.scrollLeft = Math.round(sample.position) *
      Math.max(1, viewport.clientWidth);
  };

  const projectChrome = (requestedIndex: number): void => {
    const index = boundedIndex(requestedIndex, score.beats.length);
    const beat = score.beats[index]!;
    activeIndex = index;
    deck.dataset["kpFocusDeckActiveBeat"] = beat.slug;
    deck.dataset["kpTypescriptFocusCardSourceBlock"] = beat.sourceBlockId;
    deck.querySelectorAll<HTMLElement>("[data-kp-focus-deck-beat]")
      .forEach((passage, passageIndex) => {
        const active = passageIndex === index;
        passage.dataset["kpFocusDeckBeatActive"] = String(active);
        if (active) passage.setAttribute("aria-current", "page");
        else passage.removeAttribute("aria-current");
      });
    previous.disabled = index === 0;
    next.disabled = index === score.beats.length - 1;
    replay.hidden = !beat.ownsMotionFromPrevious;
    const status = statusText(beat, index, score.beats.length);
    scrubber.setAttribute("aria-valuetext", status);
    requiredElement<HTMLOutputElement>(deck,
      "[data-kp-focus-deck-position]").value = status;
  };

  const updateLocation = (
    index: number,
    historyMode: "none" | "push" | "replace"
  ): void => {
    if (historyMode === "none") return;
    const hash = kpTypeScriptFocusCardBeatHash(score.beats[index]!);
    if (ownerWindow.location.hash === hash) return;
    if (historyMode === "push") {
      ownerWindow.history.pushState(null, "", hash);
    } else {
      ownerWindow.history.replaceState(null, "", hash);
    }
  };

  const finishMotion = (motion: PendingMotion): void => {
    pendingMotion = undefined;
    clock.pause();
    clock.seek(motion.targetProgress, "controls");
    projectPosition(motion.targetIndex, "immediate");
    deck.dataset["kpTypescriptFocusCardTransition"] = "settled";
  };

  const cancelMotion = (): void => {
    pendingMotion = undefined;
    clock.pause();
  };

  const select = (
    requestedIndex: number,
    options: Readonly<{
      animate?: boolean;
      history?: "none" | "push" | "replace";
      cursorMotion?: CursorMotion;
    }> = {}
  ): void => {
    const targetIndex = boundedIndex(requestedIndex, score.beats.length);
    const interrupted = pendingMotion;
    if (interrupted !== undefined) {
      if (options.animate !== false) finishMotion(interrupted);
      else cancelMotion();
    }
    const fromIndex = activeIndex;
    const target = score.beats[targetIndex]!;
    const sourceProgress = clock.getSnapshot().progress;
    const targetProgress = target.timelineProgress;
    const adjacent = Math.abs(targetIndex - fromIndex) === 1;
    const edgeOwnsMotion = targetIndex > fromIndex
      ? target.ownsMotionFromPrevious
      : score.beats[fromIndex]!.ownsMotionFromPrevious;
    const animate = options.animate !== false &&
      !reducedMotion.matches && adjacent && edgeOwnsMotion &&
      Math.abs(targetProgress - sourceProgress) > progressTolerance;
    projectChrome(targetIndex);
    projectPosition(targetIndex, options.cursorMotion ??
      (options.animate === false ? "immediate" : "transition"));
    updateLocation(targetIndex, options.history ?? "push");
    if (!animate) {
      clock.seek(targetProgress, options.history === "none" ? "url" : "controls");
      deck.dataset["kpTypescriptFocusCardTransition"] = "settled";
      deck.dataset["kpTypescriptFocusCardMotionDecision"] = "static";
      deck.dataset["kpTypescriptFocusCardMotionReason"] =
        options.animate === false
          ? "direct-seek"
          : reducedMotion.matches
            ? "reduced-motion"
            : !adjacent
              ? "non-adjacent"
              : !edgeOwnsMotion
                ? "attention-only-edge"
                : "already-at-target";
      return;
    }
    const direction = targetProgress > sourceProgress ? "forward" : "rewind";
    pendingMotion = {
      targetIndex,
      sourceProgress,
      targetProgress,
      direction
    };
    deck.dataset["kpTypescriptFocusCardTransition"] = "active";
    deck.dataset["kpTypescriptFocusCardMotionDecision"] = "animate";
    deck.dataset["kpTypescriptFocusCardMotionReason"] =
      "motion-owning-adjacent-edge";
    clock.play({ direction, stopAt: targetProgress });
  };

  const handlePrevious = (): void => select(activeIndex - 1);
  const handleNext = (): void => select(activeIndex + 1);
  const handleReplay = (): void => {
    const target = score.beats[activeIndex]!;
    if (!target.ownsMotionFromPrevious || activeIndex === 0) return;
    if (pendingMotion !== undefined) finishMotion(pendingMotion);
    const sourceProgress = score.beats[activeIndex - 1]!.timelineProgress;
    if (reducedMotion.matches) {
      clock.seek(target.timelineProgress, "controls");
      return;
    }
    clock.seek(sourceProgress, "controls");
    pendingMotion = {
      targetIndex: activeIndex,
      sourceProgress,
      targetProgress: target.timelineProgress,
      direction: "forward"
    };
    deck.dataset["kpTypescriptFocusCardTransition"] = "active";
    deck.dataset["kpTypescriptFocusCardMotionDecision"] = "animate";
    deck.dataset["kpTypescriptFocusCardMotionReason"] = "replay";
    clock.play({ direction: "forward", stopAt: target.timelineProgress });
  };
  const handleScrubberInput = (): void => {
    cancelMotion();
    const sample = sampleKpTypeScriptFocusCardPosition(
      score,
      Number(scrubber.value)
    );
    projectChrome(Math.round(sample.position));
    projectPosition(sample.position, "immediate");
    clock.seek(sample.timelineProgress, "controls");
    deck.dataset["kpTypescriptFocusCardTransition"] = "scrubbing";
    deck.dataset["kpTypescriptFocusCardMotionDecision"] = "static";
    deck.dataset["kpTypescriptFocusCardMotionReason"] = "scrubber";
  };
  const finishScrubber = (): void => select(Math.round(Number(scrubber.value)), {
    animate: false,
    history: "push",
    cursorMotion: "immediate"
  });
  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLButtonElement ||
        event.target instanceof HTMLAnchorElement) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    select(activeIndex + (event.key === "ArrowRight" ? 1 : -1));
  };
  const handleLocation = (): void => {
    const index = findKpTypeScriptFocusCardBeatIndexFromHash(
      score,
      ownerWindow.location.hash
    );
    if (index === undefined) return;
    select(index, {
      animate: false,
      history: "none",
      cursorMotion: "immediate"
    });
  };
  const handleReducedMotion = (): void => {
    if (pendingMotion !== undefined) finishMotion(pendingMotion);
    else clock.seek(score.beats[activeIndex]!.timelineProgress, "controls");
  };
  const handleResize = (): void => projectPosition(activeIndex, "immediate");

  const unsubscribe = clock.subscribe((sample) => {
    renderFrame();
    const motion = pendingMotion;
    if (motion === undefined || !sample.settled ||
        Math.abs(sample.progress - motion.targetProgress) > progressTolerance) {
      return;
    }
    pendingMotion = undefined;
    deck.dataset["kpTypescriptFocusCardTransition"] = "settled";
  });

  previous.addEventListener("click", handlePrevious);
  next.addEventListener("click", handleNext);
  replay.addEventListener("click", handleReplay);
  scrubber.addEventListener("input", handleScrubberInput);
  scrubber.addEventListener("change", finishScrubber);
  deck.addEventListener("keydown", handleKeydown);
  ownerWindow.addEventListener("popstate", handleLocation);
  ownerWindow.addEventListener("hashchange", handleLocation);
  ownerWindow.addEventListener("resize", handleResize);
  reducedMotion.addEventListener("change", handleReducedMotion);

  projectChrome(activeIndex);
  projectPosition(activeIndex, "immediate");
  clock.seek(score.beats[activeIndex]!.timelineProgress, "url");
  deck.dataset["kpTypescriptFocusCardTransition"] = "settled";
  renderFrame();

  return Object.freeze({
    dispose: () => {
      if (disposed) return;
      disposed = true;
      previous.removeEventListener("click", handlePrevious);
      next.removeEventListener("click", handleNext);
      replay.removeEventListener("click", handleReplay);
      scrubber.removeEventListener("input", handleScrubberInput);
      scrubber.removeEventListener("change", finishScrubber);
      deck.removeEventListener("keydown", handleKeydown);
      ownerWindow.removeEventListener("popstate", handleLocation);
      ownerWindow.removeEventListener("hashchange", handleLocation);
      ownerWindow.removeEventListener("resize", handleResize);
      reducedMotion.removeEventListener("change", handleReducedMotion);
      unsubscribe();
      clock.dispose();
      cursorTrack.remove();
    }
  });
}

function requireRuntimeStage(
  runtime: KpTypeScriptFocusCardAuthority["runtime"],
  stageId: string
) {
  const stage = runtime.score.stages.find(({ id }) => id === stageId);
  if (stage === undefined) {
    throw new Error(`TypeScript Focus Deck cannot resolve ${stageId}.`);
  }
  return stage;
}

function statusText(
  beat: KpTypeScriptFocusCardBeatV1,
  index: number,
  count: number
): string {
  return `Step ${index + 1} of ${count}: ${beat.title}`;
}

function boundedIndex(index: number, count: number): number {
  return Math.max(0, Math.min(count - 1, Math.round(index)));
}

function requiredElement<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) {
    throw new Error(`Missing TypeScript Focus Deck element ${selector}.`);
  }
  return element;
}
