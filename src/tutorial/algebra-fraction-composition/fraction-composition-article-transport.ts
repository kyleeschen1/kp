import {
  defineKpReaderPlaybackRangeWindow,
  projectKpReaderRangeLocalProgress,
  sampleKpReaderPlaybackRange,
  type KpReaderClockSample,
  type KpReaderPlaybackRangeWindow
} from "../../reader/runtime/public-api.ts";
import {
  createKpReaderTimelinePlaybackClock
} from "../../reader/runtime/timeline-playback-clock.ts";
import type {
  KpChromeFreeCanonicalEquationSession
} from "../../reader/app/chrome-free-canonical-equation-session.ts";
import type {
  KpReaderFocusSnapshot
} from "../../reader/runtime/semantic-focus.ts";

export interface KpFractionCompositionArticleTransport {
  readonly element: HTMLElement;
  selectRange(
    range: KpReaderPlaybackRangeWindow,
    progress?: number,
    source?: "controls" | "url"
  ): void;
  seekGlobal(
    progress: number,
    source?: "controls" | "url"
  ): void;
  setFocus(focus: KpReaderFocusSnapshot): void;
  play(direction: "forward" | "rewind"): void;
  pause(): void;
  dispose(): void;
}

/**
 * The Article owns transport but never owns animation time. Its local slider
 * projects into one canonical full-timeline clock, which the shared session
 * samples without remapping or recreating the fraction choreography.
 */
