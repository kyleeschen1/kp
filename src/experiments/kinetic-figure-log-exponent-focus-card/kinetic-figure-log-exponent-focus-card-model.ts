import type { KpArticleDocument } from
  "../../article/kp-article-document.ts";
import {
  kpCanonicalLogExponentSequenceTimeline,
  type KpLogExponentOperationWindow
} from
  "../../animation/log-exponent-timeline.ts";
import { sampleKpChoreographyTimeline } from
  "../../animation/choreography-timeline.ts";

export const kpLogExponentFocusCardSchema =
  "kp.log-exponent-focus-card.v1" as const;

export type KpLogExponentFocusCardBeatSlug =
  | "locate-the-unknown"
  | "choose-logarithms"
  | "apply-logarithms"
  | "match-the-power-law"
  | "extract-the-exponent"
  | "isolate-x";

export interface KpLogExponentFocusCardBeatV1 {
  readonly id: string;
  readonly slug: KpLogExponentFocusCardBeatSlug;
  readonly ordinal: number;
  readonly title: string;
  readonly referenceAddress: string;
  readonly label: string;
  readonly timelineProgress: number;
  readonly ownsMotionFromPrevious: boolean;
}

export interface KpLogExponentFocusCardScoreV1 {
  readonly schemaVersion: typeof kpLogExponentFocusCardSchema;
  readonly id: "score.algebra.log-exponent-focus-card.v1";
  readonly beats: readonly KpLogExponentFocusCardBeatV1[];
}

export interface KpLogExponentFocusCardPositionSampleV1 {
  readonly position: number;
  readonly lowerIndex: number;
  readonly upperIndex: number;
  readonly edgeProgress: number;
  readonly timelineProgress: number;
}

export interface KpLogExponentFocusCardPlaybackSampleV1 {
  readonly edgeProgress: number;
  readonly phaseId: "orient" | "reflow" | "act" | "settle" | "release";
  readonly tempoMultiplier: number;
}

const automaticPlaybackTempo = Object.freeze({
  activeRewrite: 0.85,
  stableContext: 2
});

interface BeatDeclaration {
  readonly slug: KpLogExponentFocusCardBeatSlug;
  readonly title: string;
  readonly objectPath: string;
  readonly timelineProgress: number;
  readonly ownsMotionFromPrevious: boolean;
}

const windows = kpCanonicalLogExponentSequenceTimeline.windows;
const declarations = Object.freeze([
  declaration("locate-the-unknown", "Locate the unknown", "source-equation",
    0, false),
  declaration("choose-logarithms", "Choose a reversible operation",
    "source-exponent", 0, false),
  declaration("apply-logarithms", "Apply logarithms to both sides",
    "logged-equation", windows[0]!.end, true),
  declaration("match-the-power-law", "Recognize the power-law structure",
    "logged-power", windows[0]!.end, false),
  declaration("extract-the-exponent", "Rewrite the logarithmic power",
    "extracted-equation", windows[1]!.end, true),
  declaration("isolate-x", "Divide to isolate x", "solved-equation",
    windows[2]!.end, true)
] satisfies readonly BeatDeclaration[]);

export function createKpLogExponentFocusCardScore(
  document: KpArticleDocument
): KpLogExponentFocusCardScoreV1 {
  const stage = document.blocks.find((block) =>
    block.kind === "stage" && block.id === "log-solve");
  if (stage?.kind !== "stage") {
    throw new Error("Log-exponent Focus Deck is missing its Article stage.");
  }
  const references = new Map(document.references.map((reference) =>
    [reference.address, reference] as const));
  const beats = declarations.map((entry, index) => {
    const address = `log-solve/${entry.objectPath}`;
    const reference = references.get(address);
    if (reference?.label === undefined) {
      throw new Error(`Log-exponent Focus Deck cannot bind ${address}.`);
    }
    return Object.freeze({
      id: `beat.algebra.log-exponent.${entry.slug}`,
      slug: entry.slug,
      ordinal: index + 1,
      title: entry.title,
      referenceAddress: address,
      label: reference.label,
      timelineProgress: entry.timelineProgress,
      ownsMotionFromPrevious: entry.ownsMotionFromPrevious
    });
  });
  return Object.freeze({
    schemaVersion: kpLogExponentFocusCardSchema,
    id: "score.algebra.log-exponent-focus-card.v1" as const,
    beats: Object.freeze(beats)
  });
}

export function kpLogExponentFocusCardBeatHash(
  beat: KpLogExponentFocusCardBeatV1
): string {
  return `#beat.log-exponent.${beat.slug}`;
}

export function readKpLogExponentFocusCardBeatIndexFromHash(
  score: KpLogExponentFocusCardScoreV1,
  hash: string
): number {
  const prefix = "#beat.log-exponent.";
  const slug = hash.startsWith(prefix) ? hash.slice(prefix.length) : "";
  return Math.max(0, score.beats.findIndex((beat) => beat.slug === slug));
}

/**
 * A fractional deck position denotes visible rewrite progress. The canonical
 * orient and settlement phases remain reachable at exact beat endpoints, but
 * do not consume passage distance while the equation is perceptually still.
 */
