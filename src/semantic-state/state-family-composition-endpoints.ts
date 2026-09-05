import {
  readKpSemanticSlotBinding,
  readKpSnapshotEntityStore,
  type KpAggregateSemanticSnapshot
} from "./aggregate-snapshot.ts";
import type {
  KpSemanticStateGroupDescriptor,
  KpSemanticStateMemberMap
} from "./authoring-schema.ts";
import { evaluateKpSemanticDerivedGraphTargetValue } from
  "./derived-evaluator.ts";
import type { KpSemanticDerivedGraph } from "./derived-graph.ts";
import { readKpSemanticEntityVersion } from "./entity-version-store.ts";
import type {
  KpAppliedTransformationId,
  KpSemanticCompositionBoundaryId,
  KpSemanticCompositionMemberId,
  KpSemanticSlotId,
  KpTransformationDefinitionId
} from "./identity.ts";
import type {
  KpAppliedSemanticStateFamily,
  KpSemanticStateFamilyApplicationRecord,
  KpSemanticStateFamilyDefinition,
  KpSemanticStateTransitionCapabilitySource
} from "./state-family-definition.ts";
import type {
  KpCompiledSemanticStateComposition,
  KpCompiledSemanticStateCompositionMember,
  KpSemanticStateCompositionBoundarySpecification
} from "./state-family-composition-compiler.ts";
import { projectKpSemanticStateCompositionGraphSignature } from
  "./state-family-composition-preflight.ts";
import { areKpSemanticStateTransitionPlansEqual } from
  "./state-family-transition.ts";
import { kpSemanticStateIndependentCohortMaximumMembers } from
  "./state-family-composition-declaration.ts";

export interface KpSemanticStateCompositionEndpointBinding<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion:
    "kp.semantic-state-composition-endpoint-binding.v1";
  readonly kind: "semantic-state-composition-endpoint-binding";
  readonly definitionId: KpTransformationDefinitionId;
  readonly transformationId: KpAppliedTransformationId;
  readonly application: KpSemanticStateFamilyApplicationRecord<unknown>;
  validate(): void;
  apply(
    before: KpAggregateSemanticSnapshot
  ): KpAppliedSemanticStateFamily<Root, unknown>;
}

export interface KpSemanticStateCompositionAppliedMember<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion: "kp.semantic-state-composition-applied-member.v1";
  readonly kind: "semantic-state-composition-applied-member";
  readonly stepIndex: number;
  readonly memberId: KpSemanticCompositionMemberId;
  readonly member: KpCompiledSemanticStateCompositionMember;
  readonly application: KpAppliedSemanticStateFamily<Root, unknown>;
}

export interface KpSemanticStateCompositionSettledBoundary {
  readonly schemaVersion: "kp.semantic-state-composition-settled-boundary.v1";
  readonly kind: "semantic-state-composition-settled-boundary";
  readonly id: KpSemanticCompositionBoundaryId;
  readonly specification: KpSemanticStateCompositionBoundarySpecification;
  readonly snapshot: KpAggregateSemanticSnapshot;
}

export interface KpSemanticStateCompositionConfluenceCertificate {
  readonly schemaVersion:
    "kp.semantic-state-composition-confluence-certificate.v1";
  readonly kind: "semantic-state-composition-confluence-certificate";
  readonly stepIndex: number;
  readonly canonicalMemberIds: readonly KpSemanticCompositionMemberId[];
  readonly oppositeMemberIds: readonly KpSemanticCompositionMemberId[];
  readonly affectedSlotIds: readonly KpSemanticSlotId[];
  readonly checkedSlotIds: readonly KpSemanticSlotId[];
  readonly checkedDerivedSlotIds: readonly KpSemanticSlotId[];
  readonly canonicalEndpointId: KpAggregateSemanticSnapshot["id"];
  readonly valueEquivalent: true;
}

