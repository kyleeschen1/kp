import {
  createSemanticTransformationRef,
  type SemanticTransformationPreservation,
  type SemanticTransformationRef
} from "./animation.ts";

export type SemanticTransformationNode =
  | SemanticTransformationLeafNode
  | SemanticTransformationGroupNode;

export interface SemanticTransformationLeafNode {
  readonly kind: "leaf";
  readonly id: string;
  readonly transformation: SemanticTransformationRef;
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
  readonly preserves: readonly SemanticTransformationPreservation[];
}

export interface SemanticTransformationGroupNode {
  readonly kind: "sequence" | "parallel";
  readonly id: string;
  readonly label: string;
  readonly children: readonly SemanticTransformationNode[];
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
  readonly preserves: readonly SemanticTransformationPreservation[];
  readonly summary?: string | undefined;
}

export interface CreateSemanticTransformationGroupInput {
  readonly id: string;
  readonly label: string;
  readonly children: readonly SemanticTransformationNode[];
  readonly summary?: string | undefined;
}

export type SemanticTransformationTreeAnnotationKind =
  | "pause"
  | "focus"
  | "unfocus"
  | "emphasis";

export type SemanticTransformationTreeAnnotationPlacement =
  | "before"
  | "during"
  | "after";

export interface SemanticTransformationTreeAnnotation {
  readonly id: string;
  readonly kind: SemanticTransformationTreeAnnotationKind;
  readonly targetNodeId: string;
  readonly placement: SemanticTransformationTreeAnnotationPlacement;
  readonly selectorIds?: readonly string[] | undefined;
  readonly durationBeats?: number | undefined;
  readonly summary?: string | undefined;
}

export interface EditableSemanticTransformationTree {
  readonly root: SemanticTransformationNode;
  readonly annotations: readonly SemanticTransformationTreeAnnotation[];
}

export interface CreateEditableSemanticTransformationTreeInput {
  readonly root: SemanticTransformationNode;
  readonly annotations?: readonly SemanticTransformationTreeAnnotation[] | undefined;
}

export function createSemanticTransformationLeaf(
  transformation: SemanticTransformationRef
): SemanticTransformationLeafNode {
  const clonedTransformation = createSemanticTransformationRef(transformation);

  return {
    kind: "leaf",
    id: clonedTransformation.id,
    transformation: clonedTransformation,
    sourceObjectIds: [...clonedTransformation.sourceObjectIds],
    targetObjectIds: [...clonedTransformation.targetObjectIds],
    preserves: [...clonedTransformation.preserves]
  };
}

export function createSemanticTransformationSequence(
  input: CreateSemanticTransformationGroupInput
): SemanticTransformationGroupNode {
  validateChildren(input);
  const firstChild = input.children[0]!;
  const lastChild = input.children[input.children.length - 1]!;

  return createSemanticTransformationGroup({
    input,
    kind: "sequence",
    sourceObjectIds: firstChild.sourceObjectIds,
    targetObjectIds: lastChild.targetObjectIds
  });
}

export function createSemanticTransformationParallel(
  input: CreateSemanticTransformationGroupInput
): SemanticTransformationGroupNode {
  validateChildren(input);

  return createSemanticTransformationGroup({
    input,
    kind: "parallel",
    sourceObjectIds: uniqueStrings(
      input.children.flatMap((child) => child.sourceObjectIds)
    ),
    targetObjectIds: uniqueStrings(
      input.children.flatMap((child) => child.targetObjectIds)
    )
  });
}

export function createEditableSemanticTransformationTree(
  input: CreateEditableSemanticTransformationTreeInput
): EditableSemanticTransformationTree {
  const root = cloneSemanticTransformationNode(input.root);
  const nodeIds = new Set(semanticTransformationTreeNodeIds(root));
  const seenAnnotationIds = new Set<string>();
  const annotations = (input.annotations ?? []).map((annotation) =>
    cloneValidatedTreeAnnotation(annotation, nodeIds, seenAnnotationIds)
  );

  return {
    root,
    annotations
  };
}

export function addSemanticTransformationTreeAnnotation(
  tree: EditableSemanticTransformationTree,
  annotation: SemanticTransformationTreeAnnotation
): EditableSemanticTransformationTree {
  return createEditableSemanticTransformationTree({
    root: tree.root,
    annotations: [...tree.annotations, annotation]
  });
}

export function semanticTransformationTreeAnnotationsForNode(
  tree: EditableSemanticTransformationTree,
  nodeId: string
): readonly SemanticTransformationTreeAnnotation[] {
  return tree.annotations
    .filter((annotation) => annotation.targetNodeId === nodeId)
    .map((annotation) => cloneTreeAnnotation(annotation));
}

export function semanticTransformationTreeNodeIds(
  node: SemanticTransformationNode
): readonly string[] {
  switch (node.kind) {
    case "leaf":
      return [node.id];
    case "sequence":
    case "parallel":
      return [node.id, ...node.children.flatMap(semanticTransformationTreeNodeIds)];
  }
}

export function semanticTransformationLeafRefs(
  node: SemanticTransformationNode
): readonly SemanticTransformationRef[] {
  switch (node.kind) {
    case "leaf":
      return [createSemanticTransformationRef(node.transformation)];
    case "sequence":
    case "parallel":
      return node.children.flatMap(semanticTransformationLeafRefs);
  }
}

export function semanticTransformationForwardPhases(
  node: SemanticTransformationNode
): readonly (readonly string[])[] {
  switch (node.kind) {
    case "leaf":
      return [[node.transformation.id]];
    case "sequence":
      return node.children.flatMap(semanticTransformationForwardPhases);
    case "parallel":
      return [
        semanticTransformationLeafRefs(node).map((ref) => ref.id)
      ];
  }
}

