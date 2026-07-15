import type {
  KpSymbolicManipulationFamily,
  KpSymbolicRuntimeSampleRef
} from "./symbolic-manipulation-family.ts";
import type {
  KpSelectorCorrespondenceTemplate,
  KpSemanticTransformationDefinition
} from "../semantic/asset-transformation.ts";

export interface CreateKpSymbolicPausedFrameDrillDownInput {
  readonly family: KpSymbolicManipulationFamily;
  readonly runtimeSampleId: string;
  readonly selectedTransformationDefinitionId: string;
  readonly question?: string | undefined;
}

export interface KpSymbolicPausedFrameDrillDown {
  readonly id: string;
  readonly kind: "symbolic-paused-frame-drilldown";
  readonly familyId: string;
  readonly domain: KpSymbolicManipulationFamily["domain"];
  readonly runtimeSampleId: string;
  readonly animationId?: string | undefined;
  readonly selectedTransformationDefinitionId: string;
  readonly selectedTransformation?: KpSymbolicPausedTransformationContext | undefined;
  readonly question?: string | undefined;
  readonly correspondenceRows: readonly KpSymbolicPausedCorrespondenceRow[];
  readonly visualMotifIds: readonly string[];
  readonly graphEquivalentIds: readonly string[];
  readonly generatedProblemHookIds: readonly string[];
  readonly flashcardHookIds: readonly string[];
  readonly blueprint: KpSymbolicPausedFrameDrillDownBlueprint;
  readonly promptFacts: readonly string[];
  readonly diagnostics: readonly KpSymbolicPausedFrameDrillDownDiagnostic[];
}

export interface KpSymbolicPausedTransformationContext {
  readonly id: string;
  readonly title: string;
  readonly transformType: string;
  readonly sourceObjectRoles: readonly string[];
  readonly targetObjectRoles: readonly string[];
  readonly preserves: KpSemanticTransformationDefinition["preserves"];
  readonly assumptions: readonly string[];
  readonly lawIds: readonly string[];
}

export interface KpSymbolicPausedCorrespondenceRow {
  readonly id: string;
  readonly sourceObjectRole: string;
  readonly sourceSelectorRole: string;
  readonly sourceSelectorKind?: string | undefined;
  readonly targetObjectRole: string;
  readonly targetSelectorRole: string;
  readonly targetSelectorKind?: string | undefined;
  readonly preserves: KpSelectorCorrespondenceTemplate["preserves"];
}

export interface KpSymbolicPausedFrameDrillDownBlueprint {
  readonly animationId: string;
  readonly title: string;
  readonly sourceTransformationDefinitionId: string;
  readonly requiredObjectRoleIds: readonly string[];
  readonly requiredSelectorRoleIds: readonly string[];
  readonly suggestedTransformTypes: readonly string[];
}

export interface KpSymbolicPausedFrameDrillDownDiagnostic {
  readonly severity: "error";
  readonly code:
    | "symbolic-drilldown.runtime-sample-missing"
    | "symbolic-drilldown.transformation-definition-missing";
  readonly path: "runtimeSampleId" | "selectedTransformationDefinitionId";
  readonly message: string;
}

