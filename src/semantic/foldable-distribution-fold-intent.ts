import {
  createKpFoldableDistributionEvaluationTree
} from "./foldable-distribution-evaluation-tree.ts";
import {
  semanticTransformationTreeNodeIds
} from "./transformation-composition.ts";

export type KpFoldableDistributionFoldMode =
  | "expanded"
  | "collapsed"
  | "automatic"
  | "pinned";

export interface KpFoldableDistributionFoldIntent {
  readonly schemaVersion: "kp.foldable-distribution-fold-intent.v1";
  readonly treeId: "evaluation.foldable-distribution.root";
  readonly mode: KpFoldableDistributionFoldMode;
  readonly foldableNodeIds: readonly string[];
  readonly pinnedNodeIds: readonly string[];
}

const foldableNodeIds = Object.freeze([
  "evaluation.foldable-distribution.distribute",
  "evaluation.foldable-distribution.evaluate-products"
]);

export function createKpFoldableDistributionFoldIntent(input: {
  readonly mode: KpFoldableDistributionFoldMode;
  readonly pinnedNodeIds?: readonly string[] | undefined;
}): KpFoldableDistributionFoldIntent {
  const tree = createKpFoldableDistributionEvaluationTree();
  const knownNodeIds = new Set(
    semanticTransformationTreeNodeIds(tree.root)
  );
  const pins = [...(input.pinnedNodeIds ?? [])];
  if (new Set(pins).size !== pins.length) {
    throw new Error("Fold intent repeats a pinned node.");
  }
  pins.forEach((nodeId) => {
    if (!knownNodeIds.has(nodeId)) {
      throw new Error(`Fold intent pins unknown node ${nodeId}.`);
    }
    if (!foldableNodeIds.includes(nodeId)) {
      throw new Error(`Fold intent cannot pin non-foldable node ${nodeId}.`);
    }
  });
  if (input.mode === "pinned" && pins.length === 0) {
    throw new Error("Pinned fold intent requires at least one pinned node.");
  }
  if (input.mode !== "pinned" && pins.length > 0) {
    throw new Error(
      `${input.mode} fold intent cannot carry pinned nodes.`
    );
  }

  // Fold intent names semantic nodes only. Visibility, duration, geometry, and
  // playback remain compiler-owned projections over the unchanged tree.
  return Object.freeze({
    schemaVersion: "kp.foldable-distribution-fold-intent.v1" as const,
    treeId: "evaluation.foldable-distribution.root" as const,
    mode: input.mode,
    foldableNodeIds,
    pinnedNodeIds: Object.freeze(pins)
  });
}