export interface KpSemanticStateCompositionEndpointChain<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion: "kp.semantic-state-composition-endpoint-chain.v1";
  readonly kind: "semantic-state-composition-endpoint-chain";
  readonly composition: KpCompiledSemanticStateComposition;
  readonly before: KpAggregateSemanticSnapshot;
  readonly after: KpAggregateSemanticSnapshot;
  readonly applications:
    readonly KpSemanticStateCompositionAppliedMember<Root>[];
  readonly boundaries: readonly KpSemanticStateCompositionSettledBoundary[];
  readonly confluence:
    readonly KpSemanticStateCompositionConfluenceCertificate[];
}

export type KpSemanticStateCompositionEndpointErrorCode =
  | "application-binding-mismatch"
  | "discontinuous-endpoint-chain"
  | "duplicate-endpoint-binding"
  | "foreign-composition-base"
  | "independent-confluence-failed"
  | "incompatible-confluence-graph"
  | "missing-endpoint-binding"
  | "missing-confluence-graph"
  | "unexpected-endpoint-binding"
  | "unsupported-independent-cohort-size";

export class KpSemanticStateCompositionEndpointError extends Error {
  readonly code: KpSemanticStateCompositionEndpointErrorCode;
  readonly stepIndex?: number;
  readonly memberId?: KpSemanticCompositionMemberId;
  readonly slotId?: KpSemanticSlotId;

  constructor(input: {
    readonly code: KpSemanticStateCompositionEndpointErrorCode;
    readonly message: string;
    readonly stepIndex?: number;
    readonly memberId?: KpSemanticCompositionMemberId;
    readonly slotId?: KpSemanticSlotId;
  }) {
    super(input.message);
    this.name = "KpSemanticStateCompositionEndpointError";
    this.code = input.code;
    if (input.stepIndex !== undefined) this.stepIndex = input.stepIndex;
    if (input.memberId !== undefined) this.memberId = input.memberId;
    if (input.slotId !== undefined) this.slotId = input.slotId;
  }
}

export function bindKpSemanticStateCompositionEndpoint<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  Parameters,
  TransitionCapabilities extends
    readonly KpSemanticStateTransitionCapabilitySource[]
>(input: {
  readonly definition: KpSemanticStateFamilyDefinition<
    Root,
    Parameters,
    TransitionCapabilities
  >;
  readonly application: KpSemanticStateFamilyApplicationRecord<Parameters>;
}): KpSemanticStateCompositionEndpointBinding<Root> {
  const application = input.application;
  input.definition.validatePreparedApplication(application);
  if (application.definitionId !== input.definition.id ||
    !areKpSemanticStateTransitionPlansEqual(
      application.transitionPlan,
      input.definition.declaration.transitionPlan
    )) {
    fail({
      code: "application-binding-mismatch",
      message: `Prepared application ${JSON.stringify(application.transformationId)} does not belong to family definition ${JSON.stringify(input.definition.id)}.`
    });
  }
  return Object.freeze({
    schemaVersion:
      "kp.semantic-state-composition-endpoint-binding.v1" as const,
    kind: "semantic-state-composition-endpoint-binding" as const,
    definitionId: input.definition.id,
    transformationId: application.transformationId,
    application,
    validate() {
      input.definition.validatePreparedApplication(application);
    },
    apply(before: KpAggregateSemanticSnapshot) {
      return input.definition.applyPreparedApplication(before, application);
    }
  });
}