export function mountKpFractionCompositionArticleTransport(input: {
  readonly ownerWindow: Window;
  readonly host: HTMLElement;
  readonly stage: HTMLElement;
  readonly session: KpChromeFreeCanonicalEquationSession;
  readonly range: KpReaderPlaybackRangeWindow;
  readonly durationMs: number;
  readonly initialFocus: KpReaderFocusSnapshot;
}): KpFractionCompositionArticleTransport {
  let range = defineKpReaderPlaybackRangeWindow(input.range);
  const document = input.ownerWindow.document;
  const element = document.createElement("div");
  element.className = "kp-algebra-article__range-transport";
  element.dataset["kpAlgebraRangeTransport"] = range.id;
  element.setAttribute("role", "group");
  element.setAttribute("aria-label", "Animation controls");

  const play = transportButton(document, "Play", "play");
  const pause = transportButton(document, "Pause", "pause");
  const replay = transportButton(document, "Replay", "replay");
  const scrubLabel = document.createElement("label");
  scrubLabel.className = "kp-algebra-article__range-scrubber";
  const scrubLabelText = document.createElement("span");
  scrubLabelText.className = "kp-reader-visually-hidden";
  scrubLabelText.textContent = "Animation progress";
  const scrubber = document.createElement("input");
  scrubber.type = "range";
  scrubber.min = "0";
  scrubber.max = "1000";
  scrubber.step = "1";
  scrubber.value = "0";
  scrubber.dataset["kpAlgebraRangeScrubber"] = "";
  scrubLabel.append(scrubLabelText, scrubber);
  const status = document.createElement("output");
  status.className = "kp-algebra-article__range-status";
  status.dataset["kpAlgebraRangeStatus"] = "";
  status.setAttribute("aria-live", "polite");
  element.append(play, pause, replay, scrubLabel, status);

  const progressBar = input.stage.querySelector<HTMLElement>(
    "[data-kp-reader-progress-bar]"
  );
  const reducedMotion = input.ownerWindow.matchMedia(
    "(prefers-reduced-motion: reduce)"
  );
  const clock = createKpReaderTimelinePlaybackClock({
    id: "reader.article.fraction-composition.canonical-full-timeline",
    durationMs: input.durationMs,
    initialProgress: range.start,
    ownerWindow: input.ownerWindow
  });
  input.host.dataset["kpAlgebraCanonicalClock"] = clock.id;
  input.host.dataset["kpAlgebraCanonicalRange"] = range.id;
  let previousGlobalProgress = range.start;
  let currentFocus = input.initialFocus;
  let disposed = false;

  const syncTransportStatus = (
    rangeStatus: "idle" | "playing" | "paused" | "settled",
    localProgress: number
  ): void => {
    const isPlaying = rangeStatus === "playing";
    input.host.dataset["kpAlgebraCanonicalRangeStatus"] = rangeStatus;
    play.disabled = isPlaying;
    pause.disabled = !isPlaying;
    const nextStatus = isPlaying
      ? "Playing"
      : localProgress === 1
        ? "Complete"
        : localProgress === 0
          ? "Ready"
          : "Paused";
    // Avoid re-announcing the same live-region text on every animation frame.
    if (status.value !== nextStatus) status.value = nextStatus;
  };

  const render = (clockSample: KpReaderClockSample): void => {
    if (disposed) return;
    const rangeSample = sampleKpReaderPlaybackRange({
      range,
      globalProgress: clockSample.progress,
      previousGlobalProgress,
      // A terminal autoplay sample is settled even though its clock has
      // already changed to paused before notifying subscribers.
      status: clockSample.source === "autoplay" && clockSample.settled
        ? "playing"
        : clock.getStatus()
    });
    input.session.sample({ clock: clockSample, focus: currentFocus });
    const localPermille = Math.round(rangeSample.localProgress * 1_000);
    input.host.dataset["kpAlgebraCanonicalGlobalProgress"] =
      String(clockSample.progressPermille);
    input.host.dataset["kpAlgebraCanonicalLocalProgress"] =
      String(localPermille);
    input.host.dataset["kpAlgebraCanonicalClockSource"] = clockSample.source;
    input.host.dataset["kpAlgebraCanonicalRangeBoundary"] =
      rangeSample.boundary;
    scrubber.value = String(localPermille);
    scrubber.setAttribute("aria-valuetext", `${localPermille / 10}%`);
    progressBar?.style.setProperty(
      "transform",
      `scaleX(${rangeSample.localProgress})`
    );
    syncTransportStatus(rangeSample.status, rangeSample.localProgress);
    previousGlobalProgress = clockSample.progress;
  };
  const unsubscribe = clock.subscribe(render);
  const seekLocal = (localProgress: number): void => {
    clock.seek(projectKpReaderRangeLocalProgress(range, localProgress));
  };
  const playForward = (): void => {
    if (reducedMotion.matches) {
      seekLocal(1);
      return;
    }
    if (clock.getSnapshot().progress >= range.end) seekLocal(0);
    clock.play({ direction: "forward", stopAt: range.end });
    syncTransportStatus("playing", Number(scrubber.value) / 1_000);
  };
  const playRange = (direction: "forward" | "rewind"): void => {
    const stopAt = direction === "forward" ? range.end : range.start;
    if (reducedMotion.matches) {
      seekLocal(direction === "forward" ? 1 : 0);
      return;
    }
    clock.play({ direction, stopAt });
    syncTransportStatus("playing", Number(scrubber.value) / 1_000);
  };
  const replayForward = (): void => {
    seekLocal(0);
    if (reducedMotion.matches) {
      seekLocal(1);
      return;
    }
    clock.play({ direction: "forward", stopAt: range.end });
    syncTransportStatus("playing", Number(scrubber.value) / 1_000);
  };
  const pausePlayback = (): void => {
    clock.pause();
    syncTransportStatus("paused", Number(scrubber.value) / 1_000);
  };
  const scrub = (): void => {
    seekLocal(Number(scrubber.value) / 1_000);
  };
  play.addEventListener("click", playForward);
  pause.addEventListener("click", pausePlayback);
  replay.addEventListener("click", replayForward);
  scrubber.addEventListener("input", scrub);

  input.stage.after(element);
  try {
    render(clock.getSnapshot());
  } catch (error: unknown) {
    unsubscribe();
    clock.dispose();
    element.remove();
    delete input.host.dataset["kpAlgebraCanonicalClock"];
    throw error;
  }

  return Object.freeze({
    element,
    selectRange(
      nextRange: KpReaderPlaybackRangeWindow,
      progress: number = nextRange.start,
      source: "controls" | "url" = "controls"
    ) {
      const selected = defineKpReaderPlaybackRangeWindow(nextRange);
      if (progress < selected.start || progress > selected.end) {
        throw new Error(
          `Range ${selected.id} cannot select global progress ${progress}.`
        );
      }
      clock.pause();
      range = selected;
      previousGlobalProgress = progress;
      element.dataset["kpAlgebraRangeTransport"] = range.id;
      input.host.dataset["kpAlgebraCanonicalRange"] = range.id;
      // One direct clock seek changes both the range window and frame; no
      // intermediate canonical operations are replayed during navigation.
      clock.seek(progress, source);
    },
    seekGlobal(
      progress: number,
      source: "controls" | "url" = "controls"
    ) {
      clock.seek(progress, source);
    },
    setFocus(focus: KpReaderFocusSnapshot) {
      currentFocus = focus;
      input.session.sample({ clock: clock.getSnapshot(), focus: currentFocus });
    },
    play(direction: "forward" | "rewind") {
      playRange(direction);
    },
    pause() {
      pausePlayback();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      play.removeEventListener("click", playForward);
      pause.removeEventListener("click", pausePlayback);
      replay.removeEventListener("click", replayForward);
      scrubber.removeEventListener("input", scrub);
      unsubscribe();
      clock.dispose();
      element.remove();
      delete input.host.dataset["kpAlgebraCanonicalClock"];
      delete input.host.dataset["kpAlgebraCanonicalRange"];
      delete input.host.dataset["kpAlgebraCanonicalLocalProgress"];
      delete input.host.dataset["kpAlgebraCanonicalClockSource"];
      delete input.host.dataset["kpAlgebraCanonicalRangeBoundary"];
      delete input.host.dataset["kpAlgebraCanonicalRangeStatus"];
    }
  });
}

function transportButton(
  document: Document,
  label: string,
  action: string
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset["kpAlgebraRangeAction"] = action;
  return button;
}
