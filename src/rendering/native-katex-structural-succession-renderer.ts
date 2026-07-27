import type {
  KpEquationStructuralSuccessionIntent
} from "../animation/structural-succession-presentation.ts";
import {
  createKatexArtifactSolidMaskMorphRenderer,
  KpWebglContextCapacityError,
  sampleKatexArtifactSolidMaskMorphProgress,
  type KatexArtifactSolidMaskMorphPlan,
  type KatexArtifactSolidMaskMorphRenderer
} from "./katex-artifact-solid-mask-morph.ts";
import {
  createKatexTextureAtlas,
  measureKatexTextureCaptureRect
} from "./katex-texture-atlas.ts";
import {
  measureKpNativeKatexSubtreePaintRect
} from "./native-katex-paint-geometry.ts";
import type {
  KatexMotionToken,
  KatexTextureAtlas,
  KatexTokenRect
} from "./katex-transition-types.ts";
import {
  cancelKpWebglContextLeaseWait
} from "./webgl-context-lease-pool.ts";

export interface KpNativeKatexStructuralSuccessionSyncResult {
  readonly strategy: "solid-mask-succession" | "checkpoint-settlement";
  readonly status: "initializing" | "ready" | "unavailable";
  readonly paintReady?: boolean | undefined;
  readonly reason?: string | undefined;
}

interface EndpointCorrection {
  readonly scaleX: number;
  readonly scaleY: number;
  readonly translateX: number;
  readonly translateY: number;
}

interface StructuralSuccessionState {
  readonly intentId: string;
  readonly sourceElement: HTMLElement;
  readonly targetElement: HTMLElement;
  canvas: HTMLCanvasElement;
  readonly width: number;
  readonly height: number;
  readonly intent: KpEquationStructuralSuccessionIntent;
  atlas?: KatexTextureAtlas | undefined;
  plan?: KatexArtifactSolidMaskMorphPlan | undefined;
  renderer?: KatexArtifactSolidMaskMorphRenderer | undefined;
  status: "initializing" | "prepared" | "waiting" | "ready" | "unavailable";
  reason?: string | undefined;
  progress: number;
  visible: boolean;
  sourceCorrection: EndpointCorrection;
  targetCorrection: EndpointCorrection;
  currentCorrection: EndpointCorrection;
  emptyPaintRetries: number;
  retryFrame?: number | undefined;
  idleReleaseTimer?: number | undefined;
  sourceNativeInkRect?: KatexTokenRect | undefined;
  targetNativeInkRect?: KatexTokenRect | undefined;
  onSettled?: (() => void) | undefined;
}

const identityCorrection: EndpointCorrection = {
  scaleX: 1,
  scaleY: 1,
  translateX: 0,
  translateY: 0
};
const states = new WeakMap<HTMLElement, StructuralSuccessionState>();
// Calibrate the visible antialiased fringe as well as the opaque core. A
// midpoint-only correction can be internally exact while the composited glyph
// still grows by a pixel on each side at a renderer handoff.
const inkAlphaThreshold = 48;
const contextIdleReleaseMs = 250;

export interface KpNativeKatexStructuralSuccessionInkComparison {
  readonly renderedInkRect: KatexTokenRect;
  readonly sourceNativeInkRect: KatexTokenRect;
  readonly targetNativeInkRect: KatexTokenRect;
  readonly referenceEndpoint: "source" | "target";
  readonly maximumGeometryResidualPx: number;
}

