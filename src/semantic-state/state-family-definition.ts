import type {
  KpAggregateSemanticSnapshot
} from "./aggregate-snapshot.ts";
import type { KpCompiledSemanticStateSchema } from
  "./authoring-schema-compiler.ts";
import type {
  KpSemanticStateDataShape,
  KpSemanticStateGroupDescriptor,
  KpSemanticStateMemberMap,
  KpSemanticStateReadonlyValue
} from "./authoring-schema.ts";
import type { KpSemanticStateHandleSet } from
  "./authoring-state-handles.ts";
import {
  defineKpSemanticStateTransform,
  type KpSemanticStateOperationTree,
  type KpSemanticStateTransformApplication
} from "./authoring-state-transform.ts";
import { requireAndFreezeKpPersistentSemanticValue } from
  "./entity-version-store.ts";
import type {
  KpAppliedTransformationId,
  KpTransformationDefinitionId
} from "./identity.ts";
import type { KpSemanticProgress } from "./semantic-progress.ts";
import {
  compileKpSemanticStateTransitionPlan,
  type KpSemanticStateDiscreteTransitionDeclaration,
  type KpSemanticStateInterpolationDeclaration,
  type KpSemanticStatePresentationTransitionDeclaration,
  type KpSemanticStateTransitionDeclaration,
  type KpSemanticStateTransitionPlan
} from "./state-family-transition.ts";

declare const kpSemanticStateFamilyParameters: unique symbol;

export interface KpSemanticStateFamilyParameterDeclaration<Parameters> {
  readonly schemaVersion: "kp.semantic-state-family-parameters.v1";
  readonly kind: "semantic-state-family-parameters";
  readonly [kpSemanticStateFamilyParameters]?: Parameters;
}

export function kpStateFamilyParameters<ParameterShape>():
  KpSemanticStateFamilyParameterDeclaration<
    KpSemanticStateReadonlyValue<ParameterShape>
  > {
  return Object.freeze({
    schemaVersion: "kp.semantic-state-family-parameters.v1",
    kind: "semantic-state-family-parameters"
  });
}

export interface KpSemanticStateInterpolationCapability<
  Parameters,
  Value
> extends KpSemanticStateTransitionCapabilitySource {
  readonly transitionMode: "semantic-interpolation";
  readonly declaration: KpSemanticStateInterpolationDeclaration<Value>;
  interpolate(input: {
    readonly before: Value;
    readonly after: Value;
    readonly progress: KpSemanticProgress;
    readonly parameters: Parameters;
  }): Value;
}

export interface KpSemanticStateDiscreteTransitionCapability<
  Parameters,
  Value
> extends KpSemanticStateTransitionCapabilitySource {
  readonly transitionMode: "discrete";
  readonly declaration: KpSemanticStateDiscreteTransitionDeclaration<Value>;
  select(input: {
    readonly before: Value;
    readonly after: Value;
    readonly changePointId: string;
    readonly parameters: Parameters;
  }): Value;
}

export interface KpSemanticStatePresentationTransitionCapability<Value>
  extends KpSemanticStateTransitionCapabilitySource {
  readonly transitionMode: "presentation-only";
  readonly declaration:
    KpSemanticStatePresentationTransitionDeclaration<Value>;
}

export interface KpSemanticStateTransitionCapabilitySource {
  readonly schemaVersion: "kp.semantic-state-transition-capability.v1";
  readonly kind: "semantic-state-transition-capability";
  readonly transitionMode:
    KpSemanticStateTransitionDeclaration["transitionMode"];
  readonly declaration: KpSemanticStateTransitionDeclaration;
}

