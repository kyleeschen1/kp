import {
  createKpFractionCompositionEvaluationTree,
  KP_FRACTION_COMPOSITION_FOLDABLE_NODE_IDS
} from "./fraction-composition-evaluation-tree.ts";
import {
  semanticTransformationTreeNodeIds
} from "./transformation-composition.ts";

export type KpFractionCompositionFoldMode =
  | "expanded"
  | "collapsed"
  | "automatic"
  | "pinned";

export interface KpFractionCompositionFoldIntent {
  readonly schemaVersion: "kp.fraction-composition-fold-intent.v1";
  readonly treeId: "evaluation.fraction-composition.root";
  readonly mode: KpFractionCompositionFoldMode;
  readonly foldableNodeIds: typeof KP_FRACTION_COMPOSITION_FOLDABLE_NODE_IDS;
  readonly pinnedNodeIds: readonly string[];
}

export function createKpFractionCompositionFoldIntent(input: {
  readonly mode: KpFractionCompositionFoldMode;
  readonly pinnedNodeIds?: readonly string[] | undefined;
}): KpFractionCompositionFoldIntent {
  const tree = createKpFractionCompositionEvaluationTree();
  const knownNodeIds = new Set(semanticTransformationTreeNodeIds(tree.root));
  const pins = [...(input.pinnedNodeIds ?? [])];
  if (new Set(pins).size !== pins.length) {
    throw new Error("Fraction composition fold intent repeats a pinned node.");
  }
  pins.forEach((nodeId) => {
    if (!knownNodeIds.has(nodeId)) {
      throw new Error(`Fraction composition fold intent pins unknown node ${nodeId}.`);
    }
    if (!(KP_FRACTION_COMPOSITION_FOLDABLE_NODE_IDS as readonly string[]).includes(nodeId)) {
      throw new Error(`Fraction composition fold intent cannot pin leaf ${nodeId}.`);
    }
  });
  if (input.mode === "pinned" && pins.length === 0) {
    throw new Error("Pinned fraction composition fold intent requires a node.");
  }
  if (input.mode !== "pinned" && pins.length > 0) {
    throw new Error(`${input.mode} fraction composition intent cannot carry pins.`);
  }

  return Object.freeze({
    schemaVersion: "kp.fraction-composition-fold-intent.v1" as const,
    treeId: "evaluation.fraction-composition.root" as const,
    mode: input.mode,
    foldableNodeIds: KP_FRACTION_COMPOSITION_FOLDABLE_NODE_IDS,
    pinnedNodeIds: Object.freeze(pins)
  });
}