export function syncKpNativeKatexStructuralSuccession(input: {
  readonly stage: HTMLElement;
  readonly sourceRoot: HTMLElement;
  readonly targetRoot: HTMLElement;
  readonly intent: KpEquationStructuralSuccessionIntent;
  readonly progress: number;
  readonly visible: boolean;
  readonly enabled: boolean;
  readonly onSettled?: (() => void) | undefined;
}): KpNativeKatexStructuralSuccessionSyncResult {
  if (!input.enabled) {
    disposeKpNativeKatexStructuralSuccession(input.stage);
    return checkpoint(input.stage, "motion-presentation");
  }
  const sourceElement = resolveCaptureElement(
    input.sourceRoot,
    "source",
    input.intent.sourceEntityIds
  );
  const targetElement = resolveCaptureElement(
    input.targetRoot,
    "target",
    input.intent.targetEntityIds
  );
  if (sourceElement === undefined || targetElement === undefined) {
    disposeKpNativeKatexStructuralSuccession(input.stage);
    return checkpoint(input.stage, "structural-capture-unavailable");
  }
  const stageRect = input.stage.getBoundingClientRect();
  let state = states.get(input.stage);
  if (
    state !== undefined &&
    (
      state.intentId !== input.intent.id ||
      state.sourceElement !== sourceElement ||
      state.targetElement !== targetElement ||
      Math.abs(state.width - stageRect.width) > 0.5 ||
      Math.abs(state.height - stageRect.height) > 0.5
    )
  ) {
    disposeKpNativeKatexStructuralSuccession(input.stage);
    state = undefined;
  }
  if (state === undefined) {
    state = createState({
      stage: input.stage,
      sourceElement,
      targetElement,
      intent: input.intent
    });
    states.set(input.stage, state);
    void initializeState(input.stage, state);
  }

  state.progress = input.progress;
  state.visible = input.visible;
  state.onSettled = input.onSettled;
  const requiresContext =
    input.progress >= state.intent.paintStrategy.morph.start &&
    input.progress < 1;
  if (requiresContext) {
    cancelIdleContextRelease(input.stage, state);
    if (state.status === "prepared") {
      activatePreparedRenderer(input.stage, state);
    }
  } else if (state.status === "waiting") {
    cancelKpWebglContextLeaseWait(state.canvas);
    state.status = "prepared";
    state.reason = "webgl-context-idle";
  } else if (state.status === "ready") {
    scheduleIdleContextRelease(input.stage, state);
  }
  if (state.status === "ready" && state.renderer !== undefined) {
    state.renderer.render(input.progress);
    applyCanvasCorrection(state);
    const endpointProgress = sampleKatexArtifactSolidMaskMorphProgress(
      state.intent.paintStrategy.morph,
      input.progress
    );
    const requiresEndpointPaint =
      endpointProgress === 0 || endpointProgress === 1;
    const paintReady =
      !requiresEndpointPaint || state.renderer.measureInk(1) !== undefined;
    state.canvas.style.opacity = input.visible && paintReady ? "1" : "0";
    state.canvas.dataset["kpNativeKatexStructuralPaintReady"] =
      String(paintReady);
    if (!paintReady) {
      scheduleEmptyPaintRetry(input.stage, state);
    } else {
      state.emptyPaintRetries = 0;
    }
    setStageStatus(input.stage, "solid-mask-succession", "ready");
    return {
      strategy: "solid-mask-succession",
      status: "ready",
      paintReady,
      ...(paintReady ? {} : { reason: "solid-mask-frame-empty" })
    };
  }
  if (!requiresContext && state.status === "prepared") {
    state.canvas.style.opacity = "0";
    setStageStatus(input.stage, "solid-mask-succession", "ready");
    return {
      strategy: "solid-mask-succession",
      status: "ready",
      paintReady: false,
      reason: "native-structural-settlement"
    };
  }
  state.canvas.style.opacity = "0";
  if (state.status === "unavailable") {
    return checkpoint(
      input.stage,
      state.reason ?? "solid-mask-initialization-failed"
    );
  }
  setStageStatus(
    input.stage,
    state.reason === "webgl-context-capacity"
      ? "checkpoint-settlement"
      : "solid-mask-succession",
    "initializing",
    state.reason
  );
  return {
    strategy: "checkpoint-settlement",
    status: "initializing",
    reason: state.reason ?? "solid-mask-initializing"
  };
}

