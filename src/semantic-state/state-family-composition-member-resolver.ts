import type {
  KpSemanticStateGroupDescriptor,
  KpSemanticStateMemberMap
} from "./authoring-schema.ts";
import {
  decodeKpSemanticProgress,
  type KpSemanticProgress
} from "./semantic-progress.ts";
import {
  createKpInTransitionSemanticStateCompositionAddress,
  type KpInTransitionSemanticStateCompositionAddress
} from "./state-family-composition-address.ts";
import type {
  KpSemanticStateCompositionMemberHandle,
  KpSemanticStateCompositionHandleSet
} from "./state-family-composition-handles.ts";
import type {
  KpSemanticStateCompositionAppliedMember,
  KpSemanticStateCompositionEndpointChain,
  KpSemanticStateCompositionSettledBoundary
} from "./state-family-composition-endpoints.ts";
import {
  createKpSemanticStateFamilyEvaluator,
  type KpSemanticStateFamilyEvaluator,
  type KpSemanticStateFamilySample
} from "./state-family-evaluator.ts";
import type {
  KpAppliedSemanticStateFamily,
  KpSemanticStateFamilyDefinition,
  KpSemanticStateTransitionCapabilitySource
} from "./state-family-definition.ts";

export interface KpSemanticStateCompositionMemberEvaluatorBinding<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion:
    "kp.semantic-state-composition-member-evaluator-binding.v1";
  readonly kind: "semantic-state-composition-member-evaluator-binding";
  readonly memberId:
    KpSemanticStateCompositionAppliedMember<Root>["memberId"];
  readonly definitionId:
    KpSemanticStateCompositionAppliedMember<Root>["application"]["definitionId"];
  readonly transformationId:
    KpSemanticStateCompositionAppliedMember<Root>["application"]["transformationId"];
  readonly applied: KpSemanticStateCompositionAppliedMember<Root>;
  createEvaluator(input?: {
    readonly sampleCacheCapacity?: number;
  }): KpSemanticStateFamilyEvaluator<Root>;
}

export interface KpSemanticStateCompositionMemberTransitionResolution<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion:
    "kp.semantic-state-composition-member-transition-resolution.v1";
  readonly kind: "semantic-state-composition-member-transition-resolution";
  readonly address: KpInTransitionSemanticStateCompositionAddress;
  readonly handle: KpSemanticStateCompositionMemberHandle;
  readonly applied: KpSemanticStateCompositionAppliedMember<Root>;
  readonly beforeBoundary: KpSemanticStateCompositionSettledBoundary;
  readonly afterBoundary: KpSemanticStateCompositionSettledBoundary;
  readonly progress: KpSemanticProgress;
  readonly sample: KpSemanticStateFamilySample<Root>;
}

export interface KpSemanticStateCompositionMemberTransitionResolver<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion:
    "kp.semantic-state-composition-member-transition-resolver.v1";
  readonly kind: "semantic-state-composition-member-transition-resolver";
  readonly compositionId:
    KpSemanticStateCompositionEndpointChain<Root>["composition"]["id"];
  resolveMember(
    handle: KpSemanticStateCompositionMemberHandle,
    progress: KpSemanticProgress
  ): KpSemanticStateCompositionMemberTransitionResolution<Root>;
  resolveAddress(
    address: KpInTransitionSemanticStateCompositionAddress
  ): KpSemanticStateCompositionMemberTransitionResolution<Root>;
}

export type KpSemanticStateCompositionMemberResolverErrorCode =
  | "composition-handle-mismatch"
  | "duplicate-member-evaluator-binding"
  | "foreign-transition-address"
  | "independent-transition-not-supported"
  | "invalid-transition-progress"
  | "member-boundary-mismatch"
  | "member-evaluator-binding-mismatch"
  | "missing-member-evaluator-binding"
  | "unknown-transition-member"
  | "unexpected-member-evaluator-binding";

export class KpSemanticStateCompositionMemberResolverError extends Error {
  readonly code: KpSemanticStateCompositionMemberResolverErrorCode;

  constructor(
    code: KpSemanticStateCompositionMemberResolverErrorCode,
    message: string
  ) {
    super(message);
    this.name = "KpSemanticStateCompositionMemberResolverError";
    this.code = code;
  }
}

/**
 * This binding preserves the existing family evaluator as the only sampling
 * mechanism after aggregate endpoint assembly has erased parameter types.
 */
export function bindKpSemanticStateCompositionMemberEvaluator<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  Parameters,
  Transitions extends readonly KpSemanticStateTransitionCapabilitySource[]
