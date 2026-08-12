import "../kp-tutorial-scrub-bar.css";
import "./scheme-factorial-tutorial.css";

import { projectKpSchemeFactorialResponsiveFrame } from
  "../../animation/scheme-factorial-responsive-projection.ts";
import { sampleKpSchemeFactorialFirstExpansion } from
  "../../animation/scheme-factorial-first-expansion.ts";
import { sampleKpSchemeFactorialFullEvaluation } from
  "../../animation/scheme-factorial-full-evaluation.ts";
import { projectKpSchemeFactorialMotion } from
  "../../animation/scheme-factorial-motion-projection.ts";
import {
  sampleKpSchemeFactorialTimeline,
  seekKpSchemeFactorialCheckpoint
} from "../../animation/scheme-factorial-timeline.ts";
import {
  kpSchemeFactorialCss,
  renderKpSchemeFactorialHtml
} from "../../rendering/scheme-factorial-html.ts";
import {
  kpSchemeFirstExpansionCss,
  renderKpSchemeFactorialFullEvaluationHtml,
  renderKpSchemeFirstExpansionHtml
} from "../../rendering/scheme-factorial-first-expansion-html.ts";
import { parseKpSchemeFactorialSource } from
  "../../semantic/scheme-factorial-parser.ts";
import {
  createKpReaderTimelinePlaybackClock
} from "../../reader/runtime/timeline-playback-clock.ts";
import {
  KP_TUTORIAL_SCRUB_NEXT_EVENT,
  KP_TUTORIAL_SCRUB_PREVIOUS_EVENT,
  KP_TUTORIAL_SCRUB_REWIND_EVENT,
  KP_TUTORIAL_SCRUB_SEEK_EVENT,
  KP_TUTORIAL_SCRUB_TOGGLE_EVENT,
  type KpTutorialScrubSeekDetail
} from "../kp-tutorial-scrub-bar-events.ts";
import {
  defineKpTutorialScrubBar,
  type KpTutorialScrubBarElement
} from "../kp-tutorial-scrub-bar.ts";
import {
  readKpSchemeFactorialPublicationArtifact,
  renderKpSchemeFactorialFocusPublication,
  renderKpSchemeFactorialStaticPublication
} from "./scheme-factorial-publication.ts";
import { findKpSchemeFactorialAdjacentCheckpoint } from
  "./scheme-factorial-navigation.ts";

const durationMs = 18_000;

