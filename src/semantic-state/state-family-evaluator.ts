import {
  readKpSemanticSlotBinding,
  readKpSnapshotEntityStore,
  type KpAggregateSemanticSnapshot
} from "./aggregate-snapshot.ts";
import type {
  KpPinnedSemanticStateHandleTree
} from "./authoring-state-handles.ts";
import type {
  KpSemanticStateGroupDescriptor,
  KpSemanticStateMemberMap
} from "./authoring-schema.ts";
import {
  readKpSemanticEntityVersion,
  requireAndFreezeKpPersistentSemanticValue,
  type KpPersistentSemanticValue
} from "./entity-version-store.ts";
import type { KpSemanticSlotId } from "./identity.ts";
import {
  compareKpSemanticProgress,
  decodeKpSemanticProgress,
  isKpSemanticProgressOne,
  isKpSemanticProgressZero,
  kpSemanticProgressOne,
  kpSemanticProgressZero,
  type KpSemanticProgress
} from "./semantic-progress.ts";
import {
  adaptKpSnapshotToSemanticStateReadSource,
  createKpEphemeralSemanticStateReadSource,
  type KpEphemeralSemanticStateDriverInput,
  type KpEphemeralSemanticStateReadSource,
  type KpPersistentSemanticStateReadSource
} from "./state-family-sample-source.ts";
import type {
  KpAppliedSemanticStateFamily,
  KpSemanticStateFamilyDefinition,
  KpSemanticStateTransitionCapabilitySource
} from "./state-family-definition.ts";
import {
  areKpSemanticStateTransitionPlansEqual,
  type KpSemanticStateDiscreteTransitionDeclaration,
  type KpSemanticStatePresentationTransitionDeclaration
} from "./state-family-transition.ts";

export interface KpPersistentSemanticStateFamilySample<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion: "kp.semantic-state-family-sample.v1";
  readonly kind: "persistent-endpoint";
  readonly endpoint: "before" | "after";
  readonly progress: KpSemanticProgress;
  readonly source: KpPersistentSemanticStateReadSource;
  readonly view: KpPinnedSemanticStateHandleTree<Root>;
}

export interface KpSemanticStateFamilyEvaluator<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> {
  readonly schemaVersion: "kp.semantic-state-family-evaluator.v1";
  readonly kind: "semantic-state-family-evaluator";
  at(progress: KpSemanticProgress): KpSemanticStateFamilySample<Root>;
}

export interface KpEphemeralSemanticStateFamilySample {
  readonly schemaVersion: "kp.semantic-state-family-sample.v1";
  readonly kind: "ephemeral-interior";
  readonly progress: KpSemanticProgress;
  readonly source: KpEphemeralSemanticStateReadSource;
  readonly presentationTransitions:
    readonly KpSemanticStateFamilyPresentationTransition[];
}

export interface KpSemanticStateFamilyPresentationTransition {
  readonly schemaVersion:
    "kp.semantic-state-family-presentation-transition.v1";
  readonly kind: "semantic-state-family-presentation-transition";
  readonly declarationId: string;
  readonly sourceId: string;
  readonly targetSlotId: KpSemanticSlotId;
  readonly targetPath: readonly string[];
}

export type KpSemanticStateFamilySample<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> = KpPersistentSemanticStateFamilySample<Root> |
  KpEphemeralSemanticStateFamilySample;

export type KpSemanticStateFamilyEvaluatorErrorCode =
  | "definition-application-mismatch"
  | "discrete-selection-failed"
  | "interpolation-failed"
  | "invalid-discrete-result"
  | "invalid-interpolation-result";

export class KpSemanticStateFamilyEvaluatorError extends Error {
  readonly code: KpSemanticStateFamilyEvaluatorErrorCode;
  readonly progress: KpSemanticProgress | undefined;
  readonly declarationId: string | undefined;
  override readonly cause: unknown;

  constructor(input: {
    readonly code: KpSemanticStateFamilyEvaluatorErrorCode;
    readonly progress?: KpSemanticProgress;
    readonly declarationId?: string;
    readonly cause?: unknown;
    readonly message: string;
  }) {
    super(input.message);
    this.name = "KpSemanticStateFamilyEvaluatorError";
    this.code = input.code;
    this.progress = input.progress;
    this.declarationId = input.declarationId;
    this.cause = input.cause;
  }
}

export function createKpSemanticStateFamilyEvaluator<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  Parameters,
  Transitions extends readonly KpSemanticStateTransitionCapabilitySource[]
