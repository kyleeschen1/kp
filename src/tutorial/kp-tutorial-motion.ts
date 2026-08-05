import {
  kpTutorialPageScalePerformanceBudget
} from "./kp-tutorial-page-scale-performance.ts";

export interface KpTutorialMotionCheckpoint<Id extends string = string> {
  readonly id: Id;
  readonly label: string;
  readonly progress: number;
}

export interface KpTutorialMotionCorridorKeyframe {
  readonly travel: number;
  readonly progress: number;
}

export interface KpTutorialMotionCorridor {
  readonly startViewportRatio: number;
  readonly endViewportRatio: number;
  readonly keyframes: readonly KpTutorialMotionCorridorKeyframe[];
}

export interface KpTutorialMotionBlock<
  BlockId extends string = string,
  CheckpointId extends string = string
> {
  readonly id: BlockId;
  readonly label: string;
  readonly checkpoints: readonly KpTutorialMotionCheckpoint<CheckpointId>[];
  readonly corridor: KpTutorialMotionCorridor;
}

export interface KpTutorialCumulativeBlockProjection<BlockId extends string> {
  readonly id: BlockId;
  readonly status: "settled" | "active" | "inactive";
  readonly progress: number;
}

export interface KpTutorialMotionCorridorProjection {
  readonly travel: number;
  readonly progress: number;
}

export interface KpTutorialScrollBlockGeometry<BlockId extends string> {
  readonly id: BlockId;
  readonly anchorTop: number;
  readonly corridor: KpTutorialMotionCorridor;
  readonly snapTolerance?: number | undefined;
}

export interface KpTutorialScrollBlockProjection<BlockId extends string>
  extends KpTutorialMotionCorridorProjection {
  readonly id: BlockId;
  readonly anchorTop: number;
  readonly distanceFromReadingBand: number;
  readonly ownsScroll: boolean;
}

export interface KpTutorialScrollFrameProjection<BlockId extends string> {
  readonly activeBlockId: BlockId | undefined;
  readonly readingBandY: number;
  readonly blocks: readonly KpTutorialScrollBlockProjection<BlockId>[];
}

export interface KpTutorialLocalViewportAnchor {
  /** Stable position inside the stage; never follows a moving child object. */
  readonly stageLocalRatio: number;
  /** Responsive reading line inside the viewport. */
  readonly viewportRatio: number;
}

export interface KpTutorialLocalViewportAnchorProjection {
  readonly stageLocalY: number;
  readonly viewportY: number;
  readonly stageTop: number;
}

export interface KpTutorialScrollBlockRegistration<BlockId extends string> {
  readonly id: BlockId;
  readonly anchor: HTMLElement;
  readonly corridor: KpTutorialMotionCorridor;
  readonly snapTolerance?: number | undefined;
}

export interface KpTutorialDocumentCueRegistration<CueId extends string> {
  readonly id: CueId;
  readonly anchor: HTMLElement;
}

export interface KpTutorialDocumentCueGeometry<CueId extends string> {
  readonly id: CueId;
  readonly anchor: HTMLElement;
  readonly documentTop: number;
  readonly documentBottom: number;
  readonly height: number;
}

export interface KpTutorialViewportCueGeometry<CueId extends string>
  extends KpTutorialDocumentCueGeometry<CueId> {
  readonly viewportTop: number;
  readonly viewportBottom: number;
}

export interface KpTutorialActiveCueWindowProjection<CueId extends string> {
  readonly anchorDocumentY: number;
  readonly focusIndex: number;
  readonly startIndex: number;
  readonly endIndex: number;
  readonly cues: readonly KpTutorialViewportCueGeometry<CueId>[];
}

export interface KpTutorialCoordinatedScrollProjection<BlockId extends string>
  extends KpTutorialScrollFrameProjection<BlockId> {
  readonly scrollY: number;
  readonly scrollChanged: boolean;
  /** Coarse observer candidates, capped and ordered with the exact owner first. */
  readonly nearViewportBlockIds: readonly BlockId[];
}

