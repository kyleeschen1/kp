import type { KpAnimationAsset } from "./asset.ts";
import type {
  KpAnimationVisualFrame,
  KpAnimationVisualNode
} from "./visual-frame-adapter.ts";
import type {
  KpLawCheckResult,
  KpLawFailure
} from "../semantic/asset-laws.ts";

export interface CheckKpAnimationVisualFramePersistentTokenRewindLawInput {
  readonly animation: KpAnimationAsset;
  readonly forwardFrame: KpAnimationVisualFrame;
  readonly rewindFrame: KpAnimationVisualFrame;
}

export function checkKpAnimationVisualFramePersistentTokenRewindLaw(
  input: CheckKpAnimationVisualFramePersistentTokenRewindLawInput
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];
  const activeTransformationIds = intersectStrings(
    input.forwardFrame.activeTransformationIds,
    input.rewindFrame.activeTransformationIds
  );

  activeTransformationIds.forEach((transformationId) => {
    const transformation = input.animation.transformations.find(
      (candidate) => candidate.id === transformationId
    );

    if (transformation === undefined) {
      failures.push({
        path: `transformations[${transformationId}]`,
        message:
          `Visual frame references missing animation transformation ${transformationId}.`
      });
      return;
    }

    transformation.correspondence.forEach((correspondence, index) => {
      checkPersistentSelector({
        failures,
        forwardFrame: input.forwardFrame,
        rewindFrame: input.rewindFrame,
        path:
          `transformations[${transformationId}].correspondence[${index}].sourceSelectorId`,
        selectorId: correspondence.sourceSelectorId
      });
      checkPersistentSelector({
        failures,
        forwardFrame: input.forwardFrame,
        rewindFrame: input.rewindFrame,
        path:
          `transformations[${transformationId}].correspondence[${index}].targetSelectorId`,
        selectorId: correspondence.targetSelectorId
      });
    });
  });

  return {
    lawId: "animation-visual-frame.persistent-token-rewind",
    passed: failures.length === 0,
    failures
  };
}

function checkPersistentSelector(input: {
  readonly failures: KpLawFailure[];
  readonly forwardFrame: KpAnimationVisualFrame;
  readonly rewindFrame: KpAnimationVisualFrame;
  readonly path: string;
  readonly selectorId: string;
}): void {
  const forwardRefs = visualRefsForSelector(
    input.forwardFrame,
    input.selectorId
  );
  const rewindRefs = visualRefsForSelector(input.rewindFrame, input.selectorId);

  if (forwardRefs === undefined || rewindRefs === undefined) {
    input.failures.push({
      path: input.path,
      message:
        `Persistent selector ${input.selectorId} must be bound in both forward and rewind frames.`
    });
    return;
  }

  if (!stringListsEqual(forwardRefs, rewindRefs)) {
    input.failures.push({
      path: input.path,
      message:
        `Persistent selector ${input.selectorId} must bind the same visual refs in forward and rewind frames.`
    });
  }
}

function visualRefsForSelector(
  frame: KpAnimationVisualFrame,
  selectorId: string
): readonly string[] | undefined {
  const selector = frame.selectorVisuals.find(
    (candidate) => candidate.selectorId === selectorId
  );

  if (selector === undefined) {
    return undefined;
  }

  const nodes = new Map(frame.nodes.map((node) => [node.id, node]));
  const refs = selector.nodeIds
    .map((nodeId) => nodes.get(nodeId))
    .filter((node): node is KpAnimationVisualNode => node !== undefined)
    .map((node) => node.ref);

  return refs.length === selector.nodeIds.length ? refs : undefined;
}

function intersectStrings(
  left: readonly string[],
  right: readonly string[]
): readonly string[] {
  const rightSet = new Set(right);

  return left.filter((value) => rightSet.has(value));
}

function stringListsEqual(
  left: readonly string[],
  right: readonly string[]
): boolean {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}
