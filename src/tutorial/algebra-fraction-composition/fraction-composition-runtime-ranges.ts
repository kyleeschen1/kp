import {
  kpFractionCompositionArticleTransitionBindings
} from "../../article/vignettes/fraction-composition-vignette.ts";
import {
  createKpFractionCompositionEvaluationTree
} from "../../semantic/fraction-composition-evaluation-tree.ts";
import {
  semanticTransformationLeafRefs
} from "../../semantic/transformation-composition.ts";

export interface KpFractionCompositionArticleRuntimeRange {
  readonly path: string;
  readonly evaluationNodeId: string;
  readonly operationIds: readonly string[];
  readonly start: number;
  readonly end: number;
}

export function createKpFractionCompositionArticleRuntimeRanges():
readonly KpFractionCompositionArticleRuntimeRange[] {
  const tree = createKpFractionCompositionEvaluationTree();
  if (tree.root.kind !== "sequence") {
    throw new Error("Fraction composition article runtime requires a sequence root.");
  }
  const groups = new Map(tree.root.children.map((group) => [group.id, group]));
  const operationCount = semanticTransformationLeafRefs(tree.root).length;
  let operationOffset = 0;
  return Object.freeze(kpFractionCompositionArticleTransitionBindings.map(
    ({ path, evaluationNodeId }) => {
      const group = groups.get(evaluationNodeId);
      if (group === undefined) {
        throw new Error(`Unknown fraction composition range ${evaluationNodeId}.`);
      }
      const operationIds = Object.freeze(
        semanticTransformationLeafRefs(group).map(({ id }) => id)
      );
      const start = operationOffset / operationCount;
      operationOffset += operationIds.length;
      return Object.freeze({
        path,
        evaluationNodeId,
        operationIds,
        start,
        end: operationOffset / operationCount
      });
    }
  ));
}
