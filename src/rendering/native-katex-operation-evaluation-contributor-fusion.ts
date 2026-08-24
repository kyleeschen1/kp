import {
  kpContributorFusionEvaluationFamilyProfile,
  type KpContributorFusionEvaluationFamilyProfile
} from "../animation/operation-evaluation-family-profile.ts";
import type {
  KpNativeKatexPaintPreservingRetirement
} from "./native-katex-scene-track-contract.ts";
import {
  compileKpNativeKatexInkKnotMetrics,
  kpNativeKatexInkKnotOpticalProfile
} from "./native-katex-ink-knot-geometry.ts";
import {
  isKpVerifiedEquationEvaluationFamilyCertificateV2,
  type KpVerifiedEquationEvaluationFamilyCertificateV2
} from "../domain-ir/equation-evaluation-family-certificate-v2.ts";

export interface KpContributorFusionPlaybackPort<Sample, Frame> {
  sample(progress: number): Sample;
  apply(progress: number): Frame;
  retire(retirement: KpNativeKatexPaintPreservingRetirement): void;
}

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

export function createKpNativeKatexContributorFusionPlayback<
  Sample,
  Frame,
  Session extends KpContributorFusionPlaybackPort<Sample, Frame>
>(input: {
  readonly stage: HTMLElement;
  readonly base: Session;
  readonly familyProfile: KpContributorFusionEvaluationFamilyProfile;
}): Session {
  requireCompatibleProfiles(
    input.familyProfile,
    kpNativeKatexContributorFusionOpticalProfile
  );
  return Object.freeze({
    ...input.base,
    sample(progress: number) {
      return input.base.sample(progress);
    },
    apply(progress: number) {
      const frame = input.base.apply(progress);
      applyKpNativeKatexContributorFusion({
        stage: input.stage,
        progress,
        familyProfile: input.familyProfile,
        opticalProfile: kpNativeKatexContributorFusionOpticalProfile
      });
      return frame;
    },
    retire(retirement: KpNativeKatexPaintPreservingRetirement) {
      input.base.retire(retirement);
    }
  }) as Session;
}

/** Neutral mount for any host carrying a compiler-minted family decision. */
export function createKpCertifiedNativeKatexContributorFusionPlayback<
  Sample,
  Frame,
  Session extends KpContributorFusionPlaybackPort<Sample, Frame>
>(input: {
  readonly stage: HTMLElement;
  readonly base: Session;
  readonly certificate: KpVerifiedEquationEvaluationFamilyCertificateV2;
}): Session {
  if (!isKpVerifiedEquationEvaluationFamilyCertificateV2(input.certificate)) {
    throw new Error(
      "Native KaTeX contributor fusion requires a compiler-minted family certificate."
    );
  }
  const familyProfile = input.certificate.familyProfile;
  if (familyProfile.family !== "contributor-fusion") {
    throw new Error(
      `Native KaTeX contributor fusion cannot realize ${familyProfile.family}.`
    );
  }
  return createKpNativeKatexContributorFusionPlayback({
    stage: input.stage,
    base: input.base,
    familyProfile
  });
}