export function mountKpSchemeFactorialTutorial(input: {
  readonly root: HTMLElement;
}): () => void {
  const ownerWindow = input.root.ownerDocument.defaultView;
  if (ownerWindow === null) throw new Error("Factorial tutorial needs a window.");
  const requestedView = new URLSearchParams(ownerWindow.location.search).get("view");
  const linkedCheckpoint = ownerWindow.location.hash.startsWith("#kp-checkpoint-")
    ? decodeURIComponent(ownerWindow.location.hash.slice("#kp-checkpoint-".length))
    : null;
  const requiresFullStory = linkedCheckpoint !== null &&
    linkedCheckpoint !== "scheme-factorial.checkpoint.source" &&
    linkedCheckpoint !== "scheme-factorial.checkpoint.first-descent";
  if (requestedView !== "full" && !requiresFullStory) {
    return mountKpSchemeFactorialFocusTutorial(input);
  }
  defineKpTutorialScrubBar();
  const ownerDocument = input.root.ownerDocument;
  const artifact = readKpSchemeFactorialPublicationArtifact(ownerDocument);
  const document = parseKpSchemeFactorialSource();
  input.root.innerHTML = renderKpSchemeFactorialStaticPublication({
    document,
    artifact,
    availableWidthPx: Math.max(320, Math.min(760, input.root.clientWidth))
  });
  const rendererStyle = ownerDocument.createElement("style");
  rendererStyle.dataset["kpSchemeFactorialRenderer"] = "true";
  rendererStyle.textContent = kpSchemeFactorialCss + kpSchemeFirstExpansionCss;
  ownerDocument.head.append(rendererStyle);
  const stage = required<HTMLElement>(input.root,
    "[data-kp-scheme-factorial-stage-host]");
  const caption = required<HTMLElement>(input.root,
    "[data-kp-scheme-factorial-caption]");
  const scrub = required<KpTutorialScrubBarElement>(input.root,
    "kp-tutorial-scrub-bar");
  const reducedMotion = ownerWindow.matchMedia("(prefers-reduced-motion: reduce)");
  const initialProgress = progressFromHash(ownerWindow.location.hash, artifact);
  const clock = createKpReaderTimelinePlaybackClock({
    id: "scheme-factorial.clock",
    durationMs,
    initialProgress,
    ownerWindow
  });
  let direction: "forward" | "rewind" = "forward";
  let availableWidth = stageWidth(stage);

  const render = (): void => {
    const progress = clock.getSnapshot().progress;
    const sample = sampleKpSchemeFactorialTimeline({
      timeline: artifact.timeline,
      progress,
      direction
    });
    const firstDescentInterval = artifact.timeline.intervals.find(
      ({ motionKind }) => motionKind === "first-descent"
    );
    const inFirstExpansion = firstDescentInterval !== undefined &&
      progress >= firstDescentInterval.motion.start &&
      progress <= firstDescentInterval.hold.end;
    if (inFirstExpansion) {
      const expansionProgress = sample.motionKind === "first-descent"
        ? reducedMotion.matches
          ? sample.localProgress < 0.5 ? 0 : 1
          : sample.localProgress
        : 1;
      stage.innerHTML = renderKpSchemeFirstExpansionHtml({
        expansion: artifact.firstExpansion,
        sample: sampleKpSchemeFactorialFirstExpansion(
          artifact.firstExpansion,
          expansionProgress
        )
      });
    } else {
      const frame = projectKpSchemeFactorialResponsiveFrame({
      document,
      checkpoints: artifact.checkpoints,
      sample,
      availableWidthPx: availableWidth,
      reducedMotion: reducedMotion.matches
      });
      const motion = projectKpSchemeFactorialMotion({
        choreography: artifact.choreography,
        timeline: sample
      });
      stage.innerHTML = renderKpSchemeFactorialHtml({
        checkpoints: artifact.checkpoints,
        sample,
        frame,
        motion,
        reducedMotion: reducedMotion.matches
      });
    }
    const text = progress === 0
      ? artifact.timeline.initialCaption
      : sample.caption;
    if (caption.textContent !== text) caption.textContent = text;
    scrub.setAttribute("progress", String(progress));
    scrub.setAttribute("playback-status", clock.getStatus());
    scrub.setAttribute("direction", direction);
    scrub.setAttribute("controls-disabled", "false");
    const checkpoints = orderedSeeks(artifact.timeline.checkpointSeeks);
    scrub.setAttribute("previous-disabled", String(
      findKpSchemeFactorialAdjacentCheckpoint(checkpoints, progress, -1) === null
    ));
    scrub.setAttribute("next-disabled", String(
      findKpSchemeFactorialAdjacentCheckpoint(checkpoints, progress, 1) === null
    ));
    input.root.dataset["kpSchemeFactorialProgress"] = progress.toFixed(4);
    input.root.dataset["kpSchemeFactorialCheckpoint"] =
      sample.settledCheckpointId;
  };

  const unsubscribe = clock.subscribe(render);
  const seek = (progress: number, updateUrl = false): void => {
    direction = progress < clock.getSnapshot().progress ? "rewind" : "forward";
    clock.seek(progress, updateUrl ? "url" : "controls");
    if (updateUrl) writeHash(ownerWindow, checkpointAt(artifact, progress));
  };
  const onSeek = (event: Event): void => {
    const detail = (event as CustomEvent<KpTutorialScrubSeekDetail>).detail;
    seek(detail.progress);
  };
  const onToggle = (): void => {
    if (clock.getStatus() === "playing") {
      clock.pause();
      render();
      return;
    }
    if (clock.getSnapshot().progress >= 0.999) clock.seek(0);
    direction = "forward";
    clock.play({ direction, stopAt: 1 });
    render();
  };
  const onRewind = (): void => {
    direction = "rewind";
    clock.play({ direction, stopAt: 0 });
    render();
  };
  const step = (offset: -1 | 1): void => {
    const checkpoints = orderedSeeks(artifact.timeline.checkpointSeeks);
    const next = findKpSchemeFactorialAdjacentCheckpoint(
      checkpoints,
      clock.getSnapshot().progress,
      offset
    );
    if (next === null) return;
    seek(next.progress, true);
  };
  const onPrevious = (): void => step(-1);
  const onNext = (): void => step(1);
  const onHashChange = (): void => {
    seek(progressFromHash(ownerWindow.location.hash, artifact));
  };
  const onMotionPreference = (): void => render();
  const observer = new ResizeObserver((entries) => {
    const width = entries[0]?.contentRect.width;
    if (width === undefined || width <= 0) return;
    availableWidth = Math.max(220, width);
    render();
  });
  observer.observe(stage);
  scrub.addEventListener(KP_TUTORIAL_SCRUB_SEEK_EVENT, onSeek);
  scrub.addEventListener(KP_TUTORIAL_SCRUB_TOGGLE_EVENT, onToggle);
  scrub.addEventListener(KP_TUTORIAL_SCRUB_REWIND_EVENT, onRewind);
  scrub.addEventListener(KP_TUTORIAL_SCRUB_PREVIOUS_EVENT, onPrevious);
  scrub.addEventListener(KP_TUTORIAL_SCRUB_NEXT_EVENT, onNext);
  ownerWindow.addEventListener("hashchange", onHashChange);
  reducedMotion.addEventListener("change", onMotionPreference);
  input.root.dataset["kpSchemeFactorialTutorialMounted"] = "true";
  input.root.dataset["kpSchemeFactorialView"] = "full";
  render();

  return () => {
    observer.disconnect();
    unsubscribe();
    clock.dispose();
    scrub.removeEventListener(KP_TUTORIAL_SCRUB_SEEK_EVENT, onSeek);
    scrub.removeEventListener(KP_TUTORIAL_SCRUB_TOGGLE_EVENT, onToggle);
    scrub.removeEventListener(KP_TUTORIAL_SCRUB_REWIND_EVENT, onRewind);
    scrub.removeEventListener(KP_TUTORIAL_SCRUB_PREVIOUS_EVENT, onPrevious);
    scrub.removeEventListener(KP_TUTORIAL_SCRUB_NEXT_EVENT, onNext);
    ownerWindow.removeEventListener("hashchange", onHashChange);
    reducedMotion.removeEventListener("change", onMotionPreference);
    rendererStyle.remove();
    delete input.root.dataset["kpSchemeFactorialTutorialMounted"];
    delete input.root.dataset["kpSchemeFactorialView"];
  };
}