export function createKpSymbolicPausedFrameDrillDown(
  input: CreateKpSymbolicPausedFrameDrillDownInput
): KpSymbolicPausedFrameDrillDown {
  const runtimeSample = input.family.runtimeSamples.find(
    (sample) => sample.id === input.runtimeSampleId
  );
  const definition = input.family.transformationDefinitions.find(
    (candidate) => candidate.id === input.selectedTransformationDefinitionId
  );
  const diagnostics = symbolicPausedFrameDiagnostics(
    input,
    runtimeSample,
    definition
  );
  const correspondenceRows =
    definition === undefined
      ? []
      : definition.correspondenceTemplates.map((correspondence, index) =>
          correspondenceRow(input.family, definition, correspondence, index)
        );
  const visualMotifs = input.family.visualMotifs.filter((motif) =>
    motif.transformationDefinitionIds.includes(
      input.selectedTransformationDefinitionId
    )
  );
  const graphEquivalents = input.family.graphEquivalents.filter((equivalent) =>
    runtimeSample === undefined
      ? false
      : (equivalent.sampleAssetIds ?? []).includes(runtimeSample.animationId)
  );
  const generatedProblemHooks = input.family.generatedProblemHooks.filter(
    (hook) =>
      hook.transformationDefinitionIds.includes(
        input.selectedTransformationDefinitionId
      )
  );
  const flashcardHooks = input.family.flashcardHooks.filter((hook) =>
    hook.transformationDefinitionIds.includes(
      input.selectedTransformationDefinitionId
    )
  );
  const blueprint = symbolicPausedFrameBlueprint({
    family: input.family,
    definition,
    selectedTransformationDefinitionId:
      input.selectedTransformationDefinitionId,
    correspondenceRows,
    visualMotifKinds: visualMotifs.map((motif) => motif.motifKind)
  });

  return {
    id:
      `symbolic-paused-frame.${input.family.id}.${input.runtimeSampleId}` +
      `.${input.selectedTransformationDefinitionId}`,
    kind: "symbolic-paused-frame-drilldown",
    familyId: input.family.id,
    domain: input.family.domain,
    runtimeSampleId: input.runtimeSampleId,
    ...(runtimeSample === undefined
      ? {}
      : { animationId: runtimeSample.animationId }),
    selectedTransformationDefinitionId:
      input.selectedTransformationDefinitionId,
    ...(definition === undefined
      ? {}
      : { selectedTransformation: transformationContext(definition) }),
    ...(input.question === undefined ? {} : { question: input.question }),
    correspondenceRows,
    visualMotifIds: visualMotifs.map((motif) => motif.id),
    graphEquivalentIds: graphEquivalents.map((equivalent) => equivalent.id),
    generatedProblemHookIds: generatedProblemHooks.map((hook) => hook.id),
    flashcardHookIds: flashcardHooks.map((hook) => hook.id),
    blueprint,
    promptFacts: symbolicPausedFramePromptFacts({
      family: input.family,
      runtimeSample,
      definition,
      correspondenceRows,
      visualMotifIds: visualMotifs.map((motif) => motif.id),
      graphEquivalentIds: graphEquivalents.map((equivalent) => equivalent.id),
      generatedProblemHookIds: generatedProblemHooks.map((hook) => hook.id),
      flashcardHookIds: flashcardHooks.map((hook) => hook.id)
    }),
    diagnostics
  };
}

function transformationContext(
  definition: KpSemanticTransformationDefinition
): KpSymbolicPausedTransformationContext {
  return {
    id: definition.id,
    title: definition.title,
    transformType: definition.transformType,
    sourceObjectRoles: [...definition.sourceObjectRoles],
    targetObjectRoles: [...definition.targetObjectRoles],
    preserves: [...definition.preserves],
    assumptions: [...(definition.assumptions ?? [])],
    lawIds: (definition.lawRefs ?? []).map((law) => law.id)
  };
}

function correspondenceRow(
  family: KpSymbolicManipulationFamily,
  definition: KpSemanticTransformationDefinition,
  correspondence: KpSelectorCorrespondenceTemplate,
  index: number
): KpSymbolicPausedCorrespondenceRow {
  return {
    id: `${definition.id}.correspondence.${index}`,
    sourceObjectRole: correspondence.sourceObjectRole,
    sourceSelectorRole: correspondence.sourceSelectorRole,
    ...selectorKind(
      family,
      correspondence.sourceObjectRole,
      correspondence.sourceSelectorRole,
      "sourceSelectorKind"
    ),
    targetObjectRole: correspondence.targetObjectRole,
    targetSelectorRole: correspondence.targetSelectorRole,
    ...selectorKind(
      family,
      correspondence.targetObjectRole,
      correspondence.targetSelectorRole,
      "targetSelectorKind"
    ),
    preserves: [...correspondence.preserves]
  };
}

function selectorKind(
  family: KpSymbolicManipulationFamily,
  objectRoleId: string,
  selectorRoleId: string,
  key: "sourceSelectorKind" | "targetSelectorKind"
): Partial<
  Pick<
    KpSymbolicPausedCorrespondenceRow,
    "sourceSelectorKind" | "targetSelectorKind"
  >
> {
  const kind = family.objectRoles
    .find((role) => role.id === objectRoleId)
    ?.selectorRoles.find((selector) => selector.id === selectorRoleId)?.kind;

  if (kind === undefined) {
    return {};
  }

  return key === "sourceSelectorKind"
    ? { sourceSelectorKind: kind }
    : { targetSelectorKind: kind };
}

