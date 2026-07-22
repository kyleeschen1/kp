import type {
  KpDistributionAreaLayoutSnapshot,
  KpDistributionAreaMeasuredAnchor
} from "./distribution-area-layout.ts";

export type KpDistributionAreaMaterialTokenId =
  | "source-three" | "left-three" | "right-three"
  | "left-paren" | "x" | "plus" | "times" | "two" | "right-paren" | "six";

export interface KpDistributionAreaTokenPose {
  readonly x: number;
  readonly y: number;
  readonly opacity: number;
  readonly scale: number;
}

export interface KpDistributionAreaTimelineFrame {
  readonly progress: number;
  readonly phase: "distribution" | "evaluation";
  readonly phaseProgress: number;
  readonly tokens: Readonly<Record<KpDistributionAreaMaterialTokenId, KpDistributionAreaTokenPose>>;
}

export interface KpDistributionAreaMotionPlan {
  readonly id: string;
  readonly layoutRevision: number;
  sample(progress: number): KpDistributionAreaTimelineFrame;
}

export function createKpDistributionAreaMotionPlan(
  layout: KpDistributionAreaLayoutSnapshot
): KpDistributionAreaMotionPlan {
  const f = (suffix: string) => layout.anchor("factored", suffix);
  const d = (suffix: string) => layout.anchor("distributed", suffix);
  const e = (suffix: string) => layout.anchor("expanded", suffix);
  return {
    id: `motion-plan.distribution-area.r${layout.revision}`,
    layoutRevision: layout.revision,
    sample(progressValue) {
      const progress = clamp01(progressValue);
      if (progress <= 0.72) {
        const local = smoothstep(progress / 0.72);
        return { progress, phase: "distribution", phaseProgress: local, tokens: distributionTokens(local, f, d) };
      }
      const local = smoothstep((progress - 0.72) / 0.28);
      return { progress, phase: "evaluation", phaseProgress: local, tokens: evaluationTokens(local, d, e) };
    }
  };
}

type AnchorReader = (suffix: string) => KpDistributionAreaMeasuredAnchor;

function distributionTokens(progress: number, factored: AnchorReader, distributed: AnchorReader): Readonly<Record<KpDistributionAreaMaterialTokenId, KpDistributionAreaTokenPose>> {
  const factor = factored("factor.3");
  // Let one readable factor lead the motion before its coincident copy peels away.
  // This preserves the semantic one-to-many branch without flashing a doubled glyph.
  const factorSpread = interval(progress, 0.42, 1);
  const leftFactor = travel(factor, distributed("left.factor.3"), progress, -8);
  return {
    "source-three": hiddenAt(factor),
    "left-three": leftFactor,
    "right-three": travelFromPose(leftFactor, distributed("right.factor.3"), factorSpread, -12),
    "left-paren": opening(factored("left-paren"), progress),
    x: travel(factored("term.x"), distributed("left.term.x"), progress),
    plus: travel(factored("plus"), distributed("plus"), progress),
    times: introducing(distributed("right.times"), progress, 0.58, 0.9),
    two: travel(factored("term.2"), distributed("right.term.2"), progress),
    "right-paren": opening(factored("right-paren"), progress),
    six: hiddenAt(distributed("right.factor.3"))
  };
}

function evaluationTokens(progress: number, distributed: AnchorReader, expanded: AnchorReader): Readonly<Record<KpDistributionAreaMaterialTokenId, KpDistributionAreaTokenPose>> {
  const product = expanded("right.product.6");
  const retiringOpacity = 1 - interval(progress, 0.55, 0.9);
  return {
    "source-three": hiddenAt(distributed("left.factor.3")),
    "left-three": travel(distributed("left.factor.3"), expanded("left.factor.3"), progress),
    "right-three": { ...travel(distributed("right.factor.3"), product, progress), opacity: retiringOpacity, scale: lerp(1, 0.72, progress) },
    "left-paren": hiddenAt(distributed("left.factor.3")),
    x: travel(distributed("left.term.x"), expanded("left.term.x"), progress),
    plus: travel(distributed("plus"), expanded("plus"), progress),
    times: { ...travel(distributed("right.times"), product, progress), opacity: retiringOpacity, scale: lerp(1, 0.62, progress) },
    two: { ...travel(distributed("right.term.2"), product, progress), opacity: retiringOpacity, scale: lerp(1, 0.72, progress) },
    "right-paren": hiddenAt(distributed("right.term.2")),
    six: { ...at(product), opacity: interval(progress, 0.58, 0.92), scale: lerp(0.78, 1, interval(progress, 0.58, 0.92)) }
  };
}

function travel(from: KpDistributionAreaMeasuredAnchor, to: KpDistributionAreaMeasuredAnchor, progress: number, arc = 0): KpDistributionAreaTokenPose {
  return {
    x: lerp(from.center.x, to.center.x, progress),
    y: lerp(from.center.y, to.center.y, progress) + arc * Math.sin(Math.PI * progress),
    opacity: 1,
    scale: 1
  };
}

function travelFromPose(from: KpDistributionAreaTokenPose, to: KpDistributionAreaMeasuredAnchor, progress: number, arc = 0): KpDistributionAreaTokenPose {
  return {
    x: lerp(from.x, to.center.x, progress),
    y: lerp(from.y, to.center.y, progress) + arc * Math.sin(Math.PI * progress),
    opacity: 1,
    scale: 1
  };
}

function opening(anchor: KpDistributionAreaMeasuredAnchor, progress: number): KpDistributionAreaTokenPose {
  // Parentheses are semantically consumed, so they clear before descendant
  // tokens cross their old bounds; keeping them through the crossing reads as
  // punctuation attached to the wrong term on compact expressions.
  const release = interval(progress, 0.12, 0.42);
  return { ...at(anchor), opacity: 1 - release, scale: lerp(1, 1.08, release) };
}

function introducing(anchor: KpDistributionAreaMeasuredAnchor, progress: number, start: number, end: number): KpDistributionAreaTokenPose {
  const local = interval(progress, start, end);
  return { ...at(anchor), opacity: local, scale: lerp(0.72, 1, local) };
}

function hiddenAt(anchor: KpDistributionAreaMeasuredAnchor): KpDistributionAreaTokenPose {
  return { ...at(anchor), opacity: 0, scale: 1 };
}

function at(anchor: KpDistributionAreaMeasuredAnchor): Pick<KpDistributionAreaTokenPose, "x" | "y"> {
  return { x: anchor.center.x, y: anchor.center.y };
}

function interval(value: number, start: number, end: number): number {
  return smoothstep(clamp01((value - start) / (end - start)));
}

function smoothstep(value: number): number {
  const local = clamp01(value);
  return local * local * (3 - 2 * local);
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
}
