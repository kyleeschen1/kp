import type {
  KpLawCheckResult,
  KpLawFailure
} from "../semantic/asset-laws.ts";
import {
  semanticTransformationForwardPhases,
  semanticTransformationLeafRefs,
  semanticTransformationRewindPhases,
  type SemanticTransformationNode
} from "../semantic/transformation-composition.ts";

export interface CheckKpTransformTreeCompositionEquivalenceInput {
  readonly id: string;
  readonly left: SemanticTransformationNode;
  readonly right: SemanticTransformationNode;
}

export function checkKpTransformTreeCompositionEquivalence(
  input: CheckKpTransformTreeCompositionEquivalenceInput
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];

  if (!stringListsEqual(input.left.sourceObjectIds, input.right.sourceObjectIds)) {
    failures.push({
      path: "sourceObjectIds",
      message:
        `Transform-tree composition ${input.id} must preserve source object boundary.`
    });
  }

  if (!stringListsEqual(input.left.targetObjectIds, input.right.targetObjectIds)) {
    failures.push({
      path: "targetObjectIds",
      message:
        `Transform-tree composition ${input.id} must preserve target object boundary.`
    });
  }

  if (!stringListsEqual(leafIds(input.left), leafIds(input.right))) {
    failures.push({
      path: "leafIds",
      message:
        `Transform-tree composition ${input.id} must preserve leaf transformation order.`
    });
  }

  if (
    !phaseListsEqual(
      semanticTransformationForwardPhases(input.left),
      semanticTransformationForwardPhases(input.right)
    )
  ) {
    failures.push({
      path: "forwardPhases",
      message:
        `Transform-tree composition ${input.id} must preserve forward phase structure.`
    });
  }

  if (
    !phaseListsEqual(
      semanticTransformationRewindPhases(input.left),
      semanticTransformationRewindPhases(input.right)
    )
  ) {
    failures.push({
      path: "rewindPhases",
      message:
        `Transform-tree composition ${input.id} must preserve rewind phase structure.`
    });
  }

  return {
    lawId: "transform-tree.composition-equivalence",
    passed: failures.length === 0,
    failures
  };
}

function leafIds(node: SemanticTransformationNode): readonly string[] {
  return semanticTransformationLeafRefs(node).map((ref) => ref.id);
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

