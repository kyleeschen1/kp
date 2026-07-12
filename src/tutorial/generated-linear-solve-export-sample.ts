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
  createGeneratedLinearSolveTutorialCardSample
} from "./generated-linear-solve-card-sample.ts";
import { renderKpTutorialCardIframeDocument } from "./iframe-export-document.ts";
import type {
  LinearSolveTutorialCardSampleFrame
} from "./linear-solve-card-sample.ts";
import { selectKpTutorialStaticStepCheckpoints } from "./static-step-checkpoints.ts";
import {
  renderKpTutorialCardStaticStepSequence,
  type KpTutorialCardStaticStepSequence
} from "./static-step-sequence-renderer.ts";

export interface GeneratedLinearSolveIframeExportSample {
  readonly id: string;
  readonly fixtureId: string;
  readonly progress: number;
  readonly artifact: KpTutorialCardExportArtifact;
  readonly html: string;
  readonly diagnostics: LinearSolveTutorialCardSampleFrame["diagnostics"];
}

export interface GeneratedLinearSolveStaticStepExportSample {
  readonly id: string;
  readonly fixtureId: string;
  readonly sequence: KpTutorialCardStaticStepSequence<LinearSolveTutorialCardSampleFrame>;
  readonly diagnostics: KpTutorialCardStaticStepSequence<LinearSolveTutorialCardSampleFrame>["diagnostics"];
}

export function createGeneratedLinearSolveIframeExportSample(
  fixtureId: string,
  progress: number
): GeneratedLinearSolveIframeExportSample {
  const manifest = createLinearSolveTutorialCardManifest();
  const sample = createGeneratedLinearSolveTutorialCardSample(fixtureId);
  const frame = sample.sample(progress);
  const artifact = generatedExportArtifact({
    base: resolveKpTutorialCardIframeExportArtifact(manifest),
    fixtureId: sample.fixtureId,
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
    progress: frame.progress,
    artifact,
    html,
    diagnostics: frame.diagnostics
  };
}

export function createGeneratedLinearSolveStaticStepExportSample(
  fixtureId: string
): GeneratedLinearSolveStaticStepExportSample {
  const manifest = createLinearSolveTutorialCardManifest();
  const sample = createGeneratedLinearSolveTutorialCardSample(fixtureId);
  const sequence = renderKpTutorialCardStaticStepSequence({
    artifact: generatedExportArtifact({
      base: resolveKpTutorialCardStepExportArtifact(manifest),
      fixtureId: sample.fixtureId,
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
    sequence,
    diagnostics: sequence.diagnostics
  };
}

function generatedExportArtifact(input: {
  readonly base: KpTutorialCardExportArtifact;
  readonly fixtureId: string;
  readonly sampleId: string;
  readonly suffix: "iframe" | "steps";
}): KpTutorialCardExportArtifact {
  return createKpTutorialCardExportArtifact({
    ...input.base,
    id: `artifact.${input.fixtureId}.${input.suffix}`,
    profileId: `export.${input.fixtureId}.${input.suffix}`,
    metadata: {
      ...(input.base.metadata ?? {}),
      generatedFixtureId: input.fixtureId,
      sampleId: input.sampleId,
      sourceArtifactId: input.base.id
    }
  });
}
