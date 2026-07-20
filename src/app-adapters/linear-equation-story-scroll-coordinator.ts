import type { KpLinearEquationSymbolicStoryLike } from "./linear-equation-symbolic-story-dom.ts";

export type KpLinearEquationStoryBeatLike =
  KpLinearEquationSymbolicStoryLike["beats"][number];

export interface KpLinearEquationStoryScrollCoordinator {
  refresh(): void;
  scrollTo(beatId: string, behavior: ScrollBehavior): void;
  dispose(): void;
}

export type KpLinearEquationStoryIntersectionObserverFactory = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit
) => Pick<IntersectionObserver, "disconnect" | "observe">;

export function createLinearEquationStoryScrollCoordinator(input: {
  readonly root: HTMLElement;
  readonly beats: readonly KpLinearEquationStoryBeatLike[];
  readonly currentBeat: () => string;
  readonly onBeat: (beat: KpLinearEquationStoryBeatLike) => void;
  readonly observerFactory?: KpLinearEquationStoryIntersectionObserverFactory;
  readonly reducedMotion?: () => boolean;
}): KpLinearEquationStoryScrollCoordinator {
  const beats = new Map(input.beats.map((beat) => [beat.id, beat]));
  const ratios = new Map<string, number>();
  let disposed = false;
  let programmaticTarget: string | undefined;
  const observerFactory = input.observerFactory ?? browserObserverFactory();
  const observer = observerFactory?.(onIntersection, {
    // A narrow reading band produces one intentional state change per prose
    // beat; ordinary scroll position is never treated as an animation clock.
    root: null,
    rootMargin: "-30% 0px -55% 0px",
    threshold: [0, 0.05, 0.15]
  });

  function onIntersection(_entries: readonly IntersectionObserverEntry[]): void {
    if (disposed) return;
    sampleReadingBand(input.root, ratios);
    if (programmaticTarget !== undefined) {
      if ((ratios.get(programmaticTarget) ?? 0) > 0) programmaticTarget = undefined;
      else return;
    }
    const current = input.currentBeat();
    if ((ratios.get(current) ?? 0) > 0) return;
    const next = [...ratios.entries()]
      .filter(([, ratio]) => ratio > 0)
      .sort((left, right) => right[1] - left[1])[0]?.[0];
    if (next === undefined || next === current) return;
    const beat = beats.get(next);
    if (beat !== undefined) input.onBeat(beat);
  }

  return {
    refresh() {
      if (disposed || observer === undefined) return;
      observer.disconnect();
      ratios.clear();
      input.root
        .querySelectorAll<HTMLElement>("[data-kp-symbolic-story-beat]")
        .forEach((section) => observer.observe(section));
    },
    scrollTo(beatId, behavior) {
      if (disposed) return;
      const section = input.root.querySelector<HTMLElement>(
        `[data-kp-symbolic-story-beat="${cssEscape(beatId)}"]`
      );
      if (section === null) return;
      programmaticTarget = beatId;
      const reduced = input.reducedMotion?.() ?? browserReducedMotion();
      section.scrollIntoView({ block: "center", behavior: reduced ? "auto" : behavior });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      ratios.clear();
      observer?.disconnect();
    }
  };
}

export function syncLinearEquationStoryBeat(root: HTMLElement, beatId: string): void {
  root.querySelectorAll<HTMLElement>("[data-kp-symbolic-story-beat]").forEach((section) => {
    const active = section.dataset["kpSymbolicStoryBeat"] === beatId;
    section.dataset["kpSymbolicStoryActive"] = String(active);
    if (active) section.setAttribute("aria-current", "step");
    else section.removeAttribute("aria-current");
  });
}

function browserObserverFactory(): KpLinearEquationStoryIntersectionObserverFactory | undefined {
  if (typeof IntersectionObserver === "undefined") return undefined;
  return (callback, options) => new IntersectionObserver(callback, options);
}

function sampleReadingBand(root: HTMLElement, ratios: Map<string, number>): void {
  ratios.clear();
  const viewportHeight = root.ownerDocument.defaultView?.innerHeight
    ?? root.ownerDocument.documentElement.clientHeight;
  const bandTop = viewportHeight * 0.3;
  const bandBottom = viewportHeight * 0.45;
  const bandHeight = bandBottom - bandTop;
  root.querySelectorAll<HTMLElement>("[data-kp-symbolic-story-beat]").forEach((section) => {
    const id = section.dataset["kpSymbolicStoryBeat"];
    if (id === undefined) return;
    const bounds = section.getBoundingClientRect();
    const overlap = Math.max(0, Math.min(bounds.bottom, bandBottom) - Math.max(bounds.top, bandTop));
    ratios.set(id, overlap / Math.max(1, Math.min(bounds.height, bandHeight)));
  });
}

function browserReducedMotion(): boolean {
  return typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function cssEscape(value: string): string {
  return typeof CSS !== "undefined" && typeof CSS.escape === "function"
    ? CSS.escape(value)
    : value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}