export function assembleKpSemanticStateCompositionEndpointChain<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(input: {
  readonly composition: KpCompiledSemanticStateComposition;
  readonly base: KpAggregateSemanticSnapshot;
  readonly bindings: readonly KpSemanticStateCompositionEndpointBinding<Root>[];
  readonly graph?: KpSemanticDerivedGraph;
}): KpSemanticStateCompositionEndpointChain<Root> {
  validateExecutionInput(input);

  const bindingByTransformation = new Map<
    KpAppliedTransformationId,
    KpSemanticStateCompositionEndpointBinding<Root>
  >(input.bindings.map(binding => [binding.transformationId, binding]));
  const applications: KpSemanticStateCompositionAppliedMember<Root>[] = [];
  const boundaries: KpSemanticStateCompositionSettledBoundary[] = [
    settleBoundary(input.composition.boundaries[0]!, input.base)
  ];
  const confluence: KpSemanticStateCompositionConfluenceCertificate[] = [];
  let cursor = input.base;

  for (const step of input.composition.steps) {
    if (step.kind === "member-step") {
      const executed = applyMembers({
        members: step.members,
        before: cursor,
        stepIndex: step.stepIndex,
        bindingByTransformation
      });
      applications.push(...executed.applications);
      cursor = executed.after;
    } else {
      const canonical = applyMembers({
        members: step.members,
        before: cursor,
        stepIndex: step.stepIndex,
        bindingByTransformation
      });
      const oppositeMembers = [...step.members].reverse();
      const opposite = applyMembers({
        members: oppositeMembers,
        before: cursor,
        stepIndex: step.stepIndex,
        bindingByTransformation
      });
      const graph = input.graph!;
      const comparison = assertSnapshotsValueEquivalent({
        canonical: canonical.after,
        opposite: opposite.after,
        graph,
        stepIndex: step.stepIndex
      });
      applications.push(...canonical.applications);
      cursor = canonical.after;
      const affectedSlotIds = [...new Set(step.members.flatMap(member => [
        ...member.footprint.semanticWrites,
        ...member.footprint.discreteWrites
      ]).map(({ target }) => target.slotId))].sort();
      confluence.push(Object.freeze({
        schemaVersion:
          "kp.semantic-state-composition-confluence-certificate.v1",
        kind: "semantic-state-composition-confluence-certificate",
        stepIndex: step.stepIndex,
        canonicalMemberIds: Object.freeze(step.members.map(({ id }) => id)),
        oppositeMemberIds: Object.freeze(oppositeMembers.map(({ id }) => id)),
        affectedSlotIds: Object.freeze(affectedSlotIds),
        checkedSlotIds: comparison.checkedSlotIds,
        checkedDerivedSlotIds: comparison.checkedDerivedSlotIds,
        canonicalEndpointId: canonical.after.id,
        valueEquivalent: true
      }));
    }
    boundaries.push(settleBoundary(
      input.composition.boundaries[step.stepIndex + 1]!,
      cursor
    ));
  }

  // Nothing from the mutable assembly workspace escapes until every existing
  // family application has completed and the complete chain can be frozen.
  return Object.freeze({
    schemaVersion: "kp.semantic-state-composition-endpoint-chain.v1",
    kind: "semantic-state-composition-endpoint-chain",
    composition: input.composition,
    before: input.base,
    after: cursor,
    applications: Object.freeze(applications),
    boundaries: Object.freeze(boundaries),
    confluence: Object.freeze(confluence)
  });
}

function applyMembers<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(input: {
  readonly members: readonly KpCompiledSemanticStateCompositionMember[];
  readonly before: KpAggregateSemanticSnapshot;
  readonly stepIndex: number;
  readonly bindingByTransformation: ReadonlyMap<
    KpAppliedTransformationId,
    KpSemanticStateCompositionEndpointBinding<Root>
  >;
}): {
  readonly after: KpAggregateSemanticSnapshot;
  readonly applications:
    readonly KpSemanticStateCompositionAppliedMember<Root>[];
} {
  let cursor = input.before;
  const applications: KpSemanticStateCompositionAppliedMember<Root>[] = [];
  for (const member of input.members) {
    const binding = input.bindingByTransformation.get(
      member.application.transformationId
    )!;
    const applied = binding.apply(cursor);
    if (applied.commit.before !== cursor) {
      fail({
        code: "discontinuous-endpoint-chain",
        stepIndex: input.stepIndex,
        memberId: member.id,
        message: `Composition member ${JSON.stringify(member.id)} did not preserve the existing family endpoint chain.`
      });
    }
    applications.push(Object.freeze({
      schemaVersion: "kp.semantic-state-composition-applied-member.v1",
      kind: "semantic-state-composition-applied-member",
      stepIndex: input.stepIndex,
      memberId: member.id,
      member,
      application: applied
    }));
    cursor = applied.commit.after;
  }
  return { after: cursor, applications };
}

