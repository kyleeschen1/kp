import type {
  KpSemanticStateGroupDescriptor,
  KpSemanticStateMemberMap
} from "./authoring-schema.ts";
import {
  decodeKpSemanticProgress,
  isKpSemanticProgressOne,
  isKpSemanticProgressZero,
  type KpSemanticProgress
} from "./semantic-progress.ts";
import {
  createKpInTransitionSemanticStateCompositionAddress,
  type KpInTransitionSemanticStateCompositionAddress
} from "./state-family-composition-address.ts";
import type {
  KpSemanticStateCompositionAppliedMember,
  KpSemanticStateCompositionEndpointChain,
  KpSemanticStateCompositionSettledBoundary
} from "./state-family-composition-endpoints.ts";
import type {
  KpSemanticStateCompositionGroupHandle,
  KpSemanticStateCompositionHandleSet
} from "./state-family-composition-handles.ts";
import type {
  KpSemanticStateCompositionMemberEvaluatorBinding
} from "./state-family-composition-member-resolver.ts";
import {
  adaptKpSnapshotToSemanticStateReadSource,
  createKpAggregateEphemeralSemanticStateReadSource,
  type KpAggregateEphemeralSemanticStateReadSource,
  type KpEphemeralSemanticStateReadSource,
  type KpPersistentSemanticStateReadSource
} from "./state-family-sample-source.ts";
import type {
  KpSemanticStateFamilyEvaluator
} from "./state-family-evaluator.ts";
import type {
  KpSemanticStatePresentationTransitionDeclaration,
  KpSemanticStateTransitionDeclaration
} from "./state-family-transition.ts";

export interface KpSemanticStateCompositionTransitionAuthority<
  Declaration extends KpSemanticStateTransitionDeclaration =
    KpSemanticStateTransitionDeclaration
> {
  readonly schemaVersion:
    "kp.semantic-state-composition-transition-authority.v1";
  readonly kind: "semantic-state-composition-transition-authority";
  readonly memberId: KpSemanticStateCompositionAppliedMember<
    KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
  >["memberId"];
  readonly definitionId: KpSemanticStateCompositionAppliedMember<
    KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
  >["application"]["definitionId"];
  readonly transformationId: KpSemanticStateCompositionAppliedMember<
    KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
  >["application"]["transformationId"];
  readonly applicationId: string;
  readonly declaration: Declaration;
}

export type KpSemanticStateCompositionPresentationTransitionAuthority =
  KpSemanticStateCompositionTransitionAuthority<
    KpSemanticStatePresentationTransitionDeclaration<unknown>
  >;

export interface KpPersistentSemanticStateCompositionCohortSample {
  readonly schemaVersion:
    "kp.semantic-state-composition-cohort-sample.v1";
  readonly kind: "persistent-endpoint";
  readonly endpoint: "before" | "after";
  readonly progress: KpSemanticProgress;
  readonly source: KpPersistentSemanticStateReadSource;
}

export interface KpEphemeralSemanticStateCompositionCohortSample {
  readonly schemaVersion:
    "kp.semantic-state-composition-cohort-sample.v1";
  readonly kind: "ephemeral-interior";
  readonly progress: KpSemanticProgress;
  readonly source: KpAggregateEphemeralSemanticStateReadSource;
  readonly presentationTransitions:
    readonly KpSemanticStateCompositionPresentationTransitionAuthority[];
}

export type KpSemanticStateCompositionCohortSample =
  | KpPersistentSemanticStateCompositionCohortSample
  | KpEphemeralSemanticStateCompositionCohortSample;

export interface KpSemanticStateCompositionCohortResolution<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion:
    "kp.semantic-state-composition-cohort-resolution.v1";
  readonly kind: "semantic-state-composition-cohort-resolution";
  readonly address: KpInTransitionSemanticStateCompositionAddress;
  readonly handle: KpSemanticStateCompositionGroupHandle<"independent">;
  readonly applications:
    readonly KpSemanticStateCompositionAppliedMember<Root>[];
  readonly transitionAuthority:
    readonly KpSemanticStateCompositionTransitionAuthority[];
  readonly beforeBoundary: KpSemanticStateCompositionSettledBoundary;
  readonly afterBoundary: KpSemanticStateCompositionSettledBoundary;
  readonly progress: KpSemanticProgress;
  readonly sample: KpSemanticStateCompositionCohortSample;
}

export interface KpSemanticStateCompositionCohortResolver<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion:
    "kp.semantic-state-composition-cohort-resolver.v1";
  readonly kind: "semantic-state-composition-cohort-resolver";
  readonly compositionId:
    KpSemanticStateCompositionEndpointChain<Root>["composition"]["id"];
  resolveCohort(
    handle: KpSemanticStateCompositionGroupHandle<"independent">,
    progress: KpSemanticProgress
  ): KpSemanticStateCompositionCohortResolution<Root>;
  resolveAddress(
    address: KpInTransitionSemanticStateCompositionAddress
  ): KpSemanticStateCompositionCohortResolution<Root>;
}

