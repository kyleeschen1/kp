import {
  createLinearSolveTutorialCardManifest
} from "./card-manifest.ts";
import { renderKpTutorialCardHtmlShell } from "./card-html-shell.ts";
import type { KpTutorialCardExportArtifact } from "./export-artifact.ts";
import { resolveKpTutorialCardIframeExportArtifact } from "./export-artifact-resolver.ts";
import { renderKpTutorialCardIframeDocument } from "./iframe-export-document.ts";
import {
  createLinearSolveTutorialCardSample,
  type LinearSolveTutorialCardSampleFrame
} from "./linear-solve-card-sample.ts";

export interface LinearSolveIframeExportSmokeFixture {
  readonly id: "fixture.linear-solve.iframe-export-smoke";
  readonly progress: number;
  readonly artifact: KpTutorialCardExportArtifact;
  readonly html: string;
  readonly diagnostics: LinearSolveTutorialCardSampleFrame["diagnostics"];
}

export function createLinearSolveIframeExportSmokeFixture(
  progress: number
): LinearSolveIframeExportSmokeFixture {
  const manifest = createLinearSolveTutorialCardManifest();
  const sample = createLinearSolveTutorialCardSample();
  const frame = sample.sample(progress);
  const artifact = resolveKpTutorialCardIframeExportArtifact(manifest);
  const bodyHtml = renderKpTutorialCardHtmlShell(sample, frame);
  const html = renderKpTutorialCardIframeDocument({
    artifact,
    title: manifest.title,
    bodyHtml
  });

  return {
    id: "fixture.linear-solve.iframe-export-smoke",
    progress: frame.progress,
    artifact,
    html,
    diagnostics: frame.diagnostics
  };
}
