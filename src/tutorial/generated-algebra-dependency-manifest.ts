import {
  createGeneratedAlgebraAnimationAssets
} from "../animation/catalog.ts";
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
  readonly animationIds: readonly string[];
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
    animationIds: animationIdsForFixture(fixture.id),
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

function animationIdsForFixture(fixtureId: string): readonly string[] {
  return createGeneratedAlgebraAnimationAssets()
    .filter((animation) => {
      const sourceRefIds = animation.dashboard?.sourceRefIds ?? [];
      const sourceFixtureId = animation.metadata?.["sourceFixtureId"];

      return sourceRefIds.includes(fixtureId) || sourceFixtureId === fixtureId;
    })
    .map((animation) => animation.id);
}