export function disposeKpNativeKatexStructuralSuccession(
  stage: HTMLElement
): void {
  const state = states.get(stage);
  if (state === undefined) return;
  if (state.retryFrame !== undefined) {
    stage.ownerDocument.defaultView?.cancelAnimationFrame(state.retryFrame);
  }
  if (state.idleReleaseTimer !== undefined) {
    stage.ownerDocument.defaultView?.clearTimeout(state.idleReleaseTimer);
  }
  cancelKpWebglContextLeaseWait(state.canvas);
  state.renderer?.dispose();
  state.canvas.remove();
  states.delete(stage);
}

function scheduleEmptyPaintRetry(
  stage: HTMLElement,
  state: StructuralSuccessionState
): void {
  const view = stage.ownerDocument.defaultView;
  if (
    view === null ||
    state.retryFrame !== undefined ||
    state.emptyPaintRetries >= 2
  ) {
    return;
  }
  state.emptyPaintRetries += 1;
  state.retryFrame = view.requestAnimationFrame(() => {
    state.retryFrame = undefined;
    if (states.get(stage) === state && stage.isConnected) {
      state.onSettled?.();
    }
  });
}

function scheduleIdleContextRelease(
  stage: HTMLElement,
  state: StructuralSuccessionState
): void {
  const view = stage.ownerDocument.defaultView;
  if (view === null || state.idleReleaseTimer !== undefined) return;
  state.idleReleaseTimer = view.setTimeout(() => {
    state.idleReleaseTimer = undefined;
    if (
      states.get(stage) !== state ||
      (state.progress > 0 && state.progress < 1) ||
      state.renderer === undefined
    ) {
      return;
    }
    state.renderer.dispose();
    state.renderer = undefined;
    const releasedCanvas = state.canvas;
    state.canvas = replaceReleasedCanvas(stage, releasedCanvas);
    state.status = "prepared";
    state.reason = "webgl-context-idle";
    state.canvas.style.opacity = "0";
    setStageStatus(stage, "solid-mask-succession", "ready");
  }, contextIdleReleaseMs);
}

function cancelIdleContextRelease(
  stage: HTMLElement,
  state: StructuralSuccessionState
): void {
  if (state.idleReleaseTimer === undefined) return;
  stage.ownerDocument.defaultView?.clearTimeout(state.idleReleaseTimer);
  state.idleReleaseTimer = undefined;
}

export function measureKpNativeKatexStructuralSuccessionInk(
  stage: HTMLElement
): KpNativeKatexStructuralSuccessionInkComparison | undefined {
  const state = states.get(stage);
  if (
    state?.status !== "ready" ||
    state.renderer === undefined ||
    state.sourceNativeInkRect === undefined ||
    state.targetNativeInkRect === undefined
  ) {
    return undefined;
  }
  state.renderer.render(state.progress);
  const measured = state.renderer.measureInk(inkAlphaThreshold);
  if (measured === undefined) return undefined;
  const renderedInkRect = applyEndpointCorrection(
    measured,
    state.currentCorrection
  );
  const referenceEndpoint = state.progress < 0.5 ? "source" : "target";
  const nativeInkRect = referenceEndpoint === "source"
    ? state.sourceNativeInkRect
    : state.targetNativeInkRect;
  return {
    renderedInkRect,
    sourceNativeInkRect: state.sourceNativeInkRect,
    targetNativeInkRect: state.targetNativeInkRect,
    referenceEndpoint,
    maximumGeometryResidualPx: rectDelta(
      renderedInkRect,
      nativeInkRect
    )
  };
}

