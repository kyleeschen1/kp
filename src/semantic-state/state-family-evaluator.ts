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
import { areKpSemanticStateTransitionPlansEqual } from
  "./state-family-transition.ts";

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
}

export type KpSemanticStateFamilySample<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
> = KpPersistentSemanticStateFamilySample<Root> |
  KpEphemeralSemanticStateFamilySample;

export type KpSemanticStateFamilyEvaluatorErrorCode =
  | "definition-application-mismatch"
  | "interpolation-failed"
  | "invalid-interpolation-result"
  | "transition-mode-sampling-unsupported";

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
  const interpolationCapabilities = input.definition.capabilities.transitions
    .filter(hasInterpolationCapability);
  const unsupported = input.definition.capabilities.transitions.find(
    ({ transitionMode }) => transitionMode === "discrete"
  );

  return Object.freeze({
    schemaVersion: "kp.semantic-state-family-evaluator.v1",
    kind: "semantic-state-family-evaluator",
    at(progress: KpSemanticProgress) {
      if (isKpSemanticProgressZero(progress)) return before;
      if (isKpSemanticProgressOne(progress)) return after;
      if (unsupported !== undefined) {
        throw new KpSemanticStateFamilyEvaluatorError({
          code: "transition-mode-sampling-unsupported",
          progress,
          declarationId: unsupported.declaration.id,
          message: `Semantic state-family transition ${JSON.stringify(unsupported.declaration.id)} requires discrete sampling support.`
        });
      }
      const drivers = interpolationCapabilities.map((capability) =>
        interpolateDriver({
          capability,
          application: input.application,
          progress
        })
      );
      const source = createKpEphemeralSemanticStateReadSource({
        application: input.application,
        progress,
        drivers
      });
      return Object.freeze({
        schemaVersion: "kp.semantic-state-family-sample.v1" as const,
        kind: "ephemeral-interior" as const,
        progress,
        source
      });
    }
  });
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
import {
  readKpSemanticSlotBinding,
  readKpSnapshotEntityStore,
  type KpAggregateSemanticSnapshot
} from "./aggregate-snapshot.ts";
