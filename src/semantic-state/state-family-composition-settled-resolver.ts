import type {
  KpSemanticStateGroupDescriptor,
  KpSemanticStateMemberMap
} from "./authoring-schema.ts";
import type {
  KpPinnedSemanticStateHandleTree,
  KpSemanticStateHandleSet
} from "./authoring-state-handles.ts";
import type {
  KpSemanticStateCompositionNodeDeclaration
} from "./state-family-composition-declaration.ts";
import {
  createKpSettledSemanticStateCompositionAddress,
  type KpSettledSemanticStateCompositionAddress
} from "./state-family-composition-address.ts";
import type {
  KpSemanticStateCompositionBoundaryHandle,
  KpSemanticStateCompositionHandleSet
} from "./state-family-composition-handles.ts";
import type {
  KpSemanticStateCompositionEndpointChain,
  KpSemanticStateCompositionSettledBoundary
} from "./state-family-composition-endpoints.ts";

export interface KpSettledSemanticStateCompositionResolution<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion:
    "kp.settled-semantic-state-composition-resolution.v1";
  readonly kind: "settled-semantic-state-composition-resolution";
  readonly address: KpSettledSemanticStateCompositionAddress;
  readonly handle: KpSemanticStateCompositionBoundaryHandle;
  readonly boundary: KpSemanticStateCompositionSettledBoundary;
  readonly snapshot: KpSemanticStateCompositionSettledBoundary["snapshot"];
  readonly state: KpPinnedSemanticStateHandleTree<Root>;
}

export interface KpSettledSemanticStateCompositionResolver<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion:
    "kp.settled-semantic-state-composition-resolver.v1";
  readonly kind: "settled-semantic-state-composition-resolver";
  readonly compositionId:
    KpSemanticStateCompositionEndpointChain<Root>["composition"]["id"];
  resolveBoundary(
    handle: KpSemanticStateCompositionBoundaryHandle
  ): KpSettledSemanticStateCompositionResolution<Root>;
  resolveAddress(
    address: KpSettledSemanticStateCompositionAddress
  ): KpSettledSemanticStateCompositionResolution<Root>;
}

export type KpSettledSemanticStateCompositionResolverErrorCode =
  | "composition-handle-mismatch"
  | "foreign-settled-address"
  | "unknown-settled-boundary";

export class KpSettledSemanticStateCompositionResolverError extends Error {
  readonly code: KpSettledSemanticStateCompositionResolverErrorCode;

  constructor(
    code: KpSettledSemanticStateCompositionResolverErrorCode,
    message: string
  ) {
    super(message);
    this.name = "KpSettledSemanticStateCompositionResolverError";
    this.code = code;
  }
}

/**
 * The resolver indexes only snapshots already retained by endpoint assembly.
 * Resolution can therefore pin historical state without replaying a prefix or
 * constructing a value-equivalent replacement snapshot.
 */
export function createKpSettledSemanticStateCompositionResolver<
  const Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  const DeclarationRoot extends KpSemanticStateCompositionNodeDeclaration
>(input: {
  readonly chain: KpSemanticStateCompositionEndpointChain<Root>;
  readonly compositionHandles:
    KpSemanticStateCompositionHandleSet<DeclarationRoot>;
  readonly stateHandles: KpSemanticStateHandleSet<Root>;
}): KpSettledSemanticStateCompositionResolver<Root> {
  validateHandleAlignment(input.chain, input.compositionHandles);
  const boundaryIndex = createBoundaryIndex(input.chain.boundaries);

  const resolveAddress = (
    address: KpSettledSemanticStateCompositionAddress
  ): KpSettledSemanticStateCompositionResolution<Root> => {
    if (address.compositionId !== input.chain.composition.id) {
      fail(
        "foreign-settled-address",
        `Settled address belongs to composition ${JSON.stringify(address.compositionId)}, not ${JSON.stringify(input.chain.composition.id)}.`
      );
    }
    const ordinal = boundaryIndex[address.boundary.id];
    const boundary = ordinal === undefined
      ? undefined
      : input.chain.boundaries[ordinal];
    const handle = ordinal === undefined
      ? undefined
      : input.compositionHandles.boundaries[ordinal];
    if (boundary === undefined || handle === undefined ||
      boundary.id !== address.boundary.id || handle.id !== boundary.id) {
      fail(
        "unknown-settled-boundary",
        `Settled address references boundary ${JSON.stringify(address.boundary.id)} outside the retained endpoint chain.`
      );
    }
    const snapshot = boundary.snapshot;
    return Object.freeze({
      schemaVersion:
        "kp.settled-semantic-state-composition-resolution.v1",
      kind: "settled-semantic-state-composition-resolution",
      address: createKpSettledSemanticStateCompositionAddress({
        handles: input.compositionHandles,
        boundary: handle
      }),
      handle,
      boundary,
      snapshot,
      state: input.stateHandles.pin(snapshot)
    });
  };

  return Object.freeze({
    schemaVersion: "kp.settled-semantic-state-composition-resolver.v1",
    kind: "settled-semantic-state-composition-resolver",
    compositionId: input.chain.composition.id,
    resolveBoundary(handle: KpSemanticStateCompositionBoundaryHandle) {
      const address = createKpSettledSemanticStateCompositionAddress({
        handles: input.compositionHandles,
        boundary: handle
      });
      return resolveAddress(address);
    },
    resolveAddress
  });
}

function validateHandleAlignment<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(
  chain: KpSemanticStateCompositionEndpointChain<Root>,
  handles: KpSemanticStateCompositionHandleSet
): void {
  if (handles.composition.id !== chain.composition.id ||
    handles.boundaries.length !== chain.boundaries.length ||
    !handles.boundaries.every((handle, index) => {
      const boundary = chain.boundaries[index];
      return boundary !== undefined && handle.id === boundary.id &&
        handle.id === boundary.specification.id &&
        handle.stepIndex === boundary.specification.stepIndex;
    })) {
    fail(
      "composition-handle-mismatch",
      `Generated handles do not describe endpoint chain ${JSON.stringify(chain.composition.id)}.`
    );
  }
}

function createBoundaryIndex(
  boundaries: readonly KpSemanticStateCompositionSettledBoundary[]
): Readonly<Record<string, number>> {
  const index: Record<string, number> = Object.create(null);
  boundaries.forEach((boundary, ordinal) => {
    index[boundary.id] = ordinal;
  });
  return Object.freeze(index);
}

function fail(
  code: KpSettledSemanticStateCompositionResolverErrorCode,
  message: string
): never {
  throw new KpSettledSemanticStateCompositionResolverError(code, message);
}
