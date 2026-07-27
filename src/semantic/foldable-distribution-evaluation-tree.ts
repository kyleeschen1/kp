import {
  createSemanticTransformationRef
} from "./animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationParallel,
  createSemanticTransformationSequence,
  type EditableSemanticTransformationTree,
  type SemanticTransformationNode
} from "./transformation-composition.ts";
import {
  createKpFoldableDistributionFanOutCertificates,
  createKpFoldableFinalCollectionCertificate,
  createKpFoldableProductEvaluationCertificates,
  createKpFoldableSignedTermGroupingCertificate
} from "./foldable-distribution-operation-certificates.ts";

export function createKpFoldableDistributionEvaluationTree():
  EditableSemanticTransformationTree {
  const fanOut = createKpFoldableDistributionFanOutCertificates();
  const products = createKpFoldableProductEvaluationCertificates();
  const grouping = createKpFoldableSignedTermGroupingCertificate();
  const collection = createKpFoldableFinalCollectionCertificate();
  const distributionNode = createSemanticTransformationParallel({
    id: "evaluation.foldable-distribution.distribute",
    label: "Distribute both factors",
    children: fanOut.map(({ execution }) =>
      scopedLeaf({
        id: execution.transformationId,
        kind: "distributeMultiplication",
        sourceObjectId: "expression.foldable-distribution.factored",
        targetObjectId: "expression.foldable-distribution.distributed-raw",
        summary: "One factor fans out into its two descendant products."
      })
    )
  });
  const productNode = createSemanticTransformationParallel({
    id: "evaluation.foldable-distribution.evaluate-products",
    label: "Evaluate constant products",
    children: products.map(({ transformation }) =>
      scopedLeaf({
        id: transformation.id,
        kind: transformation.transformType,
        sourceObjectId: "expression.foldable-distribution.distributed-raw",
        targetObjectId: "expression.foldable-distribution.distributed",
        summary: transformation.title
      })
    )
  });
  const groupingNode = scopedLeaf({
    id: grouping.transformation.id,
    kind: grouping.transformation.transformType,
    sourceObjectId: "expression.foldable-distribution.distributed",
    targetObjectId: "expression.foldable-distribution.grouped",
    summary: grouping.transformation.title
  });
  const factoringNode = scopedLeaf({
    id: collection.factoringTransformation.id,
    kind: collection.factoringTransformation.transformType,
    sourceObjectId: "expression.foldable-distribution.grouped",
    targetObjectId:
      "expression.foldable-distribution.coefficient-factored",
    summary: collection.factoringTransformation.title
  });
  const collectionNode = scopedLeaf({
    id: collection.transformation.id,
    kind: collection.transformation.transformType,
    sourceObjectId:
      "expression.foldable-distribution.coefficient-factored",
    targetObjectId: "expression.foldable-distribution.collected",
    summary: collection.transformation.title
  });
  const root = createSemanticTransformationSequence({
    id: "evaluation.foldable-distribution.root",
    label: "Distribute, gather, and collect",
    children: [
      distributionNode,
      productNode,
      groupingNode,
      factoringNode,
      collectionNode
    ],
    summary:
      "One immutable dependency tree owns expanded, collapsed, and automatic projections."
  });
  const tree = createEditableSemanticTransformationTree({
    root,
    annotations: [
      {
        id: "annotation.foldable-distribution.inspect-distribution",
        kind: "pause",
        targetNodeId: distributionNode.id,
        placement: "after",
        summary: "The learner may inspect both completed fan-outs."
      },
      {
        id: "annotation.foldable-distribution.inspect-groups",
        kind: "pause",
        targetNodeId: groupingNode.id,
        placement: "after",
        summary: "The learner may inspect the stable like-term groups."
      }
    ]
  });

  return Object.freeze({
    root: freezeNode(tree.root),
    annotations: Object.freeze(
      tree.annotations.map((annotation) => Object.freeze({
        ...annotation,
        ...(annotation.selectorIds === undefined
          ? {}
          : { selectorIds: Object.freeze([...annotation.selectorIds]) })
      }))
    )
  });
}

function scopedLeaf(input: {
  readonly id: string;
  readonly kind: string;
  readonly sourceObjectId: string;
  readonly targetObjectId: string;
  readonly summary: string;
}) {
  return createSemanticTransformationLeaf(
    createSemanticTransformationRef({
      id: input.id,
      kind: input.kind,
      sourceObjectIds: [input.sourceObjectId],
      targetObjectIds: [input.targetObjectId],
      preserves: ["value", "structure"],
      summary: input.summary
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
        sourceObjectIds: Object.freeze([
          ...node.transformation.sourceObjectIds
        ]),
        targetObjectIds: Object.freeze([
          ...node.transformation.targetObjectIds
        ]),
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
