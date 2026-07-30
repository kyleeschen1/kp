import {
  kpPlaceValueAdditionVisualReference as reference
} from "../reader/compiler/place-value-addition-visual-reference.ts";
import {
  KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS,
  createKpPlaceValueAdditionEvaluationTree
} from "./place-value-addition-evaluation-tree.ts";
import {
  kpPlaceValueAdditionTrace
} from "./place-value-addition-trace.ts";
import {
  semanticTransformationLeafRefs,
  semanticTransformationTreeNodeIds
} from "./transformation-composition.ts";

export type KpPlaceValueAdditionFoldMode =
  | "expanded"
  | "collapsed"
  | "automatic"
  | "pinned";

export interface KpPlaceValueAdditionFoldIntent {
  readonly schemaVersion: "kp.place-value-addition-fold-intent.v1";
  readonly treeId: "evaluation.place-value.root";
  readonly mode: KpPlaceValueAdditionFoldMode;
  readonly foldableNodeIds: typeof KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS;
  readonly pinnedNodeIds: readonly string[];
}

export interface KpPlaceValueAdditionFoldProjection {
  readonly schemaVersion: "kp.place-value-addition-fold-projection.v1";
  readonly mode: KpPlaceValueAdditionFoldMode;
  readonly treeId: "evaluation.place-value.root";
  readonly expandedNodeIds: readonly string[];
  readonly collapsedNodeIds: readonly string[];
  readonly visibleNodeIds: readonly string[];
  readonly operationIds: readonly string[];
  readonly disclosures: readonly {
    readonly nodeId: string;
    readonly label: string;
    readonly hiddenOperationIds: readonly string[];
    readonly summary: string;
  }[];
  readonly semanticTruth: {
    readonly traceId: typeof kpPlaceValueAdditionTrace.id;
    readonly expression: typeof kpPlaceValueAdditionTrace.expression;
    readonly stateIds: readonly string[];
    readonly operationIds: readonly string[];
    readonly exactResult: 434n;
  };
}

export interface KpPlaceValueAdditionOutlineAnchor {
  readonly id: string;
  readonly label: string;
  readonly targetNodeId: string;
  readonly progressPermille: number;
  readonly stateId: string;
  readonly boundary: "animation-start" | "settled-checkpoint";
  readonly mayExposeTransient: false;
}

export function createKpPlaceValueAdditionFoldIntent(input: {
  readonly mode: KpPlaceValueAdditionFoldMode;
  readonly pinnedNodeIds?: readonly string[] | undefined;
}): KpPlaceValueAdditionFoldIntent {
  const tree = createKpPlaceValueAdditionEvaluationTree();
  const known = new Set(semanticTransformationTreeNodeIds(tree.root));
  const foldable = new Set<string>(KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS);
  const pins = [...(input.pinnedNodeIds ?? [])];
  if (new Set(pins).size !== pins.length) {
    throw new Error("Place-value fold intent repeats a pinned group.");
  }
  for (const nodeId of pins) {
    if (!known.has(nodeId)) {
      throw new Error(`Place-value fold intent pins unknown node ${nodeId}.`);
    }
    if (!foldable.has(nodeId)) {
      throw new Error(`Place-value fold intent cannot pin leaf ${nodeId}.`);
    }
  }
  if (input.mode === "pinned" && pins.length === 0) {
    throw new Error("Pinned place-value fold intent requires a group.");
  }
  if (input.mode !== "pinned" && pins.length > 0) {
    throw new Error(`${input.mode} place-value fold intent cannot carry pins.`);
  }
  return Object.freeze({
    schemaVersion: "kp.place-value-addition-fold-intent.v1" as const,
    treeId: "evaluation.place-value.root" as const,
    mode: input.mode,
    foldableNodeIds: KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS,
    pinnedNodeIds: Object.freeze(pins)
  });
}

