import {
  canSequenceKpSemanticTransformations,
  type KpSemanticTransformation,
  type KpTransformationPreservation
} from "./asset-transformation.ts";

export type KpSemanticDiagram =
  | KpTransformationDiagramLeaf
  | KpSemanticDiagramSequence
  | KpSemanticDiagramParallel
  | KpSemanticDiagramTree;

export interface KpSemanticDiagramBase {
  readonly id: string;
  readonly title: string;
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
  readonly preserves: readonly KpTransformationPreservation[];
}

export interface KpTransformationDiagramLeaf extends KpSemanticDiagramBase {
  readonly kind: "transformation";
  readonly transformation: KpSemanticTransformation;
}

export interface KpSemanticDiagramSequence extends KpSemanticDiagramBase {
  readonly kind: "sequence";
  readonly children: readonly KpSemanticDiagram[];
}

export interface KpSemanticDiagramParallel extends KpSemanticDiagramBase {
  readonly kind: "parallel";
  readonly children: readonly KpSemanticDiagram[];
}

export interface KpSemanticDiagramTree extends KpSemanticDiagramBase {
  readonly kind: "tree";
  readonly parentTransformation: KpSemanticTransformation;
  readonly child: KpSemanticDiagram;
}

export interface CreateKpSemanticDiagramGroupInput {
  readonly id: string;
  readonly title: string;
  readonly children: readonly KpSemanticDiagram[];
}

export interface CreateKpSemanticDiagramTreeInput {
  readonly id: string;
  readonly title: string;
  readonly parent: KpSemanticTransformation;
  readonly child: KpSemanticDiagram;
}

export function createKpTransformationDiagramLeaf(
  transformation: KpSemanticTransformation
): KpTransformationDiagramLeaf {
  return {
    id: transformation.id,
    kind: "transformation",
    title: transformation.title,
    transformation,
    sourceObjectIds: [...transformation.sourceObjectIds],
    targetObjectIds: [...transformation.targetObjectIds],
    preserves: [...transformation.preserves]
  };
}

export function createKpSemanticDiagramSequence(
  input: CreateKpSemanticDiagramGroupInput
): KpSemanticDiagramSequence {
  assertNonEmpty(input.id, "Semantic diagram sequence id");
  assertNonEmpty(input.title, `Semantic diagram ${input.id} title`);
  assertChildren(input);

  input.children.slice(0, -1).forEach((child, index) => {
    const nextChild = input.children[index + 1];

    if (nextChild === undefined) {
      throw new Error(`Semantic diagram ${input.id} has an invalid child boundary.`);
    }

    if (!canSequenceDiagramNodes(child, nextChild)) {
      throw new Error(
        `Semantic diagram ${input.id} cannot sequence child ${index} into child ${index + 1}.`
      );
    }
  });

  return {
    id: input.id,
    kind: "sequence",
    title: input.title,
    children: [...input.children],
    sourceObjectIds: [...firstChild(input).sourceObjectIds],
    targetObjectIds: [...lastChild(input).targetObjectIds],
    preserves: sharedPreservation(input.children)
  };
}

export function createKpSemanticDiagramParallel(
  input: CreateKpSemanticDiagramGroupInput
): KpSemanticDiagramParallel {
  assertNonEmpty(input.id, "Semantic diagram parallel id");
  assertNonEmpty(input.title, `Semantic diagram ${input.id} title`);
  assertChildren(input);

  return {
    id: input.id,
    kind: "parallel",
    title: input.title,
    children: [...input.children],
    sourceObjectIds: uniqueOrdered(
      input.children.flatMap((child) => child.sourceObjectIds)
    ),
    targetObjectIds: uniqueOrdered(
      input.children.flatMap((child) => child.targetObjectIds)
    ),
    preserves: sharedPreservation(input.children)
  };
}

