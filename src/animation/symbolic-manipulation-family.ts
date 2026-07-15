import type {
  KpAnimationAssetRenderTargetKind
} from "./asset.ts";
import type { KpAssetMetadataValue } from "../semantic/asset.ts";
import {
  validateKpSemanticTransformationDefinition,
  type KpLawCheckLevel,
  type KpSemanticTransformationDefinition,
  type KpTransformationPreservation
} from "../semantic/asset-transformation.ts";

export type KpSymbolicManipulationDomain =
  | "algebra"
  | "calculus"
  | "linear-algebra"
  | "graph";

export type KpSymbolicManipulationFamilyStatus =
  | "seed"
  | "promoted"
  | "ready";

export type KpSymbolicGraphEquivalentExactness =
  | "exact"
  | "sampled"
  | "qualitative";

export type KpSymbolicFlashcardHookKind =
  | "cloze"
  | "focus"
  | "predict-next"
  | "relationship";

export type KpSymbolicRuntimeSampleAvailability =
  | "planned"
  | "concrete";

export interface KpSymbolicManipulationFamily {
  readonly id: string;
  readonly kind: "symbolic-manipulation-family";
  readonly title: string;
  readonly version: 1;
  readonly domain: KpSymbolicManipulationDomain;
  readonly status: KpSymbolicManipulationFamilyStatus;
  readonly objectRoles: readonly KpSymbolicObjectRole[];
  readonly transformationDefinitions: readonly KpSemanticTransformationDefinition[];
  readonly visualMotifs: readonly KpSymbolicVisualMotifRef[];
  readonly runtimeSamples: readonly KpSymbolicRuntimeSampleRef[];
  readonly graphEquivalents: readonly KpSymbolicGraphEquivalentRef[];
  readonly generatedProblemHooks: readonly KpSymbolicGeneratedProblemHook[];
  readonly flashcardHooks: readonly KpSymbolicFlashcardHook[];
  readonly dashboard?: KpSymbolicFamilyDashboardMetadata | undefined;
  readonly metadata?: Readonly<Record<string, KpAssetMetadataValue>> | undefined;
}

export interface KpSymbolicObjectRole {
  readonly id: string;
  readonly objectType: string;
  readonly title: string;
  readonly selectorRoles: readonly KpSymbolicSelectorRole[];
  readonly metadata?: Readonly<Record<string, KpAssetMetadataValue>> | undefined;
}

export interface KpSymbolicSelectorRole {
  readonly id: string;
  readonly kind: string;
  readonly label?: string | undefined;
  readonly summary?: string | undefined;
  readonly metadata?: Readonly<Record<string, KpAssetMetadataValue>> | undefined;
}

export interface KpSymbolicVisualMotifRef {
  readonly id: string;
  readonly motifKind: string;
  readonly transformationDefinitionIds: readonly string[];
  readonly summary?: string | undefined;
  readonly metadata?: Readonly<Record<string, KpAssetMetadataValue>> | undefined;
}

export interface KpSymbolicRuntimeSampleRef {
  readonly id: string;
  readonly animationId: string;
  readonly availability?: KpSymbolicRuntimeSampleAvailability | undefined;
  readonly renderTargetKinds: readonly KpAnimationAssetRenderTargetKind[];
  readonly transformationDefinitionIds?: readonly string[] | undefined;
  readonly summary?: string | undefined;
  readonly metadata?: Readonly<Record<string, KpAssetMetadataValue>> | undefined;
}

export function symbolicRuntimeSampleAvailability(
  sample: KpSymbolicRuntimeSampleRef
): KpSymbolicRuntimeSampleAvailability {
  // Existing family records predate executable catalog closure, so omission
  // must remain planned instead of accidentally claiming a concrete asset.
  return sample.availability ?? "planned";
}

export interface KpSymbolicGraphEquivalentRef {
  readonly id: string;
  readonly title: string;
  readonly representationKind: string;
  readonly exactness: KpSymbolicGraphEquivalentExactness;
  readonly preserves: readonly KpTransformationPreservation[];
  readonly lawRefs?: readonly KpSymbolicFamilyLawRef[] | undefined;
  readonly sampleAssetIds?: readonly string[] | undefined;
  readonly summary?: string | undefined;
  readonly metadata?: Readonly<Record<string, KpAssetMetadataValue>> | undefined;
}

