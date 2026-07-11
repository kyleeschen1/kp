import { createLinearSolveTutorialCardManifest } from "./card-manifest.ts";
import { resolveKpTutorialCardStepExportArtifact } from "./export-artifact-resolver.ts";
import {
  createLinearSolveTutorialCardSample,
  type LinearSolveTutorialCardSampleFrame
} from "./linear-solve-card-sample.ts";
import { selectKpTutorialStaticStepCheckpoints } from "./static-step-checkpoints.ts";
import {
  renderKpTutorialCardStaticStepSequence,
  type KpTutorialCardStaticStepSequence
} from "./static-step-sequence-renderer.ts";

export interface LinearSolveStaticStepExportSmokeFixture {
  readonly id: "fixture.linear-solve.static-step-export-smoke";
  readonly sequence: KpTutorialCardStaticStepSequence<LinearSolveTutorialCardSampleFrame>;
  readonly html: string;
  readonly diagnostics: KpTutorialCardStaticStepSequence<LinearSolveTutorialCardSampleFrame>["diagnostics"];
}

export function createLinearSolveStaticStepExportSmokeFixture(): LinearSolveStaticStepExportSmokeFixture {
  const manifest = createLinearSolveTutorialCardManifest();
  const sample = createLinearSolveTutorialCardSample();
  const sequence = renderKpTutorialCardStaticStepSequence({
    artifact: resolveKpTutorialCardStepExportArtifact(manifest),
    checkpoints: selectKpTutorialStaticStepCheckpoints(
      sample.cardSampler.parentTimeline
    ),
    sampler: sample
  });

  return {
    id: "fixture.linear-solve.static-step-export-smoke",
    sequence,
    html: renderStaticStepSmokeHtml(sequence),
    diagnostics: sequence.diagnostics
  };
}

function renderStaticStepSmokeHtml(
  sequence: KpTutorialCardStaticStepSequence<LinearSolveTutorialCardSampleFrame>
): string {
  return [
    "<!doctype html>",
    `<html lang="en" data-kp-export-artifact="${escapeAttr(
      sequence.artifact.id
    )}" data-kp-export-manifest="${escapeAttr(
      sequence.artifact.manifestId
    )}" data-kp-export-profile="${escapeAttr(
      sequence.artifact.profileId
    )}" data-kp-export-kind="${escapeAttr(
      sequence.artifact.exportKind
    )}" data-kp-export-target="${escapeAttr(
      sequence.artifact.target
    )}" data-kp-export-status="${escapeAttr(sequence.artifact.status)}">`,
    "<head>",
    `  <meta charset="utf-8" />`,
    `  <meta name="viewport" content="width=device-width, initial-scale=1" />`,
    `  <title>Linear Solve Static Steps</title>`,
    `  <script type="application/json" data-kp-static-step-sequence-json>${escapeScriptJson(
      JSON.stringify(sequence)
    )}</script>`,
    "</head>",
    `<body data-kp-export-payload="${escapeAttr(sequence.artifact.payloadKind)}">`,
    `  <ol data-kp-static-step-sequence="${escapeAttr(sequence.artifact.id)}">`,
    ...sequence.steps.map(
      (step) =>
        `    <li data-kp-static-step="${escapeAttr(
          step.checkpointId
        )}" data-kp-static-step-progress="${escapeAttr(
          String(step.progress)
        )}" data-kp-static-step-beat="${escapeAttr(
          String(step.beat)
        )}" data-kp-static-step-timeline="${escapeAttr(
          step.timelineId
        )}">${escapeHtml(step.label)}</li>`
    ),
    "  </ol>",
    "</body>",
    "</html>"
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("\"", "&quot;");
}

function escapeScriptJson(value: string): string {
  return value
    .replaceAll("<", "\\u003c")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}
