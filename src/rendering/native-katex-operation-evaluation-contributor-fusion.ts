import {
  kpContributorFusionEvaluationFamilyProfile,
  type KpContributorFusionEvaluationFamilyProfile
} from "../animation/operation-evaluation-family-profile.ts";
import type {
  KpNativeKatexPaintPreservingRetirement
} from "./native-katex-scene-track-contract.ts";
import { sampleKpNativeKatexContributorFusionPaint, kpNativeKatexContributorFusionOpticalProfile,
  kpNativeKatexContributorFusionRealizedPrimitiveId, type KpNativeKatexContributorFusionOpticalProfile } from "./native-katex-contributor-fusion-sampling.ts";
export { kpNativeKatexContributorFusionOpticalProfile, kpNativeKatexContributorFusionRealizedPrimitiveId,
  type KpNativeKatexContributorFusionOpticalProfile } from "./native-katex-contributor-fusion-sampling.ts";
import {
  isKpVerifiedEquationEvaluationFamilyCertificateV2,
  type KpVerifiedEquationEvaluationFamilyCertificateV2
} from "../domain-ir/equation-evaluation-family-certificate-v2.ts";
import { createKpNativeKatexMaterialRealization, requireKpNativeKatexMeasuredMaterialFrame,
  type KpNativeKatexMaterialRealization } from "./native-katex-scene-contribution.ts";
import type { KpNativeKatexSceneAssembly } from "./native-katex-scene-assembly.ts";
import type { KpNativeKatexRenderedSceneObservation } from "./native-katex-rendered-scene.ts";

const realizedCertificates = new WeakMap<KpNativeKatexMaterialRealization, KpVerifiedEquationEvaluationFamilyCertificateV2>();

export function createKpCertifiedNativeKatexContributorFusionRealization(input: {
  readonly certificate: KpVerifiedEquationEvaluationFamilyCertificateV2;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
}): KpNativeKatexMaterialRealization {
  if (!isKpVerifiedEquationEvaluationFamilyCertificateV2(input.certificate))
    throw new Error("Ink-knot realization requires a compiler-minted family certificate.");
  requireCompatibleProfiles(requireContributorFusionFamilyProfile(input.certificate), kpNativeKatexContributorFusionOpticalProfile);
  const nativeRects = new Map([...input.source.atoms, ...input.target.atoms].map(atom => [atom.sourceElement, atom.rect]));
  const realization = createKpNativeKatexMaterialRealization((owners, progress) => {
    const source = owners.filter(owner => owner.fragmentRole?.startsWith("successor-source:"));
    const target = owners.filter(owner => owner.fragmentRole?.startsWith("successor-target:"));
    if (source.length + target.length !== owners.length) throw new Error("Ink-knot realization received unrelated material.");
    const describe = (owner: typeof owners[number]) => {
      const ink = owner.paintAlignmentRect;
      if (!ink || !nativeRects.has(owner.sourceElement)) throw new Error("Ink-knot contribution requires measured native ink.");
      return { rect: owner.rect, pivot: { x: ink.left + ink.width / 2, y: ink.top + ink.height / 2 }, role: owner.fragmentRole };
    };
    const sampled = sampleKpNativeKatexContributorFusionPaint({ source: source.map(describe), target: target.map(describe), progress });
    const poses = new Map([...source.map((owner, i) => [owner.ownerId, sampled.source[i]!] as const),
      ...target.map((owner, i) => [owner.ownerId, sampled.target[i]!] as const)]);
    return owners.map(owner => {
      const pose = poses.get(owner.ownerId)!, ink = owner.paintAlignmentRect!, native = nativeRects.get(owner.sourceElement)!;
      const inset = pose.clipInset / 100;
      const clipped = owner.fragmentRole?.startsWith("successor-target:");
      const left = clipped ? Math.max(ink.left, native.left + native.width * inset) : ink.left;
      const top = clipped ? Math.max(ink.top, native.top + native.height * inset) : ink.top;
      const right = clipped ? Math.min(ink.left + ink.width, native.left + native.width * (1 - inset)) : ink.left + ink.width;
      const bottom = clipped ? Math.min(ink.top + ink.height, native.top + native.height * (1 - inset)) : ink.top + ink.height;
      const pivot = describe(owner).pivot;
      return requireKpNativeKatexMeasuredMaterialFrame({ ...owner,
        transform: pose.transform, opacity: pose.present ? 1 : 0,
        ...(clipped ? { clipPath: `inset(${pose.clipInset}% ${pose.clipInset}%)` } : {}),
        expectedPaintRect: {
          left: pivot.x + (left - pivot.x) * pose.scale + pose.translateX,
          top: pivot.y + (top - pivot.y) * pose.scale + pose.translateY,
          width: Math.max(0, right - left) * pose.scale,
          height: Math.max(0, bottom - top) * pose.scale
        }
      });
    });
  });
  realizedCertificates.set(realization, input.certificate);
  return realization;
}