function validateExecutionInput<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(input: {
  readonly composition: KpCompiledSemanticStateComposition;
  readonly base: KpAggregateSemanticSnapshot;
  readonly bindings: readonly KpSemanticStateCompositionEndpointBinding<Root>[];
  readonly graph?: KpSemanticDerivedGraph;
}): void {
  if (input.base.id !== input.composition.baseSnapshotId ||
    input.base.namespace !== input.composition.namespace) {
    fail({
      code: "foreign-composition-base",
      message: `Composition ${JSON.stringify(input.composition.id)} cannot execute from snapshot ${JSON.stringify(input.base.id)}.`
    });
  }
  const byTransformation = new Map<
    KpAppliedTransformationId,
    KpSemanticStateCompositionEndpointBinding<Root>
  >();
  const hasIndependentStep = input.composition.steps.some(
    ({ kind }) => kind === "independent-step"
  );
  // Reconstructed executable records must not bypass the declaration bound.
  // Check the complete plan before any endpoint callback is invoked.
  for (const step of input.composition.steps) {
    if (step.kind === "independent-step" &&
        step.members.length > kpSemanticStateIndependentCohortMaximumMembers) {
      fail({
        code: "unsupported-independent-cohort-size",
        stepIndex: step.stepIndex,
        message: "Independent endpoint-order checking supports at most two members."
      });
    }
  }
  if (hasIndependentStep && input.graph === undefined) {
    fail({
      code: "missing-confluence-graph",
      message: `Composition ${JSON.stringify(input.composition.id)} requires its preflight derived graph to certify an independent cohort.`
    });
  }
  if (input.graph !== undefined &&
    (input.graph.namespace !== input.composition.namespace ||
      projectKpSemanticStateCompositionGraphSignature(input.graph) !==
        input.composition.graphSignature)) {
    fail({
      code: "incompatible-confluence-graph",
      message: `Derived graph for composition ${JSON.stringify(input.composition.id)} does not match its preflight graph authority.`
    });
  }
  for (const binding of input.bindings) {
    binding.validate();
    if (byTransformation.has(binding.transformationId)) {
      fail({
        code: "duplicate-endpoint-binding",
        message: `Composition endpoint binding ${JSON.stringify(binding.transformationId)} is supplied more than once.`
      });
    }
    byTransformation.set(binding.transformationId, binding);
  }

  for (const step of input.composition.steps) {
    for (const member of step.members) {
      const binding = byTransformation.get(
        member.application.transformationId
      );
      if (binding === undefined) {
        fail({
          code: "missing-endpoint-binding",
          stepIndex: step.stepIndex,
          memberId: member.id,
          message: `Composition member ${JSON.stringify(member.id)} has no endpoint family binding.`
        });
      }
      if (binding.definitionId !== member.application.definitionId ||
        !arePreparedApplicationsEqual(
          binding.application,
          member.application
        )) {
        fail({
          code: "application-binding-mismatch",
          stepIndex: step.stepIndex,
          memberId: member.id,
          message: `Composition member ${JSON.stringify(member.id)} does not match its prepared endpoint application.`
        });
      }
      byTransformation.delete(binding.transformationId);
    }
  }
  for (const unexpected of byTransformation.values()) {
    fail({
      code: "unexpected-endpoint-binding",
      message: `Endpoint binding ${JSON.stringify(unexpected.transformationId)} is not a member of composition ${JSON.stringify(input.composition.id)}.`
    });
  }
}