function mountKpSchemeFactorialFocusTutorial(input: {
  readonly root: HTMLElement;
}): () => void {
  const ownerDocument = input.root.ownerDocument;
  const ownerWindow = ownerDocument.defaultView;
  if (ownerWindow === null) throw new Error("Factorial tutorial needs a window.");
  const artifact = readKpSchemeFactorialPublicationArtifact(ownerDocument);
  input.root.innerHTML = renderKpSchemeFactorialFocusPublication({ artifact });
  const rendererStyle = ownerDocument.createElement("style");
  rendererStyle.dataset["kpSchemeFactorialRenderer"] = "true";
  rendererStyle.textContent = kpSchemeFactorialCss + kpSchemeFirstExpansionCss;
  ownerDocument.head.append(rendererStyle);
  const stage = required<HTMLElement>(input.root,
    "[data-kp-scheme-factorial-focus-stage-host]");
  const toggle = required<HTMLButtonElement>(input.root,
    "button[data-action=focus-toggle]");
  const seek = required<HTMLInputElement>(input.root,
    "input[data-action=focus-seek]");
  const progressOutput = required<HTMLOutputElement>(input.root,
    "[data-focus-progress]");
  const caption = required<HTMLElement>(input.root,
    "[data-kp-scheme-factorial-focus-caption]");
  const reducedMotion = ownerWindow.matchMedia("(prefers-reduced-motion: reduce)");
  const clock = createKpReaderTimelinePlaybackClock({
    id: "scheme-factorial.full-evaluation.clock",
    durationMs: 30_000,
    initialProgress: 0,
    ownerWindow
  });

  const render = (): void => {
    const progress = clock.getSnapshot().progress;
    const sample = sampleKpSchemeFactorialFullEvaluation(
      artifact.fullEvaluation,
      progress,
      { reducedMotion: reducedMotion.matches }
    );
    stage.innerHTML = renderKpSchemeFactorialFullEvaluationHtml({
      evaluation: artifact.fullEvaluation,
      sample
    });
    if (caption.textContent !== sample.caption) caption.textContent = sample.caption;
    seek.value = String(progress);
    progressOutput.value = `${Math.round(progress * 100)}%`;
    toggle.textContent = clock.getStatus() === "playing"
      ? "Pause"
      : progress >= 0.999 ? "Replay" : "Play";
    toggle.setAttribute("aria-label", toggle.textContent);
    input.root.dataset["kpSchemeFactorialProgress"] = progress.toFixed(4);
    input.root.dataset["kpSchemeFactorialCheckpoint"] = sample.settledStateId;
  };
  const unsubscribe = clock.subscribe(render);
  const onToggle = (): void => {
    if (clock.getStatus() === "playing") {
      clock.pause();
    } else {
      if (clock.getSnapshot().progress >= 0.999) clock.seek(0);
      clock.play({ direction: "forward", stopAt: 1 });
    }
    render();
  };
  const onSeek = (): void => {
    clock.pause();
    clock.seek(Number(seek.value), "controls");
    render();
  };
  const onMotionPreference = (): void => render();
  toggle.disabled = false;
  seek.disabled = false;
  toggle.addEventListener("click", onToggle);
  seek.addEventListener("input", onSeek);
  reducedMotion.addEventListener("change", onMotionPreference);
  input.root.dataset["kpSchemeFactorialTutorialMounted"] = "true";
  input.root.dataset["kpSchemeFactorialView"] = "focus";
  render();

  return () => {
    unsubscribe();
    clock.dispose();
    toggle.removeEventListener("click", onToggle);
    seek.removeEventListener("input", onSeek);
    reducedMotion.removeEventListener("change", onMotionPreference);
    rendererStyle.remove();
    delete input.root.dataset["kpSchemeFactorialTutorialMounted"];
    delete input.root.dataset["kpSchemeFactorialView"];
  };
}

