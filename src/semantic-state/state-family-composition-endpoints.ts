import type { KpAggregateSemanticSnapshot } from "./aggregate-snapshot.ts";
import type {
  KpSemanticStateGroupDescriptor,
  KpSemanticStateMemberMap
} from "./authoring-schema.ts";
import type {
  KpAppliedTransformationId,
  KpSemanticCompositionBoundaryId,
  KpSemanticCompositionMemberId,
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
import { areKpSemanticStateTransitionPlansEqual } from
  "./state-family-transition.ts";

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
}

export type KpSemanticStateCompositionEndpointErrorCode =
  | "application-binding-mismatch"
  | "discontinuous-endpoint-chain"
  | "duplicate-endpoint-binding"
  | "foreign-composition-base"
  | "independent-endpoint-unsupported"
  | "missing-endpoint-binding"
  | "unexpected-endpoint-binding";

export class KpSemanticStateCompositionEndpointError extends Error {
  readonly code: KpSemanticStateCompositionEndpointErrorCode;
  readonly stepIndex?: number;
  readonly memberId?: KpSemanticCompositionMemberId;

  constructor(input: {
    readonly code: KpSemanticStateCompositionEndpointErrorCode;
    readonly message: string;
    readonly stepIndex?: number;
    readonly memberId?: KpSemanticCompositionMemberId;
  }) {
    super(input.message);
    this.name = "KpSemanticStateCompositionEndpointError";
    this.code = input.code;
    if (input.stepIndex !== undefined) this.stepIndex = input.stepIndex;
    if (input.memberId !== undefined) this.memberId = input.memberId;
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
  let cursor = input.base;

  for (const step of input.composition.steps) {
    const member = step.members[0]!;
    const binding = bindingByTransformation.get(
      member.application.transformationId
    )!;
    const applied = binding.apply(cursor);
    if (applied.commit.before !== cursor) {
      fail({
        code: "discontinuous-endpoint-chain",
        stepIndex: step.stepIndex,
        memberId: member.id,
        message: `Composition member ${JSON.stringify(member.id)} did not preserve the existing family endpoint chain.`
      });
    }
    applications.push(Object.freeze({
      schemaVersion: "kp.semantic-state-composition-applied-member.v1",
      kind: "semantic-state-composition-applied-member",
      stepIndex: step.stepIndex,
      memberId: member.id,
      member,
      application: applied
    }));
    cursor = applied.commit.after;
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
    boundaries: Object.freeze(boundaries)
  });
}

function validateExecutionInput<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(input: {
  readonly composition: KpCompiledSemanticStateComposition;
  readonly base: KpAggregateSemanticSnapshot;
  readonly bindings: readonly KpSemanticStateCompositionEndpointBinding<Root>[];
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
    if (step.kind === "independent-step") {
      fail({
        code: "independent-endpoint-unsupported",
        stepIndex: step.stepIndex,
        message: `Independent composition step ${JSON.stringify(step.path)} requires confluence certification before endpoint execution.`
      });
    }
    const member = step.members[0]!;
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
      !arePreparedApplicationsEqual(binding.application, member.application)) {
      fail({
        code: "application-binding-mismatch",
        stepIndex: step.stepIndex,
        memberId: member.id,
        message: `Composition member ${JSON.stringify(member.id)} does not match its prepared endpoint application.`
      });
    }
    byTransformation.delete(binding.transformationId);
  }
  for (const unexpected of byTransformation.values()) {
    fail({
      code: "unexpected-endpoint-binding",
      message: `Endpoint binding ${JSON.stringify(unexpected.transformationId)} is not a member of composition ${JSON.stringify(input.composition.id)}.`
    });
  }
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
}): never {
  throw new KpSemanticStateCompositionEndpointError(input);
}
