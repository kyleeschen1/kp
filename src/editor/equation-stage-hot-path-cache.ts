export type KpEditorEquationStageCacheInvalidationReason =
  | "content"
  | "native-fit"
  | "resize"
  | "fonts"
  | "dispose";

export interface KpEditorEquationTransitionNodes {
  readonly element: HTMLElement;
  readonly source: HTMLElement | null;
  readonly target: HTMLElement | null;
  readonly focusTokens: readonly HTMLElement[];
}

export interface KpEditorEquationStageHotPathCache {
  readonly contentKey: string;
  readonly revision: number;
  readonly transitions: readonly KpEditorEquationTransitionNodes[];
  readonly motionTokens: readonly HTMLElement[];
  readonly motionTokenRects: ReadonlyMap<HTMLElement, KpEditorEquationLocalRect>;
}

export interface KpEditorEquationLocalRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

interface InternalCache extends KpEditorEquationStageHotPathCache {
  readonly width: number;
  readonly height: number;
  readonly observer?: ResizeObserver | undefined;
  readonly onInvalidate: (
    stage: HTMLElement,
    reason: KpEditorEquationStageCacheInvalidationReason
  ) => void;
  valid: boolean;
}

const caches = new WeakMap<HTMLElement, InternalCache>();
const activeStages = new Set<HTMLElement>();
let fontInvalidationRegistered = false;

export function isKpEditorEquationStageHotPathCacheValid(
  stage: HTMLElement,
  contentKey: string
): boolean {
  const cached = caches.get(stage);
  return cached?.valid === true && cached.contentKey === contentKey;
}

export function getKpEditorEquationStageHotPathCache(input: {
  readonly stage: HTMLElement;
  readonly contentKey: string;
  readonly onInvalidate: (
    stage: HTMLElement,
    reason: KpEditorEquationStageCacheInvalidationReason
  ) => void;
}): KpEditorEquationStageHotPathCache {
  const existing = caches.get(input.stage);
  if (existing?.valid === true && existing.contentKey === input.contentKey) {
    return existing;
  }
  existing?.observer?.disconnect();

  // Read every stable node and box as one preparation batch. Active playback
  // may then sample semantics and write transforms without rediscovering the
  // DOM tree or mixing layout reads into each animation frame.
  const transitions = [
    ...input.stage.querySelectorAll<HTMLElement>(
      ".editor-equation-stage__transition"
    )
  ].map((element) => ({
    element,
    source: element.querySelector<HTMLElement>(
      "[data-kp-editor-equation-source]"
    ),
    target: element.querySelector<HTMLElement>(
      "[data-kp-editor-equation-target]"
    ),
    focusTokens: [
      ...element.querySelectorAll<HTMLElement>(
        "[data-kp-editor-equation-focus-token]"
      )
    ]
  }));
  const stageRect = input.stage.getBoundingClientRect();
  transitions.forEach(({ element, source, target }) => {
    if (source === null || target === null) return;
    const sourceRect = source.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    element.dataset["kpEditorEquationSourceWidth"] = String(sourceRect.width);
    element.dataset["kpEditorEquationSourceHeight"] = String(sourceRect.height);
    element.dataset["kpEditorEquationTargetWidth"] = String(targetRect.width);
    element.dataset["kpEditorEquationTargetHeight"] = String(targetRect.height);
  });
  const motionTokens = [
    ...input.stage.querySelectorAll<HTMLElement>("[data-kp-motion-id]")
  ];
  const motionTokenRects = new Map(motionTokens.map((token) => [
    token,
    localRect(token.getBoundingClientRect(), stageRect)
  ] as const));
  const revision = Number(input.stage.dataset["kpEditorEquationCacheRevision"] ?? 0);
  const cache: InternalCache = {
    contentKey: input.contentKey,
    revision: Number.isFinite(revision) ? revision : 0,
    transitions,
    motionTokens,
    motionTokenRects,
    width: stageRect.width,
    height: stageRect.height,
    onInvalidate: input.onInvalidate,
    valid: true,
    ...(typeof ResizeObserver === "undefined"
      ? {}
      : {
          observer: createResizeObserver(
            input.stage,
            stageRect.width,
            stageRect.height
          )
        })
  };
  caches.set(input.stage, cache);
  activeStages.add(input.stage);
  registerFontInvalidation();
  input.stage.dataset["kpEditorEquationCacheBuildCount"] = String(
    Number(input.stage.dataset["kpEditorEquationCacheBuildCount"] ?? 0) + 1
  );
  input.stage.dataset["kpEditorEquationCacheStatus"] = "ready";
  cache.observer?.observe(input.stage);
  return cache;
}

export function invalidateKpEditorEquationStageHotPathCache(
  stage: HTMLElement,
  reason: KpEditorEquationStageCacheInvalidationReason
): void {
  const cache = caches.get(stage);
  if (cache === undefined) return;
  if (
    !cache.valid &&
    stage.dataset["kpEditorEquationCacheInvalidationReason"] === reason
  ) return;
  cache.valid = false;
  stage.dataset["kpEditorEquationCacheStatus"] = "invalid";
  stage.dataset["kpEditorEquationCacheInvalidationReason"] = reason;
  stage.dataset["kpEditorEquationCacheRevision"] = String(cache.revision + 1);
  stage.querySelectorAll<HTMLElement>("[data-kp-editor-overlay-geometry-revision]")
    .forEach((overlay) => {
      delete overlay.dataset["kpEditorOverlayGeometryRevision"];
    });
  cache.onInvalidate(stage, reason);
}

export function disposeKpEditorEquationStageHotPathCache(
  stage: HTMLElement
): void {
  const cache = caches.get(stage);
  if (cache === undefined) return;
  invalidateKpEditorEquationStageHotPathCache(stage, "dispose");
  cache.observer?.disconnect();
  caches.delete(stage);
  activeStages.delete(stage);
}

export function disposeKpEditorEquationStageHotPathCaches(
  root: ParentNode
): void {
  root.querySelectorAll<HTMLElement>("[data-kp-editor-equation-stage]")
    .forEach(disposeKpEditorEquationStageHotPathCache);
}

export function invalidateKpEditorEquationStageFontCaches(): void {
  for (const stage of activeStages) {
    if (!stage.isConnected) {
      disposeKpEditorEquationStageHotPathCache(stage);
      continue;
    }
    invalidateKpEditorEquationStageHotPathCache(stage, "fonts");
  }
}

function createResizeObserver(
  stage: HTMLElement,
  width: number,
  height: number
): ResizeObserver {
  return new ResizeObserver((entries) => {
    const entry = entries.find((candidate) => candidate.target === stage);
    if (entry === undefined) return;
    if (
      Math.abs(entry.contentRect.width - width) <= 0.5 &&
      Math.abs(entry.contentRect.height - height) <= 0.5
    ) return;
    invalidateKpEditorEquationStageHotPathCache(stage, "resize");
  });
}

function registerFontInvalidation(): void {
  if (fontInvalidationRegistered || document.fonts === undefined) return;
  fontInvalidationRegistered = true;
  document.fonts.addEventListener(
    "loadingdone",
    invalidateKpEditorEquationStageFontCaches
  );
  void document.fonts.ready.then(invalidateKpEditorEquationStageFontCaches);
}

function localRect(
  rect: DOMRect,
  rootRect: DOMRect
): KpEditorEquationLocalRect {
  return {
    left: rect.left - rootRect.left,
    top: rect.top - rootRect.top,
    width: rect.width,
    height: rect.height
  };
}