function createState(input: {
  readonly stage: HTMLElement;
  readonly sourceElement: HTMLElement;
  readonly targetElement: HTMLElement;
  readonly intent: KpEquationStructuralSuccessionIntent;
}): StructuralSuccessionState {
  const rect = input.stage.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const canvas = createStructuralCanvas({
    stage: input.stage,
    intentId: input.intent.id,
    width: Math.max(1, Math.ceil(rect.width * pixelRatio)),
    height: Math.max(1, Math.ceil(rect.height * pixelRatio))
  });
  input.stage.append(canvas);
  return {
    intentId: input.intent.id,
    sourceElement: input.sourceElement,
    targetElement: input.targetElement,
    canvas,
    width: rect.width,
    height: rect.height,
    intent: input.intent,
    status: "initializing",
    progress: 0,
    visible: false,
    emptyPaintRetries: 0,
    sourceCorrection: identityCorrection,
    targetCorrection: identityCorrection,
    currentCorrection: identityCorrection
  };
}

function createStructuralCanvas(input: {
  readonly stage: HTMLElement;
  readonly intentId: string;
  readonly width: number;
  readonly height: number;
}): HTMLCanvasElement {
  const canvas = input.stage.ownerDocument.createElement("canvas");
  canvas.className = "kp-native-katex-structural-succession";
  canvas.dataset["kpNativeKatexStructuralSuccession"] = input.intentId;
  canvas.dataset["kpEquationMaterialFragmentRole"] =
    "structural-succession";
  canvas.setAttribute("aria-hidden", "true");
  canvas.setAttribute("inert", "");
  canvas.width = input.width;
  canvas.height = input.height;
  return canvas;
}

function replaceReleasedCanvas(
  stage: HTMLElement,
  released: HTMLCanvasElement
): HTMLCanvasElement {
  const replacement = createStructuralCanvas({
    stage,
    intentId:
      released.dataset["kpNativeKatexStructuralSuccession"] ??
      "structural-succession",
    width: released.width,
    height: released.height
  });
  for (const key of [
    "kpNativeKatexStructuralStrategy",
    "kpNativeKatexStructuralProfile",
    "kpNativeKatexStructuralSourceCapture",
    "kpNativeKatexStructuralSourceFont"
  ] as const) {
    const value = released.dataset[key];
    if (value !== undefined) replacement.dataset[key] = value;
  }
  replacement.style.opacity = "0";
  released.replaceWith(replacement);
  return replacement;
}

