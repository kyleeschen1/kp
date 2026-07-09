import type { EasingName } from "./equation-motion-plan.ts";
import {
  createKatexWebGLRenderer,
  type KatexQuad,
  type KatexQuadFrame,
  type KatexWebGLRenderer
} from "./katex-webgl-transition.ts";
import type {
  KatexAtlasRegion,
  KatexMotionToken,
  KatexTextureAtlas,
  KatexTokenRect,
  KatexTransitionPlan
} from "./katex-transition-types.ts";

export interface KatexArtifactTextureBlendEndpoint {
  readonly tokenId: string;
  readonly rect: KatexTokenRect;
}

export interface KatexArtifactTextureBlendPlan {
  readonly id: string;
  readonly kind: "artifact-texture-blend";
  readonly source?: KatexArtifactTextureBlendEndpoint | undefined;
  readonly target?: KatexArtifactTextureBlendEndpoint | undefined;
  readonly start: number;
  readonly end: number;
  readonly easing: EasingName;
}

export function sampleKatexArtifactTextureBlendProgress(
  plan: KatexArtifactTextureBlendPlan,
  progress: number
): number {
  const clampedProgress = clamp01(progress);

  if (plan.end <= plan.start) {
    return clampedProgress >= plan.end ? 1 : 0;
  }

  const localProgress = clamp01(
    (clampedProgress - plan.start) / (plan.end - plan.start)
  );

  return roundUnitProgress(easedProgress(plan.easing, localProgress));
}

export function createKatexArtifactTextureBlendFrame(
  plan: KatexArtifactTextureBlendPlan,
  regions: ReadonlyMap<string, KatexAtlasRegion>,
  progress: number
): KatexQuadFrame {
  const localProgress = sampleKatexArtifactTextureBlendProgress(plan, progress);
  const quads: KatexQuad[] = [];

  if (plan.source !== undefined) {
    const region = regions.get(plan.source.tokenId);

    if (region !== undefined) {
      quads.push({
        tokenId: plan.source.tokenId,
        rect: cloneRect(plan.source.rect),
        opacity: 1 - localProgress,
        region
      });
    }
  }

  if (plan.target !== undefined) {
    const region = regions.get(plan.target.tokenId);

    if (region !== undefined) {
      quads.push({
        tokenId: plan.target.tokenId,
        rect: cloneRect(plan.target.rect),
        opacity: localProgress,
        region
      });
    }
  }

  return { quads };
}

export function createKatexArtifactTextureBlendTransitionPlan(
  plan: KatexArtifactTextureBlendPlan
): KatexTransitionPlan {
  const source =
    plan.source === undefined
      ? undefined
      : textureBlendToken(plan.source.tokenId, plan.source.rect);
  const target =
    plan.target === undefined
      ? undefined
      : textureBlendToken(plan.target.tokenId, plan.target.rect);

  return {
    matched: [],
    sourceOnly: source === undefined ? [] : [{ source }],
    targetOnly: target === undefined ? [] : [{ target }],
    diagnostics: {
      sourceTokenCount: source === undefined ? 0 : 1,
      targetTokenCount: target === undefined ? 0 : 1,
      matchedCount: 0,
      sourceOnlyCount: source === undefined ? 0 : 1,
      targetOnlyCount: target === undefined ? 0 : 1,
      ambiguousGroupCount: 0
    }
  };
}

export function createKatexArtifactTextureBlendRenderer(
  canvas: HTMLCanvasElement,
  plan: KatexArtifactTextureBlendPlan,
  atlas: KatexTextureAtlas
): KatexWebGLRenderer {
  const renderer = createKatexWebGLRenderer(
    canvas,
    createKatexArtifactTextureBlendTransitionPlan(plan),
    atlas
  );

  return {
    render(progress) {
      renderer.render(sampleKatexArtifactTextureBlendProgress(plan, progress));
    },
    dispose() {
      renderer.dispose();
    }
  };
}

function textureBlendToken(
  id: string,
  rect: KatexTokenRect
): KatexMotionToken {
  return {
    id,
    text: id,
    signature: "artifact-texture-blend",
    rect: cloneRect(rect),
    localRect: cloneRect(rect),
    row: 0
  };
}

function cloneRect(rect: KatexTokenRect): KatexTokenRect {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height
  };
}

function easedProgress(easing: EasingName, progress: number): number {
  switch (easing) {
    case "linear":
      return progress;
    case "ease-in":
      return progress * progress;
    case "ease-out":
      return 1 - (1 - progress) * (1 - progress);
    case "ease-in-out":
      return (1 - Math.cos(Math.PI * progress)) / 2;
    default:
      return assertNever(easing);
  }
}

function clamp01(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.min(Math.max(value, 0), 1);
}

function roundUnitProgress(value: number): number {
  return Math.round(value * 1_000_000_000_000) / 1_000_000_000_000;
}

function assertNever(value: never): never {
  throw new Error(`Unhandled artifact texture blend easing: ${value}`);
}
