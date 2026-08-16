import {
  createSemanticTransformationRef
} from "./animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence,
  type EditableSemanticTransformationTree,
  type SemanticTransformationNode
} from "./transformation-composition.ts";
import {
  kpPlaceValueAdditionTrace,
  type KpPlaceValueAdditionBeat
} from "./place-value-addition-trace.ts";

export const KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS = Object.freeze([
  "evaluation.place-value.ones",
  "evaluation.place-value.tens",
  "evaluation.place-value.hundreds"
] as const);

export function createKpPlaceValueAdditionEvaluationTree():
EditableSemanticTransformationTree {
  const [establish, evaluateOnes, exchangeOnes, evaluateTens, exchangeTens,
    evaluateHundreds, settle] = kpPlaceValueAdditionTrace.beats;
  if (
    establish === undefined ||
    evaluateOnes === undefined ||
    exchangeOnes === undefined ||
    evaluateTens === undefined ||
    exchangeTens === undefined ||
    evaluateHundreds === undefined ||
    settle === undefined
  ) {
    throw new Error("Evaluation tree requires all seven place-value beats.");
  }

  const establishNode = traceLeaf(establish);
  const onesNode = createSemanticTransformationSequence({
    id: KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS[0],
    label: "Add the ones",
    children: [traceLeaf(evaluateOnes), traceLeaf(exchangeOnes)],
    summary: "Evaluate fourteen ones, settle four, and carry one ten."
  });
  const tensNode = createSemanticTransformationSequence({
    id: KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS[1],
    label: "Add the tens",
    children: [traceLeaf(evaluateTens), traceLeaf(exchangeTens)],
    summary: "Evaluate thirteen tens, settle three, and carry one hundred."
  });
  const hundredsNode = createSemanticTransformationSequence({
    id: KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS[2],
    label: "Add the hundreds",
    children: [traceLeaf(evaluateHundreds), traceLeaf(settle)],
    summary: "Evaluate four hundreds and settle the native result 434."
  });
  const root = createSemanticTransformationSequence({
    id: "evaluation.place-value.root",
    label: "Add 278 and 156 by place",
    children: [establishNode, onesNode, tensNode, hundredsNode],
    summary:
      "One immutable exact trace owns expanded and collapsed place-value work."
  });
  const tree = createEditableSemanticTransformationTree({
    root,
    annotations: KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS.map(
      (targetNodeId, index) => ({
        id: `annotation.place-value.inspect-${["ones", "tens", "hundreds"][index]}`,
        kind: "pause" as const,
        targetNodeId,
        placement: "after" as const,
        summary: `The learner may inspect the settled ${["ones", "tens", "hundreds"][index]} column.`
      })
    )
  });

  return Object.freeze({
    root: freezeNode(tree.root),
    annotations: Object.freeze(
      tree.annotations.map((annotation) => Object.freeze({ ...annotation }))
    )
  });
}

function traceLeaf(beat: KpPlaceValueAdditionBeat) {
  return createSemanticTransformationLeaf(
    createSemanticTransformationRef({
      id: beat.id,
      kind: beat.operation,
      sourceObjectIds: beat.fromStateId === undefined
        ? beat.contributorIds
        : [beat.fromStateId],
      targetObjectIds: [beat.toStateId],
      preserves: ["value", "role"],
      summary: `${beat.operation} from the immutable place-value trace.`
    })
  );
}

function freezeNode(
  node: SemanticTransformationNode
): SemanticTransformationNode {
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
