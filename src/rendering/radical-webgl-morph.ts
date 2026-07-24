import {
  kpRadicalConventionalMorphProfile
} from "../animation/radical-morph-profile.ts";
import {
  createKatexArtifactSolidMaskMorphRenderer,
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

export interface KpRadicalWebglMorphSyncResult {
  readonly mode: "webgl-solid-mask" | "dom-fallback";
  readonly ready: boolean;
  readonly sourceCaptureRect?: KatexTokenRect | undefined;
  readonly targetCaptureRect?: KatexTokenRect | undefined;
}

export interface KpRadicalWebglInkComparison {
  readonly endpoint: "source" | "target";
  readonly semanticProgress: number;
  readonly renderedWebglInkRect: KatexTokenRect;
  readonly liveNativeInkRect: KatexTokenRect;
  readonly positionResidualPx: number;
  readonly sizeResidualPx: number;
  readonly maximumGeometryResidualPx: number;
}

interface KpRadicalWebglMorphState {
  sourceElement: HTMLElement;
  targetElement: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly width: number;
  readonly height: number;
  readonly materialIdentityKey: string;
  renderer?: KatexArtifactSolidMaskMorphRenderer | undefined;
  status: "initializing" | "ready" | "fallback";
  progress: number;
  opacity: number;
  sourceCaptureRect?: KatexTokenRect | undefined;
  sourceNativeInkRect?: KatexTokenRect | undefined;
  targetCaptureRect?: KatexTokenRect | undefined;
  targetNativeInkRect?: KatexTokenRect | undefined;
}

const morphStates = new WeakMap<HTMLElement, KpRadicalWebglMorphState>();

export function syncKpRadicalWebglMorph(input: {
  readonly stage: HTMLElement;
  readonly sourceElement: HTMLElement;
  readonly targetElement: HTMLElement;
  readonly semanticProgress: number;
  readonly opacity: number;
  readonly enabled: boolean;
}): KpRadicalWebglMorphSyncResult {
  if (!input.enabled) {
    disposeKpRadicalWebglMorph(input.stage);
    input.stage.dataset["kpEditorRadicalMorphMode"] = "dom-fallback";
    input.stage.dataset["kpEditorRadicalMorphReady"] = "false";
    input.stage.dataset["kpEditorRadicalMorphFallbackReason"] =
      "motion-presentation";
    return { mode: "dom-fallback", ready: false };
  }

  const stageRect = input.stage.getBoundingClientRect();
  let state = morphStates.get(input.stage);
  if (
    state !== undefined &&
    (
      state.sourceElement !== input.sourceElement ||
      state.targetElement !== input.targetElement ||
      Math.abs(state.width - stageRect.width) > 0.5 ||
      Math.abs(state.height - stageRect.height) > 0.5
    )
  ) {
    disposeKpRadicalWebglMorph(input.stage);
    state = undefined;
  }

  if (state === undefined) {
    state = createMorphState(
      input.stage,
      input.sourceElement,
      input.targetElement
    );
    morphStates.set(input.stage, state);
    void initializeMorphState({ stage: input.stage, state });
  }

  state.progress = input.semanticProgress;
  state.opacity = input.opacity;
  if (state.status === "ready" && state.renderer !== undefined) {
    state.renderer.render(state.progress);
    state.canvas.style.opacity = String(state.opacity);
    input.stage.dataset["kpEditorRadicalMorphMode"] = "webgl-solid-mask";
    input.stage.dataset["kpEditorRadicalMorphReady"] = "true";
    delete input.stage.dataset["kpEditorRadicalMorphFallbackReason"];
    return {
      mode: "webgl-solid-mask",
      ready: true,
      sourceCaptureRect: state.sourceCaptureRect,
      targetCaptureRect: state.targetCaptureRect
    };
  }

  state.canvas.style.opacity = "0";
  input.stage.dataset["kpEditorRadicalMorphReady"] = "false";
  input.stage.dataset["kpEditorRadicalMorphMode"] = state.status === "fallback"
    ? "dom-fallback"
    : "webgl-solid-mask";
  return {
    mode: state.status === "fallback"
      ? "dom-fallback"
      : "webgl-solid-mask",
    ready: false
  };
}

export function disposeKpRadicalWebglMorph(stage: HTMLElement): void {
  const state = morphStates.get(stage);
  if (state === undefined) return;
  state.renderer?.dispose();
  state.canvas.remove();
  morphStates.delete(stage);
}

export function measureKpRadicalWebglSourceInk(
  stage: HTMLElement
): KpRadicalWebglInkComparison | undefined {
  return measureKpRadicalWebglInk(stage, "source");
}

export function measureKpRadicalWebglInk(
  stage: HTMLElement,
  endpoint: "source" | "target"
): KpRadicalWebglInkComparison | undefined {
  const state = morphStates.get(stage);
  const liveNativeInkRect = endpoint === "source"
    ? state?.sourceNativeInkRect
    : state?.targetNativeInkRect;
  if (
    state?.status !== "ready" ||
    state.renderer === undefined ||
    liveNativeInkRect === undefined
  ) {
    return undefined;
  }
  // Readback is diagnostic-only. Re-rendering immediately before readPixels
  // avoids relying on the browser preserving a composited WebGL buffer.
  state.renderer.render(state.progress);
  const renderedWebglInkRect = state.renderer.measureInk();
  if (renderedWebglInkRect === undefined) return undefined;
  const renderedCenter = rectCenter(renderedWebglInkRect);
  const nativeCenter = rectCenter(liveNativeInkRect);
  return {
    endpoint,
    semanticProgress: state.progress,
    renderedWebglInkRect,
    liveNativeInkRect,
    positionResidualPx: Math.hypot(
      renderedCenter.x - nativeCenter.x,
      renderedCenter.y - nativeCenter.y
    ),
    sizeResidualPx: Math.hypot(
      renderedWebglInkRect.width - liveNativeInkRect.width,
      renderedWebglInkRect.height - liveNativeInkRect.height
    ),
    maximumGeometryResidualPx: Math.max(
      Math.abs(renderedWebglInkRect.left - liveNativeInkRect.left),
      Math.abs(renderedWebglInkRect.top - liveNativeInkRect.top),
      Math.abs(renderedWebglInkRect.width - liveNativeInkRect.width),
      Math.abs(renderedWebglInkRect.height - liveNativeInkRect.height)
    )
  };
}

function createMorphState(
  stage: HTMLElement,
  sourceElement: HTMLElement,
  targetElement: HTMLElement
): KpRadicalWebglMorphState {
  const rect = stage.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  const canvas = document.createElement("canvas");
  canvas.className = "editor-equation-stage__radical-webgl-morph";
  canvas.dataset["kpEditorRadicalWebglMorph"] = "true";
  canvas.dataset["kpEditorRadicalWebglSource"] = "fractional-exponent";
  canvas.dataset["kpEditorRadicalWebglTarget"] =
    "complete-native-radical-operator";
  canvas.dataset["kpEquationMaterialFragmentRole"] =
    "radical-complete-operator";
  canvas.width = Math.max(1, Math.ceil(rect.width * pixelRatio));
  canvas.height = Math.max(1, Math.ceil(rect.height * pixelRatio));
  stage.append(canvas);
  return {
    sourceElement,
    targetElement,
    canvas,
    width: rect.width,
    height: rect.height,
    materialIdentityKey:
      stage.dataset["kpEditorEquationMaterialIdentityKey"] ?? "",
    status: "initializing",
    progress: 0,
    opacity: 0
  };
}

async function initializeMorphState(input: {
  readonly stage: HTMLElement;
  readonly state: KpRadicalWebglMorphState;
}): Promise<void> {
  try {
    const stageRect = input.stage.getBoundingClientRect();
    const sourceRect = measureKatexTextureCaptureRect(
      input.state.sourceElement,
      { includeTransparent: true }
    );
    const targetRect = measureKatexTextureCaptureRect(
      input.state.targetElement
    );
    const sourceLocalRect = viewportRectToLocalRect(sourceRect, stageRect);
    const targetLocalRect = viewportRectToLocalRect(targetRect, stageRect);
    const sourceToken = captureToken(
      "radical-morph.fractional-exponent",
      input.state.sourceElement,
      sourceRect,
      sourceLocalRect
    );
    const targetToken = captureToken(
      "radical-morph.complete-native-radical",
      input.state.targetElement,
      targetRect,
      targetLocalRect
    );
    const atlas = await createKatexTextureAtlas(
      [sourceToken, targetToken],
      { forceVisibleTokenIds: [sourceToken.id] }
    );
    if (
      morphStates.get(input.stage) !== input.state ||
      !input.stage.isConnected
    ) {
      return;
    }

    const profile = kpRadicalConventionalMorphProfile;
    const plan: KatexArtifactSolidMaskMorphPlan = {
      id: "radical-rewrite.complete-native-radical.solid-mask-morph",
      kind: "artifact-solid-mask-morph",
      source: {
        tokenId: sourceToken.id,
        rect: sourceLocalRect
      },
      target: {
        tokenId: targetToken.id,
        rect: targetLocalRect
      },
      start: profile.morph.start,
      end: profile.morph.end,
      easing: profile.morph.easing,
      maximumDistancePx: profile.solidMask.maximumDistancePx,
      edgeSoftnessPx: profile.solidMask.edgeSoftnessPx,
      boundsPaddingPx: profile.solidMask.boundsPaddingPx,
      sourceTravelFraction: profile.solidMask.sourceTravelFraction,
      sourceArcHeightPx: profile.solidMask.sourceArcHeightPx,
      shapeLeadFraction: profile.solidMask.shapeLeadFraction,
      targetGrowthOriginXFraction:
        profile.solidMask.targetGrowthOriginXFraction,
      targetGrowthOriginYFraction:
        profile.solidMask.targetGrowthOriginYFraction,
      targetGrowthSoftnessPx: profile.solidMask.targetGrowthSoftnessPx,
      bridgeExpansionPx: profile.solidMask.bridgeExpansionPx,
      endpointBlendFraction: profile.solidMask.endpointBlendFraction,
      color: parseComputedColor(input.state.targetElement)
    };
    input.state.renderer = createKatexArtifactSolidMaskMorphRenderer(
      input.state.canvas,
      plan,
      atlas
    );
    input.state.sourceCaptureRect = sourceLocalRect;
    input.state.sourceNativeInkRect = measureAtlasEndpointInk({
      atlas,
      tokenId: sourceToken.id,
      endpointRect: sourceLocalRect
    });
    input.state.targetCaptureRect = targetLocalRect;
    input.state.targetNativeInkRect = measureAtlasEndpointInk({
      atlas,
      tokenId: targetToken.id,
      endpointRect: targetLocalRect
    });
    input.state.status = "ready";
    input.state.renderer.render(input.state.progress);
    input.state.canvas.style.opacity = String(input.state.opacity);
    input.state.canvas.dataset["kpEditorRadicalWebglStrategy"] =
      "signed-distance-field";
    input.state.canvas.dataset["kpEditorRadicalWebglPrimitive"] =
      "triangle-strip";
    input.state.canvas.dataset["kpEditorRadicalWebglTargetCapture"] =
      "native-clipped-svg";
    input.state.canvas.dataset["kpEditorRadicalMotionProfile"] = profile.id;
    input.state.canvas.dataset["kpEditorRadicalWebglSourceWidth"] =
      String(sourceLocalRect.width);
    input.state.canvas.dataset["kpEditorRadicalWebglSourceHeight"] =
      String(sourceLocalRect.height);
    input.state.canvas.dataset["kpEditorRadicalWebglSourceLeft"] =
      String(sourceLocalRect.left);
    input.state.canvas.dataset["kpEditorRadicalWebglSourceTop"] =
      String(sourceLocalRect.top);
    input.state.canvas.dataset["kpEditorRadicalWebglTargetWidth"] =
      String(targetLocalRect.width);
    input.state.canvas.dataset["kpEditorRadicalWebglTargetHeight"] =
      String(targetLocalRect.height);
    input.state.canvas.dataset["kpEditorRadicalWebglTargetLeft"] =
      String(targetLocalRect.left);
    input.state.canvas.dataset["kpEditorRadicalWebglTargetTop"] =
      String(targetLocalRect.top);
    input.state.canvas.dataset["kpEditorRadicalWebglGrowth"] =
      "simultaneous-radial-from-junction";
    input.stage.dataset["kpEditorRadicalMorphMode"] = "webgl-solid-mask";
    input.stage.dataset["kpEditorRadicalMorphReady"] = "true";
    delete input.stage.dataset["kpEditorRadicalMorphFallbackReason"];
  } catch (error) {
    if (morphStates.get(input.stage) !== input.state) return;
    input.state.status = "fallback";
    input.state.canvas.style.opacity = "0";
    input.stage.dataset["kpEditorRadicalMorphMode"] = "dom-fallback";
    input.stage.dataset["kpEditorRadicalMorphReady"] = "false";
    input.stage.dataset["kpEditorRadicalMorphFallbackReason"] =
      error instanceof Error
        ? error.message
        : "WebGL solid-mask morph initialization failed.";
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
    throw new Error("Could not resolve the native KaTeX radical color.");
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
  readonly alphaThreshold?: number | undefined;
}): KatexTokenRect {
  const region = input.atlas.regions.get(input.tokenId);
  const page = region === undefined ? undefined : input.atlas.pages[region.page];
  if (region === undefined || page === undefined) {
    throw new Error(`Missing live native ink capture for ${input.tokenId}.`);
  }
  const context = page.getContext("2d");
  if (context === null) {
    throw new Error("Could not read the live native KaTeX ink capture.");
  }
  const alphaThreshold = input.alphaThreshold ?? 8;
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
      if ((pixels[(y * region.width + x) * 4 + 3] ?? 0) < alphaThreshold) {
        continue;
      }
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }
  if (right < left || bottom < top) {
    throw new Error("Live native KaTeX fraction capture contains no ink.");
  }
  const pixelRatio = input.atlas.pixelRatio;
  return {
    left: input.endpointRect.left + left / pixelRatio,
    top: input.endpointRect.top + top / pixelRatio,
    width: (right - left + 1) / pixelRatio,
    height: (bottom - top + 1) / pixelRatio
  };
}

function rectCenter(
  rect: KatexTokenRect
): { readonly x: number; readonly y: number } {
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}
