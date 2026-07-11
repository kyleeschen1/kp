import {
  createLinearSolveTutorialCardManifest
} from "./card-manifest.ts";
import type { KpTutorialCardExportArtifact } from "./export-artifact.ts";
import {
  resolveKpTutorialCardIframeExportArtifact,
  resolveKpTutorialCardStepExportArtifact
} from "./export-artifact-resolver.ts";
import {
  createLinearSolveTutorialCardSample
} from "./linear-solve-card-sample.ts";
import { selectKpTutorialStaticStepCheckpoints } from "./static-step-checkpoints.ts";
import { renderKpTutorialCardStaticStepSequence } from "./static-step-sequence-renderer.ts";

export interface KpTutorialExportArtifactCatalogSourceRef {
  readonly label: string;
  readonly href: string;
}

export interface KpTutorialExportArtifactCatalogEntry {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly artifact: KpTutorialCardExportArtifact;
  readonly dashboardRowId: string;
  readonly apiItemId: string;
  readonly sourceRefs: readonly KpTutorialExportArtifactCatalogSourceRef[];
  readonly verification: readonly string[];
  readonly checkpointCount?: number | undefined;
  readonly sampleProgresses?: readonly number[] | undefined;
}

export function listKpTutorialExportArtifactCatalogEntries(): readonly KpTutorialExportArtifactCatalogEntry[] {
  return createLinearSolveTutorialExportArtifactCatalog();
}

export function findKpTutorialExportArtifactCatalogEntry(
  artifactId: string
): KpTutorialExportArtifactCatalogEntry | undefined {
  return listKpTutorialExportArtifactCatalogEntries().find(
    (entry) => entry.id === artifactId
  );
}

function createLinearSolveTutorialExportArtifactCatalog(): readonly KpTutorialExportArtifactCatalogEntry[] {
  const manifest = createLinearSolveTutorialCardManifest();
  const iframeArtifact = resolveKpTutorialCardIframeExportArtifact(manifest);
  const sample = createLinearSolveTutorialCardSample();
  const checkpoints = selectKpTutorialStaticStepCheckpoints(
    sample.cardSampler.parentTimeline
  );
  const staticStepSequence = renderKpTutorialCardStaticStepSequence({
    artifact: resolveKpTutorialCardStepExportArtifact(manifest),
    checkpoints,
    sampler: sample
  });

  return [
    {
      id: iframeArtifact.id,
      title: "Iframe export artifact",
      summary:
        "Iframe-ready export artifact metadata for the linear-solve tutorial card.",
      artifact: iframeArtifact,
      dashboardRowId: "iframe-export-artifact",
      apiItemId: "embed-iframe-export-artifact",
      sourceRefs: [
        {
          label: "Export artifact contract",
          href: "src/tutorial/export-artifact.ts"
        },
        {
          label: "Iframe artifact resolver",
          href: "src/tutorial/export-artifact-resolver.ts"
        },
        {
          label: "Iframe document renderer",
          href: "src/tutorial/iframe-export-document.ts"
        }
      ],
      verification: [
        "tests/tutorial-card-export-artifact.test.ts",
        "tests/tutorial-card-iframe-document.test.ts"
      ]
    },
    {
      id: staticStepSequence.artifact.id,
      title: "Static-step export artifact",
      summary:
        "Renderable JSON step-sequence artifact sampled from the linear-solve tutorial-card parent timeline.",
      artifact: staticStepSequence.artifact,
      dashboardRowId: "static-step-export-artifact",
      apiItemId: "embed-static-step-export-artifact",
      sourceRefs: [
        {
          label: "Export artifact contract",
          href: "src/tutorial/export-artifact.ts"
        },
        {
          label: "Static-step checkpoint selector",
          href: "src/tutorial/static-step-checkpoints.ts"
        },
        {
          label: "Static-step sequence renderer",
          href: "src/tutorial/static-step-sequence-renderer.ts"
        }
      ],
      verification: [
        "tests/tutorial-card-export-artifact.test.ts",
        "tests/tutorial-card-static-step-artifact.test.ts"
      ],
      checkpointCount: staticStepSequence.steps.length,
      sampleProgresses: staticStepSequence.steps.map((step) => step.progress)
    }
  ];
}