export interface KpSymbolicFamilyLawRef {
  readonly id: string;
  readonly level: KpLawCheckLevel;
  readonly summary?: string | undefined;
}

export interface KpSymbolicGeneratedProblemHook {
  readonly id: string;
  readonly fixtureFamilyId: string;
  readonly transformationDefinitionIds: readonly string[];
  readonly summary?: string | undefined;
  readonly metadata?: Readonly<Record<string, KpAssetMetadataValue>> | undefined;
}

export interface KpSymbolicFlashcardHook {
  readonly id: string;
  readonly kind: KpSymbolicFlashcardHookKind;
  readonly transformationDefinitionIds: readonly string[];
  readonly summary?: string | undefined;
  readonly metadata?: Readonly<Record<string, KpAssetMetadataValue>> | undefined;
}

export interface KpSymbolicFamilyDashboardMetadata {
  readonly rowId: string;
  readonly tags: readonly string[];
  readonly sampleTargetIds?: readonly string[] | undefined;
}

export interface CreateKpSymbolicManipulationFamilyInput {
  readonly id: string;
  readonly title: string;
  readonly domain: KpSymbolicManipulationDomain;
  readonly status?: KpSymbolicManipulationFamilyStatus | undefined;
  readonly objectRoles?: readonly KpSymbolicObjectRole[] | undefined;
  readonly transformationDefinitions?: readonly KpSemanticTransformationDefinition[] | undefined;
  readonly visualMotifs?: readonly KpSymbolicVisualMotifRef[] | undefined;
  readonly runtimeSamples?: readonly KpSymbolicRuntimeSampleRef[] | undefined;
  readonly graphEquivalents?: readonly KpSymbolicGraphEquivalentRef[] | undefined;
  readonly generatedProblemHooks?: readonly KpSymbolicGeneratedProblemHook[] | undefined;
  readonly flashcardHooks?: readonly KpSymbolicFlashcardHook[] | undefined;
  readonly dashboard?: KpSymbolicFamilyDashboardMetadata | undefined;
  readonly metadata?: Readonly<Record<string, KpAssetMetadataValue>> | undefined;
}

export interface KpSymbolicManipulationFamilyValidationIssue {
  readonly path: string;
  readonly message: string;
}

export function createKpSymbolicManipulationFamily(
  input: CreateKpSymbolicManipulationFamilyInput
): KpSymbolicManipulationFamily {
  assertNonEmpty(input.id, "Symbolic manipulation family id");
  assertNonEmpty(input.title, `Symbolic manipulation family ${input.id} title`);

  return {
    id: input.id,
    kind: "symbolic-manipulation-family",
    title: input.title,
    version: 1,
    domain: input.domain,
    status: input.status ?? "seed",
    objectRoles: (input.objectRoles ?? []).map(cloneObjectRole),
    transformationDefinitions: (input.transformationDefinitions ?? []).map(
      cloneTransformationDefinition
    ),
    visualMotifs: (input.visualMotifs ?? []).map(cloneVisualMotifRef),
    runtimeSamples: (input.runtimeSamples ?? []).map(cloneRuntimeSampleRef),
    graphEquivalents: (input.graphEquivalents ?? []).map(cloneGraphEquivalentRef),
    generatedProblemHooks: (input.generatedProblemHooks ?? []).map(
      cloneGeneratedProblemHook
    ),
    flashcardHooks: (input.flashcardHooks ?? []).map(cloneFlashcardHook),
    ...(input.dashboard === undefined
      ? {}
      : { dashboard: cloneDashboardMetadata(input.dashboard) }),
    ...(input.metadata === undefined ? {} : { metadata: { ...input.metadata } })
  };
}

export function symbolicManipulationFamilyDashboardTags(
  family: KpSymbolicManipulationFamily
): readonly string[] {
  return uniqueStrings([
    "symbolic-family",
    family.domain,
    family.status,
    ...(family.dashboard?.tags ?? [])
  ]);
}

