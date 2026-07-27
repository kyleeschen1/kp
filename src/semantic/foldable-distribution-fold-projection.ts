import {
  createKpFoldableDistributionEvaluationTree
} from "./foldable-distribution-evaluation-tree.ts";
import type {
  KpFoldableDistributionFoldIntent
} from "./foldable-distribution-fold-intent.ts";
import {
  semanticTransformationLeafRefs
} from "./transformation-composition.ts";

export interface KpFoldedWorkDisclosure {
  readonly nodeId: string;
  readonly label: string;
  readonly hiddenOperationIds: readonly string[];
  readonly summary: string;
}

export interface KpFoldableDistributionProjection {
  readonly schemaVersion: "kp.foldable-distribution-projection.v1";
  readonly mode: KpFoldableDistributionFoldIntent["mode"];
  readonly treeId: string;
  readonly expandedNodeIds: readonly string[];
  readonly collapsedNodeIds: readonly string[];
  readonly visibleNodeIds: readonly string[];
  readonly operationIds: readonly string[];
  readonly disclosures: readonly KpFoldedWorkDisclosure[];
  readonly semanticTruth: {
    readonly sourceObjectIds: readonly string[];
    readonly targetObjectIds: readonly string[];
    readonly operationIds: readonly string[];
  };
}

export function compileKpFoldableDistributionStaticProjection(
  intent: KpFoldableDistributionFoldIntent
): KpFoldableDistributionProjection {
  if (intent.mode !== "expanded" && intent.mode !== "collapsed") {
    throw new Error(
      `Static fold projection cannot compile ${intent.mode} intent.`
    );
  }
  return compileProjection({
    intent,
    expandedNodeIds:
      intent.mode === "expanded" ? intent.foldableNodeIds : [],
    collapsedNodeIds:
      intent.mode === "collapsed" ? intent.foldableNodeIds : []
  });
}

export function compileKpFoldableDistributionAdaptiveProjection(input: {
  readonly intent: KpFoldableDistributionFoldIntent;
  readonly detailBudget: "compact" | "balanced" | "roomy";
}): KpFoldableDistributionProjection {
  const { intent } = input;
  if (intent.mode !== "automatic" && intent.mode !== "pinned") {
    throw new Error(
      `Adaptive fold projection cannot compile ${intent.mode} intent.`
    );
  }
  const expandedNodeIds = intent.mode === "pinned"
    ? intent.pinnedNodeIds
    : input.detailBudget === "roomy"
      ? intent.foldableNodeIds
      : input.detailBudget === "balanced"
        ? intent.foldableNodeIds.slice(0, 1)
        : [];
  const expanded = new Set(expandedNodeIds);
  return compileProjection({
    intent,
    expandedNodeIds,
    collapsedNodeIds: intent.foldableNodeIds.filter(
      (nodeId) => !expanded.has(nodeId)
    )
  });
}

export function compileKpFoldableDistributionProjectionFromNodeState(input: {
  readonly intent: KpFoldableDistributionFoldIntent;
  readonly expandedNodeIds: readonly string[];
  readonly collapsedNodeIds: readonly string[];
}): KpFoldableDistributionProjection {
  return compileProjection(input);
}

function compileProjection(input: {
  readonly intent: KpFoldableDistributionFoldIntent;
  readonly expandedNodeIds: readonly string[];
  readonly collapsedNodeIds: readonly string[];
}): KpFoldableDistributionProjection {
  const tree = createKpFoldableDistributionEvaluationTree();
  const root = tree.root;
  if (root.kind !== "sequence") {
    throw new Error("Foldable distribution evaluation root must be a sequence.");
  }
  const nodeById = new Map(root.children.map((node) => [node.id, node]));
  const expanded = validatePartition(
    input.intent.foldableNodeIds,
    input.expandedNodeIds,
    input.collapsedNodeIds
  );
  const collapsed = Object.freeze([...input.collapsedNodeIds]);
  const operationIds = Object.freeze(
    semanticTransformationLeafRefs(root).map(({ id }) => id)
  );
  const disclosures = Object.freeze(collapsed.map((nodeId) => {
    const node = nodeById.get(nodeId);
    if (node === undefined || node.kind === "leaf") {
      throw new Error(`Fold projection cannot disclose missing group ${nodeId}.`);
    }
    return Object.freeze({
      nodeId,
      label: node.label,
      hiddenOperationIds: Object.freeze(
        semanticTransformationLeafRefs(node).map(({ id }) => id)
      ),
      summary: node.summary ?? node.label
    });
  }));
  const collapsedSet = new Set(collapsed);
  const visibleNodeIds = Object.freeze(
    root.children.flatMap((node) =>
      collapsedSet.has(node.id) || node.kind === "leaf"
        ? [node.id]
        : [node.id, ...node.children.map(({ id }) => id)]
    )
  );

  return Object.freeze({
    schemaVersion: "kp.foldable-distribution-projection.v1" as const,
    mode: input.intent.mode,
    treeId: input.intent.treeId,
    expandedNodeIds: expanded,
    collapsedNodeIds: collapsed,
    visibleNodeIds,
    operationIds,
    disclosures,
    semanticTruth: Object.freeze({
      sourceObjectIds: Object.freeze([...root.sourceObjectIds]),
      targetObjectIds: Object.freeze([...root.targetObjectIds]),
      operationIds
    })
  });
}

function validatePartition(
  foldableNodeIds: readonly string[],
  expandedNodeIds: readonly string[],
  collapsedNodeIds: readonly string[]
): readonly string[] {
  const known = new Set(foldableNodeIds);
  const combined = [...expandedNodeIds, ...collapsedNodeIds];
  if (
    combined.some((nodeId) => !known.has(nodeId)) ||
    new Set(combined).size !== combined.length ||
    combined.length !== foldableNodeIds.length
  ) {
    throw new Error(
      "Fold projection must partition every foldable node exactly once."
    );
  }
  return Object.freeze([...expandedNodeIds]);
}
