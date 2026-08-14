import {
  kpEigenvectorBeatIds,
  type KpEigenvectorBeatId
} from "./eigenvector-endpoints.ts";

export const kpEigenvectorReadingLineRatio = 0.56;
export const kpEigenvectorScrubDistanceRatio = 0.22;

export interface KpEigenvectorPassageMeasurement {
  readonly beatId: KpEigenvectorBeatId;
  readonly top: number;
}

export interface KpEigenvectorScrollProjection {
  readonly fromBeatId: KpEigenvectorBeatId;
  readonly toBeatId: KpEigenvectorBeatId;
  readonly progress: number;
  readonly settled: boolean;
}

export interface KpEigenvectorScrollSelectionHandle {
  readonly kind: "intersection-observer" | "static";
  disconnect(): void;
  measure(): void;
}

/**
 * Passage geometry is the timeline: crossing the seam starts a transition and
 * the following corridor completes it. Sampling the same geometry while
 * rewinding therefore produces the same frame without a second clock.
 */
export function projectKpEigenvectorScrollPosition(input: {
  readonly passages: readonly KpEigenvectorPassageMeasurement[];
  readonly readingLineY: number;
  readonly scrubDistance: number;
  readonly reducedMotion?: boolean;
}): KpEigenvectorScrollProjection {
  if (input.passages.length === 0) {
    const beatId = kpEigenvectorBeatIds[0];
    return { fromBeatId: beatId, toBeatId: beatId, progress: 1, settled: true };
  }
  const ordered = [...input.passages].sort((left, right) =>
    kpEigenvectorBeatIds.indexOf(left.beatId) -
    kpEigenvectorBeatIds.indexOf(right.beatId)
  );
  let crossedIndex = -1;
  for (const [index, passage] of ordered.entries()) {
    if (passage.top <= input.readingLineY) crossedIndex = index;
  }
  if (crossedIndex <= 0) {
    const beatId = ordered[0]!.beatId;
    return { fromBeatId: beatId, toBeatId: beatId, progress: 1, settled: true };
  }
  const current = ordered[crossedIndex]!;
  const previous = ordered[crossedIndex - 1]!;
  const distance = Math.max(1, input.scrubDistance);
  const measuredProgress = clamp01(
    (input.readingLineY - current.top) / distance
  );
  const progress = input.reducedMotion === true ? 1 : measuredProgress;
  return {
    fromBeatId: previous.beatId,
    toBeatId: current.beatId,
    progress,
    settled: progress === 1
  };
}

/** The last passage top to cross the reading line owns the discrete state. */
export function selectKpEigenvectorBeatAtReadingLine(input: {
  readonly passages: readonly KpEigenvectorPassageMeasurement[];
  readonly readingLineY: number;
}): KpEigenvectorBeatId {
  return projectKpEigenvectorScrollPosition({
    ...input,
    scrubDistance: 1,
    reducedMotion: true
  }).toBeatId;
}

export function enhanceKpEigenvectorScrollSelection(input: {
  readonly root: ParentNode;
  readonly viewportHeight: () => number;
  readonly onProjection: (projection: KpEigenvectorScrollProjection) => void;
  readonly reducedMotion?: () => boolean;
  readonly observerFactory?: (
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit
  ) => IntersectionObserver;
}): KpEigenvectorScrollSelectionHandle {
  const passages = [...input.root.querySelectorAll<HTMLElement>(
    "[data-kp-eigenvector-passage]"
  )];
  const experience = input.root.querySelector<HTMLElement>(
    "[data-kp-eigenvector-experience]"
  );
  const readBeatId = (element: HTMLElement): KpEigenvectorBeatId | undefined => {
    const candidate = element.dataset["kpEigenvectorPassage"];
    return kpEigenvectorBeatIds.find((beatId) => beatId === candidate);
  };
  const measure = (): void => {
    const viewportHeight = input.viewportHeight();
    input.onProjection(projectKpEigenvectorScrollPosition({
      passages: passages.flatMap((element) => {
        const beatId = readBeatId(element);
        return beatId === undefined
          ? []
          : [{ beatId, top: element.getBoundingClientRect().top }];
      }),
      readingLineY: viewportHeight * kpEigenvectorReadingLineRatio,
      scrubDistance: viewportHeight * kpEigenvectorScrubDistanceRatio,
      reducedMotion: input.reducedMotion?.() ?? false
    }));
  };

  if (typeof window === "undefined") {
    measure();
    return { kind: "static", disconnect() {}, measure };
  }

  let active = experience === null;
  let scheduledFrame: number | undefined;
  const scheduleMeasure = (): void => {
    if (!active || scheduledFrame !== undefined) return;
    scheduledFrame = window.requestAnimationFrame(() => {
      scheduledFrame = undefined;
      measure();
    });
  };
  // The passive listener only invalidates geometry. DOM reads and the single
  // paint projection are coalesced into the next animation frame.
  window.addEventListener("scroll", scheduleMeasure, { passive: true });
  window.addEventListener("resize", scheduleMeasure, { passive: true });

  const createObserver = input.observerFactory ??
    (typeof IntersectionObserver === "undefined"
      ? undefined
      : (callback: IntersectionObserverCallback, options: IntersectionObserverInit) =>
          new IntersectionObserver(callback, options));
  const observer = createObserver === undefined || experience === null
    ? undefined
    : createObserver((entries) => {
        active = entries.some((entry) => entry.isIntersecting);
        if (active) scheduleMeasure();
      }, {
        root: null,
        rootMargin: "25% 0px 25% 0px",
        threshold: 0
      });
  if (observer !== undefined && experience !== null) observer.observe(experience);
  else active = true;
  scheduleMeasure();

  return {
    kind: observer === undefined ? "static" : "intersection-observer",
    disconnect() {
      if (scheduledFrame !== undefined) cancelAnimationFrame(scheduledFrame);
      window.removeEventListener("scroll", scheduleMeasure);
      window.removeEventListener("resize", scheduleMeasure);
      observer?.disconnect();
    },
    measure
  };
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}
