export interface KpTutorialSemanticTransitEndpoints {
  readonly source: HTMLElement;
  readonly destination: HTMLElement;
  readonly stage: HTMLElement;
}

export interface KpTutorialSemanticTransitRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
  readonly right: number;
  readonly bottom: number;
  readonly centerX: number;
  readonly centerY: number;
}

export interface KpTutorialSemanticTransitGeometry {
  readonly revision: number;
  readonly sourceDocument: KpTutorialSemanticTransitRect;
  readonly destinationDocument: KpTutorialSemanticTransitRect;
  readonly destinationStageLocal: KpTutorialSemanticTransitRect;
  readonly stageDocument: KpTutorialSemanticTransitRect;
  readonly viewport: Readonly<{ width: number; height: number }>;
}

export interface KpTutorialSemanticTransitProjection {
  readonly sourceViewport: KpTutorialSemanticTransitRect;
  readonly destinationViewport: KpTutorialSemanticTransitRect;
  readonly stageViewport: KpTutorialSemanticTransitRect;
  readonly viewport: Readonly<{ width: number; height: number }>;
}

export interface KpTutorialSemanticTransitTransform {
  readonly progress: number;
  readonly x: number;
  readonly y: number;
  readonly visible: boolean;
}

export interface KpTutorialSemanticTransitGeometryCacheOptions {
  readonly onInvalidated?: (() => void) | undefined;
}

/**
 * Source and stage geometry is retained in document/local space so scroll
 * frames need only scrollY plus the already-owned sticky-stage position.
 */
export class KpTutorialSemanticTransitGeometryCache {
  private readonly view: Window;
  private readonly endpoints: () => KpTutorialSemanticTransitEndpoints;
  private readonly onInvalidated: (() => void) | undefined;
  private snapshot: KpTutorialSemanticTransitGeometry | undefined;
  private observer: ResizeObserver | undefined;
  private connected = false;
  private invalidated = true;
  private revision = 0;
  private reads = 0;

  constructor(
    view: Window,
    endpoints: () => KpTutorialSemanticTransitEndpoints,
    options: KpTutorialSemanticTransitGeometryCacheOptions = {}
  ) {
    this.view = view;
    this.endpoints = endpoints;
    this.onInvalidated = options.onInvalidated;
  }

  connect(): void {
    if (this.connected) return;
    this.connected = true;
    this.view.addEventListener("resize", this.invalidate);
    this.view.document.fonts?.addEventListener(
      "loadingdone",
      this.invalidate
    );
    const Observer = (this.view as Window & {
      readonly ResizeObserver?: typeof ResizeObserver;
    }).ResizeObserver;
    if (typeof Observer === "function") {
      this.observer = new Observer(this.invalidate);
      this.observeEndpoints();
    }
  }

  disconnect(): void {
    if (!this.connected) return;
    this.connected = false;
    this.view.removeEventListener("resize", this.invalidate);
    this.view.document.fonts?.removeEventListener(
      "loadingdone",
      this.invalidate
    );
    this.observer?.disconnect();
    this.observer = undefined;
  }

  readonly invalidate = (): void => {
    if (this.invalidated) return;
    this.invalidated = true;
    this.onInvalidated?.();
  };

  refreshEndpoints(): void {
    this.observer?.disconnect();
    this.observeEndpoints();
    this.invalidate();
  }

  geometry(): KpTutorialSemanticTransitGeometry {
    if (!this.invalidated && this.snapshot !== undefined) return this.snapshot;
    const { source, destination, stage } = this.endpoints();
    const scrollX = finite(this.view.scrollX, "Transit scroll x");
    const scrollY = finite(this.view.scrollY, "Transit scroll y");
    const sourceDocument = this.measureDocumentRect(source, scrollX, scrollY);
    const destinationDocument = this.measureDocumentRect(
      destination,
      scrollX,
      scrollY
    );
    const stageDocument = this.measureDocumentRect(stage, scrollX, scrollY);
    const destinationStageLocal = translateRect(
      destinationDocument,
      -stageDocument.left,
      -stageDocument.top
    );
    this.revision += 1;
    this.snapshot = Object.freeze({
      revision: this.revision,
      sourceDocument,
      destinationDocument,
      destinationStageLocal,
      stageDocument,
      viewport: Object.freeze({
        width: positive(this.view.innerWidth, "Transit viewport width"),
        height: positive(this.view.innerHeight, "Transit viewport height")
      })
    });
    this.invalidated = false;
    return this.snapshot;
  }