export interface KpTutorialScrollCoordinatorMetrics {
  readonly scrollEvents: number;
  readonly resizeEvents: number;
  readonly scheduleRequests: number;
  readonly coalescedRequests: number;
  readonly requestedFrames: number;
  readonly executedFrames: number;
  readonly registrationReads: number;
  readonly layoutReads: number;
  readonly totalExecutionMs: number;
  readonly longestExecutionMs: number;
}

export interface KpTutorialScrollCoordinatorOptions {
  /** Detailed timing is opt-in so the measurement surface does not become reader overhead. */
  readonly profileExecution?: boolean | undefined;
  readonly now?: (() => number) | undefined;
  /** Exact scroll projection visits at most radius * 2 + 1 registrations. */
  readonly projectionNeighborhoodRadius?: number | undefined;
  /** Observer activation cannot create an unbounded live-stage candidate set. */
  readonly maxNearViewportBlocks?: number | undefined;
  readonly activationRootMargin?: string | undefined;
}

export interface KpTutorialCueActivationObserverOptions {
  readonly rootMargin?: string | undefined;
  readonly onActivationChange?: (() => void) | undefined;
}

export function projectKpTutorialLocalViewportAnchor(input: {
  readonly anchor: KpTutorialLocalViewportAnchor;
  readonly stageBlockSize: number;
  readonly viewportHeight: number;
}): KpTutorialLocalViewportAnchorProjection {
  const viewportHeight = finitePositive(input.viewportHeight);
  const stageBlockSize = finitePositive(input.stageBlockSize);
  const stageLocalY = stageBlockSize * clamp(input.anchor.stageLocalRatio);
  const viewportY = viewportHeight * clamp(input.anchor.viewportRatio);
  return Object.freeze({
    stageLocalY,
    viewportY,
    stageTop: viewportY - stageLocalY
  });
}

export function projectKpTutorialActiveCueWindow<CueId extends string>(input: {
  readonly geometry: readonly KpTutorialDocumentCueGeometry<CueId>[];
  readonly scrollY: number;
  readonly viewportHeight: number;
  readonly viewportAnchorRatio?: number | undefined;
  readonly neighborhoodRadius?: number | undefined;
}): KpTutorialActiveCueWindowProjection<CueId> {
  const anchorDocumentY = input.scrollY + finitePositive(input.viewportHeight) *
    clamp(input.viewportAnchorRatio ?? 0.38);
  if (input.geometry.length === 0) {
    return Object.freeze({
      anchorDocumentY,
      focusIndex: -1,
      startIndex: 0,
      endIndex: 0,
      cues: Object.freeze([])
    });
  }
  const insertionIndex = lowerBoundCueTop(input.geometry, anchorDocumentY);
  const beforeIndex = Math.max(0, insertionIndex - 1);
  const afterIndex = Math.min(input.geometry.length - 1, insertionIndex);
  const focusIndex = Math.abs(
    input.geometry[beforeIndex]!.documentTop - anchorDocumentY
  ) <= Math.abs(input.geometry[afterIndex]!.documentTop - anchorDocumentY)
    ? beforeIndex
    : afterIndex;
  const radius = Math.max(0, Math.floor(input.neighborhoodRadius ?? 2));
  const startIndex = Math.max(0, focusIndex - radius);
  const endIndex = Math.min(input.geometry.length, focusIndex + radius + 1);
  return Object.freeze({
    anchorDocumentY,
    focusIndex,
    startIndex,
    endIndex,
    cues: Object.freeze(input.geometry.slice(startIndex, endIndex).map(
      (geometry) => Object.freeze({
        ...geometry,
        viewportTop: geometry.documentTop - input.scrollY,
        viewportBottom: geometry.documentBottom - input.scrollY
      })
    ))
  });
}

/**
 * Geometry is read only after explicit invalidation, then stored in document
 * space so ordinary scroll can be projected with scrollY alone.
 */