export type KpSemanticStateCompositionCohortResolverErrorCode =
  | "cohort-application-mismatch"
  | "composition-handle-mismatch"
  | "duplicate-cohort-evaluator-binding"
  | "foreign-cohort-address"
  | "invalid-cohort-progress"
  | "member-transition-not-supported"
  | "missing-cohort-evaluator-binding"
  | "unknown-independent-cohort"
  | "unexpected-cohort-evaluator-binding";

export class KpSemanticStateCompositionCohortResolverError extends Error {
  readonly code: KpSemanticStateCompositionCohortResolverErrorCode;

  constructor(
    code: KpSemanticStateCompositionCohortResolverErrorCode,
    message: string
  ) {
    super(message);
    this.name = "KpSemanticStateCompositionCohortResolverError";
    this.code = code;
  }
}

/**
 * Cohort members are evaluated independently, then only their concrete driver
 * overlays are joined over the cohort's one retained before boundary.
 */
export function createKpSemanticStateCompositionCohortResolver<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(input: {
  readonly chain: KpSemanticStateCompositionEndpointChain<Root>;
  readonly handles: KpSemanticStateCompositionHandleSet;
  readonly bindings:
    readonly KpSemanticStateCompositionMemberEvaluatorBinding<Root>[];
}): KpSemanticStateCompositionCohortResolver<Root> {
  validateHandleAlignment(input.chain, input.handles);
  const bindingByMember = indexBindings(input.bindings);
  const entries = new Map<string, KpIndependentCohortEntry<Root>>();

  for (const step of input.chain.composition.steps) {
    if (step.kind !== "independent-step") continue;
    const canonicalHandle = input.handles.groups.find(candidate =>
      candidate.nodeKind === "independent" &&
      candidate.path.length === step.path.length &&
      candidate.path.every((segment, index) => segment === step.path[index])
    ) as KpSemanticStateCompositionGroupHandle<"independent"> | undefined;
    const beforeBoundary = input.chain.boundaries[step.stepIndex];
    const afterBoundary = input.chain.boundaries[step.stepIndex + 1];
    if (canonicalHandle === undefined || beforeBoundary === undefined ||
      afterBoundary === undefined) {
      fail(
        "unknown-independent-cohort",
        `Independent composition step ${step.stepIndex} has no aligned handle and retained boundaries.`
      );
    }
    const members = step.members.map(member => {
      const applied = input.chain.applications.find(candidate =>
        candidate.stepIndex === step.stepIndex &&
        candidate.memberId === member.id
      );
      const binding = bindingByMember.get(member.id);
      if (applied === undefined || binding === undefined) {
        fail(
          "missing-cohort-evaluator-binding",
          `Independent member ${JSON.stringify(member.id)} has no applied evaluator binding.`
        );
      }
      bindingByMember.delete(member.id);
      if (applied.member !== member || binding.applied !== applied ||
        binding.definitionId !== member.application.definitionId ||
        binding.transformationId !== member.application.transformationId) {
        fail(
          "cohort-application-mismatch",
          `Independent member ${JSON.stringify(member.id)} does not match its compiled and applied evaluator authority.`
        );
      }
      return Object.freeze({
        applied,
        evaluator: binding.createEvaluator({ sampleCacheCapacity: 0 })
      });
    });
    const transitionAuthority = Object.freeze(members.flatMap(({ applied }) =>
      applied.application.transitionPlan.declarations.map(declaration =>
        Object.freeze({
          schemaVersion:
            "kp.semantic-state-composition-transition-authority.v1" as const,
          kind: "semantic-state-composition-transition-authority" as const,
          memberId: applied.memberId,
          definitionId: applied.application.definitionId,
          transformationId: applied.application.transformationId,
          applicationId: applied.application.applicationId,
          declaration
        }))
    ));
    entries.set(canonicalHandle.id, Object.freeze({
      handle: canonicalHandle,
      members: Object.freeze(members),
      transitionAuthority,
      beforeBoundary,
      afterBoundary
    }));
  }

  const unexpected = bindingByMember.values().next().value as
    KpSemanticStateCompositionMemberEvaluatorBinding<Root> | undefined;
  if (unexpected !== undefined) {
    fail(
      "unexpected-cohort-evaluator-binding",
      `Member evaluator binding ${JSON.stringify(unexpected.memberId)} does not belong to an independent cohort.`
    );
  }

  const resolveAddress = (
    address: KpInTransitionSemanticStateCompositionAddress
  ): KpSemanticStateCompositionCohortResolution<Root> => {
    if (address.compositionId !== input.chain.composition.id) {
      fail(
        "foreign-cohort-address",
        `Cohort address belongs to composition ${JSON.stringify(address.compositionId)}, not ${JSON.stringify(input.chain.composition.id)}.`
      );
    }
    if (address.target.kind !== "semantic-state-composition-group-handle") {
      fail(
        "member-transition-not-supported",
        `Member ${JSON.stringify(address.target.id)} requires ordered leaf resolution.`
      );
    }
    const entry = entries.get(address.target.id);
    if (entry === undefined || entry.handle.id !== address.target.id) {
      fail(
        "unknown-independent-cohort",
        `Transition target ${JSON.stringify(address.target.id)} is not an independent cohort of this composition.`
      );
    }
    let progress: KpSemanticProgress;
    try {
      progress = decodeKpSemanticProgress(address.progress);
    } catch {
      fail(
        "invalid-cohort-progress",
        `Independent cohort ${JSON.stringify(address.target.id)} has invalid exact progress.`
      );
    }
    const canonicalAddress =
      createKpInTransitionSemanticStateCompositionAddress({
        handles: input.handles,
        target: entry.handle,
        progress
      });
    return Object.freeze({
      schemaVersion: "kp.semantic-state-composition-cohort-resolution.v1",
      kind: "semantic-state-composition-cohort-resolution",
      address: canonicalAddress,
      handle: entry.handle,
      applications: Object.freeze(entry.members.map(({ applied }) => applied)),
      transitionAuthority: entry.transitionAuthority,
      beforeBoundary: entry.beforeBoundary,
      afterBoundary: entry.afterBoundary,
      progress,
      sample: sampleCohort({
        chain: input.chain,
        entry,
        progress
      })
    });
  };

  return Object.freeze({
    schemaVersion: "kp.semantic-state-composition-cohort-resolver.v1",
    kind: "semantic-state-composition-cohort-resolver",
    compositionId: input.chain.composition.id,
    resolveCohort(
      handle: KpSemanticStateCompositionGroupHandle<"independent">,
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

interface KpIndependentCohortMember<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly applied: KpSemanticStateCompositionAppliedMember<Root>;
  readonly evaluator: KpSemanticStateFamilyEvaluator<Root>;
}

interface KpIndependentCohortEntry<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly handle: KpSemanticStateCompositionGroupHandle<"independent">;
  readonly members: readonly KpIndependentCohortMember<Root>[];
  readonly transitionAuthority:
    readonly KpSemanticStateCompositionTransitionAuthority[];
  readonly beforeBoundary: KpSemanticStateCompositionSettledBoundary;
  readonly afterBoundary: KpSemanticStateCompositionSettledBoundary;
}

function sampleCohort<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(input: {
  readonly chain: KpSemanticStateCompositionEndpointChain<Root>;
  readonly entry: KpIndependentCohortEntry<Root>;
  readonly progress: KpSemanticProgress;
}): KpSemanticStateCompositionCohortSample {
  if (isKpSemanticProgressZero(input.progress)) {
    return Object.freeze({
      schemaVersion: "kp.semantic-state-composition-cohort-sample.v1",
      kind: "persistent-endpoint",
      endpoint: "before",
      progress: input.progress,
      source: adaptKpSnapshotToSemanticStateReadSource(
        input.entry.beforeBoundary.snapshot
      )
    });
  }
  if (isKpSemanticProgressOne(input.progress)) {
    return Object.freeze({
      schemaVersion: "kp.semantic-state-composition-cohort-sample.v1",
      kind: "persistent-endpoint",
      endpoint: "after",
      progress: input.progress,
      source: adaptKpSnapshotToSemanticStateReadSource(
        input.entry.afterBoundary.snapshot
      )
    });
  }
  const samples = input.entry.members.map(({ evaluator }) => {
    const sample = evaluator.at(input.progress);
    if (sample.kind !== "ephemeral-interior") {
      fail(
        "invalid-cohort-progress",
        "Interior cohort progress unexpectedly resolved to a persistent member endpoint."
      );
    }
    return sample;
  });
  const sources: readonly KpEphemeralSemanticStateReadSource[] =
    samples.map(({ source }) => source);
  return Object.freeze({
    schemaVersion: "kp.semantic-state-composition-cohort-sample.v1",
    kind: "ephemeral-interior",
    progress: input.progress,
    source: createKpAggregateEphemeralSemanticStateReadSource({
      compositionId: input.chain.composition.id,
      cohortId: input.entry.handle.id,
      progress: input.progress,
      base: input.entry.beforeBoundary.snapshot,
      sources
    }),
    presentationTransitions: Object.freeze(
      input.entry.transitionAuthority.filter(
        hasPresentationTransitionAuthority
      )
    )
  });
}

function hasPresentationTransitionAuthority(
  authority: KpSemanticStateCompositionTransitionAuthority
): authority is KpSemanticStateCompositionPresentationTransitionAuthority {
  return authority.declaration.transitionMode === "presentation-only";
}

function validateHandleAlignment<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(
  chain: KpSemanticStateCompositionEndpointChain<Root>,
  handles: KpSemanticStateCompositionHandleSet
): void {
  if (handles.composition.id !== chain.composition.id ||
    handles.groups.length !== chain.composition.groups.length ||
    !handles.groups.every(handle => chain.composition.groups.some(group =>
      group.id === handle.id && group.kind === handle.nodeKind
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
        "duplicate-cohort-evaluator-binding",
        `Independent cohort repeats evaluator binding ${JSON.stringify(binding.memberId)}.`
      );
    }
    index.set(binding.memberId, binding);
  }
  return index;
}

function fail(
  code: KpSemanticStateCompositionCohortResolverErrorCode,
  message: string
): never {
  throw new KpSemanticStateCompositionCohortResolverError(code, message);
}
