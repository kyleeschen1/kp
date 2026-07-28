import {
  createKpFoldableDistributionEvaluationTree
} from "../../semantic/foldable-distribution-evaluation-tree.ts";
import {
  createKpFoldableDistributionFoldIntent,
  type KpFoldableDistributionFoldMode
} from "../../semantic/foldable-distribution-fold-intent.ts";
import {
  semanticTransformationTreeNodeIds
} from "../../semantic/transformation-composition.ts";
import type {
  KpReaderRuntimeRouteDescriptor
} from "./reader-route-descriptor.ts";
import {
  decodeKpReaderEvaluationFoldUrl,
  encodeKpReaderEvaluationFoldUrl,
  type KpReaderEvaluationFoldUrlContract
} from "./evaluation-fold-url-codec.ts";

export type KpFoldableDistributionDirection = "forward" | "inverse";
export type KpFoldableDistributionCheckpoint =
  | "factored"
  | "distributed"
  | "products-evaluated"
  | "grouped"
  | "coefficient-factored"
  | "collected";

export interface KpFoldableDistributionUrlState {
  readonly checkpoint: KpFoldableDistributionCheckpoint;
  readonly progressPermille?: number | undefined;
  readonly direction: KpFoldableDistributionDirection;
  readonly foldMode: KpFoldableDistributionFoldMode;
  readonly activeNodeId?: string | undefined;
  readonly collapsedNodeIds: readonly string[];
  readonly pinnedNodeIds: readonly string[];
}

const checkpoints = new Set<KpFoldableDistributionCheckpoint>([
  "factored",
  "distributed",
  "products-evaluated",
  "grouped",
  "coefficient-factored",
  "collected"
]);
const knownNodeIds = new Set(
  semanticTransformationTreeNodeIds(
    createKpFoldableDistributionEvaluationTree().root
  )
);
const foldableNodeIds = new Set(
  createKpFoldableDistributionFoldIntent({ mode: "expanded" }).foldableNodeIds
);
const contract: KpReaderEvaluationFoldUrlContract<
  KpFoldableDistributionCheckpoint
> = Object.freeze({
  label: "foldable distribution",
  checkpointIds: checkpoints,
  defaultCheckpoint: "factored",
  knownNodeIds,
  foldableNodeIds,
  validateIntent(
    mode: KpFoldableDistributionFoldMode,
    pinnedNodeIds: readonly string[]
  ) {
    createKpFoldableDistributionFoldIntent({
      mode: mode as KpFoldableDistributionFoldMode,
      pinnedNodeIds
    });
  }
});

export function decodeKpFoldableDistributionUrl(
  input: string | URL,
  expected?: KpReaderRuntimeRouteDescriptor
): KpFoldableDistributionUrlState {
  return decodeKpReaderEvaluationFoldUrl(input, contract, expected);
}

export function encodeKpFoldableDistributionUrl(
  baseUrl: string | URL,
  route: KpReaderRuntimeRouteDescriptor,
  state: KpFoldableDistributionUrlState
): string {
  return encodeKpReaderEvaluationFoldUrl(baseUrl, route, state, contract);
}