export function applyKpNativeKatexContributorFusion(input: {
  readonly stage: HTMLElement;
  readonly progress: number;
  readonly familyProfile: KpContributorFusionEvaluationFamilyProfile;
  readonly opticalProfile: KpNativeKatexContributorFusionOpticalProfile;
}): void {
  requireCompatibleProfiles(input.familyProfile, input.opticalProfile);
  const sourceOwners = materialOwners(input.stage, "source");
  const targetOwners = materialOwners(input.stage, "target");
  if (sourceOwners.length === 0 || targetOwners.length === 0) return;
  const sourceRects = sourceOwners.map(ownerBaseRect);
  const targetRects = targetOwners.map(ownerBaseRect);
  const sourcePivots = sourceOwners.map((owner, index) =>
    ownerPaintPivot(owner, sourceRects[index]!)
  );
  const targetPivots = targetOwners.map((owner, index) =>
    ownerPaintPivot(owner, targetRects[index]!)
  );
  const knotCenter = centerOfPointBounds(targetPivots);
  const sourceArea = summedArea(sourceRects);
  const targetArea = summedArea(targetRects);
  // Endpoint ink boxes are the stable optical proxy. Exact raster sampling
  // would couple the motif to browser paint internals and make seeks brittle.
  const {
    kernelSpan,
    sourceKernelScale,
    targetKernelScale
  } = compileKpNativeKatexInkKnotMetrics({
    sourceArea,
    targetArea,
    profile: kpNativeKatexInkKnotOpticalProfile
  });
  const gatherProgress = smoothstep(
    input.opticalProfile.gatherStartsAt,
    input.opticalProfile.sourceKernelStartsAt,
    input.progress
  );
  const compressionProgress = smoothstep(
    input.opticalProfile.compressionStartsAt,
    input.opticalProfile.sourceKernelStartsAt,
    input.progress
  );
  const targetExpansion = smoothstep(
    input.opticalProfile.ownershipHandoffAt,
    input.opticalProfile.targetExpansionEndsAt,
    input.progress
  );
  const sourceOwnsPaint =
    input.progress < input.opticalProfile.ownershipHandoffAt;
  const sourceKernelOffsets = centeredOffsetsByNativeGeometry(
    sourceOwners,
    sourcePivots,
    kernelSpan
  );

  sourceOwners.forEach((owner, index) => {
    const sourceCenter = sourcePivots[index]!;
    const slotOffset = sourceKernelOffsets[index]!;
    setOwnerPaintPresence(owner, sourceOwnsPaint);
    owner.style.transform = ownerTransform({
      translateX:
        (knotCenter.x - sourceCenter.x + slotOffset.x) * gatherProgress,
      translateY:
        (knotCenter.y - sourceCenter.y + slotOffset.y) * gatherProgress,
      scale: lerp(1, sourceKernelScale, compressionProgress)
    });
  });
  targetOwners.forEach((owner, index) => {
    const targetCenter = targetPivots[index]!;
    setOwnerPaintPresence(owner, !sourceOwnsPaint);
    const visual = owner.firstElementChild as HTMLElement | null;
    if (visual !== null) {
      const reveal = smoothstep(
        input.opticalProfile.ownershipHandoffAt,
        input.opticalProfile.targetLegibilityStartsAt,
        input.progress
      );
      const inset = 28 * (1 - reveal);
      visual.style.clipPath = `inset(${inset}% ${inset}%)`;
    }
    owner.style.transform = ownerTransform({
      translateX: (knotCenter.x - targetCenter.x) * (1 - targetExpansion),
      translateY: (knotCenter.y - targetCenter.y) * (1 - targetExpansion),
      scale: lerp(targetKernelScale, 1, targetExpansion)
    });
  });

  const legibilityState =
    input.progress < input.opticalProfile.sourceKernelStartsAt
      ? "source"
      : input.progress < input.opticalProfile.targetLegibilityStartsAt
        ? "kernel"
        : "target";
  input.stage.dataset["kpOperationEvaluationFamily"] =
    input.familyProfile.family;
  input.stage.dataset["kpOperationEvaluationHandoff"] =
    input.familyProfile.handoff;
  input.stage.dataset["kpOperationEvaluationFamilyProfileId"] =
    input.familyProfile.id;
  input.stage.dataset["kpOperationEvaluationRendererProfileId"] =
    input.opticalProfile.id;
  input.stage.dataset["kpOperationEvaluationRealizedPrimitiveId"] =
    kpNativeKatexContributorFusionRealizedPrimitiveId;
  input.stage.dataset["kpOperationEvaluationLegibilityState"] =
    legibilityState;
  input.stage.dataset["kpOperationEvaluationReadableCohortCount"] =
    legibilityState === "kernel" ? "0" : "1";
}

function requireCompatibleProfiles(
  familyProfile: KpContributorFusionEvaluationFamilyProfile,
  opticalProfile: KpNativeKatexContributorFusionOpticalProfile
): void {
  if (
    familyProfile !== kpContributorFusionEvaluationFamilyProfile ||
    familyProfile.rendererProfileId !== opticalProfile.id
  ) {
    throw new Error(
      `Contributor-fusion family ${familyProfile.id} cannot use Native ` +
      `KaTeX profile ${opticalProfile.id}.`
    );
  }
}

function materialOwners(
  stage: HTMLElement,
  side: "source" | "target"
): readonly HTMLElement[] {
  return [...stage.querySelectorAll<HTMLElement>(
    `[data-kp-equation-material-fragment-role^="successor-${side}:"]`
  )];
}

function setOwnerPaintPresence(owner: HTMLElement, present: boolean): void {
  owner.style.visibility = present ? "visible" : "hidden";
  owner.style.opacity = present ? "1" : "0";
}

interface KpInkRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

function ownerBaseRect(owner: HTMLElement): KpInkRect {
  const left = Number.parseFloat(owner.style.left);
  const top = Number.parseFloat(owner.style.top);
  const width = Number.parseFloat(owner.style.width);
  const height = Number.parseFloat(owner.style.height);
  if (![left, top, width, height].every(Number.isFinite)) {
    throw new Error("Ink-knot fusion requires measured material-owner boxes.");
  }
  return { left, top, width, height };
}

function ownerPaintPivot(
  owner: HTMLElement,
  rect: KpInkRect
): { readonly x: number; readonly y: number } {
  if (owner.dataset["kpEquationMaterialPaintAlignment"] !== "measured-ink") {
    // Generic equation mounts clone exact native token rectangles and need no
    // separate ink inset; their carrier center is already the paint pivot.
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2
    };
  }
  const [originX, originY] = owner.style.transformOrigin
    .split(" ")
    .map(Number.parseFloat);
  if (!Number.isFinite(originX) || !Number.isFinite(originY)) {
    throw new Error(
      "Ink-knot fusion requires a measured material-owner paint pivot."
    );
  }
  return { x: rect.left + originX!, y: rect.top + originY! };
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

function summedArea(rects: readonly KpInkRect[]): number {
  return Math.max(1, rects.reduce(
    (area, rect) => area + Math.max(0, rect.width * rect.height),
    0
  ));
}

function centeredOffsetsByNativeGeometry(
  owners: readonly HTMLElement[],
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
      owner.dataset["kpEquationMaterialFragmentRole"] ===
        "successor-source:material-input"
    )
    .map(({ index }) => index)
    .sort(byNativeCoordinate);
  const catalystIndexes = owners
    .map((owner, index) => ({ owner, index }))
    .filter(({ owner }) =>
      owner.dataset["kpEquationMaterialFragmentRole"] ===
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
