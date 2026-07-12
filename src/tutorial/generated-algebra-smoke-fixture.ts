import type {
  GeneratedAlgebraDependencyManifest
} from "./generated-algebra-dependency-manifest.ts";
import {
  createGeneratedAlgebraIframeExportSample,
  type GeneratedAlgebraIframeExportSample
} from "./generated-algebra-export-sample.ts";
import type {
  KpTutorialCardExportArtifact
} from "./export-artifact.ts";
import type {
  LinearSolveTutorialCardSampleFrame
} from "./linear-solve-card-sample.ts";

export interface GeneratedAlgebraIframeSmokeFixture {
  readonly id: string;
  readonly fixtureId: string;
  readonly fixtureFamilyId: string;
  readonly progress: number;
  readonly artifact: KpTutorialCardExportArtifact;
  readonly dependencyManifest: GeneratedAlgebraDependencyManifest;
  readonly html: string;
  readonly diagnostics: LinearSolveTutorialCardSampleFrame["diagnostics"];
}

export function createGeneratedAlgebraIframeSmokeFixture(
  fixtureId: string,
  progress: number
): GeneratedAlgebraIframeSmokeFixture {
  const sample = createGeneratedAlgebraIframeExportSample(fixtureId, progress);

  return generatedIframeSmokeFixtureFromSample(sample);
}

function generatedIframeSmokeFixtureFromSample(
  sample: GeneratedAlgebraIframeExportSample
): GeneratedAlgebraIframeSmokeFixture {
  return {
    id: `fixture.${sample.fixtureId}.iframe-browser-smoke`,
    fixtureId: sample.fixtureId,
    fixtureFamilyId: sample.fixtureFamilyId,
    progress: sample.progress,
    artifact: sample.artifact,
    dependencyManifest: sample.dependencyManifest,
    html: sample.html,
    diagnostics: sample.diagnostics
  };
}