export function sampleKpLogExponentFocusCardPosition(
  score: KpLogExponentFocusCardScoreV1,
  requestedPosition: number
): KpLogExponentFocusCardPositionSampleV1 {
  if (score.beats.length === 0) {
    throw new Error("Log-exponent Focus Deck requires at least one beat.");
  }
  const finite = Number.isFinite(requestedPosition) ? requestedPosition : 0;
  const position = Math.max(0, Math.min(score.beats.length - 1, finite));
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.min(score.beats.length - 1, Math.ceil(position));
  const edgeProgress = position - lowerIndex;
  const lowerTimeline = score.beats[lowerIndex]!.timelineProgress;
  const upperTimeline = score.beats[upperIndex]!.timelineProgress;
  return Object.freeze({
    position,
    lowerIndex,
    upperIndex,
    edgeProgress,
    timelineProgress: timelineProgressForVisibleEdge({
      lowerTimeline,
      upperTimeline,
      edgeProgress
    })
  });
}

/**
 * Projects the canonical player clock back into card travel. This is the
 * inverse of the scrubber mapping during the active rewrite, so button and
 * direct-manipulation paths expose the same material frames.
 */
export function sampleKpLogExponentFocusCardPlayback(input: {
  readonly sourceProgress: number;
  readonly targetProgress: number;
  readonly currentProgress: number;
}): KpLogExponentFocusCardPlaybackSampleV1 {
  const window = requireMotionWindow(
    input.sourceProgress,
    input.targetProgress
  );
  const sourceVisible = visibleProgressInWindow(window, input.sourceProgress);
  const targetVisible = visibleProgressInWindow(window, input.targetProgress);
  const currentVisible = visibleProgressInWindow(
    window,
    input.currentProgress
  );
  const distance = targetVisible - sourceVisible;
  const edgeProgress = round(Math.abs(distance) <= 0.000001
    ? input.currentProgress === input.targetProgress ? 1 : 0
    : clamp((currentVisible - sourceVisible) / distance));
  const localProgress = localProgressInWindow(window, input.currentProgress);
  const frame = sampleKpChoreographyTimeline({
    timeline: window.timeline,
    progress: localProgress
  });
  const phaseId = frame.activePhaseIds.at(-1) ??
    (localProgress <= 0 ? "orient" : "release");
  return Object.freeze({
    edgeProgress,
    phaseId,
    tempoMultiplier: phaseId === "act"
      ? automaticPlaybackTempo.activeRewrite
      : automaticPlaybackTempo.stableContext
  });
}

function timelineProgressForVisibleEdge(input: {
  readonly lowerTimeline: number;
  readonly upperTimeline: number;
  readonly edgeProgress: number;
}): number {
  if (input.lowerTimeline === input.upperTimeline) return input.lowerTimeline;
  if (input.edgeProgress <= 0) return input.lowerTimeline;
  if (input.edgeProgress >= 1) return input.upperTimeline;
  const window = requireMotionWindow(
    input.lowerTimeline,
    input.upperTimeline
  );
  const act = window.timeline.phases.find(({ phaseId }) => phaseId === "act");
  if (act === undefined) {
    throw new Error(
      `Log-exponent operation ${window.operationId} has no act phase.`
    );
  }
  const localProgress = interpolate(act.start, act.end, input.edgeProgress);
  return round(interpolate(window.start, window.end, localProgress));
}

function visibleProgressInWindow(
  window: KpLogExponentOperationWindow,
  progress: number
): number {
  const frame = sampleKpChoreographyTimeline({
    timeline: window.timeline,
    progress: localProgressInWindow(window, progress)
  });
  if (frame.completedPhaseIds.includes("act")) return 1;
  return clamp(frame.phaseProgress.act ?? 0);
}

function localProgressInWindow(
  window: KpLogExponentOperationWindow,
  progress: number
): number {
  if (window.end === window.start) return 1;
  return clamp((progress - window.start) / (window.end - window.start));
}

function requireMotionWindow(
  firstProgress: number,
  secondProgress: number
): KpLogExponentOperationWindow {
  const lower = Math.min(firstProgress, secondProgress);
  const upper = Math.max(firstProgress, secondProgress);
  const tolerance = 0.000001;
  const window = kpCanonicalLogExponentSequenceTimeline.windows.find(
    (candidate) =>
      lower >= candidate.start - tolerance &&
      upper <= candidate.end + tolerance &&
      upper - lower > tolerance
  );
  if (window === undefined) {
    throw new Error(
      `Log-exponent Focus Deck cannot project motion ${firstProgress} -> ${secondProgress}.`
    );
  }
  return window;
}

function interpolate(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function declaration(
  slug: KpLogExponentFocusCardBeatSlug,
  title: string,
  objectPath: string,
  timelineProgress: number,
  ownsMotionFromPrevious: boolean
): BeatDeclaration {
  return Object.freeze({
    slug,
    title,
    objectPath,
    timelineProgress,
    ownsMotionFromPrevious
  });
}
