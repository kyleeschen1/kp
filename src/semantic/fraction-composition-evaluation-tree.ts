import { createSemanticTransformationRef } from "./animation.ts";
import {
  createKpLawfulFractionSolveMacro,
  type KpVerifiedFractionSolveTrace
} from "./fraction-solve-macro.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence,
  type SemanticTransformationNode
} from "./transformation-composition.ts";

export interface KpFractionCompositionEvaluationTree {
  readonly schemaVersion: "kp.fraction-composition-evaluation-tree.v1";
  readonly root: SemanticTransformationNode;
  readonly annotations: readonly {
    readonly id: string;
    readonly kind: "pause";
    readonly targetNodeId: string;
    readonly placement: "after";
    readonly summary: string;
  }[];
  readonly traceProof: KpVerifiedFractionSolveTrace;
}

export const KP_FRACTION_COMPOSITION_FOLDABLE_NODE_IDS = Object.freeze([
  "evaluation.fraction-composition.expand-fractions",
  "evaluation.fraction-composition.evaluate-constants",
  "evaluation.fraction-composition.subtract-and-simplify",
  "evaluation.fraction-composition.multiply-and-simplify",
  "evaluation.fraction-composition.divide-and-solve"
] as const);

const groupSpecs = Object.freeze([
  {
    id: KP_FRACTION_COMPOSITION_FOLDABLE_NODE_IDS[0],
    label: "Distribute and normalize the fractions",
    stepIndexes: [0, 1]
  },
  {
    id: KP_FRACTION_COMPOSITION_FOLDABLE_NODE_IDS[1],
    label: "Evaluate the constant fraction",
    stepIndexes: [2, 3]
  },
  {
    id: KP_FRACTION_COMPOSITION_FOLDABLE_NODE_IDS[2],
    label: "Subtract four and simplify",
    stepIndexes: [4, 5, 6]
  },
  {
    id: KP_FRACTION_COMPOSITION_FOLDABLE_NODE_IDS[3],
    label: "Multiply by three and simplify",
    stepIndexes: [7, 8, 9]
  },
  {
    id: KP_FRACTION_COMPOSITION_FOLDABLE_NODE_IDS[4],
    label: "Divide by two and solve",
    stepIndexes: [10, 11, 12]
  }
] as const);

export function createKpFractionCompositionEvaluationTree():
KpFractionCompositionEvaluationTree {
  const macro = createKpLawfulFractionSolveMacro();
  const groups = groupSpecs.map((group) =>
    createSemanticTransformationSequence({
      id: group.id,
      label: group.label,
      children: group.stepIndexes.map((index) => {
        const step = macro.steps[index]!;
        return createSemanticTransformationLeaf(
          createSemanticTransformationRef({
            id: step.id,
            kind: step.transformType,
            sourceObjectIds: [step.sourceStateId],
            targetObjectIds: [step.targetStateId],
            preserves: ["value"],
            summary: `Apply ${step.transformType}.`
          })
        );
      }),
      summary: `${group.stepIndexes.length} certified operations over the same solve trace.`
    })
  );
  const root = createSemanticTransformationSequence({
    id: "evaluation.fraction-composition.root",
    label: "Solve two thirds times x plus six equals ten",
    children: groups,
    summary:
      "One immutable exact-solution trace owns every expanded and folded projection."
  });
  const tree = createEditableSemanticTransformationTree({
    root,
    annotations: [
      {
        id: "annotation.fraction-composition.inspect-normalized-fractions",
        kind: "pause",
        targetNodeId: KP_FRACTION_COMPOSITION_FOLDABLE_NODE_IDS[0],
        placement: "after",
        summary: "Inspect both terms after the fraction has distributed."
      },
      {
        id: "annotation.fraction-composition.inspect-isolated-fraction",
        kind: "pause",
        targetNodeId: KP_FRACTION_COMPOSITION_FOLDABLE_NODE_IDS[2],
        placement: "after",
        summary: "Inspect the isolated variable fraction before clearing its denominator."
      }
    ]
  });

  return Object.freeze({
    schemaVersion: "kp.fraction-composition-evaluation-tree.v1" as const,
    root: freezeNode(tree.root),
    annotations: Object.freeze(tree.annotations.map((annotation) => Object.freeze({
      id: annotation.id,
      kind: "pause" as const,
      targetNodeId: annotation.targetNodeId,
      placement: "after" as const,
      summary: annotation.summary ?? ""
    }))),
    // Folding is a view over this proof; it never fabricates replacement states.
    traceProof: macro.verification
  });
}

function freezeNode(node: SemanticTransformationNode): SemanticTransformationNode {
  if (node.kind === "leaf") {
    return Object.freeze({
      ...node,
      transformation: Object.freeze({
        ...node.transformation,
        sourceObjectIds: Object.freeze([...node.transformation.sourceObjectIds]),
        targetObjectIds: Object.freeze([...node.transformation.targetObjectIds]),
        preserves: Object.freeze([...node.transformation.preserves])
      }),
      sourceObjectIds: Object.freeze([...node.sourceObjectIds]),
      targetObjectIds: Object.freeze([...node.targetObjectIds]),
      preserves: Object.freeze([...node.preserves])
    });
  }
  return Object.freeze({
    ...node,
    children: Object.freeze(node.children.map(freezeNode)),
    sourceObjectIds: Object.freeze([...node.sourceObjectIds]),
    targetObjectIds: Object.freeze([...node.targetObjectIds]),
    preserves: Object.freeze([...node.preserves])
  });
}