export class KpTutorialDocumentCueGeometryCache<CueId extends string> {
  private readonly view: Window;
  private readonly registrations: () =>
    readonly KpTutorialDocumentCueRegistration<CueId>[];
  private geometry: readonly KpTutorialDocumentCueGeometry<CueId>[] =
    Object.freeze([]);
  private invalidated = true;
  private reads = 0;

  constructor(
    view: Window,
    registrations: () => readonly KpTutorialDocumentCueRegistration<CueId>[]
  ) {
    this.view = view;
    this.registrations = registrations;
  }

  invalidate(): void {
    this.invalidated = true;
  }

  documentGeometry(): readonly KpTutorialDocumentCueGeometry<CueId>[] {
    if (!this.invalidated) return this.geometry;
    const scrollY = this.view.scrollY;
    this.geometry = Object.freeze(this.registrations().map(({ id, anchor }) => {
      const bounds = anchor.getBoundingClientRect();
      this.reads += 1;
      return Object.freeze({
        id,
        anchor,
        documentTop: bounds.top + scrollY,
        documentBottom: bounds.bottom + scrollY,
        height: bounds.height
      });
    }).sort((left, right) => left.documentTop - right.documentTop));
    this.invalidated = false;
    return this.geometry;
  }

  viewportGeometry(
    scrollY: number = this.view.scrollY
  ): readonly KpTutorialViewportCueGeometry<CueId>[] {
    return Object.freeze(this.documentGeometry().map((geometry) => Object.freeze({
      ...geometry,
      viewportTop: geometry.documentTop - scrollY,
      viewportBottom: geometry.documentBottom - scrollY
    })));
  }

  measurementReads(): number {
    return this.reads;
  }
}

/** IntersectionObserver gates near-viewport work; scroll+rAF still owns progress. */
export class KpTutorialCueActivationObserver<CueId extends string> {
  private readonly view: Window;
  private readonly registrations: () =>
    readonly KpTutorialDocumentCueRegistration<CueId>[];
  private readonly options: KpTutorialCueActivationObserverOptions;
  private readonly idsByAnchor = new Map<HTMLElement, CueId>();
  private readonly activeIds = new Set<CueId>();
  private observer: IntersectionObserver | undefined;
  private connected = false;

  constructor(
    view: Window,
    registrations: () => readonly KpTutorialDocumentCueRegistration<CueId>[],
    options: KpTutorialCueActivationObserverOptions = {}
  ) {
    this.view = view;
    this.registrations = registrations;
    this.options = options;
  }

  connect(): void {
    if (this.connected) return;
    this.connected = true;
    const Observer = (this.view as Window & {
      readonly IntersectionObserver?: typeof IntersectionObserver;
    }).IntersectionObserver;
    if (typeof Observer !== "function") {
      for (const { id } of this.registrations()) this.activeIds.add(id);
      return;
    }
    this.observer = new Observer(
      this.handleIntersections,
      { root: null, rootMargin: this.options.rootMargin ?? "100% 0px" }
    );
    this.refresh();
  }

  refresh(): void {
    if (!this.connected || this.observer === undefined) return;
    const registrations = this.registrations();
    const nextAnchors = new Set(registrations.map(({ anchor }) => anchor));
    for (const anchor of this.idsByAnchor.keys()) {
      if (nextAnchors.has(anchor)) continue;
      this.observer.unobserve(anchor);
      const id = this.idsByAnchor.get(anchor);
      this.idsByAnchor.delete(anchor);
      if (id !== undefined) this.activeIds.delete(id);
    }
    for (const { id, anchor } of registrations) {
      if (this.idsByAnchor.get(anchor) === id) continue;
      this.idsByAnchor.set(anchor, id);
      this.observer.observe(anchor);
    }
  }

  disconnect(): void {
    if (!this.connected) return;
    this.connected = false;
    this.observer?.disconnect();
    this.observer = undefined;
    this.idsByAnchor.clear();
    this.activeIds.clear();
  }

  isActive(id: CueId): boolean {
    return this.activeIds.has(id);
  }