>(input: {
  readonly definition: KpSemanticStateFamilyDefinition<
    Root,
    Parameters,
    Transitions
  >;
  readonly application: KpAppliedSemanticStateFamily<Root, Parameters>;
}): KpSemanticStateFamilyEvaluator<Root> {
  if (input.definition.id !== input.application.definitionId ||
    !areKpSemanticStateTransitionPlansEqual(
      input.definition.declaration.transitionPlan,
      input.application.transitionPlan
    )) {
    throw new KpSemanticStateFamilyEvaluatorError({
      code: "definition-application-mismatch",
      message: `Semantic state family definition ${JSON.stringify(input.definition.id)} does not own application ${JSON.stringify(input.application.transformationId)}.`
    });
  }
  const before = createEndpointSample({
    endpoint: "before",
    progress: kpSemanticProgressZero,
    source: adaptKpSnapshotToSemanticStateReadSource(
      input.application.commit.before
    ),
    view: input.application.before
  });
  const after = createEndpointSample({
    endpoint: "after",
    progress: kpSemanticProgressOne,
    source: adaptKpSnapshotToSemanticStateReadSource(
      input.application.commit.after
    ),
    view: input.application.after
  });
  const orderedCapabilities = [...input.definition.capabilities.transitions]
    .sort((left, right) =>
      compareStrings(
        left.declaration.target.slotId,
        right.declaration.target.slotId
      ) || compareStrings(left.declaration.id, right.declaration.id)
    );
  const driverCapabilities = orderedCapabilities.filter(
    ({ transitionMode }) => transitionMode !== "presentation-only"
  );
  const presentationTransitions = Object.freeze(
    orderedCapabilities
      .filter(hasPresentationCapability)
      .map(createPresentationTransition)
  );

  return Object.freeze({
    schemaVersion: "kp.semantic-state-family-evaluator.v1",
    kind: "semantic-state-family-evaluator",
    at(progress: KpSemanticProgress) {
      if (isKpSemanticProgressZero(progress)) return before;
      if (isKpSemanticProgressOne(progress)) return after;
      const drivers = driverCapabilities.map((capability) => {
        if (hasInterpolationCapability(capability)) {
          return interpolateDriver({
            capability,
            application: input.application,
            progress
          });
        }
        if (hasDiscreteCapability(capability)) {
          return selectDiscreteDriver({
            capability,
            application: input.application,
            progress
          });
        }
        throw new KpSemanticStateFamilyEvaluatorError({
          code: "definition-application-mismatch",
          progress,
          declarationId: capability.declaration.id,
          message: `Semantic transition ${JSON.stringify(capability.declaration.id)} has no matching sampling capability.`
        });
      });
      const source = createKpEphemeralSemanticStateReadSource({
        application: input.application,
        progress,
        drivers
      });
      return Object.freeze({
        schemaVersion: "kp.semantic-state-family-sample.v1" as const,
        kind: "ephemeral-interior" as const,
        progress,
        source,
        presentationTransitions
      });
    }
  });
}

interface KpUnknownSemanticStateDiscreteCapability {
  readonly transitionMode: "discrete";
  readonly declaration: KpSemanticStateDiscreteTransitionDeclaration<unknown>;
  select(input: {
    readonly before: never;
    readonly after: never;
    readonly changePointId: string;
    readonly valueSourceId: string;
    readonly parameters: never;
  }): unknown;
}

interface KpUnknownSemanticStatePresentationCapability {
  readonly transitionMode: "presentation-only";
  readonly declaration:
    KpSemanticStatePresentationTransitionDeclaration<unknown>;
}

interface KpUnknownSemanticStateInterpolationCapability {
  readonly transitionMode: "semantic-interpolation";
  readonly declaration: KpEphemeralSemanticStateDriverInput<unknown>[
    "declaration"
  ];
  interpolate(input: {
    readonly before: never;
    readonly after: never;
    readonly progress: KpSemanticProgress;
    readonly parameters: never;
  }): unknown;
}

function hasInterpolationCapability(
  capability: KpSemanticStateTransitionCapabilitySource
): capability is KpSemanticStateTransitionCapabilitySource &
  KpUnknownSemanticStateInterpolationCapability {
  return capability.transitionMode === "semantic-interpolation" &&
    "interpolate" in capability &&
    typeof capability.interpolate === "function";
}

function hasDiscreteCapability(
  capability: KpSemanticStateTransitionCapabilitySource
): capability is KpSemanticStateTransitionCapabilitySource &
  KpUnknownSemanticStateDiscreteCapability {
  return capability.transitionMode === "discrete" &&
    "select" in capability && typeof capability.select === "function";
}

function hasPresentationCapability(
  capability: KpSemanticStateTransitionCapabilitySource
): capability is KpSemanticStateTransitionCapabilitySource &
  KpUnknownSemanticStatePresentationCapability {
  return capability.transitionMode === "presentation-only";
}

