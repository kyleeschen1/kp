import type { MotionPose } from "./equation-motion-plan.ts";
import type {
  KatexArtifactSeedRevealPlan
} from "./katex-artifact-seed-reveal.ts";
import type { KatexTokenRect } from "./katex-transition-types.ts";

export interface KpDomArtifactBundleMorphFrame {
  readonly sourcePose: MotionPose;
  readonly targetPose: MotionPose;
  readonly bundleRect: KatexTokenRect;
}

export function createKpRadicalArtifactBundlePlan(input: {
  readonly id: string;
  readonly sourceTokenId: string;
  readonly sourceRect: KatexTokenRect;
  readonly targetTokenId: string;
  readonly targetRect: KatexTokenRect;
}): KatexArtifactSeedRevealPlan {
  return {
    id: input.id,
    kind: "artifact-seed-reveal",
    source: {
      tokenId: input.sourceTokenId,
      rect: input.sourceRect
    },
    target: {
      tokenId: input.targetTokenId,
      rect: input.targetRect
    },
    bundleRect: kpRadicalArtifactBundleRect(input.targetRect),
    sourceGrid: { columns: 6, rows: 2 },
    targetGrid: { columns: 10, rows: 2 },
    sourceMotion: {
      kind: "collapse-to-bundle",
      collapseEnd: 0.48,
      fadeStart: 0.34,
      fadeEnd: 0.56,
      stagger: 0.08,
      drift: 1.5
    },
    targetMotion: {
      kind: "unfold-from-bundle",
      revealStart: 0.42,
      revealEnd: 1,
      stagger: 0.18,
      drift: 1.25,
      dissolveFraction: 0
    },
    start: 0,
    end: 1,
    easing: "ease-in-out"
  };
}

export function sampleKpDomArtifactBundleMorph(input: {
  readonly plan: KatexArtifactSeedRevealPlan;
  readonly sourceCollapseProgress: number;
  readonly sourceFadeProgress: number;
  readonly targetRevealProgress: number;
  readonly collapseScale: number;
}): KpDomArtifactBundleMorphFrame {
  return {
    sourcePose: rectMorphPose(
      input.plan.source.rect,
      input.plan.bundleRect,
      input.sourceCollapseProgress,
      {
        opacity: 1 - input.sourceFadeProgress,
        scale: interpolate(1, input.collapseScale, input.sourceCollapseProgress)
      }
    ),
    targetPose: rectMorphPose(
      input.plan.target.rect,
      input.plan.bundleRect,
      1 - input.targetRevealProgress,
      {
        opacity: input.targetRevealProgress,
        scale: interpolate(input.collapseScale, 1, input.targetRevealProgress)
      }
    ),
    bundleRect: input.plan.bundleRect
  };
}

export function kpRadicalArtifactBundleRect(
  targetRect: KatexTokenRect
): KatexTokenRect {
  return {
    left: round(targetRect.left + targetRect.width * 0.14),
    top: round(targetRect.top + targetRect.height * 0.55),
    width: round(Math.max(8, targetRect.width * 0.2)),
    height: round(Math.max(6, targetRect.height * 0.22))
  };
}

function rectMorphPose(
  source: KatexTokenRect,
  target: KatexTokenRect,
  progress: number,
  options: {
    readonly opacity: number;
    readonly scale: number;
  }
): MotionPose {
  const sourceCenter = rectCenter(source);
  const targetCenter = rectCenter(target);
  return {
    opacity: options.opacity,
    x: round((targetCenter.x - sourceCenter.x) * progress),
    y: round((targetCenter.y - sourceCenter.y) * progress),
    scale: round(options.scale)
  };
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
  return round(start + (end - start) * progress);
}

function round(value: number): number {
  const result = Math.round(value * 1_000_000) / 1_000_000;
  return Object.is(result, -0) ? 0 : result;
}
