import {
  kpEigenvectorBeatIds,
  type KpEigenvectorBeatId
} from "./eigenvector-endpoints.ts";

export const kpEigenvectorReadingLineRatio = 0.56;

export interface KpEigenvectorPassageMeasurement {
  readonly beatId: KpEigenvectorBeatId;
  readonly top: number;
}

export interface KpEigenvectorScrollSelectionHandle {
  readonly kind: "intersection-observer" | "static";
  disconnect(): void;
}

/** The last passage top to cross the reading line owns the discrete state. */
export function selectKpEigenvectorBeatAtReadingLine(input: {
  readonly passages: readonly KpEigenvectorPassageMeasurement[];
  readonly readingLineY: number;
}): KpEigenvectorBeatId {
  if (input.passages.length === 0) {
    return kpEigenvectorBeatIds[0];
  }
  const ordered = [...input.passages].sort((left, right) =>
    left.top - right.top
  );
  const crossed = ordered.filter(({ top }) => top <= input.readingLineY);
  return (crossed.at(-1) ?? ordered[0]!).beatId;
}

export function enhanceKpEigenvectorScrollSelection(input: {
  readonly root: ParentNode;
  readonly viewportHeight: () => number;
  readonly onBeatSelected: (beatId: KpEigenvectorBeatId) => void;
  readonly observerFactory?: (
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit
  ) => IntersectionObserver;
}): KpEigenvectorScrollSelectionHandle {
  const passages = [...input.root.querySelectorAll<HTMLElement>(
    "[data-kp-eigenvector-passage]"
  )];
  const readBeatId = (element: HTMLElement): KpEigenvectorBeatId | undefined => {
    const candidate = element.dataset["kpEigenvectorPassage"];
    return kpEigenvectorBeatIds.find((beatId) => beatId === candidate);
  };
  let selected = selectKpEigenvectorBeatAtReadingLine({
    passages: passages.flatMap((element) => {
      const beatId = readBeatId(element);
      return beatId === undefined
        ? []
        : [{ beatId, top: element.getBoundingClientRect().top }];
    }),
    readingLineY: input.viewportHeight() * kpEigenvectorReadingLineRatio
  });
  input.onBeatSelected(selected);

  const createObserver = input.observerFactory ??
    (typeof IntersectionObserver === "undefined"
      ? undefined
      : (callback: IntersectionObserverCallback, options: IntersectionObserverInit) =>
          new IntersectionObserver(callback, options));
  if (createObserver === undefined) {
    return { kind: "static", disconnect() {} };
  }

  const observer = createObserver(() => {
    const next = selectKpEigenvectorBeatAtReadingLine({
      passages: passages.flatMap((element) => {
        const beatId = readBeatId(element);
        return beatId === undefined
          ? []
          : [{ beatId, top: element.getBoundingClientRect().top }];
      }),
      readingLineY: input.viewportHeight() * kpEigenvectorReadingLineRatio
    });
    if (next !== selected) {
      selected = next;
      input.onBeatSelected(next);
    }
  }, {
    root: null,
    // A narrow band around the reading line yields discrete callbacks while
    // the animation continues on its own bounded clock after selection.
    rootMargin: "-55% 0px -43% 0px",
    threshold: 0
  });
  for (const passage of passages) {
    observer.observe(passage);
  }
  return {
    kind: "intersection-observer",
    disconnect() {
      observer.disconnect();
    }
  };
}