async function initializeState(
  stage: HTMLElement,
  state: StructuralSuccessionState
): Promise<void> {
  try {
    const stageRect = stage.getBoundingClientRect();
    const sourceRect = measureKatexTextureCaptureRect(
      state.sourceElement,
      { includeTransparent: true, resetTransforms: true }
    );
    const targetRect = measureKatexTextureCaptureRect(
      state.targetElement,
      { includeTransparent: true, resetTransforms: true }
    );
    const sourceLocalRect = viewportRectToLocalRect(sourceRect, stageRect);
    const targetLocalRect = viewportRectToLocalRect(targetRect, stageRect);
    const sourceToken = captureToken(
      `${state.intent.id}.source`,
      state.sourceElement,
      sourceRect,
      sourceLocalRect
    );
    const targetToken = captureToken(
      `${state.intent.id}.target`,
      state.targetElement,
      targetRect,
      targetLocalRect
    );
    const atlas = await createKatexTextureAtlas(
      [sourceToken, targetToken],
      {
        forceVisibleTokenIds: [sourceToken.id, targetToken.id],
        preserveFontIdentityTokenIds: [sourceToken.id],
        resetTransformTokenIds: [sourceToken.id, targetToken.id]
      }
    );
    if (states.get(stage) !== state || !stage.isConnected) return;
    const strategy = state.intent.paintStrategy;
    const plan: KatexArtifactSolidMaskMorphPlan = {
      id: `${state.intent.id}.solid-mask`,
      kind: "artifact-solid-mask-morph",
      source: { tokenId: sourceToken.id, rect: sourceLocalRect },
      target: { tokenId: targetToken.id, rect: targetLocalRect },
      ...strategy.morph,
      ...strategy.solidMask,
      sourceColor: parseComputedColor(state.sourceElement),
      color: parseComputedColor(state.targetElement)
    };
    const sourceLiveInkRect = measureAtlasEndpointInk({
      atlas,
      tokenId: sourceToken.id,
      endpointRect: sourceLocalRect
    });
    const sourceNativeInkRect =
      measureKpNativeKatexSubtreePaintRect(stage, state.sourceElement) ??
      sourceLiveInkRect;
    const targetLiveInkRect = measureAtlasEndpointInk({
      atlas,
      tokenId: targetToken.id,
      endpointRect: targetLocalRect
    });
    state.atlas = atlas;
    state.plan = plan;
    state.sourceNativeInkRect = sourceNativeInkRect;
    state.targetNativeInkRect = targetLiveInkRect;
    state.status = "prepared";
    state.reason = "webgl-context-idle";
    state.canvas.style.opacity = "0";
    state.canvas.dataset["kpNativeKatexStructuralStrategy"] =
      "signed-distance-field";
    state.canvas.dataset["kpNativeKatexStructuralProfile"] =
      strategy.profileId;
    state.canvas.dataset["kpNativeKatexStructuralSourceCapture"] =
      "document-font-canvas";
    state.canvas.dataset["kpNativeKatexStructuralSourceFont"] =
      nativeTextFontFingerprint(state.sourceElement);
    if (
      state.progress >= state.intent.paintStrategy.morph.start &&
      state.progress < 1
    ) {
      activatePreparedRenderer(stage, state);
    }
    const activationStatus = (state as StructuralSuccessionState).status;
    if (activationStatus === "unavailable") {
      state.onSettled?.();
      return;
    }
    setStageStatus(
      stage,
      activationStatus === "waiting"
        ? "checkpoint-settlement"
        : "solid-mask-succession",
      activationStatus === "ready" || activationStatus === "prepared"
        ? "ready"
        : "initializing",
      state.reason
    );
    // Capture is asynchronous. Reapply the latest canonical session frame so
    // a direct seek after resize cannot leave a ready canvas hidden at source.
    state.onSettled?.();
  } catch (error) {
    if (states.get(stage) !== state) return;
    state.status = "unavailable";
    state.reason = error instanceof Error
      ? error.message
      : "solid-mask-initialization-failed";
    state.canvas.style.opacity = "0";
    checkpoint(stage, state.reason);
    state.onSettled?.();
  }
}

function activatePreparedRenderer(
  stage: HTMLElement,
  state: StructuralSuccessionState
): void {
  if (
    state.atlas === undefined ||
    state.plan === undefined ||
    state.sourceNativeInkRect === undefined ||
    state.targetNativeInkRect === undefined
  ) {
    return;
  }
  try {
    const renderer = createKatexArtifactSolidMaskMorphRenderer(
      state.canvas,
      state.plan,
      state.atlas,
      {
        onContextAvailable: () => {
          if (
            states.get(stage) !== state ||
            !stage.isConnected ||
            state.status !== "waiting"
          ) {
            return;
          }
          state.status = "prepared";
          activatePreparedRenderer(stage, state);
          state.onSettled?.();
        },
        onContextLost: () => {
          if (states.get(stage) !== state) return;
          const onSettled = state.onSettled;
          disposeKpNativeKatexStructuralSuccession(stage);
          onSettled?.();
        }
      }
    );
    state.renderer = renderer;
    state.sourceCorrection = measureEndpointCorrection({
      renderer,
      progress: 0,
      nativeInkRect: state.sourceNativeInkRect
    });
    state.targetCorrection = measureEndpointCorrection({
      renderer,
      progress: 1,
      nativeInkRect: state.targetNativeInkRect
    });
    state.status = "ready";
    state.reason = undefined;
    renderer.render(state.progress);
    applyCanvasCorrection(state);
  } catch (error) {
    state.renderer?.dispose();
    state.renderer = undefined;
    state.canvas.style.opacity = "0";
    if (error instanceof KpWebglContextCapacityError) {
      state.status = "waiting";
      state.reason = "webgl-context-capacity";
      setStageStatus(
        stage,
        "checkpoint-settlement",
        "initializing",
        state.reason
      );
      return;
    }
    state.status = "unavailable";
    state.reason = error instanceof Error
      ? error.message
      : "solid-mask-initialization-failed";
    checkpoint(stage, state.reason);
  }
}

