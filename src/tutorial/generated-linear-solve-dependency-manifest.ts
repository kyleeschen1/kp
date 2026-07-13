import type {
  GeneratedLinearSolveTutorialFixture
} from "../semantic/generated-algebra-tutorial-fixture.ts";
import type {
  KpTutorialCardExportArtifact
} from "./export-artifact.ts";
import type {
  KpTutorialDependencyPhase
} from "./dependency-planner.ts";

export interface GeneratedLinearSolveDependencyManifest {
  readonly id: string;
  readonly artifactId: string;
  readonly manifestId: string;
  readonly profileId: string;
  readonly fixtureId: string;
  readonly sampleId: string;
  readonly assetId: string;
  readonly semanticObjectIds: readonly string[];
  readonly transformationIds: readonly string[];
  readonly transformDefinitionIds: readonly string[];
  readonly drillDownIds: readonly string[];
  readonly flashcardIds: readonly string[];
  readonly traceStepIds: readonly string[];
  readonly timelineIds: readonly string[];
  readonly dependencyPhases: readonly KpTutorialDependencyPhase[];
  readonly capabilityKeys: readonly string[];
  readonly capabilityPackageIds: readonly string[];
  readonly capabilityPackageKeys: readonly string[];
  readonly assetIds: readonly string[];
  readonly diagnostics: readonly GeneratedLinearSolveDependencyManifestDiagnostic[];
}

export interface GeneratedLinearSolveDependencyManifestDiagnostic {
  readonly path: string;
  readonly message: string;
}

export interface CreateGeneratedLinearSolveDependencyManifestInput {
  readonly fixture: GeneratedLinearSolveTutorialFixture;
  readonly artifact: KpTutorialCardExportArtifact;
  readonly sampleId: string;
}

export function createGeneratedLinearSolveDependencyManifest(
  input: CreateGeneratedLinearSolveDependencyManifestInput
): GeneratedLinearSolveDependencyManifest {
  const { artifact, fixture } = input;

  return {
    id: `dependency-manifest.${artifact.id}`,
    artifactId: artifact.id,
    manifestId: artifact.manifestId,
    profileId: artifact.profileId,
    fixtureId: fixture.id,
    sampleId: input.sampleId,
    assetId: fixture.bundle.id,
    semanticObjectIds: fixture.bundle.objects.map((object) => object.id),
    transformationIds: fixture.transformations.map(
      (transformation) => transformation.id
    ),
    transformDefinitionIds: uniqueStrings(
      fixture.transformations.flatMap((transformation) =>
        transformation.definitionId === undefined
          ? []
          : [transformation.definitionId]
      )
    ),
    drillDownIds: fixture.drillDownHooks.map((hook) => hook.id),
    flashcardIds: fixture.flashcards.map((flashcard) => flashcard.id),
    traceStepIds: fixture.trace.steps.map((step) => step.id),
    timelineIds: [...artifact.timelineIds],
    dependencyPhases: [...artifact.dependencies.phases],
    capabilityKeys: [...artifact.dependencies.capabilityKeys],
    capabilityPackageIds: [
      ...(artifact.dependencies.capabilityPackageIds ?? [])
    ],
    capabilityPackageKeys: [
      ...(artifact.dependencies.capabilityPackageKeys ?? [])
    ],
    assetIds: [...artifact.dependencies.assetIds],
    diagnostics: []
  };
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return Array.from(new Set(values));
}
