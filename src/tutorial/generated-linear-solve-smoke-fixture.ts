import {
  createGeneratedLinearSolveIframeExportSample,
  type GeneratedLinearSolveIframeExportSample
} from "./generated-linear-solve-export-sample.ts";
import type {
  GeneratedLinearSolveDependencyManifest
} from "./generated-linear-solve-dependency-manifest.ts";
import type {
  KpTutorialCardExportArtifact
} from "./export-artifact.ts";
import type {
  LinearSolveTutorialCardSampleFrame
} from "./linear-solve-card-sample.ts";

export interface GeneratedLinearSolveIframeSmokeFixture {
  readonly id: string;
  readonly fixtureId: string;
  readonly progress: number;
  readonly artifact: KpTutorialCardExportArtifact;
  readonly dependencyManifest: GeneratedLinearSolveDependencyManifest;
  readonly html: string;
  readonly diagnostics: LinearSolveTutorialCardSampleFrame["diagnostics"];
}

export function createGeneratedLinearSolveIframeSmokeFixture(
  fixtureId: string,
  progress: number
): GeneratedLinearSolveIframeSmokeFixture {
  const sample = createGeneratedLinearSolveIframeExportSample(
    fixtureId,
    progress
  );

  return generatedIframeSmokeFixtureFromSample(sample);
}

function generatedIframeSmokeFixtureFromSample(
  sample: GeneratedLinearSolveIframeExportSample
): GeneratedLinearSolveIframeSmokeFixture {
  return {
    id: `fixture.${sample.fixtureId}.iframe-browser-smoke`,
    fixtureId: sample.fixtureId,
    progress: sample.progress,
    artifact: sample.artifact,
    dependencyManifest: sample.dependencyManifest,
    html: sample.html,
    diagnostics: sample.diagnostics
  };
}