  activeCueIds(): ReadonlySet<CueId> {
    return new Set(this.activeIds);
  }

  private readonly handleIntersections: IntersectionObserverCallback = (
    entries
  ): void => {
    let changed = false;
    for (const entry of entries) {
      const id = this.idsByAnchor.get(entry.target as HTMLElement);
      if (id === undefined) continue;
      if (entry.isIntersecting) {
        if (!this.activeIds.has(id)) {
          this.activeIds.add(id);
          changed = true;
        }
      } else if (this.activeIds.delete(id)) {
        changed = true;
      }
    }
    if (changed) this.options.onActivationChange?.();
  };
}

export function projectKpTutorialCumulativeMotion<BlockId extends string>(input: {
  readonly blocks: readonly Pick<KpTutorialMotionBlock<BlockId>, "id">[];
  readonly activeBlockId: BlockId;
  readonly localProgress: number;
}): readonly KpTutorialCumulativeBlockProjection<BlockId>[] {
  const activeIndex = input.blocks.findIndex(({ id }) => id === input.activeBlockId);
  if (activeIndex < 0) throw new Error(`Unknown tutorial motion block: ${input.activeBlockId}`);
  const progress = clamp(input.localProgress);
  return Object.freeze(input.blocks.map(({ id }, index) => Object.freeze({
    id,
    status: index < activeIndex
      ? "settled" as const
      : index === activeIndex
        ? "active" as const
        : "inactive" as const,
    progress: index < activeIndex ? 1 : index === activeIndex ? progress : 0
  })));
}

export function projectKpTutorialMotionCorridor(input: {
  readonly corridor: KpTutorialMotionCorridor;
  readonly anchorTop: number;
  readonly viewportHeight: number;
  readonly snapTolerance?: number | undefined;
}): KpTutorialMotionCorridorProjection {
  const height = finitePositive(input.viewportHeight);
  const start = input.corridor.startViewportRatio * height;
  const end = input.corridor.endViewportRatio * height;
  const rawTravel = start > end && Number.isFinite(input.anchorTop)
    ? clamp((start - input.anchorTop) / (start - end))
    : 0;
  const travel = snapTravel(
    input.corridor,
    rawTravel,
    Math.max(0, input.snapTolerance ?? 0)
  );
  return Object.freeze({
    travel,
    progress: projectKpTutorialCorridorTravel(input.corridor, travel)
  });
}

export function projectKpTutorialCorridorTravel(
  corridor: KpTutorialMotionCorridor,
  travel: number
): number {
  const keyframes = corridor.keyframes;
  if (keyframes.length < 2) throw new Error("A tutorial motion corridor needs two keyframes.");
  const bounded = clamp(travel);
  if (bounded <= keyframes[0]!.travel) return keyframes[0]!.progress;
  for (let index = 1; index < keyframes.length; index += 1) {
    const before = keyframes[index - 1]!;
    const after = keyframes[index]!;
    if (bounded > after.travel) continue;
    const span = after.travel - before.travel;
    if (span <= 0) throw new Error("Tutorial corridor travel must increase strictly.");
    const position = (bounded - before.travel) / span;
    return before.progress + (after.progress - before.progress) * position;
  }
  return keyframes.at(-1)!.progress;
}

export function resolveKpTutorialCorridorTravelForProgress(input: {
  readonly corridor: KpTutorialMotionCorridor;
  readonly progress: number;
  readonly preferredTravel: number;
}): number {
  const progress = clamp(input.progress);
  const preferred = clamp(input.preferredTravel);
  const candidates: number[] = [];
  for (let index = 1; index < input.corridor.keyframes.length; index += 1) {
    const before = input.corridor.keyframes[index - 1]!;
    const after = input.corridor.keyframes[index]!;
    const span = after.progress - before.progress;
    if (Math.abs(span) <= Number.EPSILON) {
      if (Math.abs(progress - before.progress) <= Number.EPSILON) {
        candidates.push(Math.max(before.travel, Math.min(after.travel, preferred)));
      }
      continue;
    }
    const position = (progress - before.progress) / span;
    if (position >= 0 && position <= 1) {
      candidates.push(before.travel + (after.travel - before.travel) * position);
    }
  }
  return candidates.sort((left, right) =>
    Math.abs(left - preferred) - Math.abs(right - preferred)
  )[0] ?? (progress <= input.corridor.keyframes[0]!.progress ? 0 : 1);
}