function orderedSeeks(seeks: Readonly<Record<string, number>>): readonly {
  readonly id: string;
  readonly progress: number;
}[] {
  return Object.entries(seeks).map(([id, progress]) => ({ id, progress }))
    .sort((left, right) => left.progress - right.progress);
}

function checkpointIndex(
  checkpoints: readonly { readonly progress: number }[],
  progress: number
): number {
  let nearest = 0;
  for (let index = 1; index < checkpoints.length; index += 1) {
    if (Math.abs(checkpoints[index]!.progress - progress) <
        Math.abs(checkpoints[nearest]!.progress - progress)) nearest = index;
  }
  return nearest;
}

function progressFromHash(
  hash: string,
  artifact: ReturnType<typeof readKpSchemeFactorialPublicationArtifact>
): number {
  const prefix = "#kp-checkpoint-";
  if (!hash.startsWith(prefix)) return 0;
  const id = decodeURIComponent(hash.slice(prefix.length));
  try {
    return seekKpSchemeFactorialCheckpoint(artifact.timeline, id);
  } catch {
    return 0;
  }
}

function checkpointAt(
  artifact: ReturnType<typeof readKpSchemeFactorialPublicationArtifact>,
  progress: number
): string {
  const checkpoints = orderedSeeks(artifact.timeline.checkpointSeeks);
  return checkpoints[checkpointIndex(checkpoints, progress)]!.id;
}

function writeHash(ownerWindow: Window, checkpointId: string): void {
  ownerWindow.history.replaceState(null, "",
    `${ownerWindow.location.pathname}${ownerWindow.location.search}#kp-checkpoint-${encodeURIComponent(checkpointId)}`);
}

function stageWidth(stage: HTMLElement): number {
  return Math.max(220, stage.getBoundingClientRect().width || 720);
}

function required<ElementType extends Element>(
  root: ParentNode,
  selector: string
): ElementType {
  const element = root.querySelector<ElementType>(selector);
  if (element === null) throw new Error(`Factorial tutorial is missing ${selector}.`);
  return element;
}
