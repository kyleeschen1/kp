import type {
  KpSemanticStateGroupDescriptor,
  KpSemanticStateMemberMap
} from "./authoring-schema.ts";
import type { KpSemanticStateHandleSet } from
  "./authoring-state-handles.ts";
import type { KpSemanticStateCompositionLogicalAddress } from
  "./state-family-composition-address.ts";
import type {
  KpCompiledSemanticStateComposition
} from "./state-family-composition-compiler.ts";
import type {
  KpSemanticStateCompositionNodeDeclaration
} from "./state-family-composition-declaration.ts";
import {
  assembleKpSemanticStateCompositionEndpointChain,
  type KpSemanticStateCompositionEndpointBinding,
  type KpSemanticStateCompositionEndpointChain,
  type KpSemanticStateCompositionSettledBoundary
} from "./state-family-composition-endpoints.ts";
import type { KpSemanticStateCompositionHandleSet } from
  "./state-family-composition-handles.ts";
import {
  createKpSettledSemanticStateCompositionResolver
} from "./state-family-composition-settled-resolver.ts";
import type { KpSemanticDerivedGraph } from "./derived-graph.ts";

export interface KpSemanticStateCompositionBranchLineage<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion:
    "kp.semantic-state-composition-branch-lineage.v1";
  readonly kind: "semantic-state-composition-branch-lineage";
  readonly sourceChain: KpSemanticStateCompositionEndpointChain<Root>;
  readonly sourceAddress: Extract<
    KpSemanticStateCompositionLogicalAddress,
    { readonly kind: "settled" }
  >;
  readonly sourceBoundary: KpSemanticStateCompositionSettledBoundary;
  readonly sourceSnapshot: KpSemanticStateCompositionSettledBoundary["snapshot"];
}

export interface KpSemanticStateCompositionBranch<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion: "kp.semantic-state-composition-branch.v1";
  readonly kind: "semantic-state-composition-branch";
  readonly id: KpSemanticStateCompositionEndpointChain<Root>["composition"]["id"];
  readonly lineage: KpSemanticStateCompositionBranchLineage<Root>;
  readonly chain: KpSemanticStateCompositionEndpointChain<Root>;
}

export type KpSemanticStateCompositionBranchErrorCode =
  | "branch-composition-id-reused"
  | "branch-source-must-be-settled";

export class KpSemanticStateCompositionBranchError extends Error {
  readonly code: KpSemanticStateCompositionBranchErrorCode;

  constructor(
    code: KpSemanticStateCompositionBranchErrorCode,
    message: string
  ) {
    super(message);
    this.name = "KpSemanticStateCompositionBranchError";
    this.code = code;
  }
}

/**
 * A continuation starts from one already-retained boundary. The new
 * composition owns all later endpoints; the source chain stays an exact
 * lineage reference instead of being truncated or copied into the branch.
 */
export function continueKpSemanticStateCompositionFromBoundary<
  const Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  const SourceDeclarationRoot extends
    KpSemanticStateCompositionNodeDeclaration,
  const BranchDeclarationRoot extends
    KpSemanticStateCompositionNodeDeclaration
>(input: {
  readonly sourceChain: KpSemanticStateCompositionEndpointChain<Root>;
  readonly sourceHandles:
    KpSemanticStateCompositionHandleSet<SourceDeclarationRoot>;
  readonly stateHandles: KpSemanticStateHandleSet<Root>;
  readonly sourceAddress: KpSemanticStateCompositionLogicalAddress;
  readonly composition:
    KpCompiledSemanticStateComposition<BranchDeclarationRoot>;
  readonly bindings:
    readonly KpSemanticStateCompositionEndpointBinding<Root>[];
  readonly graph?: KpSemanticDerivedGraph;
}): KpSemanticStateCompositionBranch<Root> {
  if (input.sourceAddress.kind !== "settled") {
    fail(
      "branch-source-must-be-settled",
      "A composition branch must begin at a retained settled boundary, not an ephemeral transition address."
    );
  }
  if (input.composition.id === input.sourceChain.composition.id) {
    fail(
      "branch-composition-id-reused",
      `Branch continuation must have an identity distinct from source composition ${JSON.stringify(input.sourceChain.composition.id)}.`
    );
  }

  const source = createKpSettledSemanticStateCompositionResolver({
    chain: input.sourceChain,
    compositionHandles: input.sourceHandles,
    stateHandles: input.stateHandles
  }).resolveAddress(input.sourceAddress);
  const chain = assembleKpSemanticStateCompositionEndpointChain({
    composition: input.composition,
    base: source.snapshot,
    bindings: input.bindings,
    ...(input.graph === undefined ? {} : { graph: input.graph })
  });
  const lineage = Object.freeze({
    schemaVersion:
      "kp.semantic-state-composition-branch-lineage.v1" as const,
    kind: "semantic-state-composition-branch-lineage" as const,
    sourceChain: input.sourceChain,
    sourceAddress: source.address,
    sourceBoundary: source.boundary,
    sourceSnapshot: source.snapshot
  });

  return Object.freeze({
    schemaVersion: "kp.semantic-state-composition-branch.v1",
    kind: "semantic-state-composition-branch",
    id: chain.composition.id,
    lineage,
    chain
  });
}

function fail(
  code: KpSemanticStateCompositionBranchErrorCode,
  message: string
): never {
  throw new KpSemanticStateCompositionBranchError(code, message);
}
