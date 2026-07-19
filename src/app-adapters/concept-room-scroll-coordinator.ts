export interface KpConceptRoomScrollCheckpoint {
  readonly id: string;
  readonly progressPermille: number;
  readonly semanticRefs: readonly string[];
}

export interface KpConceptRoomScrollCoordinator {
  refresh(): void;
  scrollTo(checkpointId: string, behavior: ScrollBehavior): void;
  dispose(): void;
}

export type KpConceptRoomIntersectionObserverFactory = (
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit
) => Pick<IntersectionObserver, "disconnect" | "observe">;

export function createConceptRoomScrollCoordinator(input: {
  readonly root: HTMLElement;
  readonly checkpoints: readonly KpConceptRoomScrollCheckpoint[];
  readonly currentCheckpoint: () => string;
  readonly onCheckpoint: (checkpoint: KpConceptRoomScrollCheckpoint) => void;
  readonly observerFactory?: KpConceptRoomIntersectionObserverFactory;
  readonly reducedMotion?: () => boolean;
}): KpConceptRoomScrollCoordinator {
  const checkpoints = new Map(input.checkpoints.map((checkpoint) => [checkpoint.id, checkpoint]));
  const ratios = new Map<string, number>();
  let disposed = false;
  let programmaticTarget: string | undefined;
  const observerFactory = input.observerFactory ?? browserObserverFactory();
  const observer = observerFactory?.(onIntersection, {
    // The narrow reading band makes the active section predictable while
    // preserving ordinary document scrolling above and below the concept.
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
    const current = input.currentCheckpoint();
    // Retaining the current section until it exits the reading band prevents
    // URL and stage chatter where two adjacent sections overlap the boundary.
    if ((ratios.get(current) ?? 0) > 0) return;
    const next = [...ratios.entries()]
      .filter(([, ratio]) => ratio > 0)
      .sort((left, right) => right[1] - left[1])[0]?.[0];
    if (next === undefined || next === current) return;
    const checkpoint = checkpoints.get(next);
    if (checkpoint !== undefined) input.onCheckpoint(checkpoint);
  }

  return {
    refresh() {
      if (disposed || observer === undefined) return;
      observer.disconnect();
      ratios.clear();
      input.root
        .querySelectorAll<HTMLElement>("[data-kp-concept-explanation]")
        .forEach((section) => observer.observe(section));
    },
    scrollTo(checkpointId, behavior) {
      if (disposed) return;
      const section = input.root.querySelector<HTMLElement>(
        `[data-kp-concept-explanation="${cssEscape(checkpointId)}"]`
      );
      if (section === null) return;
      programmaticTarget = checkpointId;
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

function browserObserverFactory(): KpConceptRoomIntersectionObserverFactory | undefined {
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
  root.querySelectorAll<HTMLElement>("[data-kp-concept-explanation]").forEach((section) => {
    const id = section.dataset["kpConceptExplanation"];
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
