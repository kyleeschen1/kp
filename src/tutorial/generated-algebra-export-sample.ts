import {
  createGeneratedAlgebraTutorialFixture,
  type GeneratedAlgebraTutorialFixture
} from "../semantic/generated-algebra-tutorial-fixture.ts";
import { createLinearSolveTutorialCardManifest } from "./card-manifest.ts";
import { renderKpTutorialCardHtmlShell } from "./card-html-shell.ts";
import {
  createKpTutorialCardExportArtifact,
  type KpTutorialCardExportArtifact
} from "./export-artifact.ts";
import {
  resolveKpTutorialCardIframeExportArtifact,
  resolveKpTutorialCardStepExportArtifact
} from "./export-artifact-resolver.ts";
import {
  createGeneratedAlgebraDependencyManifest,
  type GeneratedAlgebraDependencyManifest
} from "./generated-algebra-dependency-manifest.ts";
import {
  createGeneratedAlgebraTutorialCardSample
} from "./generated-algebra-card-sample.ts";
import { renderKpTutorialCardIframeDocument } from "./iframe-export-document.ts";
import type {
  LinearSolveTutorialCardSampleFrame
} from "./linear-solve-card-sample.ts";
import { selectKpTutorialStaticStepCheckpoints } from "./static-step-checkpoints.ts";
import {
  renderKpTutorialCardStaticStepSequence,
  type KpTutorialCardStaticStepSequence
} from "./static-step-sequence-renderer.ts";

export interface GeneratedAlgebraIframeExportSample {
  readonly id: string;
  readonly fixtureId: string;
  readonly fixtureFamilyId: GeneratedAlgebraTutorialFixture["familyId"];
  readonly progress: number;
  readonly artifact: KpTutorialCardExportArtifact;
  readonly dependencyManifest: GeneratedAlgebraDependencyManifest;
  readonly html: string;
  readonly diagnostics: LinearSolveTutorialCardSampleFrame["diagnostics"];
}

export interface GeneratedAlgebraStaticStepExportSample {
  readonly id: string;
  readonly fixtureId: string;
  readonly fixtureFamilyId: GeneratedAlgebraTutorialFixture["familyId"];
  readonly sequence: KpTutorialCardStaticStepSequence<LinearSolveTutorialCardSampleFrame>;
  readonly dependencyManifest: GeneratedAlgebraDependencyManifest;
  readonly diagnostics: KpTutorialCardStaticStepSequence<LinearSolveTutorialCardSampleFrame>["diagnostics"];
}

export function createGeneratedAlgebraIframeExportSample(
  fixtureId: string,
  progress: number
): GeneratedAlgebraIframeExportSample {
  const manifest = createLinearSolveTutorialCardManifest();
  const fixture = createGeneratedAlgebraTutorialFixture(fixtureId);
  const sample = createGeneratedAlgebraTutorialCardSample(fixtureId);
  const frame = sample.sample(progress);
  const artifact = generatedAlgebraExportArtifact({
    base: resolveKpTutorialCardIframeExportArtifact(manifest),
    fixture,
    sampleId: sample.id,
    suffix: "iframe"
  });
  const html = renderKpTutorialCardIframeDocument({
    artifact,
    title: sample.title,
    bodyHtml: renderKpTutorialCardHtmlShell(sample, frame)
  });

  return {
    id: `fixture.${sample.fixtureId}.iframe-export-sample`,
    fixtureId: sample.fixtureId,
    fixtureFamilyId: sample.fixtureFamilyId,
    progress: frame.progress,
    artifact,
    dependencyManifest: createGeneratedAlgebraDependencyManifest({
      fixture,
      artifact,
      sampleId: sample.id
    }),
    html,
    diagnostics: frame.diagnostics
  };
}

export function createGeneratedAlgebraStaticStepExportSample(
  fixtureId: string
): GeneratedAlgebraStaticStepExportSample {
  const manifest = createLinearSolveTutorialCardManifest();
  const fixture = createGeneratedAlgebraTutorialFixture(fixtureId);
  const sample = createGeneratedAlgebraTutorialCardSample(fixtureId);
  const sequence = renderKpTutorialCardStaticStepSequence({
    artifact: generatedAlgebraExportArtifact({
      base: resolveKpTutorialCardStepExportArtifact(manifest),
      fixture,
      sampleId: sample.id,
      suffix: "steps"
    }),
    checkpoints: selectKpTutorialStaticStepCheckpoints(
      sample.cardSampler.parentTimeline
    ),
    sampler: sample
  });

  return {
    id: `fixture.${sample.fixtureId}.static-step-export-sample`,
    fixtureId: sample.fixtureId,
    fixtureFamilyId: sample.fixtureFamilyId,
    sequence,
    dependencyManifest: createGeneratedAlgebraDependencyManifest({
      fixture,
      artifact: sequence.artifact,
      sampleId: sample.id
    }),
    diagnostics: sequence.diagnostics
  };
}

function generatedAlgebraExportArtifact(input: {
  readonly base: KpTutorialCardExportArtifact;
  readonly fixture: GeneratedAlgebraTutorialFixture;
  readonly sampleId: string;
  readonly suffix: "iframe" | "steps";
}): KpTutorialCardExportArtifact {
  return createKpTutorialCardExportArtifact({
    ...input.base,
    id: `artifact.${input.fixture.id}.${input.suffix}`,
    profileId: `export.${input.fixture.id}.${input.suffix}`,
    metadata: {
      ...(input.base.metadata ?? {}),
      generatedFixtureId: input.fixture.id,
      generatedFixtureFamilyId: input.fixture.familyId,
      sampleId: input.sampleId,
      sourceArtifactId: input.base.id
    }
  });
}
