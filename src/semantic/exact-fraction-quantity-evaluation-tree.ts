import { createSemanticTransformationRef } from "./animation.ts";
import {
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence,
  semanticTransformationLeafRefs,
  semanticTransformationTreeNodeIds,
  type SemanticTransformationNode
} from "./transformation-composition.ts";
import {
  createKpExactFractionQuantityTrace,
  type KpExactFractionQuantityTrace
} from "./exact-fraction-quantity-trace.ts";

export const KP_EXACT_FRACTION_FOLDABLE_NODE_IDS = Object.freeze([
  "evaluation.exact-fraction.common-sixths",
  "evaluation.exact-fraction.compose-half"
] as const);

export type KpExactFractionQuantityFoldMode =
  | "expanded"
  | "collapsed"
  | "automatic"
  | "pinned";

export interface KpExactFractionQuantityEvaluationTree {
  readonly schemaVersion: "kp.exact-fraction-quantity-evaluation-tree.v1";
  readonly root: SemanticTransformationNode;
  readonly trace: KpExactFractionQuantityTrace;
  readonly foldableNodeIds: typeof KP_EXACT_FRACTION_FOLDABLE_NODE_IDS;
}

export interface KpExactFractionQuantityFoldIntent {
  readonly schemaVersion: "kp.exact-fraction-quantity-fold-intent.v1";
  readonly treeId: "evaluation.exact-fraction.root";
  readonly mode: KpExactFractionQuantityFoldMode;
  readonly foldableNodeIds: typeof KP_EXACT_FRACTION_FOLDABLE_NODE_IDS;
  readonly pinnedNodeIds: readonly string[];
}

export interface KpExactFractionQuantityFoldProjection {
  readonly schemaVersion: "kp.exact-fraction-quantity-fold-projection.v1";
  readonly mode: KpExactFractionQuantityFoldMode;
  readonly treeId: "evaluation.exact-fraction.root";
  readonly expandedNodeIds: readonly string[];
  readonly collapsedNodeIds: readonly string[];
  readonly visibleNodeIds: readonly string[];
  readonly beatIds: readonly string[];
  readonly disclosures: readonly {
    readonly nodeId: string;
    readonly label: string;
    readonly hiddenBeatIds: readonly string[];
  }[];
  readonly semanticTruth: {
    readonly traceId: string;
    readonly unitId: string;
    readonly stateIds: readonly string[];
    readonly checkpointIds: readonly string[];
    readonly beatIds: readonly string[];
    readonly finalEqualityVerified: true;
  };
}

export function createKpExactFractionQuantityEvaluationTree():
KpExactFractionQuantityEvaluationTree {
  const trace = createKpExactFractionQuantityTrace();
  const leaves = trace.beats.map((beat) =>
    createSemanticTransformationLeaf(
      createSemanticTransformationRef({
        id: beat.id,
        kind: beat.operation,
        sourceObjectIds: beat.fromStateId === undefined
          ? [trace.unitId]
          : [beat.fromStateId],
        targetObjectIds: [beat.toStateId],
        preserves: ["identity", "value"],
        summary: `Apply ${beat.operation}.`
      })
    )
  );
  const commonSixths = createSemanticTransformationSequence({
    id: KP_EXACT_FRACTION_FOLDABLE_NODE_IDS[0],
    label: "Refine and align the sixths",
    children: [leaves[1]!, leaves[2]!],
    summary: "One third becomes two sixths, then both addends share a denominator."
  });
  const composeHalf = createSemanticTransformationSequence({
    id: KP_EXACT_FRACTION_FOLDABLE_NODE_IDS[1],
    label: "Compose and recognize the half",
    children: [leaves[3]!, leaves[4]!],
    summary: "Three selected sixths merge and regroup as the same selected half."
  });
  const root = createSemanticTransformationSequence({
    id: "evaluation.exact-fraction.root",
    label: "Add one third and one sixth",
    children: [leaves[0]!, commonSixths, composeHalf],
    summary:
      "Folding changes disclosure only; all five verified beats remain in the trace."
  });
  return Object.freeze({
    schemaVersion: "kp.exact-fraction-quantity-evaluation-tree.v1",
    root: freezeNode(root),
    trace,
    foldableNodeIds: KP_EXACT_FRACTION_FOLDABLE_NODE_IDS
  });
}