export function projectKpTutorialRebasedCorridor(input: {
  readonly corridor: KpTutorialMotionCorridor;
  readonly rawTravelAtTakeover: number;
  readonly manualProgress: number;
  readonly rawTravel: number;
}): KpTutorialMotionCorridorProjection {
  const manualTravel = resolveKpTutorialCorridorTravelForProgress({
    corridor: input.corridor,
    progress: input.manualProgress,
    preferredTravel: input.rawTravelAtTakeover
  });
  const travel = clamp(manualTravel + input.rawTravel - input.rawTravelAtTakeover);
  return Object.freeze({
    travel,
    progress: projectKpTutorialCorridorTravel(input.corridor, travel)
  });
}

export function projectKpTutorialScrollFrame<BlockId extends string>(input: {
  readonly blocks: readonly KpTutorialScrollBlockGeometry<BlockId>[];
  readonly viewportHeight: number;
  readonly readingBandRatio?: number | undefined;
}): KpTutorialScrollFrameProjection<BlockId> {
  const height = finitePositive(input.viewportHeight);
  const readingBandY = height * (input.readingBandRatio ?? 0.38);
  const candidates = input.blocks.map((block) => ({
    ...block,
    ...projectKpTutorialMotionCorridor({
      corridor: block.corridor,
      anchorTop: block.anchorTop,
      viewportHeight: height,
      snapTolerance: block.snapTolerance
    }),
    distanceFromReadingBand: Math.abs(block.anchorTop - readingBandY)
  }));
  const travelling = candidates.filter(({ travel }) => travel > 0 && travel < 1);
  const owner = [...(travelling.length > 0 ? travelling : candidates)]
    .sort((left, right) =>
      left.distanceFromReadingBand - right.distanceFromReadingBand
    )[0];
  return Object.freeze({
    activeBlockId: owner?.id,
    readingBandY,
    blocks: Object.freeze(candidates.map((candidate) => Object.freeze({
      id: candidate.id,
      anchorTop: candidate.anchorTop,
      travel: candidate.travel,
      progress: candidate.progress,
      distanceFromReadingBand: candidate.distanceFromReadingBand,
      ownsScroll: candidate.id === owner?.id
    })))
  });
}

/** One host-neutral rAF sampler owns scroll/resize observation for a lesson. */
export class KpTutorialScrollCoordinator<BlockId extends string> {
  private readonly view: Window;
  private readonly registrations: () =>
    readonly KpTutorialScrollBlockRegistration<BlockId>[];
  private readonly onProjection: (
    projection: KpTutorialCoordinatedScrollProjection<BlockId>
  ) => void;
  private frame: number | undefined;
  private connected = false;
  private previousScrollY: number | undefined;
  private readonly profileExecution: boolean;
  private readonly now: () => number;
  private readonly projectionNeighborhoodRadius: number;
  private readonly maxNearViewportBlocks: number;
  private readonly geometryCache: KpTutorialDocumentCueGeometryCache<BlockId>;
  private readonly activationObserver: KpTutorialCueActivationObserver<BlockId>;
  private registrationSnapshot:
    readonly KpTutorialScrollBlockRegistration<BlockId>[] | undefined;
  private registrationByIdSnapshot:
    ReadonlyMap<BlockId, KpTutorialScrollBlockRegistration<BlockId>> | undefined;
  private metrics = emptyScrollCoordinatorMetrics();

