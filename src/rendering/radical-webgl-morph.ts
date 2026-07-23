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
  KatexTokenRect
} from "./katex-transition-types.ts";

export interface KpRadicalWebglMorphSyncResult {
  readonly mode: "webgl-solid-mask" | "dom-fallback";
  readonly ready: boolean;
}

interface KpRadicalWebglMorphState {
  readonly sourceElement: HTMLElement;
  readonly targetElement: HTMLElement;
  readonly canvas: HTMLCanvasElement;
  readonly width: number;
  readonly height: number;
  renderer?: KatexArtifactSolidMaskMorphRenderer | undefined;
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
    return { mode: "webgl-solid-mask", ready: true };
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
    const atlas = await createKatexTextureAtlas([sourceToken, targetToken]);
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
      bridgeExpansionPx: profile.solidMask.bridgeExpansionPx,
      endpointBlendFraction: profile.solidMask.endpointBlendFraction,
      color: parseComputedColor(input.state.targetElement)
    };
    input.state.renderer = createKatexArtifactSolidMaskMorphRenderer(
      input.state.canvas,
      plan,
      atlas
    );
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
    input.state.canvas.dataset["kpEditorRadicalWebglTargetWidth"] =
      String(targetLocalRect.width);
    input.state.canvas.dataset["kpEditorRadicalWebglTargetHeight"] =
      String(targetLocalRect.height);
    input.state.canvas.dataset["kpEditorRadicalWebglTargetLeft"] =
      String(targetLocalRect.left);
    input.state.canvas.dataset["kpEditorRadicalWebglTargetTop"] =
      String(targetLocalRect.top);
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