export function createKpSemanticDiagramTree(
  input: CreateKpSemanticDiagramTreeInput
): KpSemanticDiagramTree {
  assertNonEmpty(input.id, "Semantic diagram tree id");
  assertNonEmpty(input.title, `Semantic diagram ${input.id} title`);

  if (!stringArraysEqual(input.parent.sourceObjectIds, input.child.sourceObjectIds)) {
    throw new Error(
      `Semantic diagram ${input.id} child source boundary must match parent transformation source.`
    );
  }

  if (!stringArraysEqual(input.parent.targetObjectIds, input.child.targetObjectIds)) {
    throw new Error(
      `Semantic diagram ${input.id} child target boundary must match parent transformation target.`
    );
  }

  return {
    id: input.id,
    kind: "tree",
    title: input.title,
    parentTransformation: input.parent,
    child: input.child,
    sourceObjectIds: [...input.parent.sourceObjectIds],
    targetObjectIds: [...input.parent.targetObjectIds],
    preserves: [...input.parent.preserves]
  };
}

export function kpSemanticDiagramLeafTransformationIds(
  diagram: KpSemanticDiagram
): readonly string[] {
  switch (diagram.kind) {
    case "transformation":
      return [diagram.transformation.id];
    case "sequence":
    case "parallel":
      return diagram.children.flatMap(kpSemanticDiagramLeafTransformationIds);
    case "tree":
      return kpSemanticDiagramLeafTransformationIds(diagram.child);
  }
}

export function kpSemanticDiagramForwardPhases(
  diagram: KpSemanticDiagram
): readonly (readonly string[])[] {
  switch (diagram.kind) {
    case "transformation":
      return [[diagram.transformation.id]];
    case "sequence":
      return diagram.children.flatMap(kpSemanticDiagramForwardPhases);
    case "parallel":
      return [diagram.children.flatMap(kpSemanticDiagramLeafTransformationIds)];
    case "tree":
      return kpSemanticDiagramForwardPhases(diagram.child);
  }
}

export function kpSemanticDiagramRewindPhases(
  diagram: KpSemanticDiagram
): readonly (readonly string[])[] {
  switch (diagram.kind) {
    case "transformation":
      return [[diagram.transformation.id]];
    case "sequence":
      return [...diagram.children]
        .reverse()
        .flatMap(kpSemanticDiagramRewindPhases);
    case "parallel":
      return [diagram.children.flatMap(kpSemanticDiagramLeafTransformationIds)];
    case "tree":
      return kpSemanticDiagramRewindPhases(diagram.child);
  }
}

function canSequenceDiagramNodes(
  left: KpSemanticDiagram,
  right: KpSemanticDiagram
): boolean {
  return (
    stringArraysEqual(left.targetObjectIds, right.sourceObjectIds) ||
    (left.kind === "transformation" &&
      right.kind === "transformation" &&
      canSequenceKpSemanticTransformations(left.transformation, right.transformation))
  );
}

function sharedPreservation(
  children: readonly KpSemanticDiagram[]
): readonly KpTransformationPreservation[] {
  const first = children[0];

  if (first === undefined) {
    return [];
  }

  return first.preserves.filter((preservation) =>
    children.slice(1).every((child) => child.preserves.includes(preservation))
  );
}

function assertChildren(input: CreateKpSemanticDiagramGroupInput): void {
  if (input.children.length === 0) {
    throw new Error(`Semantic diagram ${input.id} must contain at least one child.`);
  }
}

function firstChild(
  input: CreateKpSemanticDiagramGroupInput
): KpSemanticDiagram {
  const child = input.children[0];

  if (child === undefined) {
    throw new Error(`Semantic diagram ${input.id} must contain at least one child.`);
  }

  return child;
}

function lastChild(
  input: CreateKpSemanticDiagramGroupInput
): KpSemanticDiagram {
  const child = input.children[input.children.length - 1];

  if (child === undefined) {
    throw new Error(`Semantic diagram ${input.id} must contain at least one child.`);
  }

  return child;
}

function uniqueOrdered(values: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (!seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }

  return result;
}

function stringArraysEqual(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