>(input: {
  readonly handle: KpSemanticStateCompositionMemberHandle<Parameters>;
  readonly applied: KpSemanticStateCompositionAppliedMember<Root>;
  readonly definition: KpSemanticStateFamilyDefinition<
    Root,
    Parameters,
    Transitions
  >;
}): KpSemanticStateCompositionMemberEvaluatorBinding<Root> {
  const application = input.applied.application as
    KpAppliedSemanticStateFamily<Root, Parameters>;
  if (input.handle.id !== input.applied.memberId ||
    input.handle.definitionId !== application.definitionId ||
    input.handle.transformationId !== application.transformationId ||
    input.definition.id !== application.definitionId) {
    fail(
      "member-evaluator-binding-mismatch",
      `Member ${JSON.stringify(input.handle.id)} does not match its applied family evaluator authority.`
    );
  }
  return Object.freeze({
    schemaVersion:
      "kp.semantic-state-composition-member-evaluator-binding.v1" as const,
    kind: "semantic-state-composition-member-evaluator-binding" as const,
    memberId: input.applied.memberId,
    definitionId: application.definitionId,
    transformationId: application.transformationId,
    applied: input.applied,
    createEvaluator(options: {
      readonly sampleCacheCapacity?: number;
    } = {}) {
      return createKpSemanticStateFamilyEvaluator({
        definition: input.definition,
        application,
        ...(options.sampleCacheCapacity === undefined
          ? {}
          : { sampleCacheCapacity: options.sampleCacheCapacity })
      });
    }
  });
}

/**
 * Ordered leaf transitions sample from their own adjacent retained boundaries.
 * Independent cohorts need simultaneous overlays, so their private endpoint
 * execution order is intentionally unavailable through this resolver.
 */
export function createKpSemanticStateCompositionMemberTransitionResolver<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(input: {
  readonly chain: KpSemanticStateCompositionEndpointChain<Root>;
  readonly handles: KpSemanticStateCompositionHandleSet;
  readonly bindings:
    readonly KpSemanticStateCompositionMemberEvaluatorBinding<Root>[];
}): KpSemanticStateCompositionMemberTransitionResolver<Root> {
  validateHandleAlignment(input.chain, input.handles);
  const bindingByMember = indexBindings(input.bindings);
  const entries = new Map<string, KpOrderedMemberEntry<Root>>();

  for (const step of input.chain.composition.steps) {
    if (step.kind !== "member-step") continue;
    const member = step.members[0];
    const beforeBoundary = input.chain.boundaries[step.stepIndex];
    const afterBoundary = input.chain.boundaries[step.stepIndex + 1];
    const handle = member === undefined ? undefined : input.handles.members
      .find(candidate => candidate.id === member.id);
    const applied = member === undefined ? undefined : input.chain.applications
      .find(candidate => candidate.memberId === member.id);
    const binding = member === undefined ? undefined : bindingByMember.get(
      member.id
    );
    if (member === undefined || beforeBoundary === undefined ||
      afterBoundary === undefined || handle === undefined ||
      applied === undefined || binding === undefined) {
      fail(
        "missing-member-evaluator-binding",
        `Ordered composition step ${step.stepIndex} lacks complete member evaluator authority.`
      );
    }
    bindingByMember.delete(member.id);
    if (step.members.length !== 1 || applied.stepIndex !== step.stepIndex ||
      applied.member !== member || binding.applied !== applied ||
      binding.definitionId !== member.application.definitionId ||
      binding.transformationId !== member.application.transformationId) {
      fail(
        "member-evaluator-binding-mismatch",
        `Ordered member ${JSON.stringify(member.id)} does not match its compiled and applied evaluator authority.`
      );
    }
    if (applied.application.commit.before !== beforeBoundary.snapshot ||
      applied.application.commit.after !== afterBoundary.snapshot) {
      fail(
        "member-boundary-mismatch",
        `Ordered member ${JSON.stringify(member.id)} is not bounded by its retained adjacent snapshots.`
      );
    }
    entries.set(member.id, Object.freeze({
      handle,
      applied,
      beforeBoundary,
      afterBoundary,
      evaluator: binding.createEvaluator({ sampleCacheCapacity: 0 })
    }));
  }

  const unexpected = bindingByMember.values().next().value as
    KpSemanticStateCompositionMemberEvaluatorBinding<Root> | undefined;
  if (unexpected !== undefined) {
    fail(
      "unexpected-member-evaluator-binding",
      `Member evaluator binding ${JSON.stringify(unexpected.memberId)} does not belong to an ordered composition step.`
    );
  }

  const resolveAddress = (
    address: KpInTransitionSemanticStateCompositionAddress
  ): KpSemanticStateCompositionMemberTransitionResolution<Root> => {
    if (address.compositionId !== input.chain.composition.id) {
      fail(
        "foreign-transition-address",
        `Transition address belongs to composition ${JSON.stringify(address.compositionId)}, not ${JSON.stringify(input.chain.composition.id)}.`
      );
    }
    if (address.target.kind !== "semantic-state-composition-member-handle") {
      fail(
        "independent-transition-not-supported",
        `Independent cohort ${JSON.stringify(address.target.id)} requires aggregate overlay resolution.`
      );
    }
    const entry = entries.get(address.target.id);
    if (entry === undefined || entry.handle.id !== address.target.id) {
      const knownMember = input.handles.members.some(
        candidate => candidate.id === address.target.id
      );
      fail(
        knownMember
          ? "independent-transition-not-supported"
          : "unknown-transition-member",
        `Transition member ${JSON.stringify(address.target.id)} is not an ordered leaf of this composition.`
      );
    }
    let progress: KpSemanticProgress;
    try {
      progress = decodeKpSemanticProgress(address.progress);
    } catch {
      fail(
        "invalid-transition-progress",
        `Transition member ${JSON.stringify(address.target.id)} has invalid exact progress.`
      );
    }
    const canonicalAddress =
      createKpInTransitionSemanticStateCompositionAddress({
        handles: input.handles,
        target: entry.handle,
        progress
      });
    return Object.freeze({
      schemaVersion:
        "kp.semantic-state-composition-member-transition-resolution.v1",
      kind: "semantic-state-composition-member-transition-resolution",
      address: canonicalAddress,
      handle: entry.handle,
      applied: entry.applied,
      beforeBoundary: entry.beforeBoundary,
      afterBoundary: entry.afterBoundary,
      progress,
      sample: entry.evaluator.at(progress)
    });
  };

  return Object.freeze({
    schemaVersion:
      "kp.semantic-state-composition-member-transition-resolver.v1",
    kind: "semantic-state-composition-member-transition-resolver",
    compositionId: input.chain.composition.id,
    resolveMember(
      handle: KpSemanticStateCompositionMemberHandle,
      progress: KpSemanticProgress
    ) {
      return resolveAddress(createKpInTransitionSemanticStateCompositionAddress({
        handles: input.handles,
        target: handle,
        progress
      }));
    },
    resolveAddress
  });
}