export interface KpSemanticStateTransitionCapabilityBuilder<Parameters> {
  interpolate<Value>(
    declaration: KpSemanticStateInterpolationDeclaration<Value>,
    interpolate: KpSemanticStateInterpolationCapability<
      Parameters,
      Value
    >["interpolate"]
  ): KpSemanticStateInterpolationCapability<Parameters, Value>;
  discrete<Value>(
    declaration: KpSemanticStateDiscreteTransitionDeclaration<Value>,
    select: KpSemanticStateDiscreteTransitionCapability<
      Parameters,
      Value
    >["select"]
  ): KpSemanticStateDiscreteTransitionCapability<Parameters, Value>;
  presentation<Value>(
    declaration: KpSemanticStatePresentationTransitionDeclaration<Value>
  ): KpSemanticStatePresentationTransitionCapability<Value>;
}

export interface KpSemanticStateFamilyDefinitionDeclaration {
  readonly schemaVersion: "kp.semantic-state-family-definition-declaration.v1";
  readonly kind: "semantic-state-family-definition-declaration";
  readonly id: KpTransformationDefinitionId;
  readonly localId: string;
  readonly namespace: string;
  readonly sourceId: string;
  readonly transitionPlan: KpSemanticStateTransitionPlan;
}

export interface KpSemanticStateFamilySourceProvenance {
  readonly schemaVersion: "kp.semantic-state-family-source-provenance.v1";
  readonly kind: "authored";
  readonly sourceId: string;
}

export interface KpSemanticStateFamilyApplicationRecord<Parameters> {
  readonly schemaVersion: "kp.semantic-state-family-application-record.v1";
  readonly kind: "semantic-state-family-application-record";
  readonly definitionId: KpTransformationDefinitionId;
  readonly transformationId: KpAppliedTransformationId;
  readonly applicationId: string;
  readonly parameters: Parameters;
  readonly source: KpSemanticStateFamilySourceProvenance;
  readonly transitionPlan: KpSemanticStateTransitionPlan;
}

export type KpAppliedSemanticStateFamily<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  Parameters
> = Omit<
  KpSemanticStateFamilyApplicationRecord<Parameters>,
  "schemaVersion" | "kind"
> & {
  readonly schemaVersion: "kp.applied-semantic-state-family.v1";
  readonly kind: "applied-semantic-state-family";
  readonly endpointApplication: KpSemanticStateTransformApplication<Root>;
  readonly commit: KpSemanticStateTransformApplication<Root>["commit"];
  readonly before: KpSemanticStateTransformApplication<Root>["before"];
  readonly after: KpSemanticStateTransformApplication<Root>["after"];
};

export interface KpSemanticStateFamilyDefinitionCapabilities<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  Parameters,
  TransitionCapabilities extends
    readonly KpSemanticStateTransitionCapabilitySource[]
> {
  readonly schemaVersion: "kp.semantic-state-family-definition-capabilities.v1";
  readonly kind: "semantic-state-family-definition-capabilities";
  readonly compiled: KpCompiledSemanticStateSchema<Root>;
  readonly handles: KpSemanticStateHandleSet<Root>;
  readonly transitions: TransitionCapabilities;
  author(
    parameters: Parameters,
    state: KpSemanticStateOperationTree<Root>
  ): void;
}

export interface KpSemanticStateFamilyDefinition<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  Parameters,
  TransitionCapabilities extends
    readonly KpSemanticStateTransitionCapabilitySource[]
> {
  readonly schemaVersion: "kp.semantic-state-family-definition.v1";
  readonly kind: "semantic-state-family-definition";
  readonly id: KpTransformationDefinitionId;
  readonly localId: string;
  readonly declaration: KpSemanticStateFamilyDefinitionDeclaration;
  readonly capabilities: KpSemanticStateFamilyDefinitionCapabilities<
    Root,
    Parameters,
    TransitionCapabilities
  >;
  prepareApplication(input: {
    readonly applicationId: string;
    readonly parameters: Parameters & NoInfer<
      KpSemanticStateDataShape<Parameters>
    >;
    readonly sourceId: string;
  }): KpSemanticStateFamilyApplicationRecord<Parameters>;
  apply(
    before: KpAggregateSemanticSnapshot,
    input: {
      readonly applicationId: string;
      readonly parameters: Parameters & NoInfer<
        KpSemanticStateDataShape<Parameters>
      >;
      readonly sourceId: string;
    }
  ): KpAppliedSemanticStateFamily<Root, Parameters>;
}