function resolveCaptureElement(
  root: HTMLElement,
  side: "source" | "target",
  requiredEntityIds: readonly string[]
): HTMLElement | undefined {
  return [root, ...root.querySelectorAll<HTMLElement>(
    `[data-kp-structural-succession-capture="${side}"]`
  )].find((candidate) => {
    if (candidate.dataset["kpStructuralSuccessionCapture"] !== side) {
      return false;
    }
    const encoded = candidate.dataset["kpStructuralSuccessionEntityIds"];
    if (encoded === undefined) return false;
    try {
      const entityIds = JSON.parse(encoded);
      return Array.isArray(entityIds) &&
        requiredEntityIds.every((entityId) => entityIds.includes(entityId));
    } catch {
      return false;
    }
  });
}

function captureToken(
  id: string,
  element: HTMLElement,
  rect: KatexTokenRect,
  localRect: KatexTokenRect
): KatexMotionToken {
  return {
    id,
    text: id,
    signature: id,
    rect,
    localRect,
    row: 0,
    element
  };
}

function viewportRectToLocalRect(
  rect: KatexTokenRect,
  stageRect: DOMRect
): KatexTokenRect {
  return {
    left: rect.left - stageRect.left,
    top: rect.top - stageRect.top,
    width: rect.width,
    height: rect.height
  };
}

function parseComputedColor(element: HTMLElement): {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
} {
  const components = getComputedStyle(element).color.match(
    /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/
  );
  if (components === null) {
    throw new Error("Could not resolve structural succession paint color.");
  }
  return {
    red: Number(components[1]) / 255,
    green: Number(components[2]) / 255,
    blue: Number(components[3]) / 255
  };
}

function nativeTextFontFingerprint(root: HTMLElement): string {
  const fingerprints = [root, ...root.querySelectorAll<HTMLElement>("*")]
    .filter((element) =>
      [...element.childNodes].some((node) =>
        node.nodeType === Node.TEXT_NODE &&
        (node.textContent ?? "").replace(/[\s\u200b-\u200d\ufeff]+/g, "") !== ""
      )
    )
    .map((element) => {
      const computed = getComputedStyle(element);
      return [
        computed.fontFamily,
        computed.fontSize,
        computed.fontStyle,
        computed.fontWeight
      ].join("|");
    });
  return [...new Set(fingerprints)].sort().join(";");
}