export function validateKpSymbolicManipulationFamily(
  family: KpSymbolicManipulationFamily
): readonly KpSymbolicManipulationFamilyValidationIssue[] {
  const issues: KpSymbolicManipulationFamilyValidationIssue[] = [];
  const objectRolesById = new Map(
    family.objectRoles.map((role) => [role.id, role])
  );
  const definitionIds = new Set(
    family.transformationDefinitions.map((definition) => definition.id)
  );
  const runtimeSampleAnimationIds = new Set(
    family.runtimeSamples.map((sample) => sample.animationId)
  );

  family.transformationDefinitions.forEach((definition, index) => {
    validateKpSemanticTransformationDefinition(definition).forEach((issue) => {
      issues.push({
        path: `transformationDefinitions[${index}].${issue.path}`,
        message: issue.message
      });
    });

    definition.sourceObjectRoles.forEach((role, roleIndex) => {
      if (!objectRolesById.has(role)) {
        issues.push({
          path: `transformationDefinitions[${index}].sourceObjectRoles[${roleIndex}]`,
          message:
            `Family ${family.id} transformation definition ${definition.id} references missing source object role ${role}.`
        });
      }
    });

    definition.targetObjectRoles.forEach((role, roleIndex) => {
      if (!objectRolesById.has(role)) {
        issues.push({
          path: `transformationDefinitions[${index}].targetObjectRoles[${roleIndex}]`,
          message:
            `Family ${family.id} transformation definition ${definition.id} references missing target object role ${role}.`
        });
      }
    });

    definition.correspondenceTemplates.forEach((correspondence, correspondenceIndex) => {
      validateSelectorRoleRef({
        family,
        objectRolesById,
        objectRole: correspondence.sourceObjectRole,
        selectorRole: correspondence.sourceSelectorRole,
        path:
          `transformationDefinitions[${index}].correspondenceTemplates[${correspondenceIndex}].sourceSelectorRole`,
        issues
      });
      validateSelectorRoleRef({
        family,
        objectRolesById,
        objectRole: correspondence.targetObjectRole,
        selectorRole: correspondence.targetSelectorRole,
        path:
          `transformationDefinitions[${index}].correspondenceTemplates[${correspondenceIndex}].targetSelectorRole`,
        issues
      });
    });
  });

  family.visualMotifs.forEach((motif, index) => {
    validateDefinitionRefs({
      family,
      definitionIds,
      ownerLabel: `visual motif ${motif.id}`,
      refs: motif.transformationDefinitionIds,
      pathPrefix: `visualMotifs[${index}].transformationDefinitionIds`,
      issues
    });
  });

  family.runtimeSamples.forEach((sample, index) => {
    validateDefinitionRefs({
      family,
      definitionIds,
      ownerLabel: `runtime sample ${sample.id}`,
      refs: sample.transformationDefinitionIds ?? [],
      pathPrefix: `runtimeSamples[${index}].transformationDefinitionIds`,
      issues
    });
  });

  family.graphEquivalents.forEach((equivalent, index) => {
    (equivalent.sampleAssetIds ?? []).forEach((sampleAssetId, sampleIndex) => {
      if (!runtimeSampleAnimationIds.has(sampleAssetId)) {
        issues.push({
          path: `graphEquivalents[${index}].sampleAssetIds[${sampleIndex}]`,
          message:
            `Family ${family.id} graph equivalent ${equivalent.id} references missing runtime sample animation ${sampleAssetId}.`
        });
      }
    });
    validateGraphEquivalentLawRefs({
      family,
      equivalent,
      index,
      issues
    });
  });

  family.generatedProblemHooks.forEach((hook, index) => {
    validateDefinitionRefs({
      family,
      definitionIds,
      ownerLabel: `generated problem hook ${hook.id}`,
      refs: hook.transformationDefinitionIds,
      pathPrefix: `generatedProblemHooks[${index}].transformationDefinitionIds`,
      issues
    });
  });

  family.flashcardHooks.forEach((hook, index) => {
    validateDefinitionRefs({
      family,
      definitionIds,
      ownerLabel: `flashcard hook ${hook.id}`,
      refs: hook.transformationDefinitionIds,
      pathPrefix: `flashcardHooks[${index}].transformationDefinitionIds`,
      issues
    });
  });

  return issues;
}