function symbolicPausedFrameBlueprint(input: {
  readonly family: KpSymbolicManipulationFamily;
  readonly definition: KpSemanticTransformationDefinition | undefined;
  readonly selectedTransformationDefinitionId: string;
  readonly correspondenceRows: readonly KpSymbolicPausedCorrespondenceRow[];
  readonly visualMotifKinds: readonly string[];
}): KpSymbolicPausedFrameDrillDownBlueprint {
  const definition = input.definition;

  return {
    animationId:
      `animation.drilldown.${input.family.id}.` +
      dashboardIdPart(input.selectedTransformationDefinitionId),
    title:
      definition === undefined
        ? `Drill down into ${input.selectedTransformationDefinitionId}`
        : `Drill down into ${definition.title}`,
    sourceTransformationDefinitionId:
      input.selectedTransformationDefinitionId,
    requiredObjectRoleIds:
      definition === undefined
        ? []
        : uniqueStrings([
            ...definition.sourceObjectRoles,
            ...definition.targetObjectRoles
          ]),
    requiredSelectorRoleIds: uniqueStrings(
      input.correspondenceRows.flatMap((row) => [
        `${row.sourceObjectRole}.${row.sourceSelectorRole}`,
        `${row.targetObjectRole}.${row.targetSelectorRole}`
      ])
    ),
    suggestedTransformTypes: uniqueStrings([
      "focusCorrespondence",
      ...input.visualMotifKinds,
      ...((definition?.assumptions ?? []).length === 0
        ? []
        : ["explainAssumptions"]),
      "restoreParentFrame"
    ])
  };
}

function symbolicPausedFramePromptFacts(input: {
  readonly family: KpSymbolicManipulationFamily;
  readonly runtimeSample: KpSymbolicRuntimeSampleRef | undefined;
  readonly definition: KpSemanticTransformationDefinition | undefined;
  readonly correspondenceRows: readonly KpSymbolicPausedCorrespondenceRow[];
  readonly visualMotifIds: readonly string[];
  readonly graphEquivalentIds: readonly string[];
  readonly generatedProblemHookIds: readonly string[];
  readonly flashcardHookIds: readonly string[];
}): readonly string[] {
  return [
    `family:${input.family.id}`,
    `domain:${input.family.domain}`,
    ...(input.runtimeSample === undefined
      ? []
      : [
          `runtime-sample:${input.runtimeSample.id}`,
          `animation:${input.runtimeSample.animationId}`
        ]),
    ...(input.definition === undefined
      ? []
      : [
          `selected-transformation:${input.definition.id}`,
          `selected-kind:${input.definition.transformType}`,
          ...(input.definition.assumptions ?? []).map(
            (assumption) => `assumption:${assumption}`
          ),
          ...(input.definition.lawRefs ?? []).map((law) => `law:${law.id}`)
        ]),
    ...input.correspondenceRows.map(
      (row) =>
        `correspondence:${row.sourceObjectRole}.${row.sourceSelectorRole}` +
        `->${row.targetObjectRole}.${row.targetSelectorRole}`
    ),
    ...input.visualMotifIds.map((id) => `visual-motif:${id}`),
    ...input.graphEquivalentIds.map((id) => `graph-equivalent:${id}`),
    ...input.generatedProblemHookIds.map((id) => `generated-problem-hook:${id}`),
    ...input.flashcardHookIds.map((id) => `flashcard-hook:${id}`)
  ];
}

function symbolicPausedFrameDiagnostics(
  input: CreateKpSymbolicPausedFrameDrillDownInput,
  runtimeSample: KpSymbolicRuntimeSampleRef | undefined,
  definition: KpSemanticTransformationDefinition | undefined
): readonly KpSymbolicPausedFrameDrillDownDiagnostic[] {
  return [
    ...(runtimeSample === undefined
      ? [
          {
            severity: "error" as const,
            code: "symbolic-drilldown.runtime-sample-missing" as const,
            path: "runtimeSampleId" as const,
            message:
              `Symbolic family ${input.family.id} does not contain runtime sample ` +
              `${input.runtimeSampleId}.`
          }
        ]
      : []),
    ...(definition === undefined
      ? [
          {
            severity: "error" as const,
            code:
              "symbolic-drilldown.transformation-definition-missing" as const,
            path: "selectedTransformationDefinitionId" as const,
            message:
              `Symbolic family ${input.family.id} does not contain transformation definition ` +
              `${input.selectedTransformationDefinitionId}.`
          }
        ]
      : [])
  ];
}

function dashboardIdPart(id: string): string {
  return id.replaceAll(".", "-");
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}