export function semanticTransformationRewindPhases(
  node: SemanticTransformationNode
): readonly (readonly string[])[] {
  switch (node.kind) {
    case "leaf":
      return [[node.transformation.id]];
    case "sequence":
      return [...node.children]
        .reverse()
        .flatMap(semanticTransformationRewindPhases);
    case "parallel":
      return [
        semanticTransformationLeafRefs(node).map((ref) => ref.id)
      ];
  }
}

export function semanticTransformationAnnotationIdsForPhase(input: {
  readonly root: SemanticTransformationNode;
  readonly phaseNodeIds: readonly string[];
  readonly direction: "forward" | "rewind";
  readonly annotations: readonly SemanticTransformationTreeAnnotation[];
}): {
  readonly before: readonly string[];
  readonly during: readonly string[];
  readonly after: readonly string[];
} {
  const phaseNodeIds = new Set(input.phaseNodeIds);
  const idsByPlacement: {
    before: string[];
    during: string[];
    after: string[];
  } = { before: [], during: [], after: [] };

  for (const annotation of input.annotations) {
    const target = findSemanticTransformationNode(
      input.root,
      annotation.targetNodeId
    );
    if (target === undefined) {
      continue;
    }
    const playbackLeafIds = semanticTransformationLeafRefs(target)
      .map(({ id }) => id);
    if (input.direction === "rewind") {
      playbackLeafIds.reverse();
    }
    const placement = input.direction === "forward"
      ? annotation.placement
      : mirrorSemanticTransformationAnnotationPlacement(annotation.placement);
    // Group annotations belong to a playback boundary, not to an invisible
    // group node. Projecting them onto descendant leaves keeps pauses and
    // authored markers alive after a tree is compiled into executable phases.
    const applies = placement === "during"
      ? playbackLeafIds.some((id) => phaseNodeIds.has(id))
      : phaseNodeIds.has(
        placement === "before"
          ? playbackLeafIds[0]!
          : playbackLeafIds[playbackLeafIds.length - 1]!
      );
    if (applies) {
      idsByPlacement[placement].push(annotation.id);
    }
  }

  return idsByPlacement;
}

function createSemanticTransformationGroup(input: {
  readonly input: CreateSemanticTransformationGroupInput;
  readonly kind: SemanticTransformationGroupNode["kind"];
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
}): SemanticTransformationGroupNode {
  return {
    kind: input.kind,
    id: input.input.id,
    label: input.input.label,
    children: [...input.input.children],
    sourceObjectIds: [...input.sourceObjectIds],
    targetObjectIds: [...input.targetObjectIds],
    preserves: commonPreservations(input.input.children),
    ...(input.input.summary === undefined ? {} : { summary: input.input.summary })
  };
}

function findSemanticTransformationNode(
  node: SemanticTransformationNode,
  nodeId: string
): SemanticTransformationNode | undefined {
  if (node.id === nodeId) {
    return node;
  }
  if (node.kind === "leaf") {
    return undefined;
  }
  for (const child of node.children) {
    const match = findSemanticTransformationNode(child, nodeId);
    if (match !== undefined) {
      return match;
    }
  }
  return undefined;
}

function mirrorSemanticTransformationAnnotationPlacement(
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

function cloneSemanticTransformationNode(
  node: SemanticTransformationNode
): SemanticTransformationNode {
  switch (node.kind) {
    case "leaf":
      return createSemanticTransformationLeaf(node.transformation);
    case "sequence":
    case "parallel":
      return {
        kind: node.kind,
        id: node.id,
        label: node.label,
        children: node.children.map(cloneSemanticTransformationNode),
        sourceObjectIds: [...node.sourceObjectIds],
        targetObjectIds: [...node.targetObjectIds],
        preserves: [...node.preserves],
        ...(node.summary === undefined ? {} : { summary: node.summary })
      };
  }
}

function cloneValidatedTreeAnnotation(
  annotation: SemanticTransformationTreeAnnotation,
  nodeIds: ReadonlySet<string>,
  seenAnnotationIds: Set<string>
): SemanticTransformationTreeAnnotation {
  validateTreeAnnotation(annotation, nodeIds, seenAnnotationIds);

  return cloneTreeAnnotation(annotation);
}

function cloneTreeAnnotation(
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

function validateTreeAnnotation(
  annotation: SemanticTransformationTreeAnnotation,
  nodeIds: ReadonlySet<string>,
  seenAnnotationIds: Set<string>
): void {
  if (seenAnnotationIds.has(annotation.id)) {
    throw new Error(
      `Semantic transformation tree annotation ${annotation.id} is duplicated.`
    );
  }

  seenAnnotationIds.add(annotation.id);

  if (!nodeIds.has(annotation.targetNodeId)) {
    throw new Error(
      `Semantic transformation tree annotation ${annotation.id} targets unknown transform node ${annotation.targetNodeId}.`
    );
  }

  if (
    annotation.durationBeats !== undefined &&
    (!Number.isFinite(annotation.durationBeats) || annotation.durationBeats < 0)
  ) {
    throw new Error(
      `Semantic transformation tree annotation ${annotation.id} must use a non-negative duration.`
    );
  }
}

function validateChildren(input: CreateSemanticTransformationGroupInput): void {
  if (input.children.length === 0) {
    throw new Error(
      `Semantic transformation group ${input.id} must contain at least one child.`
    );
  }
}

function commonPreservations(
  children: readonly SemanticTransformationNode[]
): readonly SemanticTransformationPreservation[] {
  const [firstChild, ...rest] = children;

  if (firstChild === undefined) {
    return [];
  }

  return firstChild.preserves.filter((preservation) =>
    rest.every((child) => child.preserves.includes(preservation))
  );
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}