export function compileKpPlaceValueAdditionFoldProjection(input: {
  readonly intent: KpPlaceValueAdditionFoldIntent;
  readonly detailBudget?: "compact" | "balanced" | "roomy" | undefined;
}): KpPlaceValueAdditionFoldProjection {
  const { intent } = input;
  const expandedNodeIds =
    intent.mode === "expanded"
      ? intent.foldableNodeIds
      : intent.mode === "collapsed"
        ? []
        : intent.mode === "pinned"
          ? intent.pinnedNodeIds
          : input.detailBudget === "roomy"
            ? intent.foldableNodeIds
            : input.detailBudget === "balanced"
              ? intent.foldableNodeIds.slice(0, 1)
              : [];
  const expanded = new Set(expandedNodeIds);
  const collapsedNodeIds = intent.foldableNodeIds.filter(
    (nodeId) => !expanded.has(nodeId)
  );
  if (
    expandedNodeIds.length + collapsedNodeIds.length !==
      intent.foldableNodeIds.length
  ) {
    throw new Error("Place-value fold projection must partition every group.");
  }

  const tree = createKpPlaceValueAdditionEvaluationTree();
  if (tree.root.kind !== "sequence") {
    throw new Error("Place-value evaluation root must remain a sequence.");
  }
  const nodeById = new Map(tree.root.children.map((node) => [node.id, node]));
  const operationIds = Object.freeze(
    semanticTransformationLeafRefs(tree.root).map(({ id }) => id)
  );
  const collapsed = new Set<string>(collapsedNodeIds);
  const visibleNodeIds = Object.freeze(
    tree.root.children.flatMap((node) =>
      collapsed.has(node.id) || node.kind === "leaf"
        ? [node.id]
        : [node.id, ...node.children.map(({ id }) => id)]
    )
  );
  const disclosures = Object.freeze(collapsedNodeIds.map((nodeId) => {
    const node = nodeById.get(nodeId);
    if (node === undefined || node.kind === "leaf") {
      throw new Error(`Place-value fold projection cannot disclose ${nodeId}.`);
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

  return Object.freeze({
    schemaVersion: "kp.place-value-addition-fold-projection.v1" as const,
    mode: intent.mode,
    treeId: intent.treeId,
    expandedNodeIds: Object.freeze([...expandedNodeIds]),
    collapsedNodeIds: Object.freeze([...collapsedNodeIds]),
    visibleNodeIds,
    operationIds,
    disclosures,
    // Folding changes disclosure only; both views retain this exact trace truth.
    semanticTruth: Object.freeze({
      traceId: kpPlaceValueAdditionTrace.id,
      expression: kpPlaceValueAdditionTrace.expression,
      stateIds: Object.freeze(
        kpPlaceValueAdditionTrace.states.map(({ id }) => id)
      ),
      operationIds,
      exactResult: 434n as const
    })
  });
}

export const kpPlaceValueAdditionOutlineAnchors = Object.freeze([
  anchor(
    "outline.place-value.start",
    "Set up the addition",
    reference.beats[0]!.id,
    0,
    "state.place-value.established",
    "animation-start"
  ),
  anchor(
    "outline.place-value.ones",
    "Add the ones",
    KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS[0],
    reference.beats[1]!.startPermille,
    "state.place-value.established",
    "animation-start"
  ),
  anchor(
    "outline.place-value.tens",
    "Add the tens",
    KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS[1],
    reference.beats[3]!.startPermille,
    "state.place-value.ones-exchanged",
    "settled-checkpoint"
  ),
  anchor(
    "outline.place-value.hundreds",
    "Add the hundreds",
    KP_PLACE_VALUE_ADDITION_FOLDABLE_NODE_IDS[2],
    reference.beats[5]!.startPermille,
    "state.place-value.tens-exchanged",
    "settled-checkpoint"
  ),
  anchor(
    "outline.place-value.complete",
    "Read the result",
    reference.beats[6]!.id,
    1_000,
    "state.place-value.settled",
    "settled-checkpoint"
  )
]);

function anchor(
  id: string,
  label: string,
  targetNodeId: string,
  progressPermille: number,
  stateId: string,
  boundary: KpPlaceValueAdditionOutlineAnchor["boundary"]
): KpPlaceValueAdditionOutlineAnchor {
  return Object.freeze({
    id,
    label,
    targetNodeId,
    progressPermille,
    stateId,
    boundary,
    mayExposeTransient: false as const
  });
}