function validateGraphEquivalentLawRefs(input: {
  readonly family: KpSymbolicManipulationFamily;
  readonly equivalent: KpSymbolicGraphEquivalentRef;
  readonly index: number;
  readonly issues: KpSymbolicManipulationFamilyValidationIssue[];
}): void {
  const lawLevels = new Set(
    (input.equivalent.lawRefs ?? []).map((law) => law.level)
  );
  if (input.equivalent.exactness === "sampled" && !lawLevels.has("sampled")) {
    input.issues.push({
      path: `graphEquivalents[${input.index}].lawRefs`,
      message:
        `Family ${input.family.id} graph equivalent ${input.equivalent.id} with sampled exactness must include a sampled law reference.`
    });
  }
  if (input.equivalent.exactness === "qualitative" && !lawLevels.has("qualitative")) {
    input.issues.push({
      path: `graphEquivalents[${input.index}].lawRefs`,
      message:
        `Family ${input.family.id} graph equivalent ${input.equivalent.id} with qualitative exactness must include a qualitative law reference.`
    });
  }
  if (input.equivalent.exactness === "exact" && !lawLevels.has("strict")) {
    input.issues.push({
      path: `graphEquivalents[${input.index}].lawRefs`,
      message:
        `Family ${input.family.id} graph equivalent ${input.equivalent.id} with exact exactness must include a strict law reference.`
    });
  }
}

function validateSelectorRoleRef(input: {
  readonly family: KpSymbolicManipulationFamily;
  readonly objectRolesById: ReadonlyMap<string, KpSymbolicObjectRole>;
  readonly objectRole: string;
  readonly selectorRole: string;
  readonly path: string;
  readonly issues: KpSymbolicManipulationFamilyValidationIssue[];
}): void {
  const objectRole = input.objectRolesById.get(input.objectRole);
  if (objectRole === undefined) return;

  if (!objectRole.selectorRoles.some((role) => role.id === input.selectorRole)) {
    input.issues.push({
      path: input.path,
      message:
        `Family ${input.family.id} object role ${input.objectRole} has no selector role ${input.selectorRole}.`
    });
  }
}

function validateDefinitionRefs(input: {
  readonly family: KpSymbolicManipulationFamily;
  readonly definitionIds: ReadonlySet<string>;
  readonly ownerLabel: string;
  readonly refs: readonly string[];
  readonly pathPrefix: string;
  readonly issues: KpSymbolicManipulationFamilyValidationIssue[];
}): void {
  input.refs.forEach((definitionId, index) => {
    if (!input.definitionIds.has(definitionId)) {
      input.issues.push({
        path: `${input.pathPrefix}[${index}]`,
        message:
          `Family ${input.family.id} ${input.ownerLabel} references missing transformation definition ${definitionId}.`
      });
    }
  });
}

function cloneObjectRole(role: KpSymbolicObjectRole): KpSymbolicObjectRole {
  return {
    id: role.id,
    objectType: role.objectType,
    title: role.title,
    selectorRoles: role.selectorRoles.map(cloneSelectorRole),
    ...(role.metadata === undefined ? {} : { metadata: { ...role.metadata } })
  };
}

function cloneSelectorRole(role: KpSymbolicSelectorRole): KpSymbolicSelectorRole {
  return {
    id: role.id,
    kind: role.kind,
    ...(role.label === undefined ? {} : { label: role.label }),
    ...(role.summary === undefined ? {} : { summary: role.summary }),
    ...(role.metadata === undefined ? {} : { metadata: { ...role.metadata } })
  };
}

