import {
  createKatexArtifactPixelFlowRenderer,
  type KatexArtifactPixelFlowPlan,
  type KatexArtifactPixelFlowRenderer
} from "./katex-artifact-pixel-flow.ts";
import {
  createKatexTextureAtlas,
  measureKatexTextureCaptureRect
} from "./katex-texture-atlas.ts";
import type {
  KatexMotionToken,
  KatexTokenRect,
  KatexTextureAtlas
} from "./katex-transition-types.ts";

export interface KpRadicalWebglMorphSyncResult {
  readonly mode: "webgl-pixel-flow" | "dom-fallback";
  readonly ready: boolean;
}

interface KpRadicalWebglMorphState {
  readonly sourceElement: HTMLElement;
  readonly targetElement: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly width: number;
  readonly height: number;
  renderer?: KatexArtifactPixelFlowRenderer | undefined;
  status: "initializing" | "ready" | "fallback";
  progress: number;
  opacity: number;
}

const morphStates = new WeakMap<HTMLElement, KpRadicalWebglMorphState>();

export function syncKpRadicalWebglMorph(input: {
  readonly stage: HTMLElement;
  readonly sourceElement: HTMLElement;
  readonly targetElement: HTMLElement;
  readonly semanticProgress: number;
  readonly opacity: number;
  readonly enabled: boolean;
  readonly particleDensityScale?: number | undefined;
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
    state = createMorphState(input.stage, input.sourceElement, input.targetElement);
    morphStates.set(input.stage, state);
    void initializeMorphState({
      stage: input.stage,
      state,
      particleDensityScale: input.particleDensityScale
    });
  }

  state.progress = input.semanticProgress;
  state.opacity = input.opacity;
  if (state.status === "ready" && state.renderer !== undefined) {
    state.renderer.render(state.progress);
    state.canvas.style.opacity = String(state.opacity);
    input.stage.dataset["kpEditorRadicalMorphMode"] = "webgl-pixel-flow";
    input.stage.dataset["kpEditorRadicalMorphReady"] = "true";
    delete input.stage.dataset["kpEditorRadicalMorphFallbackReason"];
    return { mode: "webgl-pixel-flow", ready: true };
  }

  state.canvas.style.opacity = "0";
  input.stage.dataset["kpEditorRadicalMorphReady"] = "false";
  input.stage.dataset["kpEditorRadicalMorphMode"] = state.status === "fallback"
    ? "dom-fallback"
    : "webgl-pixel-flow";
  return {
    mode: state.status === "fallback"
      ? "dom-fallback"
      : "webgl-pixel-flow",
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
    status: "initializing",
    progress: 0,
    opacity: 0
  };
}

