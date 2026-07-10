import type { EasingName } from "./equation-motion-plan.ts";
import type { KatexQuad, KatexQuadFrame } from "./katex-webgl-transition.ts";
import type {
  KatexAtlasRegion,
  KatexTextureAtlas,
  KatexTokenRect
} from "./katex-transition-types.ts";

export interface KatexArtifactSeedRevealEndpoint {
  readonly tokenId: string;
  readonly rect: KatexTokenRect;
}

export interface KatexArtifactSeedRevealSourceMotion {
  readonly kind: "contract-to-seed";
  readonly contractEnd: number;
  readonly fadeStart: number;
  readonly fadeEnd: number;
}

export interface KatexArtifactSeedRevealTargetMotion {
  readonly kind: "reveal-from-seed";
  readonly revealStart: number;
  readonly revealEnd: number;
}

export interface KatexArtifactSeedRevealPlan {
  readonly id: string;
  readonly kind: "artifact-seed-reveal";
  readonly source: KatexArtifactSeedRevealEndpoint;
  readonly target: KatexArtifactSeedRevealEndpoint;
  readonly seedRect: KatexTokenRect;
  readonly sourceMotion: KatexArtifactSeedRevealSourceMotion;
  readonly targetMotion: KatexArtifactSeedRevealTargetMotion;
  readonly start: number;
  readonly end: number;
  readonly easing: EasingName;
}

export interface KatexArtifactSeedRevealRenderer {
  render(progress: number): void;
  dispose(): void;
}

export function sampleKatexArtifactSeedRevealProgress(
  plan: KatexArtifactSeedRevealPlan,
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

export function createKatexArtifactSeedRevealFrame(
  plan: KatexArtifactSeedRevealPlan,
  regions: ReadonlyMap<string, KatexAtlasRegion>,
  progress: number
): KatexQuadFrame {
  const localProgress = sampleKatexArtifactSeedRevealProgress(plan, progress);
  const quads: KatexQuad[] = [];
  const sourceRegion = regions.get(plan.source.tokenId);
  const targetRegion = regions.get(plan.target.tokenId);

  if (sourceRegion !== undefined) {
    const contractProgress = phaseProgress(
      0,
      plan.sourceMotion.contractEnd,
      localProgress
    );
    const sourceOpacity = 1 - phaseProgress(
      plan.sourceMotion.fadeStart,
      plan.sourceMotion.fadeEnd,
      localProgress
    );

    if (sourceOpacity > 0.001) {
      quads.push({
        tokenId: plan.source.tokenId,
        rect: interpolateRect(
          plan.source.rect,
          plan.seedRect,
          contractProgress
        ),
        opacity: sourceOpacity,
        region: sourceRegion
      });
    }
  }

  if (targetRegion !== undefined) {
    const revealProgress = phaseProgress(
      plan.targetMotion.revealStart,
      plan.targetMotion.revealEnd,
      localProgress
    );

    if (revealProgress > 0.001) {
      quads.push({
        tokenId: plan.target.tokenId,
        rect: interpolateRect(plan.seedRect, plan.target.rect, revealProgress),
        opacity: revealProgress,
        region: targetRegion
      });
    }
  }

  return { quads };
}

export function createKatexArtifactSeedRevealRenderer(
  canvas: HTMLCanvasElement,
  plan: KatexArtifactSeedRevealPlan,
  atlas: KatexTextureAtlas
): KatexArtifactSeedRevealRenderer {
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (context === null) {
    throw new Error("2D canvas is unavailable for KaTeX artifact seed reveal.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  let disposed = false;

  return {
    render(progress) {
      if (disposed) {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);

      for (const quad of createKatexArtifactSeedRevealFrame(
        plan,
        atlas.regions,
        progress
      ).quads) {
        const page = atlas.pages[quad.region.page];

        if (page === undefined) {
          continue;
        }

        drawQuad(context, page, quad, atlas.pixelRatio);
      }
    },
    dispose() {
      disposed = true;
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
}

function drawQuad(
  context: CanvasRenderingContext2D,
  page: HTMLCanvasElement,
  quad: KatexQuad,
  pixelRatio: number
): void {
  context.save();
  context.globalAlpha = quad.opacity;
  context.drawImage(
    page,
    quad.region.x,
    quad.region.y,
    quad.region.width,
    quad.region.height,
    quad.rect.left * pixelRatio,
    quad.rect.top * pixelRatio,
    quad.rect.width * pixelRatio,
    quad.rect.height * pixelRatio
  );
  context.restore();
}

function phaseProgress(start: number, end: number, progress: number): number {
  if (end <= start) {
    return progress >= end ? 1 : 0;
  }

  return easedProgress("ease-in-out", clamp01((progress - start) / (end - start)));
}

function interpolateRect(
  source: KatexTokenRect,
  target: KatexTokenRect,
  progress: number
): KatexTokenRect {
  return {
    left: interpolate(source.left, target.left, progress),
    top: interpolate(source.top, target.top, progress),
    width: interpolate(source.width, target.width, progress),
    height: interpolate(source.height, target.height, progress)
  };
}

function interpolate(source: number, target: number, progress: number): number {
  return source + (target - source) * progress;
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
  throw new Error(`Unhandled artifact seed reveal easing: ${value}`);
}