interface KpOrderedMemberEntry<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly handle: KpSemanticStateCompositionMemberHandle;
  readonly applied: KpSemanticStateCompositionAppliedMember<Root>;
  readonly beforeBoundary: KpSemanticStateCompositionSettledBoundary;
  readonly afterBoundary: KpSemanticStateCompositionSettledBoundary;
  readonly evaluator: KpSemanticStateFamilyEvaluator<Root>;
}

function validateHandleAlignment<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(
  chain: KpSemanticStateCompositionEndpointChain<Root>,
  handles: KpSemanticStateCompositionHandleSet
): void {
  if (handles.composition.id !== chain.composition.id ||
    handles.members.length !== chain.composition.members.length ||
    !handles.members.every(handle => chain.composition.members.some(member =>
      member.id === handle.id &&
      member.application.definitionId === handle.definitionId &&
      member.application.transformationId === handle.transformationId
    ))) {
    fail(
      "composition-handle-mismatch",
      `Generated handles do not describe composition ${JSON.stringify(chain.composition.id)}.`
    );
  }
}

function indexBindings<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(bindings: readonly KpSemanticStateCompositionMemberEvaluatorBinding<Root>[]):
Map<string, KpSemanticStateCompositionMemberEvaluatorBinding<Root>> {
  const index = new Map<
    string,
    KpSemanticStateCompositionMemberEvaluatorBinding<Root>
  >();
  for (const binding of bindings) {
    if (index.has(binding.memberId)) {
      fail(
        "duplicate-member-evaluator-binding",
        `Composition repeats member evaluator binding ${JSON.stringify(binding.memberId)}.`
      );
    }
    index.set(binding.memberId, binding);
  }
  return index;
}

function fail(
  code: KpSemanticStateCompositionMemberResolverErrorCode,
  message: string
): never {
  throw new KpSemanticStateCompositionMemberResolverError(code, message);
}
