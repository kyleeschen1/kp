import type {
  KpEquationStructuralSuccessionIntent
} from "../animation/structural-succession-presentation.ts";
import {
  createKatexArtifactSolidMaskMorphRenderer,
  sampleKatexArtifactSolidMaskMorphProgress,
  type KatexArtifactSolidMaskMorphPlan,
  type KatexArtifactSolidMaskMorphRenderer
} from "./katex-artifact-solid-mask-morph.ts";
import {
  createKatexTextureAtlas,
  measureKatexTextureCaptureRect
} from "./katex-texture-atlas.ts";
import type {
  KatexMotionToken,
  KatexTextureAtlas,
  KatexTokenRect
} from "./katex-transition-types.ts";

export interface KpNativeKatexStructuralSuccessionSyncResult {
  readonly strategy: "solid-mask-succession" | "checkpoint-settlement";
  readonly status: "initializing" | "ready" | "unavailable";
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
  readonly canvas: HTMLCanvasElement;
  readonly width: number;
  readonly height: number;
  readonly intent: KpEquationStructuralSuccessionIntent;
  renderer?: KatexArtifactSolidMaskMorphRenderer | undefined;
  status: "initializing" | "ready" | "unavailable";
  reason?: string | undefined;
  progress: number;
  visible: boolean;
  sourceCorrection: EndpointCorrection;
  targetCorrection: EndpointCorrection;
  currentCorrection: EndpointCorrection;
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
const inkAlphaThreshold = 128;

export interface KpNativeKatexStructuralSuccessionInkComparison {
  readonly renderedInkRect: KatexTokenRect;
  readonly targetNativeInkRect: KatexTokenRect;
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
  if (!supportsWebgl(input.stage.ownerDocument)) {
    disposeKpNativeKatexStructuralSuccession(input.stage);
    return checkpoint(input.stage, "webgl-unavailable");
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
  if (state.status === "ready" && state.renderer !== undefined) {
    state.renderer.render(input.progress);
    applyCanvasCorrection(state);
    state.canvas.style.opacity = input.visible ? "1" : "0";
    setStageStatus(input.stage, "solid-mask-succession", "ready");
    return {
      strategy: "solid-mask-succession",
      status: "ready"
    };
  }
  state.canvas.style.opacity = "0";
  if (state.status === "unavailable") {
    return checkpoint(
      input.stage,
      state.reason ?? "solid-mask-initialization-failed"
    );
  }
  setStageStatus(input.stage, "solid-mask-succession", "initializing");
  return {
    strategy: "checkpoint-settlement",
    status: "initializing",
    reason: "solid-mask-initializing"
  };
}

export function disposeKpNativeKatexStructuralSuccession(
  stage: HTMLElement
): void {
  const state = states.get(stage);
  if (state === undefined) return;
  state.renderer?.dispose();
  state.canvas.remove();
  states.delete(stage);
}

export function measureKpNativeKatexStructuralSuccessionInk(
  stage: HTMLElement
): KpNativeKatexStructuralSuccessionInkComparison | undefined {
  const state = states.get(stage);
  if (
    state?.status !== "ready" ||
    state.renderer === undefined ||
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
  return {
    renderedInkRect,
    targetNativeInkRect: state.targetNativeInkRect,
    maximumGeometryResidualPx: rectDelta(
      renderedInkRect,
      state.targetNativeInkRect
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
  const canvas = input.stage.ownerDocument.createElement("canvas");
  canvas.className = "kp-native-katex-structural-succession";
  canvas.dataset["kpNativeKatexStructuralSuccession"] = input.intent.id;
  canvas.dataset["kpEquationMaterialFragmentRole"] =
    "structural-succession";
  canvas.setAttribute("aria-hidden", "true");
  canvas.setAttribute("inert", "");
  canvas.width = Math.max(1, Math.ceil(rect.width * pixelRatio));
  canvas.height = Math.max(1, Math.ceil(rect.height * pixelRatio));
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
    sourceCorrection: identityCorrection,
    targetCorrection: identityCorrection,
    currentCorrection: identityCorrection
  };
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
      color: parseComputedColor(state.targetElement)
    };
    state.renderer = createKatexArtifactSolidMaskMorphRenderer(
      state.canvas,
      plan,
      atlas
    );
    const sourceInkRect = measureAtlasEndpointInk({
      atlas,
      tokenId: sourceToken.id,
      endpointRect: sourceLocalRect
    });
    const targetInkRect = measureAtlasEndpointInk({
      atlas,
      tokenId: targetToken.id,
      endpointRect: targetLocalRect
    });
    state.sourceCorrection = measureEndpointCorrection({
      renderer: state.renderer,
      progress: 0,
      nativeInkRect: sourceInkRect
    });
    state.targetCorrection = measureEndpointCorrection({
      renderer: state.renderer,
      progress: 1,
      nativeInkRect: targetInkRect
    });
    state.targetNativeInkRect = targetInkRect;
    state.status = "ready";
    state.renderer.render(state.progress);
    applyCanvasCorrection(state);
    state.canvas.style.opacity = state.visible ? "1" : "0";
    state.canvas.dataset["kpNativeKatexStructuralStrategy"] =
      "signed-distance-field";
    state.canvas.dataset["kpNativeKatexStructuralProfile"] =
      strategy.profileId;
    setStageStatus(stage, "solid-mask-succession", "ready");
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

function supportsWebgl(ownerDocument: Document): boolean {
  try {
    return ownerDocument.createElement("canvas").getContext("webgl") !== null;
  } catch {
    return false;
  }
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