function assertSnapshotsValueEquivalent(input: {
  readonly canonical: KpAggregateSemanticSnapshot;
  readonly opposite: KpAggregateSemanticSnapshot;
  readonly graph: KpSemanticDerivedGraph;
  readonly stepIndex: number;
}): {
  readonly checkedSlotIds: readonly KpSemanticSlotId[];
  readonly checkedDerivedSlotIds: readonly KpSemanticSlotId[];
} {
  const checkedSlotIds = Object.freeze([
    ...input.canonical.requiredSlotIds,
    ...input.canonical.optionalSlotIds
  ].sort());
  const checkedDerivedSlotIds: KpSemanticSlotId[] = [];
  for (const slotId of checkedSlotIds) {
    const canonical = projectComparableSlotValue(
      input.canonical,
      input.graph,
      slotId
    );
    const opposite = projectComparableSlotValue(
      input.opposite,
      input.graph,
      slotId
    );
    if (canonical["kind"] === "derived") checkedDerivedSlotIds.push(slotId);
    if (!areStructuralValuesEqual(canonical, opposite)) {
      fail({
        code: "independent-confluence-failed",
        stepIndex: input.stepIndex,
        slotId,
        message: `Independent composition step ${input.stepIndex} is order-dependent at semantic slot ${JSON.stringify(slotId)}.`
      });
    }
  }
  return {
    checkedSlotIds,
    checkedDerivedSlotIds: Object.freeze(checkedDerivedSlotIds)
  };
}

function projectComparableSlotValue(
  snapshot: KpAggregateSemanticSnapshot,
  graph: KpSemanticDerivedGraph,
  slotId: KpSemanticSlotId
): Readonly<Record<string, unknown>> {
  if (snapshot.derivedBindingIndex[slotId] !== undefined) {
    return Object.freeze({
      kind: "derived",
      value: evaluateKpSemanticDerivedGraphTargetValue({
        graph,
        snapshot,
        targetSlotId: slotId
      })
    });
  }
  const absenceIndex = snapshot.absenceIndex[slotId];
  if (absenceIndex !== undefined) {
    const absence = snapshot.absences[absenceIndex]!;
    return Object.freeze({ kind: "absence", reason: absence.reason });
  }
  const binding = readKpSemanticSlotBinding(snapshot, slotId);
  const store = readKpSnapshotEntityStore(snapshot, binding.entityId);
  return Object.freeze({
    kind: "concrete",
    value: readKpSemanticEntityVersion(store, binding.versionId).value
  });
}

function settleBoundary(
  specification: KpSemanticStateCompositionBoundarySpecification,
  snapshot: KpAggregateSemanticSnapshot
): KpSemanticStateCompositionSettledBoundary {
  return Object.freeze({
    schemaVersion: "kp.semantic-state-composition-settled-boundary.v1",
    kind: "semantic-state-composition-settled-boundary",
    id: specification.id,
    specification,
    snapshot
  });
}

function arePreparedApplicationsEqual(
  left: KpSemanticStateFamilyApplicationRecord<unknown>,
  right: KpSemanticStateFamilyApplicationRecord<unknown>
): boolean {
  return left.definitionId === right.definitionId &&
    left.transformationId === right.transformationId &&
    left.applicationId === right.applicationId &&
    areKpSemanticStateTransitionPlansEqual(
      left.transitionPlan,
      right.transitionPlan
    ) && areStructuralValuesEqual(left.parameters, right.parameters) &&
    areStructuralValuesEqual(left.source, right.source);
}

function areStructuralValuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (typeof left !== "object" || left === null ||
    typeof right !== "object" || right === null ||
    Array.isArray(left) !== Array.isArray(right)) return false;
  if (Array.isArray(left) && Array.isArray(right)) {
    return left.length === right.length && left.every(
      (value, index) => areStructuralValuesEqual(value, right[index])
    );
  }
  const leftRecord = left as Readonly<Record<string, unknown>>;
  const rightRecord = right as Readonly<Record<string, unknown>>;
  const leftKeys = Object.keys(leftRecord).sort();
  const rightKeys = Object.keys(rightRecord).sort();
  return leftKeys.length === rightKeys.length && leftKeys.every(
    (key, index) => key === rightKeys[index] &&
      areStructuralValuesEqual(leftRecord[key], rightRecord[key])
  );
}

function fail(input: {
  readonly code: KpSemanticStateCompositionEndpointErrorCode;
  readonly message: string;
  readonly stepIndex?: number;
  readonly memberId?: KpSemanticCompositionMemberId;
  readonly slotId?: KpSemanticSlotId;
}): never {
  throw new KpSemanticStateCompositionEndpointError(input);
}
