import {
  readKpSemanticSlotBinding,
  type KpAggregateSemanticSnapshot,
  type KpSemanticSlotBinding
} from "./aggregate-snapshot.ts";
import type {
  KpSemanticStateGroupDescriptor,
  KpSemanticStateMemberMap
} from "./authoring-schema.ts";
import type {
  KpPinnedSemanticStateHandleTree,
  KpRequiredSemanticStateLeafHandle,
  KpSemanticStateHandleSet
} from "./authoring-state-handles.ts";
import type { KpSettledSemanticStateCompositionAddress } from
  "./state-family-composition-address.ts";
import type {
  KpSemanticStateCompositionNodeDeclaration
} from "./state-family-composition-declaration.ts";
import type {
  KpSemanticStateCompositionEndpointChain,
  KpSemanticStateCompositionSettledBoundary
} from "./state-family-composition-endpoints.ts";
import type {
  KpSemanticStateCompositionHandleSet
} from "./state-family-composition-handles.ts";
import {
  createKpSettledSemanticStateCompositionResolver,
  type KpSettledSemanticStateCompositionResolution
} from "./state-family-composition-settled-resolver.ts";

export interface KpSemanticStateCompositionHistoricalLocalInspection<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  Value
> {
  readonly schemaVersion:
    "kp.semantic-state-composition-historical-local-inspection.v1";
  readonly kind: "semantic-state-composition-historical-local-inspection";
  readonly compositionId:
    KpSemanticStateCompositionEndpointChain<Root>["composition"]["id"];
  readonly target: KpRequiredSemanticStateLeafHandle<Value>;
  readonly historical:
    KpSettledSemanticStateCompositionResolution<Root>;
  readonly historicalBinding: KpSemanticSlotBinding;
  readonly currentSnapshot: KpAggregateSemanticSnapshot;
  readonly currentState: KpPinnedSemanticStateHandleTree<Root>;
  readonly currentBinding: KpSemanticSlotBinding;
}

export interface KpSemanticStateCompositionRestoreGuidance {
  readonly schemaVersion:
    "kp.semantic-state-composition-restore-guidance.v1";
  readonly kind: "semantic-state-composition-restore-guidance";
  readonly alternatives: readonly [
    "historical-inspection",
    "explicit-authored-branch"
  ];
  readonly branchFunction:
    "continueKpSemanticStateCompositionFromBoundary";
  readonly sourceAddress: KpSettledSemanticStateCompositionAddress;
  readonly sourceBoundary: KpSemanticStateCompositionSettledBoundary;
  readonly sourceSnapshot: KpAggregateSemanticSnapshot;
}

export type KpSemanticStateCompositionRestoreErrorCode =
  | "foreign-local-target"
  | "partial-local-restore-forbidden";

export class KpSemanticStateCompositionRestoreError extends Error {
  readonly code: KpSemanticStateCompositionRestoreErrorCode;
  readonly guidance?: KpSemanticStateCompositionRestoreGuidance;

  constructor(input: {
    readonly code: KpSemanticStateCompositionRestoreErrorCode;
    readonly message: string;
    readonly guidance?: KpSemanticStateCompositionRestoreGuidance;
  }) {
    super(input.message);
    this.name = "KpSemanticStateCompositionRestoreError";
    this.code = input.code;
    if (input.guidance !== undefined) this.guidance = input.guidance;
  }
}

/**
 * A local historical view pins one retained aggregate boundary. It exposes
 * the old and current bindings side by side but creates no candidate snapshot
 * that could be mistaken for coherent aggregate authority.
 */
export function inspectKpSemanticStateCompositionHistoricalLocal<
  const Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  const DeclarationRoot extends KpSemanticStateCompositionNodeDeclaration,
  Value
>(input: {
  readonly chain: KpSemanticStateCompositionEndpointChain<Root>;
  readonly compositionHandles:
    KpSemanticStateCompositionHandleSet<DeclarationRoot>;
  readonly stateHandles: KpSemanticStateHandleSet<Root>;
  readonly address: KpSettledSemanticStateCompositionAddress;
  readonly target: KpRequiredSemanticStateLeafHandle<Value>;
}): KpSemanticStateCompositionHistoricalLocalInspection<Root, Value> {
  if (input.target.namespace !== input.chain.composition.namespace) {
    fail({
      code: "foreign-local-target",
      message: `Local target ${JSON.stringify(input.target.slotId)} does not belong to composition namespace ${JSON.stringify(input.chain.composition.namespace)}.`
    });
  }
  const historical = createKpSettledSemanticStateCompositionResolver({
    chain: input.chain,
    compositionHandles: input.compositionHandles,
    stateHandles: input.stateHandles
  }).resolveAddress(input.address);
  const currentSnapshot = input.chain.after;

  return Object.freeze({
    schemaVersion:
      "kp.semantic-state-composition-historical-local-inspection.v1",
    kind: "semantic-state-composition-historical-local-inspection",
    compositionId: input.chain.composition.id,
    target: input.target,
    historical,
    historicalBinding: readKpSemanticSlotBinding(
      historical.snapshot,
      input.target.slotId
    ),
    currentSnapshot,
    currentState: input.stateHandles.pin(currentSnapshot),
    currentBinding: readKpSemanticSlotBinding(
      currentSnapshot,
      input.target.slotId
    )
  });
}

/**
 * A partial restore has no legal transaction meaning. The diagnostic carries
 * the exact retained boundary needed for either continued inspection or a
 * separately authored whole-aggregate branch transformation.
 */
export function requestKpSemanticStateCompositionHistoricalLocalRestore<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  Value
>(
  inspection: KpSemanticStateCompositionHistoricalLocalInspection<Root, Value>
): never {
  const guidance = Object.freeze({
    schemaVersion:
      "kp.semantic-state-composition-restore-guidance.v1" as const,
    kind: "semantic-state-composition-restore-guidance" as const,
    alternatives: Object.freeze([
      "historical-inspection",
      "explicit-authored-branch"
    ] as const),
    branchFunction:
      "continueKpSemanticStateCompositionFromBoundary" as const,
    sourceAddress: inspection.historical.address,
    sourceBoundary: inspection.historical.boundary,
    sourceSnapshot: inspection.historical.snapshot
  });
  fail({
    code: "partial-local-restore-forbidden",
    guidance,
    message: `Cannot splice local slot ${JSON.stringify(inspection.target.slotId)} at version ${JSON.stringify(inspection.historicalBinding.versionId)} into current aggregate snapshot ${JSON.stringify(inspection.currentSnapshot.id)}. Inspect the retained historical boundary or author an explicit transformation and continue it as a new branch.`
  });
}

function fail(input: {
  readonly code: KpSemanticStateCompositionRestoreErrorCode;
  readonly message: string;
  readonly guidance?: KpSemanticStateCompositionRestoreGuidance;
}): never {
  throw new KpSemanticStateCompositionRestoreError(input);
}