function interpolateDriver<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  Parameters
>(input: {
  readonly capability: KpUnknownSemanticStateInterpolationCapability;
  readonly application: KpAppliedSemanticStateFamily<Root, Parameters>;
  readonly progress: KpSemanticProgress;
}): KpEphemeralSemanticStateDriverInput<unknown> {
  const before = readConcreteValue(
    input.application.commit.before,
    input.capability.declaration.target.slotId
  );
  const after = readConcreteValue(
    input.application.commit.after,
    input.capability.declaration.target.slotId
  );
  let result: unknown;
  try {
    // The family builder proves the callback's value and parameter types.
    // Runtime iteration erases only that existential pairing at this seam.
    result = Reflect.apply(input.capability.interpolate, undefined, [{
      before,
      after,
      progress: input.progress,
      parameters: input.application.parameters
    }]);
  } catch (cause) {
    throw new KpSemanticStateFamilyEvaluatorError({
      code: "interpolation-failed",
      progress: input.progress,
      declarationId: input.capability.declaration.id,
      cause,
      message: `Semantic interpolation ${JSON.stringify(input.capability.declaration.id)} failed.`
    });
  }
  let value: KpPersistentSemanticValue;
  try {
    value = requireAndFreezeKpPersistentSemanticValue(result);
  } catch (cause) {
    throw new KpSemanticStateFamilyEvaluatorError({
      code: "invalid-interpolation-result",
      progress: input.progress,
      declarationId: input.capability.declaration.id,
      cause,
      message: `Semantic interpolation ${JSON.stringify(input.capability.declaration.id)} returned a non-structural value.`
    });
  }
  return Object.freeze({
    declaration: input.capability.declaration,
    value
  });
}

function selectDiscreteDriver<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  Parameters
>(input: {
  readonly capability: KpUnknownSemanticStateDiscreteCapability;
  readonly application: KpAppliedSemanticStateFamily<Root, Parameters>;
  readonly progress: KpSemanticProgress;
}): KpEphemeralSemanticStateDriverInput<unknown> {
  const before = readConcreteValue(
    input.application.commit.before,
    input.capability.declaration.target.slotId
  );
  const after = readConcreteValue(
    input.application.commit.after,
    input.capability.declaration.target.slotId
  );
  const active = [...input.capability.declaration.changePoints]
    .reverse()
    .find(({ at }) => compareKpSemanticProgress(
      decodeKpSemanticProgress(at),
      input.progress
    ) <= 0);
  if (active === undefined) {
    return Object.freeze({
      declaration: input.capability.declaration,
      value: before
    });
  }
  let result: unknown;
  try {
    result = Reflect.apply(input.capability.select, undefined, [{
      before,
      after,
      changePointId: active.id,
      valueSourceId: active.valueSourceId,
      parameters: input.application.parameters
    }]);
  } catch (cause) {
    throw new KpSemanticStateFamilyEvaluatorError({
      code: "discrete-selection-failed",
      progress: input.progress,
      declarationId: input.capability.declaration.id,
      cause,
      message: `Discrete semantic transition ${JSON.stringify(input.capability.declaration.id)} failed at ${JSON.stringify(active.id)}.`
    });
  }
  let value: KpPersistentSemanticValue;
  try {
    value = requireAndFreezeKpPersistentSemanticValue(result);
  } catch (cause) {
    throw new KpSemanticStateFamilyEvaluatorError({
      code: "invalid-discrete-result",
      progress: input.progress,
      declarationId: input.capability.declaration.id,
      cause,
      message: `Discrete semantic transition ${JSON.stringify(input.capability.declaration.id)} returned a non-structural value.`
    });
  }
  return Object.freeze({
    declaration: input.capability.declaration,
    value
  });
}

function createPresentationTransition(
  capability: KpUnknownSemanticStatePresentationCapability
): KpSemanticStateFamilyPresentationTransition {
  return Object.freeze({
    schemaVersion:
      "kp.semantic-state-family-presentation-transition.v1",
    kind: "semantic-state-family-presentation-transition",
    declarationId: capability.declaration.id,
    sourceId: capability.declaration.source.id,
    targetSlotId: capability.declaration.target.slotId,
    targetPath: capability.declaration.target.path
  });
}

function readConcreteValue(
  snapshot: KpAggregateSemanticSnapshot,
  slotId: KpSemanticSlotId
): KpPersistentSemanticValue {
  const binding = readKpSemanticSlotBinding(snapshot, slotId);
  const store = readKpSnapshotEntityStore(snapshot, binding.entityId);
  return readKpSemanticEntityVersion(store, binding.versionId).value;
}

function createEndpointSample<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(input: {
  readonly endpoint: "before" | "after";
  readonly progress: KpSemanticProgress;
  readonly source: KpPersistentSemanticStateReadSource;
  readonly view: KpPinnedSemanticStateHandleTree<Root>;
}): KpPersistentSemanticStateFamilySample<Root> {
  return Object.freeze({
    schemaVersion: "kp.semantic-state-family-sample.v1",
    kind: "persistent-endpoint",
    ...input
  });
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}
