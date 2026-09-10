import { compileKpNativeKatexInkKnotMetrics, kpNativeKatexInkKnotOpticalProfile } from "./native-katex-ink-knot-geometry.ts";

export interface KpNativeKatexContributorFusionOpticalProfile {
  readonly schemaVersion:
    "kp.native-katex-contributor-fusion-optical-profile.v1";
  readonly id:
    "kp.rendering.native-katex.operation-evaluation.contributor-fusion.v1";
  readonly gatherStartsAt: number;
  readonly compressionStartsAt: number;
  readonly sourceKernelStartsAt: number;
  readonly ownershipHandoffAt: number;
  readonly targetLegibilityStartsAt: number;
  readonly targetExpansionEndsAt: number;
  readonly kernelAreaRatio: number;
}

export const kpNativeKatexContributorFusionRealizedPrimitiveId =
  "kp.rendering.native-katex.primitive.ink-knot.v1" as const;

/**
 * This is the single tuning surface for every Native KaTeX caller of the
 * promoted contributor-fusion family. Semantic callers select the family;
 * only this renderer profile owns optical thresholds and knot proportions.
 */
export const kpNativeKatexContributorFusionOpticalProfile = Object.freeze({
  schemaVersion:
    "kp.native-katex-contributor-fusion-optical-profile.v1" as const,
  id:
    "kp.rendering.native-katex.operation-evaluation.contributor-fusion.v1" as const,
  gatherStartsAt: 0.18,
  compressionStartsAt: 0.38,
  sourceKernelStartsAt: 0.48,
  ownershipHandoffAt: 0.52,
  targetLegibilityStartsAt: 0.58,
  targetExpansionEndsAt: 0.7,
  kernelAreaRatio: kpNativeKatexInkKnotOpticalProfile.kernelAreaRatio
} satisfies KpNativeKatexContributorFusionOpticalProfile);


export interface KpContributorFusionPaintInput {
  readonly rect: { readonly left: number; readonly top: number; readonly width: number; readonly height: number };
  readonly pivot: { readonly x: number; readonly y: number };
  readonly role: string | undefined;
}

export interface KpContributorFusionPaintPose {
  readonly translateX: number;
  readonly translateY: number;
  readonly scale: number;
  readonly transform: string;
  readonly present: boolean;
  readonly clipInset: number;
}

/** The promoted optical calculation shared by DOM adapters and inspected paint.
 * Geometry enters as measured descriptors; sampling neither reads nor writes DOM. */
export function sampleKpNativeKatexContributorFusionPaint(input: {
  readonly source: readonly KpContributorFusionPaintInput[];
  readonly target: readonly KpContributorFusionPaintInput[];
  readonly progress: number;
  readonly opticalProfile?: KpNativeKatexContributorFusionOpticalProfile;
}) {
  const profile = input.opticalProfile ?? kpNativeKatexContributorFusionOpticalProfile;
  if (!Number.isFinite(input.progress) || input.source.length === 0 || input.target.length === 0)
    throw new Error("Ink-knot sampling requires finite progress and both native sides.");
  const p = Math.max(0, Math.min(1, input.progress));
  const sources = input.source.map(owner => owner.pivot), targets = input.target.map(owner => owner.pivot);
  const knotCenter = centerOfPointBounds(targets);
  const { kernelSpan, sourceKernelScale, targetKernelScale } = compileKpNativeKatexInkKnotMetrics({
    sourceArea: summedArea(input.source.map(owner => owner.rect)),
    targetArea: summedArea(input.target.map(owner => owner.rect)),
    profile: kpNativeKatexInkKnotOpticalProfile
  });
  const gather = smoothstep(profile.gatherStartsAt, profile.sourceKernelStartsAt, p);
  const compression = smoothstep(profile.compressionStartsAt, profile.sourceKernelStartsAt, p);
  const expansion = smoothstep(profile.ownershipHandoffAt, profile.targetExpansionEndsAt, p);
  const offsets = centeredOffsetsByNativeGeometry(input.source, sources, kernelSpan);
  const materialOwns = p > 0 && p < 1;
  const sourceOwns = p < profile.ownershipHandoffAt;
  const pose = (translateX: number, translateY: number, scale: number, present: boolean, clipInset = 0): KpContributorFusionPaintPose =>
    Object.freeze({ translateX, translateY, scale, transform: ownerTransform({ translateX, translateY, scale }), present, clipInset });
  return Object.freeze({
    source: Object.freeze(sources.map((center, i) => pose(
      (knotCenter.x - center.x + offsets[i]!.x) * gather,
      (knotCenter.y - center.y + offsets[i]!.y) * gather,
      lerp(1, sourceKernelScale, compression), materialOwns && sourceOwns))),
    target: Object.freeze(targets.map(center => pose(
      (knotCenter.x - center.x) * (1 - expansion),
      (knotCenter.y - center.y) * (1 - expansion),
      lerp(targetKernelScale, 1, expansion), materialOwns && !sourceOwns,
      28 * (1 - smoothstep(profile.ownershipHandoffAt, profile.targetLegibilityStartsAt, p))))),
    legibilityState: p < profile.sourceKernelStartsAt ? "source" as const
      : p < profile.targetLegibilityStartsAt ? "kernel" as const : "target" as const
  });
}

