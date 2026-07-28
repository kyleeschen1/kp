import {
  createKpFractionCompositionEvaluationTree
} from "./fraction-composition-evaluation-tree.ts";
import type {
  KpFractionCompositionFoldIntent
} from "./fraction-composition-fold-intent.ts";
import {
  semanticTransformationLeafRefs
} from "./transformation-composition.ts";

export interface KpFractionCompositionFoldProjection {
  readonly schemaVersion: "kp.fraction-composition-fold-projection.v1";
  readonly mode: KpFractionCompositionFoldIntent["mode"];
  readonly treeId: "evaluation.fraction-composition.root";
  readonly expandedNodeIds: readonly string[];
  readonly collapsedNodeIds: readonly string[];
  readonly visibleNodeIds: readonly string[];
  readonly operationIds: readonly string[];
  readonly disclosures: readonly {
    readonly nodeId: string;
    readonly label: string;
    readonly hiddenOperationIds: readonly string[];
  }[];
  readonly semanticTruth: {
    readonly sourceStateId: string;
    readonly targetStateId: string;
    readonly stateIds: readonly string[];
    readonly operationIds: readonly string[];
    readonly solution: { readonly numerator: "9"; readonly denominator: "1" };
  };
}

export function compileKpFractionCompositionStaticProjection(
  intent: KpFractionCompositionFoldIntent
): KpFractionCompositionFoldProjection {
  if (intent.mode !== "expanded" && intent.mode !== "collapsed") {
    throw new Error(`Static fraction composition projection cannot compile ${intent.mode}.`);
  }
  return compileProjection({
    intent,
    expandedNodeIds: intent.mode === "expanded" ? intent.foldableNodeIds : [],
    collapsedNodeIds: intent.mode === "collapsed" ? intent.foldableNodeIds : []
  });
}

export function compileKpFractionCompositionAdaptiveProjection(input: {
  readonly intent: KpFractionCompositionFoldIntent;
  readonly detailBudget: "compact" | "balanced" | "roomy";
}): KpFractionCompositionFoldProjection {
  if (input.intent.mode !== "automatic" && input.intent.mode !== "pinned") {
    throw new Error(
      `Adaptive fraction composition projection cannot compile ${input.intent.mode}.`
    );
  }
  const expandedNodeIds = input.intent.mode === "pinned"
    ? input.intent.pinnedNodeIds
    : input.detailBudget === "roomy"
      ? input.intent.foldableNodeIds
      : input.detailBudget === "balanced"
        ? input.intent.foldableNodeIds.slice(0, 2)
        : [];
  const expanded = new Set(expandedNodeIds);
  return compileProjection({
    intent: input.intent,
    expandedNodeIds,
    collapsedNodeIds: input.intent.foldableNodeIds.filter(
      (nodeId) => !expanded.has(nodeId)
    )
  });
}

function compileProjection(input: {
  readonly intent: KpFractionCompositionFoldIntent;
  readonly expandedNodeIds: readonly string[];
  readonly collapsedNodeIds: readonly string[];
}): KpFractionCompositionFoldProjection {
  validatePartition(
    input.intent.foldableNodeIds,
    input.expandedNodeIds,
    input.collapsedNodeIds
  );
  const tree = createKpFractionCompositionEvaluationTree();
  if (tree.root.kind !== "sequence") {
    throw new Error("Fraction composition evaluation root must remain a sequence.");
  }
  const nodeById = new Map(tree.root.children.map((node) => [node.id, node]));
  const operationIds = Object.freeze(
    semanticTransformationLeafRefs(tree.root).map(({ id }) => id)
  );
  const collapsedSet = new Set(input.collapsedNodeIds);
  const visibleNodeIds = Object.freeze(tree.root.children.flatMap((node) =>
    collapsedSet.has(node.id) || node.kind === "leaf"
      ? [node.id]
      : [node.id, ...node.children.map(({ id }) => id)]
  ));
  const disclosures = Object.freeze(input.collapsedNodeIds.map((nodeId) => {
    const node = nodeById.get(nodeId);
    if (node === undefined || node.kind === "leaf") {
      throw new Error(`Fraction composition projection cannot disclose ${nodeId}.`);
    }
    return Object.freeze({
      nodeId,
      label: node.label,
      hiddenOperationIds: Object.freeze(
        semanticTransformationLeafRefs(node).map(({ id }) => id)
      )
    });
  }));

  return Object.freeze({
    schemaVersion: "kp.fraction-composition-fold-projection.v1" as const,
    mode: input.intent.mode,
    treeId: input.intent.treeId,
    expandedNodeIds: Object.freeze([...input.expandedNodeIds]),
    collapsedNodeIds: Object.freeze([...input.collapsedNodeIds]),
    visibleNodeIds,
    operationIds,
    disclosures,
    // Every projection carries the same certified endpoint chain; only disclosure differs.
    semanticTruth: Object.freeze({
      sourceStateId: tree.traceProof.stateIds[0]!,
      targetStateId: tree.traceProof.stateIds[tree.traceProof.stateIds.length - 1]!,
      stateIds: tree.traceProof.stateIds,
      operationIds,
      solution: tree.traceProof.solution
    })
  });
}

function validatePartition(
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
    throw new Error("Fraction composition projection must partition every foldable node.");
  }
}