function measureAtlasEndpointInk(input: {
  readonly atlas: KatexTextureAtlas;
  readonly tokenId: string;
  readonly endpointRect: KatexTokenRect;
}): KatexTokenRect {
  const region = input.atlas.regions.get(input.tokenId);
  const page = region === undefined ? undefined : input.atlas.pages[region.page];
  if (region === undefined || page === undefined) {
    throw new Error(`Missing structural capture for ${input.tokenId}.`);
  }
  const context = page.getContext("2d");
  if (context === null) {
    throw new Error("Could not read structural succession capture.");
  }
  const pixels = context.getImageData(
    region.x,
    region.y,
    region.width,
    region.height
  ).data;
  let left = region.width;
  let top = region.height;
  let right = -1;
  let bottom = -1;
  for (let y = 0; y < region.height; y += 1) {
    for (let x = 0; x < region.width; x += 1) {
      if ((pixels[(y * region.width + x) * 4 + 3] ?? 0) < inkAlphaThreshold) {
        continue;
      }
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left || bottom < top) {
    throw new Error("Structural succession capture contains no ink.");
  }
  const pixelRatio = input.atlas.pixelRatio;
  return {
    left: input.endpointRect.left + left / pixelRatio,
    top: input.endpointRect.top + top / pixelRatio,
    width: (right - left + 1) / pixelRatio,
    height: (bottom - top + 1) / pixelRatio
  };
}

function measureEndpointCorrection(input: {
  readonly renderer: KatexArtifactSolidMaskMorphRenderer;
  readonly progress: number;
  readonly nativeInkRect: KatexTokenRect;
}): EndpointCorrection {
  input.renderer.render(input.progress);
  const rendered = input.renderer.measureInk(inkAlphaThreshold);
  if (rendered === undefined) {
    throw new Error("Structural succession endpoint calibration has no ink.");
  }
  const renderedCenter = rectCenter(rendered);
  const nativeCenter = rectCenter(input.nativeInkRect);
  const scaleX = input.nativeInkRect.width / rendered.width;
  const scaleY = input.nativeInkRect.height / rendered.height;
  return {
    scaleX,
    scaleY,
    translateX: nativeCenter.x - renderedCenter.x * scaleX,
    translateY: nativeCenter.y - renderedCenter.y * scaleY
  };
}

function applyCanvasCorrection(state: StructuralSuccessionState): void {
  const progress = sampleKatexArtifactSolidMaskMorphProgress(
    state.intent.paintStrategy.morph,
    state.progress
  );
  const correction = {
    scaleX: interpolate(
      state.sourceCorrection.scaleX,
      state.targetCorrection.scaleX,
      progress
    ),
    scaleY: interpolate(
      state.sourceCorrection.scaleY,
      state.targetCorrection.scaleY,
      progress
    ),
    translateX: interpolate(
      state.sourceCorrection.translateX,
      state.targetCorrection.translateX,
      progress
    ),
    translateY: interpolate(
      state.sourceCorrection.translateY,
      state.targetCorrection.translateY,
      progress
    )
  };
  state.currentCorrection = correction;
  state.canvas.style.transformOrigin = "0 0";
  state.canvas.style.transform =
    `matrix(${correction.scaleX}, 0, 0, ${correction.scaleY}, ` +
    `${correction.translateX}, ${correction.translateY})`;
}

function applyEndpointCorrection(
  rect: KatexTokenRect,
  correction: EndpointCorrection
): KatexTokenRect {
  return {
    left: rect.left * correction.scaleX + correction.translateX,
    top: rect.top * correction.scaleY + correction.translateY,
    width: rect.width * correction.scaleX,
    height: rect.height * correction.scaleY
  };
}

function rectDelta(left: KatexTokenRect, right: KatexTokenRect): number {
  return Math.max(
    Math.abs(left.left - right.left),
    Math.abs(left.top - right.top),
    Math.abs(left.width - right.width),
    Math.abs(left.height - right.height)
  );
}

function rectCenter(rect: KatexTokenRect): {
  readonly x: number;
  readonly y: number;
} {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

function interpolate(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function checkpoint(
  stage: HTMLElement,
  reason: string
): KpNativeKatexStructuralSuccessionSyncResult {
  setStageStatus(stage, "checkpoint-settlement", "unavailable", reason);
  return {
    strategy: "checkpoint-settlement",
    status: "unavailable",
    reason
  };
}

function setStageStatus(
  stage: HTMLElement,
  strategy: KpNativeKatexStructuralSuccessionSyncResult["strategy"],
  status: KpNativeKatexStructuralSuccessionSyncResult["status"],
  reason?: string
): void {
  stage.dataset["kpNativeKatexStructuralSuccessionStrategy"] = strategy;
  stage.dataset["kpNativeKatexStructuralSuccessionStatus"] = status;
  if (reason === undefined) {
    delete stage.dataset["kpNativeKatexStructuralSuccessionReason"];
  } else {
    stage.dataset["kpNativeKatexStructuralSuccessionReason"] = reason;
  }
}