export interface KpContributorFusionPlaybackPort<Sample, Frame> {
  readonly sceneAssembly?: KpNativeKatexSceneAssembly | undefined;
  sample(progress: number): Sample;
  apply(progress: number): Frame;
  retire(retirement: KpNativeKatexPaintPreservingRetirement): void;
}

export function createKpNativeKatexContributorFusionPlayback<
  Sample,
  Frame,
  Session extends KpContributorFusionPlaybackPort<Sample, Frame>
>(input: {
  readonly stage: HTMLElement;
  readonly base: Session;
  readonly familyProfile: KpContributorFusionEvaluationFamilyProfile;
  readonly cohortId?: string | undefined;
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
        opticalProfile: kpNativeKatexContributorFusionOpticalProfile,
        cohortId: input.cohortId
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
  if (input.base.sceneAssembly?.contributions.some(contribution => contribution.realization &&
      realizedCertificates.get(contribution.realization) === input.certificate)) {
    // The issued contribution already paints the optical result. A legacy host
    // wrapper may publish family telemetry, but must not apply the motion twice.
    return Object.freeze({ ...input.base, apply(progress: number) {
      const frame = input.base.apply(progress);
      recordContributorFusionTelemetry(input.stage, familyProfile, kpNativeKatexContributorFusionOpticalProfile, progress);
      return frame;
    } }) as Session;
  }
  return createKpNativeKatexContributorFusionPlayback({
    stage: input.stage,
    base: input.base,
    familyProfile
  });
}

/**
 * Several certified evaluations may share one semantic transition and clock.
 * Cohort IDs scope the existing primitive to independent material groups;
 * the base lifecycle is sampled, applied, and retired exactly once.
 */
export function createKpCertifiedNativeKatexContributorFusionCohortPlayback<
  Sample,
  Frame,
  Session extends KpContributorFusionPlaybackPort<Sample, Frame>
>(input: {
  readonly stage: HTMLElement;
  readonly base: Session;
  readonly cohorts: readonly {
    readonly cohortId: string;
    readonly certificate: KpVerifiedEquationEvaluationFamilyCertificateV2;
  }[];
}): Session {
  if (input.cohorts.length < 2) {
    throw new Error(
      "Native KaTeX cohort fusion requires at least two certified cohorts."
    );
  }
  const cohortIds = new Set<string>();
  input.cohorts.forEach(({ cohortId, certificate }) => {
    if (!isKpVerifiedEquationEvaluationFamilyCertificateV2(certificate)) {
      throw new Error(
        "Native KaTeX cohort fusion requires compiler-minted family certificates."
      );
    }
    const familyProfile = requireContributorFusionFamilyProfile(certificate);
    if (certificate.topologyCertificate.cohortId !== cohortId ||
        cohortId.trim() === "" || cohortIds.has(cohortId)) {
      throw new Error(
        "Native KaTeX cohort fusion requires unique certificate-owned cohort IDs."
      );
    }
    cohortIds.add(cohortId);
    requireCompatibleProfiles(
      familyProfile,
      kpNativeKatexContributorFusionOpticalProfile
    );
  });
  return Object.freeze({
    ...input.base,
    sample(progress: number) {
      return input.base.sample(progress);
    },
    apply(progress: number) {
      const frame = input.base.apply(progress);
      input.cohorts.forEach(({ cohortId, certificate }) => {
        const familyProfile =
          requireContributorFusionFamilyProfile(certificate);
        const sourceOwners = materialOwners(input.stage, "source", cohortId);
        const targetOwners = materialOwners(input.stage, "target", cohortId);
        if (sourceOwners.length === 0 || targetOwners.length === 0) {
          throw new Error(
            `Native KaTeX cohort ${cohortId} lacks source or target material paint.`
          );
        }
        applyKpNativeKatexContributorFusion({
          stage: input.stage,
          progress,
          familyProfile,
          opticalProfile: kpNativeKatexContributorFusionOpticalProfile,
          cohortId
        });
      });
      input.stage.dataset["kpOperationEvaluationCohortIds"] =
        JSON.stringify([...cohortIds]);
      input.stage.dataset["kpOperationEvaluationCohortCount"] =
        String(cohortIds.size);
      input.stage.dataset["kpOperationEvaluationReadableCohortCount"] =
        input.stage.dataset["kpOperationEvaluationLegibilityState"] === "kernel"
          ? "0"
          : String(cohortIds.size);
      return frame;
    },
    retire(retirement: KpNativeKatexPaintPreservingRetirement) {
      input.base.retire(retirement);
    }
  }) as Session;
}

export function applyKpNativeKatexContributorFusion(input: {
  readonly stage: HTMLElement;
  readonly progress: number;
  readonly familyProfile: KpContributorFusionEvaluationFamilyProfile;
  readonly opticalProfile: KpNativeKatexContributorFusionOpticalProfile;
  readonly cohortId?: string | undefined;
}): void {
  requireCompatibleProfiles(input.familyProfile, input.opticalProfile);
  const sourceOwners = materialOwners(input.stage, "source", input.cohortId);
  const targetOwners = materialOwners(input.stage, "target", input.cohortId);
  if (sourceOwners.length === 0 || targetOwners.length === 0) return;
  const describe = (owner: HTMLElement) => {
    const rect = ownerBaseRect(owner);
    return { rect, pivot: ownerPaintPivot(owner, rect), role: owner.dataset["kpEquationMaterialFragmentRole"] };
  };
  const sampled = sampleKpNativeKatexContributorFusionPaint({
    source: sourceOwners.map(describe), target: targetOwners.map(describe),
    progress: input.progress, opticalProfile: input.opticalProfile
  });
  sourceOwners.forEach((owner, i) => {
    const pose = sampled.source[i]!;
    setOwnerPaintPresence(owner, pose.present);
    owner.style.transform = pose.transform;
  });
  targetOwners.forEach((owner, i) => {
    const pose = sampled.target[i]!;
    setOwnerPaintPresence(owner, pose.present);
    const visual = owner.firstElementChild as HTMLElement | null;
    if (visual) visual.style.clipPath = `inset(${pose.clipInset}% ${pose.clipInset}%)`;
    owner.style.transform = pose.transform;
  });
  recordContributorFusionTelemetry(input.stage, input.familyProfile, input.opticalProfile, input.progress);
}

function recordContributorFusionTelemetry(stage: HTMLElement, familyProfile: KpContributorFusionEvaluationFamilyProfile,
  opticalProfile: KpNativeKatexContributorFusionOpticalProfile, progress: number): void {
  const input = { stage, familyProfile, opticalProfile };
  const legibilityState = progress < opticalProfile.sourceKernelStartsAt ? "source"
    : progress < opticalProfile.targetLegibilityStartsAt ? "kernel" : "target";
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

function requireContributorFusionFamilyProfile(
  certificate: KpVerifiedEquationEvaluationFamilyCertificateV2
): KpContributorFusionEvaluationFamilyProfile {
  const familyProfile = certificate.familyProfile;
  if (familyProfile.family !== "contributor-fusion") {
    throw new Error(
      `Native KaTeX cohort fusion cannot realize ${familyProfile.family}.`
    );
  }
  return familyProfile;
}

function materialOwners(
  stage: HTMLElement,
  side: "source" | "target",
  cohortId?: string | undefined
): readonly HTMLElement[] {
  const owners = [...stage.querySelectorAll<HTMLElement>(
    `[data-kp-equation-material-fragment-role^="successor-${side}:"]`
  )];
  return cohortId === undefined
    ? owners
    : owners.filter((owner) =>
        owner.dataset["kpEquationMaterialVerifiedOperationCohortId"] ===
          cohortId
      );
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