export function createKpExactFractionQuantityFoldIntent(input: {
  readonly mode: KpExactFractionQuantityFoldMode;
  readonly pinnedNodeIds?: readonly string[] | undefined;
}): KpExactFractionQuantityFoldIntent {
  const tree = createKpExactFractionQuantityEvaluationTree();
  const knownNodeIds = new Set(
    semanticTransformationTreeNodeIds(tree.root)
  );
  const pins = [...(input.pinnedNodeIds ?? [])];
  if (new Set(pins).size !== pins.length) {
    throw new Error("Exact fraction fold intent repeats a pinned node.");
  }
  for (const nodeId of pins) {
    if (!knownNodeIds.has(nodeId)) {
      throw new Error(`Exact fraction fold intent pins unknown node ${nodeId}.`);
    }
    if (
      !(KP_EXACT_FRACTION_FOLDABLE_NODE_IDS as readonly string[])
        .includes(nodeId)
    ) {
      throw new Error(
        `Exact fraction fold intent cannot pin leaf ${nodeId}.`
      );
    }
  }
  if (input.mode === "pinned" && pins.length === 0) {
    throw new Error("Pinned exact fraction fold intent requires a group.");
  }
  if (input.mode !== "pinned" && pins.length > 0) {
    throw new Error(
      `${input.mode} exact fraction fold intent cannot carry pins.`
    );
  }
  return Object.freeze({
    schemaVersion: "kp.exact-fraction-quantity-fold-intent.v1",
    treeId: "evaluation.exact-fraction.root",
    mode: input.mode,
    foldableNodeIds: KP_EXACT_FRACTION_FOLDABLE_NODE_IDS,
    pinnedNodeIds: Object.freeze(pins)
  });
}

export function compileKpExactFractionQuantityFoldProjection(input: {
  readonly intent: KpExactFractionQuantityFoldIntent;
  readonly detailBudget?: "compact" | "balanced" | "roomy" | undefined;
}): KpExactFractionQuantityFoldProjection {
  const { intent } = input;
  const expandedNodeIds = intent.mode === "expanded"
    ? [...intent.foldableNodeIds]
    : intent.mode === "collapsed"
      ? []
      : intent.mode === "pinned"
        ? [...intent.pinnedNodeIds]
        : input.detailBudget === "roomy"
          ? [...intent.foldableNodeIds]
          : input.detailBudget === "balanced"
            ? [intent.foldableNodeIds[0]]
            : [];
  const expanded = new Set(expandedNodeIds);
  const collapsedNodeIds = intent.foldableNodeIds.filter(
    (nodeId) => !expanded.has(nodeId)
  );
  assertFoldPartition(
    intent.foldableNodeIds,
    expandedNodeIds,
    collapsedNodeIds
  );

  const tree = createKpExactFractionQuantityEvaluationTree();
  if (tree.root.kind !== "sequence") {
    throw new Error("Exact fraction evaluation root must remain a sequence.");
  }
  const childById = new Map(
    tree.root.children.map((child) => [child.id, child])
  );
  const collapsed = new Set<string>(collapsedNodeIds);
  const visibleNodeIds = tree.root.children.flatMap((node) =>
    node.kind === "leaf" || collapsed.has(node.id)
      ? [node.id]
      : [node.id, ...node.children.map(({ id }) => id)]
  );
  const beatIds = semanticTransformationLeafRefs(tree.root).map(
    ({ id }) => id
  );
  const disclosures = collapsedNodeIds.map((nodeId) => {
    const node = childById.get(nodeId);
    if (node === undefined || node.kind === "leaf") {
      throw new Error(`Exact fraction fold cannot disclose ${nodeId}.`);
    }
    return Object.freeze({
      nodeId,
      label: node.label,
      hiddenBeatIds: Object.freeze(
        semanticTransformationLeafRefs(node).map(({ id }) => id)
      )
    });
  });
  return Object.freeze({
    schemaVersion: "kp.exact-fraction-quantity-fold-projection.v1",
    mode: intent.mode,
    treeId: intent.treeId,
    expandedNodeIds: Object.freeze(expandedNodeIds),
    collapsedNodeIds: Object.freeze(collapsedNodeIds),
    visibleNodeIds: Object.freeze(visibleNodeIds),
    beatIds: Object.freeze(beatIds),
    disclosures: Object.freeze(disclosures),
    semanticTruth: Object.freeze({
      traceId: tree.trace.id,
      unitId: tree.trace.unitId,
      stateIds: Object.freeze(tree.trace.states.map(({ id }) => id)),
      checkpointIds: Object.freeze(
        tree.trace.states.map(({ checkpointId }) => checkpointId)
      ),
      beatIds: Object.freeze(tree.trace.beats.map(({ id }) => id)),
      finalEqualityVerified:
        tree.trace.verification.finalEqualityVerified
    })
  });
}

function assertFoldPartition(
  foldableNodeIds: readonly string[],
  expandedNodeIds: readonly string[],
  collapsedNodeIds: readonly string[]
): void {
  const known = new Set(foldableNodeIds);
  const combined = [...expandedNodeIds, ...collapsedNodeIds];
  if (
    combined.length !== foldableNodeIds.length ||
    new Set(combined).size !== combined.length ||
    combined.some((nodeId) => !known.has(nodeId))
  ) {
    throw new Error(
      "Exact fraction fold must partition every foldable group exactly once."
    );
  }
}

function freezeNode(node: SemanticTransformationNode):
SemanticTransformationNode {
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
