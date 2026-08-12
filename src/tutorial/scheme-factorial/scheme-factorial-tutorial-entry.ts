import "../../styles.css";
import "../kp-tutorial-scrub-bar.css";
import "./scheme-factorial-tutorial.css";

import { projectKpSchemeFactorialResponsiveFrame } from
  "../../animation/scheme-factorial-responsive-projection.ts";
import {
  sampleKpSchemeFactorialTimeline,
  seekKpSchemeFactorialCheckpoint
} from "../../animation/scheme-factorial-timeline.ts";
import {
  kpSchemeFactorialCss,
  renderKpSchemeFactorialHtml
} from "../../rendering/scheme-factorial-html.ts";
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
  renderKpSchemeFactorialStaticPublication
} from "./scheme-factorial-publication.ts";
import { findKpSchemeFactorialAdjacentCheckpoint } from
  "./scheme-factorial-navigation.ts";

const durationMs = 18_000;

export function mountKpSchemeFactorialTutorial(input: {
  readonly root: HTMLElement;
}): () => void {
  defineKpTutorialScrubBar();
  const ownerDocument = input.root.ownerDocument;
  const ownerWindow = ownerDocument.defaultView;
  if (ownerWindow === null) throw new Error("Factorial tutorial needs a window.");
  const artifact = readKpSchemeFactorialPublicationArtifact(ownerDocument);
  const document = parseKpSchemeFactorialSource();
  input.root.innerHTML = renderKpSchemeFactorialStaticPublication({
    document,
    artifact,
    availableWidthPx: Math.max(320, Math.min(760, input.root.clientWidth))
  });
  const rendererStyle = ownerDocument.createElement("style");
  rendererStyle.dataset["kpSchemeFactorialRenderer"] = "true";
  rendererStyle.textContent = kpSchemeFactorialCss;
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
    const frame = projectKpSchemeFactorialResponsiveFrame({
      document,
      checkpoints: artifact.checkpoints,
      sample,
      availableWidthPx: availableWidth,
      reducedMotion: reducedMotion.matches
    });
    stage.innerHTML = renderKpSchemeFactorialHtml({
      checkpoints: artifact.checkpoints,
      sample,
      frame,
      reducedMotion: reducedMotion.matches
    });
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
