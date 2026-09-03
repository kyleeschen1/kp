import type {
  KpPinnedSemanticStateHandleTree
} from "./authoring-state-handles.ts";
import type {
  KpSemanticStateGroupDescriptor,
  KpSemanticStateMemberMap
} from "./authoring-schema.ts";
import {
  isKpSemanticProgressOne,
  isKpSemanticProgressZero,
  kpSemanticProgressOne,
  kpSemanticProgressZero,
  type KpSemanticProgress
} from "./semantic-progress.ts";
import {
  adaptKpSnapshotToSemanticStateReadSource,
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
  at(progress: KpSemanticProgress):
    KpPersistentSemanticStateFamilySample<Root>;
}

export type KpSemanticStateFamilyEvaluatorErrorCode =
  | "definition-application-mismatch"
  | "interior-sampling-unsupported";

export class KpSemanticStateFamilyEvaluatorError extends Error {
  readonly code: KpSemanticStateFamilyEvaluatorErrorCode;
  readonly progress: KpSemanticProgress | undefined;

  constructor(input: {
    readonly code: KpSemanticStateFamilyEvaluatorErrorCode;
    readonly progress?: KpSemanticProgress;
    readonly message: string;
  }) {
    super(input.message);
    this.name = "KpSemanticStateFamilyEvaluatorError";
    this.code = input.code;
    this.progress = input.progress;
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

  return Object.freeze({
    schemaVersion: "kp.semantic-state-family-evaluator.v1",
    kind: "semantic-state-family-evaluator",
    at(progress: KpSemanticProgress) {
      if (isKpSemanticProgressZero(progress)) return before;
      if (isKpSemanticProgressOne(progress)) return after;
      throw new KpSemanticStateFamilyEvaluatorError({
        code: "interior-sampling-unsupported",
        progress,
        message: "Interior semantic state-family sampling has not acquired an interpolation capability."
      });
    }
  });
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
