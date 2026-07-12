import type {
  GeneratedAlgebraTutorialFixture
} from "../semantic/generated-algebra-tutorial-fixture.ts";
import type {
  KpTutorialDependencyPhase
} from "./dependency-planner.ts";
import type {
  KpTutorialCardExportArtifact
} from "./export-artifact.ts";

export interface GeneratedAlgebraDependencyManifest {
  readonly id: string;
  readonly artifactId: string;
  readonly manifestId: string;
  readonly profileId: string;
  readonly fixtureId: string;
  readonly fixtureFamilyId: GeneratedAlgebraTutorialFixture["familyId"];
  readonly sampleId: string;
  readonly assetId: string;
  readonly semanticObjectIds: readonly string[];
  readonly transformationIds: readonly string[];
  readonly drillDownIds: readonly string[];
  readonly flashcardIds: readonly string[];
  readonly traceStepIds: readonly string[];
  readonly timelineIds: readonly string[];
  readonly dependencyPhases: readonly KpTutorialDependencyPhase[];
  readonly capabilityKeys: readonly string[];
  readonly capabilityPackageIds: readonly string[];
  readonly capabilityPackageKeys: readonly string[];
  readonly assetIds: readonly string[];
  readonly diagnostics: readonly GeneratedAlgebraDependencyManifestDiagnostic[];
}

export interface GeneratedAlgebraDependencyManifestDiagnostic {
  readonly path: string;
  readonly message: string;
}

export interface CreateGeneratedAlgebraDependencyManifestInput {
  readonly fixture: GeneratedAlgebraTutorialFixture;
  readonly artifact: KpTutorialCardExportArtifact;
  readonly sampleId: string;
}

export function createGeneratedAlgebraDependencyManifest(
  input: CreateGeneratedAlgebraDependencyManifestInput
): GeneratedAlgebraDependencyManifest {
  const { artifact, fixture } = input;

  return {
    id: `dependency-manifest.${artifact.id}`,
    artifactId: artifact.id,
    manifestId: artifact.manifestId,
    profileId: artifact.profileId,
    fixtureId: fixture.id,
    fixtureFamilyId: fixture.familyId,
    sampleId: input.sampleId,
    assetId: fixture.bundle.id,
    semanticObjectIds: fixture.bundle.objects.map((object) => object.id),
    transformationIds: fixture.transformations.map(
      (transformation) => transformation.id
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