export type KpSemanticStateFamilyErrorCode =
  | "invalid-family-parameters"
  | "invalid-family-source"
  | "invalid-transition-capabilities";

export class KpSemanticStateFamilyError extends Error {
  readonly code: KpSemanticStateFamilyErrorCode;

  constructor(code: KpSemanticStateFamilyErrorCode, message: string) {
    super(message);
    this.name = "KpSemanticStateFamilyError";
    this.code = code;
  }
}

export function defineKpSemanticStateFamily<
  const Members extends KpSemanticStateMemberMap,
  Parameters,
  const TransitionCapabilities extends
    readonly KpSemanticStateTransitionCapabilitySource[]
>(input: {
  readonly compiled: KpCompiledSemanticStateSchema<
    KpSemanticStateGroupDescriptor<Members>
  >;
  readonly handles: KpSemanticStateHandleSet<
    KpSemanticStateGroupDescriptor<Members>
  >;
  readonly id: string;
  readonly sourceId: string;
  readonly parameters: KpSemanticStateFamilyParameterDeclaration<Parameters>;
  readonly transitions: (
    builder: KpSemanticStateTransitionCapabilityBuilder<Parameters>
  ) => TransitionCapabilities;
  readonly author: (
    parameters: Parameters,
    state: KpSemanticStateOperationTree<
      KpSemanticStateGroupDescriptor<Members>
    >
  ) => void;
}): KpSemanticStateFamilyDefinition<
  KpSemanticStateGroupDescriptor<Members>,
  Parameters,
  TransitionCapabilities
