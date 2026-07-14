import {
  describeKpAnimationAssetTransformationTree,
  validateKpAnimationAsset,
  type KpAnimationAsset,
  type KpAnimationAssetValidationIssue
} from "./asset.ts";
import type {
  KpLawCheckLevel
} from "../semantic/asset-transformation.ts";
import type {
  KpLawCheckResult,
  KpLawFailure
} from "../semantic/asset-laws.ts";

export interface KpAnimationRepresentationTransform {
  readonly id: string;
  readonly title: string;
  readonly sourceRepresentation: string;
  readonly targetRepresentation: string;
  readonly preservation: KpLawCheckLevel;
  apply(animation: KpAnimationAsset): KpAnimationAsset;
}

export interface CreateKpAnimationRepresentationTransformInput {
  readonly id: string;
  readonly title: string;
  readonly sourceRepresentation: string;
  readonly targetRepresentation: string;
  readonly preservation: KpLawCheckLevel;
  readonly apply: (animation: KpAnimationAsset) => KpAnimationAsset;
}

export interface KpAnimationRepresentationTransformResult {
  readonly transformId: string;
  readonly sourceRepresentation: string;
  readonly targetRepresentation: string;
  readonly sourceAnimationId: string;
  readonly targetAnimation: KpAnimationAsset;
  readonly diagnostics: readonly KpAnimationAssetValidationIssue[];
}

export function createKpAnimationRepresentationTransform(
  input: CreateKpAnimationRepresentationTransformInput
): KpAnimationRepresentationTransform {
  assertNonEmpty(input.id, "Representation transform id");
  assertNonEmpty(input.title, `Representation transform ${input.id} title`);
  assertNonEmpty(
    input.sourceRepresentation,
    `Representation transform ${input.id} sourceRepresentation`
  );
  assertNonEmpty(
    input.targetRepresentation,
    `Representation transform ${input.id} targetRepresentation`
  );

  return {
    id: input.id,
    title: input.title,
    sourceRepresentation: input.sourceRepresentation,
    targetRepresentation: input.targetRepresentation,
    preservation: input.preservation,
    apply: input.apply
  };
}

export function applyKpAnimationRepresentationTransform(
  transform: KpAnimationRepresentationTransform,
  animation: KpAnimationAsset
): KpAnimationRepresentationTransformResult {
  const targetAnimation = transform.apply(animation);

  return {
    transformId: transform.id,
    sourceRepresentation: transform.sourceRepresentation,
    targetRepresentation: transform.targetRepresentation,
    sourceAnimationId: animation.id,
    targetAnimation,
    diagnostics: validateKpAnimationAsset(targetAnimation).map((issue) => ({
      ...issue
    }))
  };
}

export function checkKpAnimationRepresentationTransformLaw(
  transform: KpAnimationRepresentationTransform,
  animation: KpAnimationAsset
): KpLawCheckResult {
  const target = transform.apply(animation);
  const failures: KpLawFailure[] = [];

  if (!stringListsEqual(objectIds(animation), objectIds(target))) {
    failures.push({
      path: "target.bundle.objects",
      message:
        `Representation transform ${transform.id} must preserve semantic object ids.`
    });
  }

  if (!stringListsEqual(transformationIds(animation), transformationIds(target))) {
    failures.push({
      path: "target.transformations",
      message:
        `Representation transform ${transform.id} must preserve transformation ids.`
    });
  }

  if (!phaseListsEqual(forwardPhaseNodeIds(animation), forwardPhaseNodeIds(target))) {
    failures.push({
      path: "target.transformationTree.forwardPhases",
      message:
        `Representation transform ${transform.id} must preserve forward phase order.`
    });
  }

  return {
    lawId: "animation-representation.preservation",
    passed: failures.length === 0,
    failures
  };
}

function objectIds(animation: KpAnimationAsset): readonly string[] {
  return animation.bundle.objects.map((object) => object.id);
}

function transformationIds(animation: KpAnimationAsset): readonly string[] {
  return animation.transformations.map((transformation) => transformation.id);
}

function forwardPhaseNodeIds(
  animation: KpAnimationAsset
): readonly (readonly string[])[] {
  return describeKpAnimationAssetTransformationTree(animation)
    .forwardPhases.map((phase) => phase.nodeIds);
}

function stringListsEqual(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

function phaseListsEqual(
  left: readonly (readonly string[])[],
  right: readonly (readonly string[])[]
): boolean {
  return left.length === right.length &&
    left.every((phase, index) => stringListsEqual(phase, right[index] ?? []));
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}