  constructor(
    view: Window,
    registrations: () =>
      readonly KpTutorialScrollBlockRegistration<BlockId>[],
    onProjection: (
      projection: KpTutorialCoordinatedScrollProjection<BlockId>
    ) => void,
    options: KpTutorialScrollCoordinatorOptions = {}
  ) {
    this.view = view;
    this.registrations = registrations;
    this.onProjection = onProjection;
    this.profileExecution = options.profileExecution ?? false;
    this.now = options.now ?? (() => this.view.performance.now());
    this.projectionNeighborhoodRadius = nonnegativeInteger(
      options.projectionNeighborhoodRadius ??
        kpTutorialPageScalePerformanceBudget.projectionNeighborhoodRadius,
      "Tutorial projection neighborhood radius"
    );
    this.maxNearViewportBlocks = positiveInteger(
      options.maxNearViewportBlocks ??
        kpTutorialPageScalePerformanceBudget.maxNearViewportBlocks,
      "Tutorial near-viewport block limit"
    );
    const geometryRegistrations = () => this.currentRegistrations().map(
      ({ id, anchor }) => ({ id, anchor })
    );
    this.geometryCache = new KpTutorialDocumentCueGeometryCache(
      view,
      geometryRegistrations
    );
    this.activationObserver = new KpTutorialCueActivationObserver(
      view,
      geometryRegistrations,
      {
        rootMargin: options.activationRootMargin,
        onActivationChange: this.scheduleProjection
      }
    );
  }

  connect(): void {
    if (this.connected) return;
    this.connected = true;
    this.previousScrollY = this.view.scrollY;
    this.view.addEventListener("scroll", this.handleScroll, { passive: true });
    this.view.addEventListener("resize", this.handleResize);
    this.activationObserver.connect();
    this.scheduleProjection();
  }

  disconnect(): void {
    if (!this.connected) return;
    this.connected = false;
    this.view.removeEventListener("scroll", this.handleScroll);
    this.view.removeEventListener("resize", this.handleResize);
    this.activationObserver.disconnect();
    this.cancelPendingProjection();
  }

  readonly handleScroll = (): void => {
    if (this.profileExecution) this.metrics.scrollEvents += 1;
    this.scheduleProjection();
  };

  readonly handleResize = (): void => {
    if (this.profileExecution) this.metrics.resizeEvents += 1;
    this.invalidateGeometry();
  };

  readonly invalidateGeometry = (): void => {
    this.registrationSnapshot = undefined;
    this.registrationByIdSnapshot = undefined;
    this.geometryCache.invalidate();
    this.activationObserver.refresh();
    this.scheduleProjection();
  };

  readonly scheduleProjection = (): void => {
    if (!this.connected) return;
    if (this.profileExecution) this.metrics.scheduleRequests += 1;
    if (this.frame !== undefined) {
      if (this.profileExecution) this.metrics.coalescedRequests += 1;
      return;
    }
    if (this.profileExecution) this.metrics.requestedFrames += 1;
    this.frame = this.view.requestAnimationFrame(() => {
      this.frame = undefined;
      const startedAt = this.profileExecution ? this.now() : 0;
      try {
        const byId = this.currentRegistrationsById();
        const readsBefore = this.geometryCache.measurementReads();
        const scrollY = this.view.scrollY;
        const geometry = this.geometryCache.documentGeometry();
        if (this.profileExecution) this.metrics.layoutReads +=
          this.geometryCache.measurementReads() - readsBefore;
        const activeWindow = projectKpTutorialActiveCueWindow({
          geometry,
          scrollY,
          viewportHeight: this.view.innerHeight,
          neighborhoodRadius: this.projectionNeighborhoodRadius
        });
        const projection = projectKpTutorialScrollFrame({
          blocks: activeWindow.cues.map(({ id, viewportTop }) => {
            const registration = byId.get(id);
            if (registration === undefined) {
              throw new Error(`Missing tutorial scroll registration: ${id}`);
            }
            return {
              id,
              corridor: registration.corridor,
              snapTolerance: registration.snapTolerance,
              anchorTop: viewportTop
            };
          }),
          viewportHeight: this.view.innerHeight
        });
        const nearViewportBlockIds = Object.freeze(projection.blocks
          .filter(({ id, ownsScroll }) =>
            ownsScroll || this.activationObserver.isActive(id)
          )
          .sort((left, right) => {
            if (left.ownsScroll !== right.ownsScroll) return left.ownsScroll ? -1 : 1;
            return left.distanceFromReadingBand - right.distanceFromReadingBand;
          })
          .slice(0, this.maxNearViewportBlocks)
          .map(({ id }) => id));
        const scrollChanged = this.previousScrollY !== undefined &&
          Math.abs(scrollY - this.previousScrollY) > 0.01;
        this.previousScrollY = scrollY;
        this.onProjection(Object.freeze({
          ...projection,
          scrollY,
          scrollChanged,
          nearViewportBlockIds
        }));
      } finally {
        if (this.profileExecution) {
          const duration = Math.max(0, this.now() - startedAt);
          this.metrics.executedFrames += 1;
          this.metrics.totalExecutionMs += duration;
          this.metrics.longestExecutionMs = Math.max(
            this.metrics.longestExecutionMs,
            duration
          );
        }
      }
    });
  };

