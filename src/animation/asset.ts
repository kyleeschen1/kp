import {
  createKpAssetBundle,
  validateKpAssetBundle,
  type KpAssetBundle,
  type KpAssetMetadataValue,
  type KpSemanticAssetObject
} from "../semantic/asset.ts";
import {
  createKpSemanticTransformation,
  validateKpSemanticTransformation,
  type KpLawCheckLevel,
  type KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import {
  createSemanticObjectRef,
  createSemanticTransformationRef,
  type SemanticObjectRef,
  type SemanticTransformationPreservation,
  type SemanticTransformationRef
} from "../semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence,
  semanticTransformationForwardPhases,
  semanticTransformationLeafRefs,
  semanticTransformationRewindPhases,
  type EditableSemanticTransformationTree,
  type SemanticTransformationTreeAnnotationPlacement,
  type SemanticTransformationTreeAnnotation,
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

export interface KpAnimationAssetSemanticRefCompilation {
  readonly animationId: string;
  readonly semanticObjectRefs: readonly SemanticObjectRef[];
  readonly transformationRefs: readonly SemanticTransformationRef[];
  readonly timelineRefs: readonly KpAnimationAssetTimeline[];
  readonly layoutRefs: readonly KpAnimationAssetLayoutNode[];
  readonly renderTargetRefs: readonly KpAnimationAssetCompiledRenderTargetRef[];
  readonly diagnostics: readonly KpAnimationAssetValidationIssue[];
}

export interface KpAnimationAssetCompiledRenderTargetRef {
  readonly id: string;
  readonly kind: KpAnimationAssetRenderTargetKind;
  readonly objectIds: readonly string[];
  readonly selectorIds: readonly string[];
  readonly transformationIds: readonly string[];
  readonly timelineId?: string | undefined;
  readonly summary?: string | undefined;
}

export type KpAnimationAssetTransformationTreeDirection =
  | "forward"
  | "rewind";

export interface KpAnimationAssetTransformationTreeDescription {
  readonly animationId: string;
  readonly rootNodeId: string;
  readonly rootKind: SemanticTransformationNode["kind"];
  readonly nodes: readonly KpAnimationAssetTransformationTreeNodeRef[];
  readonly forwardPhases: readonly KpAnimationAssetTransformationTreePhase[];
  readonly rewindPhases: readonly KpAnimationAssetTransformationTreePhase[];
  readonly annotations: readonly SemanticTransformationTreeAnnotation[];
}

export interface KpAnimationAssetTransformationTreeNodeRef {
  readonly id: string;
  readonly kind: SemanticTransformationNode["kind"];
  readonly label?: string | undefined;
  readonly childIds?: readonly string[] | undefined;
  readonly transformationKind?: string | undefined;
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
  readonly preserves: readonly SemanticTransformationPreservation[];
  readonly summary?: string | undefined;
}

export interface KpAnimationAssetTransformationTreePhase {
  readonly id: string;
  readonly direction: KpAnimationAssetTransformationTreeDirection;
  readonly nodeIds: readonly string[];
  readonly annotationIdsByPlacement: KpAnimationAssetTreePhaseAnnotationIds;
}

export interface KpAnimationAssetTreePhaseAnnotationIds {
  readonly before: readonly string[];
  readonly during: readonly string[];
  readonly after: readonly string[];
}

export interface CreateKpAnimationAssetBuilderInput {
  readonly id: string;
  readonly title: string;
  readonly bundleId?: string | undefined;
  readonly bundleTitle?: string | undefined;
  readonly metadata?: Readonly<Record<string, KpAssetMetadataValue>> | undefined;
}

export interface KpAnimationAssetBuilder {
  addObject(object: KpSemanticAssetObject): KpAnimationAssetBuilder;
  addTransformation(
    transformation: KpSemanticTransformation
  ): KpAnimationAssetBuilder;
  addAnnotation(
    annotation: SemanticTransformationTreeAnnotation
  ): KpAnimationAssetBuilder;
  withTransformationTree(
    tree: EditableSemanticTransformationTree
  ): KpAnimationAssetBuilder;
  withTimeline(timeline: KpAnimationAssetTimeline): KpAnimationAssetBuilder;
  withLayout(layout: KpAnimationAssetLayoutNode): KpAnimationAssetBuilder;
  addRenderTarget(target: KpAnimationAssetRenderTarget): KpAnimationAssetBuilder;
  addCheck(check: KpAnimationAssetCheckRef): KpAnimationAssetBuilder;
  addExportTarget(target: KpAnimationAssetExportTarget): KpAnimationAssetBuilder;
  withDashboard(
    dashboard: KpAnimationAssetDashboardMetadata
  ): KpAnimationAssetBuilder;
  withMetadata(
    metadata: Readonly<Record<string, KpAssetMetadataValue>>
  ): KpAnimationAssetBuilder;
  build(): KpAnimationAsset;
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

export function createKpAnimationAssetBuilder(
  input: CreateKpAnimationAssetBuilderInput
): KpAnimationAssetBuilder {
  return new DefaultKpAnimationAssetBuilder(input);
}

export function compileKpAnimationAssetSemanticRefs(
  animation: KpAnimationAsset
): KpAnimationAssetSemanticRefCompilation {
  return {
    animationId: animation.id,
    semanticObjectRefs: animation.bundle.objects.map((object) =>
      createSemanticObjectRef({
        objectId: object.id,
        objectType: object.objectType
      })
    ),
    transformationRefs: animation.transformations.map((transformation) =>
      createSemanticTransformationRef({
        id: transformation.id,
        kind: transformation.transformType,
        sourceObjectIds: transformation.sourceObjectIds,
        targetObjectIds: transformation.targetObjectIds,
        preserves: transformation.preserves,
        summary: transformation.title
      })
    ),
    timelineRefs:
      animation.timeline === undefined
        ? []
        : [cloneAnimationAssetTimeline(animation.timeline)],
    layoutRefs:
      animation.layout === undefined
        ? []
        : [cloneAnimationAssetLayoutNode(animation.layout)],
    renderTargetRefs: animation.renderTargets.map(
      compileAnimationAssetRenderTargetRef
    ),
    diagnostics: validateKpAnimationAsset(animation).map((diagnostic) => ({
      ...diagnostic
    }))
  };
}

export function describeKpAnimationAssetTransformationTree(
  animation: KpAnimationAsset
): KpAnimationAssetTransformationTreeDescription {
  const tree = animation.transformationTree;
  const annotations = tree.annotations.map(cloneTransformationTreeAnnotation);

  return {
    animationId: animation.id,
    rootNodeId: tree.root.id,
    rootKind: tree.root.kind,
    nodes: describeTransformationTreeNodes(tree.root),
    forwardPhases: describeTransformationTreeDirectionPhases(
      animation.id,
      "forward",
      semanticTransformationForwardPhases(tree.root),
      annotations
    ),
    rewindPhases: describeTransformationTreeDirectionPhases(
      animation.id,
      "rewind",
      semanticTransformationRewindPhases(tree.root),
      annotations
    ),
    annotations
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

class DefaultKpAnimationAssetBuilder implements KpAnimationAssetBuilder {
  private readonly id: string;
  private readonly title: string;
  private readonly bundleId: string;
  private readonly bundleTitle: string;
  private objects: KpSemanticAssetObject[] = [];
  private transformations: KpSemanticTransformation[] = [];
  private annotations: SemanticTransformationTreeAnnotation[] = [];
  private transformationTree: EditableSemanticTransformationTree | undefined;
  private timeline: KpAnimationAssetTimeline | undefined;
  private layout: KpAnimationAssetLayoutNode | undefined;
  private renderTargets: KpAnimationAssetRenderTarget[] = [];
  private checks: KpAnimationAssetCheckRef[] = [];
  private exportTargets: KpAnimationAssetExportTarget[] = [];
  private dashboard: KpAnimationAssetDashboardMetadata | undefined;
  private metadata: Readonly<Record<string, KpAssetMetadataValue>> | undefined;

  constructor(input: CreateKpAnimationAssetBuilderInput) {
    assertNonEmpty(input.id, "Animation asset id");
    assertNonEmpty(input.title, `Animation asset ${input.id} title`);

    this.id = input.id;
    this.title = input.title;
    this.bundleId = input.bundleId ?? `${input.id}.assets`;
    this.bundleTitle = input.bundleTitle ?? `${input.title} assets`;
    this.metadata = input.metadata === undefined ? undefined : { ...input.metadata };
  }

  addObject(object: KpSemanticAssetObject): KpAnimationAssetBuilder {
    this.objects = [...this.objects, object];
    return this;
  }

  addTransformation(
    transformation: KpSemanticTransformation
  ): KpAnimationAssetBuilder {
    this.transformations = [...this.transformations, transformation];
    return this;
  }

  addAnnotation(
    annotation: SemanticTransformationTreeAnnotation
  ): KpAnimationAssetBuilder {
    this.annotations = [...this.annotations, annotation];
    return this;
  }

  withTransformationTree(
    tree: EditableSemanticTransformationTree
  ): KpAnimationAssetBuilder {
    this.transformationTree = createEditableSemanticTransformationTree(tree);
    return this;
  }

  withTimeline(timeline: KpAnimationAssetTimeline): KpAnimationAssetBuilder {
    this.timeline = cloneAnimationAssetTimeline(timeline);
    return this;
  }

  withLayout(layout: KpAnimationAssetLayoutNode): KpAnimationAssetBuilder {
    this.layout = cloneAnimationAssetLayoutNode(layout);
    return this;
  }

  addRenderTarget(target: KpAnimationAssetRenderTarget): KpAnimationAssetBuilder {
    this.renderTargets = [
      ...this.renderTargets,
      cloneAnimationAssetRenderTarget(target)
    ];
    return this;
  }

  addCheck(check: KpAnimationAssetCheckRef): KpAnimationAssetBuilder {
    this.checks = [...this.checks, cloneAnimationAssetCheckRef(check)];
    return this;
  }

  addExportTarget(target: KpAnimationAssetExportTarget): KpAnimationAssetBuilder {
    this.exportTargets = [
      ...this.exportTargets,
      cloneAnimationAssetExportTarget(target)
    ];
    return this;
  }

  withDashboard(
    dashboard: KpAnimationAssetDashboardMetadata
  ): KpAnimationAssetBuilder {
    this.dashboard = cloneAnimationAssetDashboardMetadata(dashboard);
    return this;
  }

  withMetadata(
    metadata: Readonly<Record<string, KpAssetMetadataValue>>
  ): KpAnimationAssetBuilder {
    this.metadata = { ...metadata };
    return this;
  }

  build(): KpAnimationAsset {
    return createKpAnimationAsset({
      id: this.id,
      title: this.title,
      bundle: createKpAssetBundle({
        id: this.bundleId,
        title: this.bundleTitle,
        objects: this.objects
      }),
      transformations: this.transformations,
      transformationTree: this.buildTransformationTree(),
      ...(this.timeline === undefined ? {} : { timeline: this.timeline }),
      ...(this.layout === undefined ? {} : { layout: this.layout }),
      renderTargets: this.renderTargets,
      checks: this.checks,
      exportTargets: this.exportTargets,
      ...(this.dashboard === undefined ? {} : { dashboard: this.dashboard }),
      ...(this.metadata === undefined ? {} : { metadata: this.metadata })
    });
  }

  private buildTransformationTree(): EditableSemanticTransformationTree {
    if (this.transformationTree !== undefined) {
      return createEditableSemanticTransformationTree({
        root: this.transformationTree.root,
        annotations: [
          ...this.transformationTree.annotations,
          ...this.annotations
        ]
      });
    }

    if (this.transformations.length === 0) {
      throw new Error(
        `Animation asset ${this.id} builder requires at least one transformation or an explicit transformation tree.`
      );
    }

    const leaves = this.transformations.map((transformation) =>
      createSemanticTransformationLeaf(
        createSemanticTransformationRef({
          id: transformation.id,
          kind: transformation.transformType,
          sourceObjectIds: transformation.sourceObjectIds,
          targetObjectIds: transformation.targetObjectIds,
          preserves: transformation.preserves,
          summary: transformation.title
        })
      )
    );
    const root =
      leaves.length === 1
        ? leaves[0]!
        : createSemanticTransformationSequence({
            id: `${this.id}.transformations`,
            label: `${this.title} transformations`,
            children: leaves
          });

    return createEditableSemanticTransformationTree({
      root,
      annotations: this.annotations
    });
  }
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

function compileAnimationAssetRenderTargetRef(
  target: KpAnimationAssetRenderTarget
): KpAnimationAssetCompiledRenderTargetRef {
  return {
    id: target.id,
    kind: target.kind,
    objectIds: [...(target.objectIds ?? [])],
    selectorIds: [...(target.selectorIds ?? [])],
    transformationIds: [...(target.transformationIds ?? [])],
    ...(target.timelineId === undefined ? {} : { timelineId: target.timelineId }),
    ...(target.summary === undefined ? {} : { summary: target.summary })
  };
}

function describeTransformationTreeNodes(
  node: SemanticTransformationNode
): readonly KpAnimationAssetTransformationTreeNodeRef[] {
  switch (node.kind) {
    case "leaf":
      return [
        {
          id: node.id,
          kind: "leaf",
          transformationKind: node.transformation.kind,
          sourceObjectIds: [...node.sourceObjectIds],
          targetObjectIds: [...node.targetObjectIds],
          preserves: [...node.preserves]
        }
      ];
    case "sequence":
    case "parallel":
      return [
        {
          id: node.id,
          kind: node.kind,
          label: node.label,
          childIds: node.children.map((child) => child.id),
          sourceObjectIds: [...node.sourceObjectIds],
          targetObjectIds: [...node.targetObjectIds],
          preserves: [...node.preserves],
          ...(node.summary === undefined ? {} : { summary: node.summary })
        },
        ...node.children.flatMap(describeTransformationTreeNodes)
      ];
  }
}

function describeTransformationTreeDirectionPhases(
  animationId: string,
  direction: KpAnimationAssetTransformationTreeDirection,
  nodePhases: readonly (readonly string[])[],
  annotations: readonly SemanticTransformationTreeAnnotation[]
): readonly KpAnimationAssetTransformationTreePhase[] {
  return nodePhases.map((nodeIds, index) => ({
    id: `${animationId}.${direction}.${index}`,
    direction,
    nodeIds: [...nodeIds],
    annotationIdsByPlacement: transformationTreeAnnotationIdsForPhase(
      nodeIds,
      direction,
      annotations
    )
  }));
}

function transformationTreeAnnotationIdsForPhase(
  nodeIds: readonly string[],
  direction: KpAnimationAssetTransformationTreeDirection,
  annotations: readonly SemanticTransformationTreeAnnotation[]
): KpAnimationAssetTreePhaseAnnotationIds {
  const nodeIdSet = new Set(nodeIds);
  const idsByPlacement: {
    before: string[];
    during: string[];
    after: string[];
  } = {
    before: [],
    during: [],
    after: []
  };

  annotations.forEach((annotation) => {
    if (!nodeIdSet.has(annotation.targetNodeId)) {
      return;
    }

    const placement =
      direction === "forward"
        ? annotation.placement
        : mirrorTransformationTreeAnnotationPlacement(annotation.placement);
    idsByPlacement[placement].push(annotation.id);
  });

  return idsByPlacement;
}

function mirrorTransformationTreeAnnotationPlacement(
  placement: SemanticTransformationTreeAnnotationPlacement
): SemanticTransformationTreeAnnotationPlacement {
  switch (placement) {
    case "before":
      return "after";
    case "during":
      return "during";
    case "after":
      return "before";
  }
}

function cloneTransformationTreeAnnotation(
  annotation: SemanticTransformationTreeAnnotation
): SemanticTransformationTreeAnnotation {
  return {
    id: annotation.id,
    kind: annotation.kind,
    targetNodeId: annotation.targetNodeId,
    placement: annotation.placement,
    ...(annotation.selectorIds === undefined
      ? {}
      : { selectorIds: [...annotation.selectorIds] }),
    ...(annotation.durationBeats === undefined
      ? {}
      : { durationBeats: annotation.durationBeats }),
    ...(annotation.summary === undefined ? {} : { summary: annotation.summary })
  };
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