  measurementReads(): number {
    return this.reads;
  }

  private measureDocumentRect(
    element: HTMLElement,
    scrollX: number,
    scrollY: number
  ): KpTutorialSemanticTransitRect {
    this.reads += 1;
    return translateRect(rectFromBounds(element.getBoundingClientRect()), scrollX, scrollY);
  }

  private observeEndpoints(): void {
    if (this.observer === undefined) return;
    const { source, destination, stage } = this.endpoints();
    for (const endpoint of new Set([source, destination, stage])) {
      this.observer.observe(endpoint);
    }
  }
}

export function projectKpTutorialSemanticTransitGeometry(input: {
  readonly geometry: KpTutorialSemanticTransitGeometry;
  readonly scrollX: number;
  readonly scrollY: number;
  /** Sticky layout authority may replace only the cached stage viewport box. */
  readonly stageViewport?: KpTutorialSemanticTransitRect | undefined;
}): KpTutorialSemanticTransitProjection {
  const scrollX = finite(input.scrollX, "Transit scroll x");
  const scrollY = finite(input.scrollY, "Transit scroll y");
  const stageViewport = input.stageViewport === undefined
    ? translateRect(input.geometry.stageDocument, -scrollX, -scrollY)
    : rectFromBounds(input.stageViewport);
  return Object.freeze({
    sourceViewport: translateRect(
      input.geometry.sourceDocument,
      -scrollX,
      -scrollY
    ),
    destinationViewport: translateRect(
      input.geometry.destinationStageLocal,
      stageViewport.left,
      stageViewport.top
    ),
    stageViewport,
    viewport: input.geometry.viewport
  });
}

export function projectKpTutorialSemanticTransitTransform(input: {
  readonly projection: KpTutorialSemanticTransitProjection;
  readonly progress: number;
}): KpTutorialSemanticTransitTransform {
  const progress = clampUnit(input.progress);
  const source = input.projection.sourceViewport;
  const destination = input.projection.destinationViewport;
  // Center alignment keeps the cloned glyph at native scale, avoiding the
  // subpixel blur that a size interpolation would introduce.
  const destinationX = destination.centerX - source.width / 2;
  const destinationY = destination.centerY - source.height / 2;
  return Object.freeze({
    progress,
    x: interpolate(source.left, destinationX, progress),
    y: interpolate(source.top, destinationY, progress),
    visible: progress > 0 && progress < 1
  });
}

function rectFromBounds(bounds: Pick<DOMRectReadOnly,
  "left" | "top" | "width" | "height"
>): KpTutorialSemanticTransitRect {
  const left = finite(bounds.left, "Transit rectangle left");
  const top = finite(bounds.top, "Transit rectangle top");
  const width = nonnegative(bounds.width, "Transit rectangle width");
  const height = nonnegative(bounds.height, "Transit rectangle height");
  return Object.freeze({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    centerX: left + width / 2,
    centerY: top + height / 2
  });
}

function translateRect(
  rect: Pick<KpTutorialSemanticTransitRect, "left" | "top" | "width" | "height">,
  x: number,
  y: number
): KpTutorialSemanticTransitRect {
  return rectFromBounds({
    left: rect.left + finite(x, "Transit translation x"),
    top: rect.top + finite(y, "Transit translation y"),
    width: rect.width,
    height: rect.height
  });
}

function finite(value: number, label: string): number {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite.`);
  return value;
}

function nonnegative(value: number, label: string): number {
  const result = finite(value, label);
  if (result < 0) throw new Error(`${label} must be nonnegative.`);
  return result;
}

function positive(value: number, label: string): number {
  const result = finite(value, label);
  if (result <= 0) throw new Error(`${label} must be positive.`);
  return result;
}

function clampUnit(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}

function interpolate(before: number, after: number, progress: number): number {
  return before + (after - before) * progress;
}
