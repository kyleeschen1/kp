import {
  createKpAssetBundle,
  validateKpAssetBundle,
  type KpAssetBundle,
  type KpAssetMetadataValue
} from "../semantic/asset.ts";
import {
  createKpSemanticTransformation,
  validateKpSemanticTransformation,
  type KpLawCheckLevel,
  type KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import {
  createEditableSemanticTransformationTree,
  semanticTransformationLeafRefs,
  type EditableSemanticTransformationTree,
  type SemanticTransformationNode
} from "../semantic/transformation-composition.ts";

export type KpAnimationAssetLayoutKind =
  | "single"
  | "row"
  | "column"
  | "stack"
  | "tabs"
  | "overlay"
  | "split"
  | "grid"
  | "scroll-sequence"
  | "pinned-stage";

export type KpAnimationAssetRenderTargetKind =
  | "equation"
  | "graph"
  | "programming"
  | "dashboard"
  | "export"
  | "custom";

export type KpAnimationAssetExportTargetKind =
  | "iframe"
  | "static-step"
  | "frame-sequence"
  | "custom";

export interface KpAnimationAsset {
  readonly id: string;
  readonly kind: "animation-asset";
  readonly title: string;
  readonly version: 1;
  readonly bundle: KpAssetBundle;
  readonly transformations: readonly KpSemanticTransformation[];
  readonly transformationTree: EditableSemanticTransformationTree;
  readonly timeline?: KpAnimationAssetTimeline | undefined;
  readonly layout?: KpAnimationAssetLayoutNode | undefined;
  readonly renderTargets: readonly KpAnimationAssetRenderTarget[];
  readonly checks: readonly KpAnimationAssetCheckRef[];
  readonly exportTargets: readonly KpAnimationAssetExportTarget[];
  readonly dashboard?: KpAnimationAssetDashboardMetadata | undefined;
  readonly metadata?: Readonly<Record<string, KpAssetMetadataValue>> | undefined;
}

export interface CreateKpAnimationAssetInput {
  readonly id: string;
  readonly title: string;
  readonly bundle: KpAssetBundle;
  readonly transformations: readonly KpSemanticTransformation[];
  readonly transformationTree: EditableSemanticTransformationTree;
  readonly timeline?: KpAnimationAssetTimeline | undefined;
  readonly layout?: KpAnimationAssetLayoutNode | undefined;
  readonly renderTargets?: readonly KpAnimationAssetRenderTarget[] | undefined;
  readonly checks?: readonly KpAnimationAssetCheckRef[] | undefined;
  readonly exportTargets?: readonly KpAnimationAssetExportTarget[] | undefined;
  readonly dashboard?: KpAnimationAssetDashboardMetadata | undefined;
  readonly metadata?: Readonly<Record<string, KpAssetMetadataValue>> | undefined;
}

export interface KpAnimationAssetTimeline {
  readonly id: string;
  readonly durationMs?: number | undefined;
  readonly beatCount?: number | undefined;
  readonly markerIds?: readonly string[] | undefined;
}

export interface KpAnimationAssetLayoutNode {
  readonly id: string;
  readonly kind: KpAnimationAssetLayoutKind;
  readonly targetId?: string | undefined;
  readonly childIds?: readonly string[] | undefined;
  readonly title?: string | undefined;
  readonly metadata?: Readonly<Record<string, KpAssetMetadataValue>> | undefined;
}

export interface KpAnimationAssetRenderTarget {
  readonly id: string;
  readonly kind: KpAnimationAssetRenderTargetKind;
  readonly objectIds?: readonly string[] | undefined;
  readonly selectorIds?: readonly string[] | undefined;
  readonly transformationIds?: readonly string[] | undefined;
  readonly timelineId?: string | undefined;
  readonly summary?: string | undefined;
  readonly metadata?: Readonly<Record<string, KpAssetMetadataValue>> | undefined;
}

export interface KpAnimationAssetCheckRef {
  readonly id: string;
  readonly lawId: string;
  readonly level: KpLawCheckLevel;
  readonly targetId?: string | undefined;
  readonly summary?: string | undefined;
}

export interface KpAnimationAssetExportTarget {
  readonly id: string;
  readonly kind: KpAnimationAssetExportTargetKind;
  readonly artifactId?: string | undefined;
  readonly profileId?: string | undefined;
  readonly summary?: string | undefined;
}

export interface KpAnimationAssetDashboardMetadata {
  readonly rowId: string;
  readonly tags: readonly string[];
  readonly sampleTargetIds?: readonly string[] | undefined;
  readonly sourceRefIds?: readonly string[] | undefined;
}

export interface KpAnimationAssetValidationIssue {
  readonly path: string;
  readonly message: string;
}

// AnimationAsset is deliberately a thin composition contract: semantic truth
// stays in asset bundles, transformations, and trees while renderers consume it.
export function createKpAnimationAsset(
  input: CreateKpAnimationAssetInput
): KpAnimationAsset {
  assertNonEmpty(input.id, "Animation asset id");
  assertNonEmpty(input.title, `Animation asset ${input.id} title`);

  return {
    id: input.id,
    kind: "animation-asset",
    title: input.title,
    version: 1,
    bundle: createKpAssetBundle(input.bundle),
    transformations: input.transformations.map(cloneKpSemanticTransformation),
    transformationTree: createEditableSemanticTransformationTree(
      input.transformationTree
    ),
    ...(input.timeline === undefined
      ? {}
      : { timeline: cloneAnimationAssetTimeline(input.timeline) }),
    ...(input.layout === undefined
      ? {}
      : { layout: cloneAnimationAssetLayoutNode(input.layout) }),
    renderTargets: (input.renderTargets ?? []).map(
      cloneAnimationAssetRenderTarget
    ),
    checks: (input.checks ?? []).map(cloneAnimationAssetCheckRef),
    exportTargets: (input.exportTargets ?? []).map(
      cloneAnimationAssetExportTarget
    ),
    ...(input.dashboard === undefined
      ? {}
      : { dashboard: cloneAnimationAssetDashboardMetadata(input.dashboard) }),
    ...(input.metadata === undefined ? {} : { metadata: { ...input.metadata } })
  };
}

export function validateKpAnimationAsset(
  animation: KpAnimationAsset
): readonly KpAnimationAssetValidationIssue[] {
  const issues: KpAnimationAssetValidationIssue[] = [];
  const objectIds = new Set(animation.bundle.objects.map((object) => object.id));
  const selectorIds = new Set(
    animation.bundle.objects.flatMap((object) =>
      object.selectors.map((selector) => selector.id)
    )
  );
  const transformationIds = new Set<string>();
  const renderTargetIds = new Set(
    animation.renderTargets.map((target) => target.id)
  );

  validateKpAssetBundle(animation.bundle).forEach((issue) => {
    issues.push({
      path: `bundle.${issue.path}`,
      message: issue.message
    });
  });

  animation.transformations.forEach((transformation, index) => {
    if (transformationIds.has(transformation.id)) {
      issues.push({
        path: `transformations[${index}].id`,
        message: `Duplicate animation transformation id: ${transformation.id}.`
      });
    }

    transformationIds.add(transformation.id);

    validateKpSemanticTransformation(transformation, animation.bundle).forEach(
      (issue) => {
        issues.push({
          path: `transformations[${index}].${issue.path}`,
          message: issue.message
        });
      }
    );
  });

  validateTransformationTreeClosure(
    animation,
    transformationIds,
    issues
  );
  validateLayoutClosure(animation, renderTargetIds, issues);
  validateRenderTargetClosure(
    animation,
    objectIds,
    selectorIds,
    transformationIds,
    issues
  );

  return issues;
}

function validateTransformationTreeClosure(
  animation: KpAnimationAsset,
  transformationIds: ReadonlySet<string>,
  issues: KpAnimationAssetValidationIssue[]
): void {
  semanticTransformationLeafRefs(animation.transformationTree.root).forEach(
    (ref) => {
      if (transformationIds.has(ref.id)) {
        return;
      }

      issues.push({
        path: transformationTreePathForRef(animation.transformationTree.root, ref.id),
        message:
          `Animation ${animation.id} transformation tree references missing transformation ${ref.id}.`
      });
    }
  );
}

function validateLayoutClosure(
  animation: KpAnimationAsset,
  renderTargetIds: ReadonlySet<string>,
  issues: KpAnimationAssetValidationIssue[]
): void {
  const layout = animation.layout;

  if (layout?.targetId !== undefined && !renderTargetIds.has(layout.targetId)) {
    issues.push({
      path: "layout.targetId",
      message:
        `Animation ${animation.id} layout ${layout.id} references missing render target ${layout.targetId}.`
    });
  }
}

function validateRenderTargetClosure(
  animation: KpAnimationAsset,
  objectIds: ReadonlySet<string>,
  selectorIds: ReadonlySet<string>,
  transformationIds: ReadonlySet<string>,
  issues: KpAnimationAssetValidationIssue[]
): void {
  animation.renderTargets.forEach((target, targetIndex) => {
    (target.objectIds ?? []).forEach((objectId, objectIndex) => {
      if (objectIds.has(objectId)) {
        return;
      }

      issues.push({
        path: `renderTargets[${targetIndex}].objectIds[${objectIndex}]`,
        message:
          `Animation ${animation.id} render target ${target.id} references missing object ${objectId}.`
      });
    });

    (target.selectorIds ?? []).forEach((selectorId, selectorIndex) => {
      if (selectorIds.has(selectorId)) {
        return;
      }

      issues.push({
        path: `renderTargets[${targetIndex}].selectorIds[${selectorIndex}]`,
        message:
          `Animation ${animation.id} render target ${target.id} references missing selector ${selectorId}.`
      });
    });

    (target.transformationIds ?? []).forEach(
      (transformationId, transformationIndex) => {
        if (transformationIds.has(transformationId)) {
          return;
        }

        issues.push({
          path:
            `renderTargets[${targetIndex}].transformationIds[${transformationIndex}]`,
          message:
            `Animation ${animation.id} render target ${target.id} references missing transformation ${transformationId}.`
        });
      }
    );
  });
}

function cloneKpSemanticTransformation(
  transformation: KpSemanticTransformation
): KpSemanticTransformation {
  return createKpSemanticTransformation({
    id: transformation.id,
    ...(transformation.definitionId === undefined
      ? {}
      : { definitionId: transformation.definitionId }),
    transformType: transformation.transformType,
    title: transformation.title,
    sourceObjectIds: transformation.sourceObjectIds,
    targetObjectIds: transformation.targetObjectIds,
    preserves: transformation.preserves,
    correspondence: transformation.correspondence,
    ...(transformation.assumptions === undefined
      ? {}
      : { assumptions: transformation.assumptions }),
    ...(transformation.lawRefs === undefined
      ? {}
      : { lawRefs: transformation.lawRefs })
  });
}

function cloneAnimationAssetTimeline(
  timeline: KpAnimationAssetTimeline
): KpAnimationAssetTimeline {
  return {
    id: timeline.id,
    ...(timeline.durationMs === undefined
      ? {}
      : { durationMs: timeline.durationMs }),
    ...(timeline.beatCount === undefined ? {} : { beatCount: timeline.beatCount }),
    ...(timeline.markerIds === undefined ? {} : { markerIds: [...timeline.markerIds] })
  };
}

function cloneAnimationAssetLayoutNode(
  layout: KpAnimationAssetLayoutNode
): KpAnimationAssetLayoutNode {
  return {
    id: layout.id,
    kind: layout.kind,
    ...(layout.targetId === undefined ? {} : { targetId: layout.targetId }),
    ...(layout.childIds === undefined ? {} : { childIds: [...layout.childIds] }),
    ...(layout.title === undefined ? {} : { title: layout.title }),
    ...(layout.metadata === undefined ? {} : { metadata: { ...layout.metadata } })
  };
}

function cloneAnimationAssetRenderTarget(
  target: KpAnimationAssetRenderTarget
): KpAnimationAssetRenderTarget {
  return {
    id: target.id,
    kind: target.kind,
    ...(target.objectIds === undefined
      ? {}
      : { objectIds: [...target.objectIds] }),
    ...(target.selectorIds === undefined
      ? {}
      : { selectorIds: [...target.selectorIds] }),
    ...(target.transformationIds === undefined
      ? {}
      : { transformationIds: [...target.transformationIds] }),
    ...(target.timelineId === undefined ? {} : { timelineId: target.timelineId }),
    ...(target.summary === undefined ? {} : { summary: target.summary }),
    ...(target.metadata === undefined ? {} : { metadata: { ...target.metadata } })
  };
}

function cloneAnimationAssetCheckRef(
  check: KpAnimationAssetCheckRef
): KpAnimationAssetCheckRef {
  return {
    id: check.id,
    lawId: check.lawId,
    level: check.level,
    ...(check.targetId === undefined ? {} : { targetId: check.targetId }),
    ...(check.summary === undefined ? {} : { summary: check.summary })
  };
}

function cloneAnimationAssetExportTarget(
  target: KpAnimationAssetExportTarget
): KpAnimationAssetExportTarget {
  return {
    id: target.id,
    kind: target.kind,
    ...(target.artifactId === undefined ? {} : { artifactId: target.artifactId }),
    ...(target.profileId === undefined ? {} : { profileId: target.profileId }),
    ...(target.summary === undefined ? {} : { summary: target.summary })
  };
}

function cloneAnimationAssetDashboardMetadata(
  dashboard: KpAnimationAssetDashboardMetadata
): KpAnimationAssetDashboardMetadata {
  return {
    rowId: dashboard.rowId,
    tags: [...dashboard.tags],
    ...(dashboard.sampleTargetIds === undefined
      ? {}
      : { sampleTargetIds: [...dashboard.sampleTargetIds] }),
    ...(dashboard.sourceRefIds === undefined
      ? {}
      : { sourceRefIds: [...dashboard.sourceRefIds] })
  };
}

function transformationTreePathForRef(
  node: SemanticTransformationNode,
  refId: string,
  path = "transformationTree.root"
): string {
  if (node.kind === "leaf") {
    return node.id === refId ? path : "transformationTree.root";
  }

  const childIndex = node.children.findIndex((child) =>
    semanticTransformationLeafRefs(child).some((ref) => ref.id === refId)
  );

  return childIndex < 0
    ? "transformationTree.root"
    : transformationTreePathForRef(
        node.children[childIndex]!,
        refId,
        `${path}.children[${childIndex}]`
      );
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
