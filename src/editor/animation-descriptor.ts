import type {
  KpAnimationAssetRenderTargetKind
} from "../animation/asset.ts";
import type {
  KpSymbolicManipulationDomain
} from "../animation/symbolic-manipulation-family.ts";
import type {
  KpArtifactPromotionFacet
} from "../animation/artifact-promotion.ts";

export type KpEditorAnimationControlKind =
  | "playback"
  | "step"
  | "scrubber"
  | "rewind";

export interface KpEditorAnimationDescriptor {
  readonly id: string;
  readonly kind: "editor-animation-descriptor";
  readonly animationId: string;
  readonly title: string;
  readonly summary: string;
  readonly domain?: KpSymbolicManipulationDomain | undefined;
  readonly familyId?: string | undefined;
  readonly sampleId?: string | undefined;
  readonly renderTargetKinds: readonly KpAnimationAssetRenderTargetKind[];
  readonly controlKinds: readonly KpEditorAnimationControlKind[];
  readonly durationMs?: number | undefined;
  readonly beatCount?: number | undefined;
  readonly tags: readonly string[];
  readonly promotion?: KpArtifactPromotionFacet | undefined;
}

export interface CreateKpEditorAnimationDescriptorInput {
  readonly id?: string | undefined;
  readonly animationId: string;
  readonly title: string;
  readonly summary: string;
  readonly domain?: KpSymbolicManipulationDomain | undefined;
  readonly familyId?: string | undefined;
  readonly sampleId?: string | undefined;
  readonly renderTargetKinds: readonly KpAnimationAssetRenderTargetKind[];
  readonly controlKinds?: readonly KpEditorAnimationControlKind[] | undefined;
  readonly durationMs?: number | undefined;
  readonly beatCount?: number | undefined;
  readonly tags?: readonly string[] | undefined;
  readonly promotion?: KpArtifactPromotionFacet | undefined;
}

export interface KpEditorAnimationDescriptorValidationIssue {
  readonly path: string;
  readonly message: string;
}

export function createKpEditorAnimationDescriptor(
  input: CreateKpEditorAnimationDescriptorInput
): KpEditorAnimationDescriptor {
  return {
    id: input.id ?? `editor-animation.${input.animationId}`,
    kind: "editor-animation-descriptor",
    animationId: input.animationId,
    title: input.title,
    summary: input.summary,
    ...(input.domain === undefined ? {} : { domain: input.domain }),
    ...(input.familyId === undefined ? {} : { familyId: input.familyId }),
    ...(input.sampleId === undefined ? {} : { sampleId: input.sampleId }),
    renderTargetKinds: unique(input.renderTargetKinds),
    controlKinds: unique(
      input.controlKinds ?? ["playback", "step", "scrubber", "rewind"]
    ),
    ...(input.durationMs === undefined ? {} : { durationMs: input.durationMs }),
    ...(input.beatCount === undefined ? {} : { beatCount: input.beatCount }),
    tags: unique(input.tags ?? []),
    ...(input.promotion === undefined ? {} : { promotion: { ...input.promotion } })
  };
}

export function validateKpEditorAnimationDescriptor(
  descriptor: KpEditorAnimationDescriptor
): readonly KpEditorAnimationDescriptorValidationIssue[] {
  const issues: KpEditorAnimationDescriptorValidationIssue[] = [];

  requireText(descriptor.id, "id", issues);
  requireText(descriptor.animationId, "animationId", issues);
  requireText(descriptor.title, "title", issues);
  requireText(descriptor.summary, "summary", issues);

  if (descriptor.renderTargetKinds.length === 0) {
    issues.push({
      path: "renderTargetKinds",
      message: `Editor animation ${descriptor.id} requires a render target.`
    });
  }

  if ((descriptor.familyId === undefined) !== (descriptor.sampleId === undefined)) {
    issues.push({
      path: descriptor.familyId === undefined ? "familyId" : "sampleId",
      message:
        `Editor animation ${descriptor.id} must provide familyId and sampleId together.`
    });
  }

  if (descriptor.durationMs !== undefined && descriptor.durationMs <= 0) {
    issues.push({
      path: "durationMs",
      message: `Editor animation ${descriptor.id} duration must be positive.`
    });
  }

  if (descriptor.beatCount !== undefined && descriptor.beatCount < 1) {
    issues.push({
      path: "beatCount",
      message: `Editor animation ${descriptor.id} beat count must be positive.`
    });
  }

  return issues;
}

function requireText(
  value: string,
  path: string,
  issues: KpEditorAnimationDescriptorValidationIssue[]
): void {
  if (value.trim().length === 0) {
    issues.push({
      path,
      message: `Editor animation ${path} must not be blank.`
    });
  }
}

function unique<T>(values: readonly T[]): readonly T[] {
  return [...new Set(values)];
}