> {
  const definitionId = input.compiled.identityScope.transformation(input.id);
  const transitionCapabilities = input.transitions(
    createTransitionCapabilityBuilder<Parameters>()
  );
  if (!Array.isArray(transitionCapabilities) ||
    transitionCapabilities.length === 0) {
    throw new KpSemanticStateFamilyError(
      "invalid-transition-capabilities",
      `Semantic state family ${JSON.stringify(input.id)} requires at least one transition capability.`
    );
  }
  const frozenTransitions = Object.freeze([...transitionCapabilities]) as
    unknown as TransitionCapabilities;
  const transitionPlan = compileKpSemanticStateTransitionPlan({
    compiled: input.compiled,
    declarations: frozenTransitions.map(({ declaration }) => declaration)
  });
  const sourceId = requireSourceId(input.sourceId, "definition");
  const declaration = Object.freeze<
    KpSemanticStateFamilyDefinitionDeclaration
  >({
    schemaVersion: "kp.semantic-state-family-definition-declaration.v1",
    kind: "semantic-state-family-definition-declaration",
    id: definitionId,
    localId: input.id,
    namespace: input.compiled.namespace,
    sourceId,
    transitionPlan
  });
  const capabilities = Object.freeze<
    KpSemanticStateFamilyDefinitionCapabilities<
      KpSemanticStateGroupDescriptor<Members>,
      Parameters,
      TransitionCapabilities
    >
  >({
    schemaVersion: "kp.semantic-state-family-definition-capabilities.v1",
    kind: "semantic-state-family-definition-capabilities",
    compiled: input.compiled,
    handles: input.handles,
    transitions: frozenTransitions,
    author: input.author
  });

  const prepareApplication = (applicationInput: {
    readonly applicationId: string;
    readonly parameters: Parameters & NoInfer<
      KpSemanticStateDataShape<Parameters>
    >;
    readonly sourceId: string;
  }): KpSemanticStateFamilyApplicationRecord<Parameters> => {
    const applicationSourceId = requireSourceId(
      applicationInput.sourceId,
      "application"
    );
    let parameters: Parameters;
    try {
      parameters = requireAndFreezeKpPersistentSemanticValue(
        applicationInput.parameters
      ) as Parameters;
    } catch (error) {
      throw new KpSemanticStateFamilyError(
        "invalid-family-parameters",
        `Semantic state family ${JSON.stringify(input.id)} parameters are not persistent structural data: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    const transformationId = input.compiled.identityScope
      .appliedTransformation(definitionId, applicationInput.applicationId);
    return Object.freeze<KpSemanticStateFamilyApplicationRecord<Parameters>>({
      schemaVersion: "kp.semantic-state-family-application-record.v1",
      kind: "semantic-state-family-application-record",
      definitionId,
      transformationId,
      applicationId: applicationInput.applicationId,
      parameters,
      source: Object.freeze({
        schemaVersion: "kp.semantic-state-family-source-provenance.v1",
        kind: "authored",
        sourceId: applicationSourceId
      }),
      transitionPlan
    });
  };

  return Object.freeze<KpSemanticStateFamilyDefinition<
    KpSemanticStateGroupDescriptor<Members>,
    Parameters,
    TransitionCapabilities
  >>({
    schemaVersion: "kp.semantic-state-family-definition.v1",
    kind: "semantic-state-family-definition",
    id: definitionId,
    localId: input.id,
    declaration,
    capabilities,
    prepareApplication,
    apply(before, applicationInput) {
      const application = prepareApplication(applicationInput);
      const endpointDefinition = defineKpSemanticStateTransform({
        compiled: input.compiled,
        handles: input.handles,
        id: input.id,
        author(state) {
          const result = input.author(application.parameters, state);
          return result;
        }
      });
      const endpointApplication = endpointDefinition.apply(
        before,
        application.applicationId
      );
      return Object.freeze<KpAppliedSemanticStateFamily<
        KpSemanticStateGroupDescriptor<Members>,
        Parameters
      >>({
        ...application,
        schemaVersion: "kp.applied-semantic-state-family.v1",
        kind: "applied-semantic-state-family",
        endpointApplication,
        commit: endpointApplication.commit,
        before: endpointApplication.before,
        after: endpointApplication.after
      });
    }
  });
}

function createTransitionCapabilityBuilder<Parameters>():
  KpSemanticStateTransitionCapabilityBuilder<Parameters> {
  return Object.freeze({
    interpolate<Value>(
      declaration: KpSemanticStateInterpolationDeclaration<Value>,
      interpolate: KpSemanticStateInterpolationCapability<
        Parameters,
        Value
      >["interpolate"]
    ) {
      return Object.freeze({
        schemaVersion: "kp.semantic-state-transition-capability.v1" as const,
        kind: "semantic-state-transition-capability" as const,
        transitionMode: "semantic-interpolation" as const,
        declaration,
        interpolate
      });
    },
    discrete<Value>(
      declaration: KpSemanticStateDiscreteTransitionDeclaration<Value>,
      select: KpSemanticStateDiscreteTransitionCapability<
        Parameters,
        Value
      >["select"]
    ) {
      return Object.freeze({
        schemaVersion: "kp.semantic-state-transition-capability.v1" as const,
        kind: "semantic-state-transition-capability" as const,
        transitionMode: "discrete" as const,
        declaration,
        select
      });
    },
    presentation<Value>(
      declaration: KpSemanticStatePresentationTransitionDeclaration<Value>
    ) {
      return Object.freeze({
        schemaVersion: "kp.semantic-state-transition-capability.v1" as const,
        kind: "semantic-state-transition-capability" as const,
        transitionMode: "presentation-only" as const,
        declaration
      });
    }
  });
}

function requireSourceId(value: string, label: string): string {
  if (value.length === 0 || value.trim() !== value) {
    throw new KpSemanticStateFamilyError(
      "invalid-family-source",
      `Semantic state family ${label} source id must be non-empty and trimmed.`
    );
  }
  return value;
}