async function initializeMorphState(input: {
  readonly stage: HTMLElement;
  readonly state: KpRadicalWebglMorphState;
  readonly particleDensityScale?: number | undefined;
}): Promise<void> {
  try {
    const stageRect = input.stage.getBoundingClientRect();
    const sourceRect = measureKatexTextureCaptureRect(
      input.state.sourceElement
    );
    const targetRect = measureKatexTextureCaptureRect(
      input.state.targetElement
    );
    const sourceLocalRect = viewportRectToLocalRect(sourceRect, stageRect);
    const targetLocalRect = viewportRectToLocalRect(targetRect, stageRect);
    const targetCaptureElement = createCompleteRadicalCaptureElement({
      stage: input.stage,
      nativeElement: input.state.targetElement,
      rect: targetLocalRect
    });
    const sourceToken = captureToken(
      "radical-morph.fractional-exponent",
      input.state.sourceElement,
      sourceRect,
      sourceLocalRect
    );
    const targetToken = captureToken(
      "radical-morph.complete-native-radical",
      targetCaptureElement,
      targetRect,
      targetLocalRect
    );
    let atlas: KatexTextureAtlas;
    try {
      atlas = await createKatexTextureAtlas([sourceToken, targetToken]);
    } finally {
      targetCaptureElement.remove();
    }
    if (
      morphStates.get(input.stage) !== input.state ||
      !input.stage.isConnected
    ) {
      return;
    }

    const density = boundedDensity(input.particleDensityScale);
    const plan: KatexArtifactPixelFlowPlan = {
      id: "radical-rewrite.complete-native-radical.webgl-morph",
      kind: "artifact-pixel-flow",
      source: {
        tokenId: sourceToken.id,
        rect: sourceLocalRect
      },
      target: {
        tokenId: targetToken.id,
        rect: targetLocalRect
      },
      particleCount: Math.round(2200 * density),
      pairing: "spatial-coherent",
      color: {
        red: 15 / 255,
        green: 23 / 255,
        blue: 42 / 255
      },
      start: 0.08,
      end: 0.9,
      easing: "ease-in-out"
    };
    input.state.renderer = createKatexArtifactPixelFlowRenderer(
      input.state.canvas,
      plan,
      atlas
    );
    input.state.status = "ready";
    input.state.renderer.render(input.state.progress);
    input.state.canvas.style.opacity = String(input.state.opacity);
    input.state.canvas.dataset["kpEditorRadicalWebglParticleCount"] =
      String(input.state.renderer.particleCount);
    input.state.canvas.dataset["kpEditorRadicalWebglPairing"] =
      "spatial-coherent";
    input.state.canvas.dataset["kpEditorRadicalWebglTargetWidth"] =
      String(targetLocalRect.width);
    input.state.canvas.dataset["kpEditorRadicalWebglTargetHeight"] =
      String(targetLocalRect.height);
    input.state.canvas.dataset["kpEditorRadicalWebglTargetLeft"] =
      String(targetLocalRect.left);
    input.state.canvas.dataset["kpEditorRadicalWebglTargetTop"] =
      String(targetLocalRect.top);
    input.stage.dataset["kpEditorRadicalMorphMode"] = "webgl-pixel-flow";
    input.stage.dataset["kpEditorRadicalMorphReady"] = "true";
    delete input.stage.dataset["kpEditorRadicalMorphFallbackReason"];
  } catch (error) {
    if (morphStates.get(input.stage) !== input.state) return;
    input.state.status = "fallback";
    input.state.canvas.style.opacity = "0";
    input.stage.dataset["kpEditorRadicalMorphMode"] = "dom-fallback";
    input.stage.dataset["kpEditorRadicalMorphReady"] = "false";
    input.stage.dataset["kpEditorRadicalMorphFallbackReason"] =
      error instanceof Error ? error.message : "WebGL morph initialization failed.";
  }
}

function createCompleteRadicalCaptureElement(input: {
  readonly stage: HTMLElement;
  readonly nativeElement: HTMLElement;
  readonly rect: KatexTokenRect;
}): HTMLElement {
  const capture = document.createElement("span");
  capture.dataset["kpRadicalWebglCapture"] = "complete-native-operator";
  capture.style.position = "absolute";
  capture.style.left = `${input.rect.left}px`;
  capture.style.top = `${input.rect.top}px`;
  capture.style.width = `${input.rect.width}px`;
  capture.style.height = `${input.rect.height}px`;
  capture.style.display = "block";
  capture.style.opacity = "0";
  capture.style.pointerEvents = "none";
  capture.style.color = getComputedStyle(input.nativeElement).color;

  const hook = input.nativeElement.cloneNode(true);
  if (!(hook instanceof HTMLElement)) {
    throw new Error("Expected the native radical hook to clone as HTML.");
  }
  hook.removeAttribute("data-kp-radical-native-visual");
  hook.style.position = "absolute";
  hook.style.inset = "0";
  hook.style.opacity = "1";
  hook.style.transform = "none";

  // KaTeX stretches the overbar inside a very wide SVG viewBox. Some browser
  // foreign-object rasterizers retain the hook but clip that hairline, so the
  // capture mask completes the same measured operator geometry explicitly.
  const overbar = document.createElement("span");
  overbar.dataset["kpRadicalWebglCaptureFragment"] = "overbar";
  overbar.style.position = "absolute";
  overbar.style.left = "32%";
  overbar.style.right = "0";
  overbar.style.top = "7%";
  overbar.style.height = `${Math.max(1, input.rect.height * 0.055)}px`;
  overbar.style.background = "currentColor";

  capture.append(hook, overbar);
  input.stage.append(capture);
  return capture;
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

function boundedDensity(value: number | undefined): number {
  if (value === undefined || !Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0.45, value));
}
