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