function cloneTransformationDefinition(
  definition: KpSemanticTransformationDefinition
): KpSemanticTransformationDefinition {
  return {
    id: definition.id,
    kind: "semantic-transformation-definition",
    transformType: definition.transformType,
    title: definition.title,
    sourceObjectRoles: [...definition.sourceObjectRoles],
    targetObjectRoles: [...definition.targetObjectRoles],
    preserves: [...definition.preserves],
    correspondenceTemplates: definition.correspondenceTemplates.map(
      (correspondence) => ({
        sourceObjectRole: correspondence.sourceObjectRole,
        sourceSelectorRole: correspondence.sourceSelectorRole,
        targetObjectRole: correspondence.targetObjectRole,
        targetSelectorRole: correspondence.targetSelectorRole,
        preserves: [...correspondence.preserves],
        ...(correspondence.summary === undefined
          ? {}
          : { summary: correspondence.summary })
      })
    ),
    ...(definition.assumptions === undefined
      ? {}
      : { assumptions: [...definition.assumptions] }),
    ...(definition.lawRefs === undefined
      ? {}
      : {
          lawRefs: definition.lawRefs.map((lawRef) => ({
            id: lawRef.id,
            level: lawRef.level,
            ...(lawRef.summary === undefined ? {} : { summary: lawRef.summary })
          }))
        })
  };
}

function cloneVisualMotifRef(
  motif: KpSymbolicVisualMotifRef
): KpSymbolicVisualMotifRef {
  return {
    id: motif.id,
    motifKind: motif.motifKind,
    transformationDefinitionIds: [...motif.transformationDefinitionIds],
    ...(motif.summary === undefined ? {} : { summary: motif.summary }),
    ...(motif.metadata === undefined ? {} : { metadata: { ...motif.metadata } })
  };
}

function cloneRuntimeSampleRef(
  sample: KpSymbolicRuntimeSampleRef
): KpSymbolicRuntimeSampleRef {
  return {
    id: sample.id,
    animationId: sample.animationId,
    ...(sample.availability === undefined
      ? {}
      : { availability: sample.availability }),
    renderTargetKinds: [...sample.renderTargetKinds],
    ...(sample.transformationDefinitionIds === undefined
      ? {}
      : { transformationDefinitionIds: [...sample.transformationDefinitionIds] }),
    ...(sample.summary === undefined ? {} : { summary: sample.summary }),
    ...(sample.metadata === undefined ? {} : { metadata: { ...sample.metadata } })
  };
}

function cloneGraphEquivalentRef(
  equivalent: KpSymbolicGraphEquivalentRef
): KpSymbolicGraphEquivalentRef {
  return {
    id: equivalent.id,
    title: equivalent.title,
    representationKind: equivalent.representationKind,
    exactness: equivalent.exactness,
    preserves: [...equivalent.preserves],
    ...(equivalent.lawRefs === undefined
      ? {}
      : {
          lawRefs: equivalent.lawRefs.map((lawRef) => ({
            id: lawRef.id,
            level: lawRef.level,
            ...(lawRef.summary === undefined ? {} : { summary: lawRef.summary })
          }))
        }),
    ...(equivalent.sampleAssetIds === undefined
      ? {}
      : { sampleAssetIds: [...equivalent.sampleAssetIds] }),
    ...(equivalent.summary === undefined ? {} : { summary: equivalent.summary }),
    ...(equivalent.metadata === undefined
      ? {}
      : { metadata: { ...equivalent.metadata } })
  };
}

function cloneGeneratedProblemHook(
  hook: KpSymbolicGeneratedProblemHook
): KpSymbolicGeneratedProblemHook {
  return {
    id: hook.id,
    fixtureFamilyId: hook.fixtureFamilyId,
    transformationDefinitionIds: [...hook.transformationDefinitionIds],
    ...(hook.summary === undefined ? {} : { summary: hook.summary }),
    ...(hook.metadata === undefined ? {} : { metadata: { ...hook.metadata } })
  };
}

function cloneFlashcardHook(
  hook: KpSymbolicFlashcardHook
): KpSymbolicFlashcardHook {
  return {
    id: hook.id,
    kind: hook.kind,
    transformationDefinitionIds: [...hook.transformationDefinitionIds],
    ...(hook.summary === undefined ? {} : { summary: hook.summary }),
    ...(hook.metadata === undefined ? {} : { metadata: { ...hook.metadata } })
  };
}

function cloneDashboardMetadata(
  dashboard: KpSymbolicFamilyDashboardMetadata
): KpSymbolicFamilyDashboardMetadata {
  return {
    rowId: dashboard.rowId,
    tags: [...dashboard.tags],
    ...(dashboard.sampleTargetIds === undefined
      ? {}
      : { sampleTargetIds: [...dashboard.sampleTargetIds] })
  };
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
