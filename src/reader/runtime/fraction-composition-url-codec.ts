import {
  createKpFractionCompositionEvaluationTree
} from "../../semantic/fraction-composition-evaluation-tree.ts";
import {
  createKpFractionCompositionFoldIntent,
  type KpFractionCompositionFoldMode
} from "../../semantic/fraction-composition-fold-intent.ts";
import {
  semanticTransformationTreeNodeIds
} from "../../semantic/transformation-composition.ts";
import {
  decodeKpReaderEvaluationFoldUrl,
  encodeKpReaderEvaluationFoldUrl,
  type KpReaderEvaluationFoldUrlContract,
  type KpReaderEvaluationFoldUrlState
} from "./evaluation-fold-url-codec.ts";
import type {
  KpReaderRuntimeRouteDescriptor
} from "./reader-route-descriptor.ts";

export type KpFractionCompositionCheckpoint =
  | "factored"
  | "normalized"
  | "constant-quotient"
  | "difference-simplified"
  | "right-product-simplified"
  | "solved";

export type KpFractionCompositionUrlState =
  KpReaderEvaluationFoldUrlState<KpFractionCompositionCheckpoint>;

const checkpointIds = new Set<KpFractionCompositionCheckpoint>([
  "factored",
  "normalized",
  "constant-quotient",
  "difference-simplified",
  "right-product-simplified",
  "solved"
]);
const tree = createKpFractionCompositionEvaluationTree();
const knownNodeIds = new Set(semanticTransformationTreeNodeIds(tree.root));
const foldableNodeIds = new Set(
  createKpFractionCompositionFoldIntent({ mode: "expanded" }).foldableNodeIds
);
const contract: KpReaderEvaluationFoldUrlContract<
  KpFractionCompositionCheckpoint
> = Object.freeze({
  label: "fraction composition",
  checkpointIds,
  defaultCheckpoint: "factored",
  knownNodeIds,
  foldableNodeIds,
  validateIntent(
    mode: KpFractionCompositionFoldMode,
    pinnedNodeIds: readonly string[]
  ) {
    createKpFractionCompositionFoldIntent({
      mode: mode as KpFractionCompositionFoldMode,
      pinnedNodeIds
    });
  }
});

export function decodeKpFractionCompositionUrl(
  input: string | URL,
  expected?: KpReaderRuntimeRouteDescriptor
): KpFractionCompositionUrlState {
  return decodeKpReaderEvaluationFoldUrl(input, contract, expected);
}

export function encodeKpFractionCompositionUrl(
  baseUrl: string | URL,
  route: KpReaderRuntimeRouteDescriptor,
  state: KpFractionCompositionUrlState
): string {
  return encodeKpReaderEvaluationFoldUrl(baseUrl, route, state, contract);
}