  snapshotMetrics(): KpTutorialScrollCoordinatorMetrics {
    return Object.freeze({ ...this.metrics });
  }

  resetMetrics(): void {
    this.metrics = emptyScrollCoordinatorMetrics();
  }

  cancelPendingProjection(): void {
    if (this.frame === undefined) return;
    this.view.cancelAnimationFrame(this.frame);
    this.frame = undefined;
  }

  private currentRegistrations():
    readonly KpTutorialScrollBlockRegistration<BlockId>[] {
    if (this.registrationSnapshot !== undefined) {
      return this.registrationSnapshot;
    }
    this.registrationSnapshot = this.registrations();
    if (this.profileExecution) {
      this.metrics.registrationReads += this.registrationSnapshot.length;
    }
    return this.registrationSnapshot;
  }

  private currentRegistrationsById(): ReadonlyMap<
    BlockId,
    KpTutorialScrollBlockRegistration<BlockId>
  > {
    if (this.registrationByIdSnapshot !== undefined) {
      return this.registrationByIdSnapshot;
    }
    const registrations = this.currentRegistrations();
    const byId = new Map(registrations.map((registration) => [
      registration.id,
      registration
    ]));
    if (byId.size !== registrations.length) {
      throw new Error("Tutorial scroll registration ids must be unique.");
    }
    this.registrationByIdSnapshot = byId;
    return byId;
  }
}

function emptyScrollCoordinatorMetrics(): {
  -readonly [Key in keyof KpTutorialScrollCoordinatorMetrics]:
    KpTutorialScrollCoordinatorMetrics[Key]
} {
  return {
    scrollEvents: 0,
    resizeEvents: 0,
    scheduleRequests: 0,
    coalescedRequests: 0,
    requestedFrames: 0,
    executedFrames: 0,
    registrationReads: 0,
    layoutReads: 0,
    totalExecutionMs: 0,
    longestExecutionMs: 0
  };
}

function snapTravel(
  corridor: KpTutorialMotionCorridor,
  travel: number,
  tolerance: number
): number {
  if (tolerance <= 0) return travel;
  const nearest = [...corridor.keyframes].sort((left, right) =>
    Math.abs(left.travel - travel) - Math.abs(right.travel - travel)
  )[0];
  return nearest !== undefined && Math.abs(nearest.travel - travel) <= tolerance
    ? nearest.travel
    : travel;
}

function lowerBoundCueTop<CueId extends string>(
  geometry: readonly KpTutorialDocumentCueGeometry<CueId>[],
  documentY: number
): number {
  let low = 0;
  let high = geometry.length;
  while (low < high) {
    const middle = low + Math.floor((high - low) / 2);
    if (geometry[middle]!.documentTop < documentY) low = middle + 1;
    else high = middle;
  }
  return low;
}

function finitePositive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function nonnegativeInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a nonnegative integer.`);
  }
  return value;
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return value;
}

function clamp(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}