function centerOfPointBounds(
  points: readonly { readonly x: number; readonly y: number }[]
): { readonly x: number; readonly y: number } {
  const left = Math.min(...points.map(({ x }) => x));
  const top = Math.min(...points.map(({ y }) => y));
  const right = Math.max(...points.map(({ x }) => x));
  const bottom = Math.max(...points.map(({ y }) => y));
  return { x: (left + right) / 2, y: (top + bottom) / 2 };
}

function summedArea(rects: readonly KpContributorFusionPaintInput["rect"][]): number {
  return Math.max(1, rects.reduce(
    (area, rect) => area + Math.max(0, rect.width * rect.height),
    0
  ));
}

function centeredOffsetsByNativeGeometry(
  owners: readonly KpContributorFusionPaintInput[],
  centers: readonly { readonly x: number; readonly y: number }[],
  span: number
): readonly { readonly x: number; readonly y: number }[] {
  if (centers.length <= 1) return centers.map(() => ({ x: 0, y: 0 }));
  const spreadX = coordinateSpread(centers.map(({ x }) => x));
  const spreadY = coordinateSpread(centers.map(({ y }) => y));
  // Preserve the endpoint's own reading axis inside the compressed knot.
  // This keeps horizontal operators and stacked fractions on one measured
  // choreography without teaching the renderer quotient semantics.
  const dominantAxis = spreadY > spreadX ? "y" : "x";
  const offsets = centers.map(() => ({ x: 0, y: 0 }));
  const byNativeCoordinate = (left: number, right: number) =>
    centers[left]![dominantAxis] - centers[right]![dominantAxis] || left - right;
  const materialIndexes = owners
    .map((owner, index) => ({ owner, index }))
    .filter(({ owner }) =>
      owner.role ===
        "successor-source:material-input"
    )
    .map(({ index }) => index)
    .sort(byNativeCoordinate);
  const catalystIndexes = owners
    .map((owner, index) => ({ owner, index }))
    .filter(({ owner }) =>
      owner.role ===
        "successor-source:catalyst"
    )
    .map(({ index }) => index)
    .sort(byNativeCoordinate);
  // Structural rules do not have interoperable browser ink centers. When the
  // verified successor topology is infix, semantic roles place each catalyst
  // between its native-ordered inputs; other topologies keep measured order.
  const orderedIndexes =
    materialIndexes.length >= 2 &&
    catalystIndexes.length === materialIndexes.length - 1
      ? materialIndexes.flatMap((index, rank) => [
          index,
          ...(catalystIndexes[rank] === undefined
            ? []
            : [catalystIndexes[rank]!])
        ])
      : centers.map((_, index) => index).sort(byNativeCoordinate);
  orderedIndexes.forEach((sourceIndex, rank) => {
    const offset = (rank / (centers.length - 1) - 0.5) * span;
    offsets[sourceIndex] = dominantAxis === "x"
      ? { x: offset, y: 0 }
      : { x: 0, y: offset };
  });
  return offsets;
}

function coordinateSpread(coordinates: readonly number[]): number {
  return Math.max(...coordinates) - Math.min(...coordinates);
}

function ownerTransform(input: {
  readonly translateX: number;
  readonly translateY: number;
  readonly scale: number;
}): string {
  return `translate3d(${input.translateX}px, ${input.translateY}px, 0) ` +
    `scale(${input.scale})`;
}

function lerp(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

function smoothstep(start: number, end: number, value: number): number {
  if (end <= start) return value >= end ? 1 : 0;
  const progress = clamp01((value - start) / (end - start));
  return progress * progress * (3 - 2 * progress);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}


