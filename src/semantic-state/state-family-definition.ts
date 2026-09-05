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
import { validateKpSemanticStateFamilyEndpoint } from
  "./state-family-application-validation.ts";
import {
  areKpSemanticStateTransitionPlansEqual,
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
    readonly valueSourceId: string;
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

export interface KpSemanticStateFamilyAuthoredSourceProvenance {
  readonly schemaVersion: "kp.semantic-state-family-source-provenance.v1";
  readonly kind: "authored";
  readonly sourceId: string;
}

export interface KpSemanticStateFamilyApplicationReference {
  readonly schemaVersion: "kp.semantic-state-family-application-reference.v1";
  readonly kind: "semantic-state-family-application-reference";
  readonly definitionId: KpTransformationDefinitionId;
  readonly transformationId: KpAppliedTransformationId;
  readonly applicationId: string;
}

export interface KpSemanticStateFamilyReparameterizedSourceProvenance {
  readonly schemaVersion: "kp.semantic-state-family-source-provenance.v1";
  readonly kind: "reparameterized";
  readonly sourceId: string;
  readonly sourceApplication: KpSemanticStateFamilyApplicationReference;
}

export type KpSemanticStateFamilySourceProvenance =
  | KpSemanticStateFamilyAuthoredSourceProvenance
  | KpSemanticStateFamilyReparameterizedSourceProvenance;

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
  validatePreparedApplication(
    application: KpSemanticStateFamilyApplicationRecord<Parameters>
  ): void;
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
  applyPreparedApplication(
    before: KpAggregateSemanticSnapshot,
    application: KpSemanticStateFamilyApplicationRecord<Parameters>
  ): KpAppliedSemanticStateFamily<Root, Parameters>;
  reparameterize(
    source: KpAppliedSemanticStateFamily<Root, Parameters>,
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
  | "foreign-reparameterization-source"
  | "foreign-prepared-application"
  | "invalid-family-parameters"
  | "invalid-family-source"
  | "invalid-transition-capabilities"
  | "reused-source-application-id";

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
  }): KpSemanticStateFamilyApplicationRecord<Parameters> =>
    prepareApplicationRecord(applicationInput, Object.freeze({
      schemaVersion: "kp.semantic-state-family-source-provenance.v1",
      kind: "authored",
      sourceId: requireSourceId(applicationInput.sourceId, "application")
    }));

  const prepareApplicationRecord = (
    applicationInput: {
      readonly applicationId: string;
      readonly parameters: Parameters & NoInfer<
        KpSemanticStateDataShape<Parameters>
      >;
      readonly sourceId: string;
    },
    provenance: KpSemanticStateFamilySourceProvenance
  ): KpSemanticStateFamilyApplicationRecord<Parameters> => {
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
      source: provenance.kind === "authored"
        ? provenance
        : Object.freeze({ ...provenance, sourceId: applicationSourceId }),
      transitionPlan
    });
  };

  const applyApplication = (
    before: KpAggregateSemanticSnapshot,
    application: KpSemanticStateFamilyApplicationRecord<Parameters>
  ): KpAppliedSemanticStateFamily<
    KpSemanticStateGroupDescriptor<Members>,
    Parameters
  > => {
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
    validateKpSemanticStateFamilyEndpoint({
      commit: endpointApplication.commit,
      transitionPlan: application.transitionPlan
    });
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
  };

  const validatePreparedApplication = (
    application: KpSemanticStateFamilyApplicationRecord<Parameters>
  ): void => {
    const expectedTransformationId = input.compiled.identityScope
      .appliedTransformation(definitionId, application.applicationId);
    if (application.definitionId !== definitionId ||
      application.transformationId !== expectedTransformationId ||
      !areKpSemanticStateTransitionPlansEqual(
        application.transitionPlan,
        transitionPlan
      )) {
      throw new KpSemanticStateFamilyError(
        "foreign-prepared-application",
        `Semantic state family ${JSON.stringify(input.id)} cannot apply foreign prepared application ${JSON.stringify(application.applicationId)}.`
      );
    }
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
    validatePreparedApplication,
    apply(before, applicationInput) {
      const application = prepareApplication(applicationInput);
      return applyApplication(before, application);
    },
    applyPreparedApplication(before, application) {
      validatePreparedApplication(application);
      return applyApplication(before, application);
    },
    reparameterize(source, applicationInput) {
      if (source.definitionId !== definitionId ||
        source.commit.before.namespace !== input.compiled.namespace ||
        !areKpSemanticStateTransitionPlansEqual(
          source.transitionPlan,
          transitionPlan
        )) {
        throw new KpSemanticStateFamilyError(
          "foreign-reparameterization-source",
          `Semantic state family ${JSON.stringify(input.id)} cannot reparameterize foreign application ${JSON.stringify(source.applicationId)}.`
        );
      }
      if (source.applicationId === applicationInput.applicationId) {
        throw new KpSemanticStateFamilyError(
          "reused-source-application-id",
          `Reparameterized application ${JSON.stringify(applicationInput.applicationId)} must not reuse its source application ID.`
        );
      }
      const application = prepareApplicationRecord(
        applicationInput,
        Object.freeze({
          schemaVersion: "kp.semantic-state-family-source-provenance.v1",
          kind: "reparameterized",
          sourceId: requireSourceId(
            applicationInput.sourceId,
            "reparameterization"
          ),
          sourceApplication: Object.freeze({
            schemaVersion: "kp.semantic-state-family-application-reference.v1",
            kind: "semantic-state-family-application-reference",
            definitionId: source.definitionId,
            transformationId: source.transformationId,
            applicationId: source.applicationId
          })
        })
      );
      // Reparameterization intentionally branches from the original source,
      // never from an interior sample or the prior application's endpoint.
      return applyApplication(source.commit.before, application);
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
