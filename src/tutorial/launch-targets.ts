import { listKpTutorialExportArtifactCatalogEntries } from "./export-artifact-catalog.ts";
import type { KpTutorialExportArtifactPayloadKind } from "./export-artifact.ts";
import { createLinearSolveTutorialCardSample } from "./linear-solve-card-sample.ts";
import { createAdditionProgrammingTutorialCardSample } from "./programming-card-sample.ts";

export type KpTutorialLaunchTargetKind =
  | "tutorial-card"
  | "iframe-export-artifact"
  | "static-step-export-artifact"
  | "programming-tutorial-card";

export interface KpTutorialLaunchTarget {
  readonly id: string;
  readonly kind: KpTutorialLaunchTargetKind;
  readonly title: string;
  readonly launchPath: "/";
  readonly dashboardRowId: string;
  readonly dashboardSelectRowSelector: readonly string[];
  readonly previewSelectors: readonly string[];
  readonly smokeSelectors: readonly string[];
  readonly sampleId?: string | undefined;
  readonly artifactId?: string | undefined;
  readonly manifestId: string;
  readonly profileId?: string | undefined;
  readonly payloadKind?: KpTutorialExportArtifactPayloadKind | undefined;
}

export function listKpTutorialLaunchTargets(): readonly KpTutorialLaunchTarget[] {
  const linearSolveSample = createLinearSolveTutorialCardSample();
  const programmingSample = createAdditionProgrammingTutorialCardSample();
  const exportTargets = listKpTutorialExportArtifactCatalogEntries().map((entry) => {
    const kind: KpTutorialLaunchTargetKind =
      entry.artifact.payloadKind === "html-document"
        ? "iframe-export-artifact"
        : "static-step-export-artifact";

    return createLaunchTarget({
      id:
        kind === "iframe-export-artifact"
          ? "launch.export.linear-solve.iframe"
          : "launch.export.linear-solve.static-steps",
      kind,
      title: entry.title,
      dashboardRowId: entry.dashboardRowId,
      artifactId: entry.artifact.id,
      manifestId: entry.artifact.manifestId,
      profileId: entry.artifact.profileId,
      payloadKind: entry.artifact.payloadKind,
      previewSelectors: [
        attrSelector("data-kp-preview-link", "export-artifact"),
        attrSelector("data-kp-preview-export-artifact", entry.artifact.id),
        attrSelector("data-kp-preview-export-payload", entry.artifact.payloadKind)
      ],
      smokeSelectors:
        kind === "iframe-export-artifact"
          ? [
              attrSelector("data-kp-tutorial-card", linearSolveSample.id),
              attrSelector(
                "data-kp-tutorial-manifest",
                linearSolveSample.manifestId
              )
            ]
          : [
              attrSelector("data-kp-preview-export-artifact", entry.artifact.id),
              attrSelector(
                "data-kp-preview-export-payload",
                entry.artifact.payloadKind
              )
            ]
    });
  });

  return [
    createLaunchTarget({
      id: "launch.tutorial.linear-solve.live-card",
      kind: "tutorial-card",
      title: "Linear solve live tutorial card",
      dashboardRowId: "sample-synced-equation-graph-linear-solve",
      sampleId: linearSolveSample.id,
      manifestId: linearSolveSample.manifestId,
      previewSelectors: [
        attrSelector("data-kp-preview-link", "tutorial-card"),
        attrSelector("data-kp-preview-tutorial-card", linearSolveSample.id),
        attrSelector("data-kp-preview-manifest-id", linearSolveSample.manifestId)
      ],
      smokeSelectors: [
        attrSelector("data-kp-tutorial-card", linearSolveSample.id),
        attrSelector("data-kp-tutorial-manifest", linearSolveSample.manifestId),
        attrSelector("data-kp-tutorial-clock", "solve-x-shared-clock")
      ]
    }),
    ...exportTargets,
    createLaunchTarget({
      id: "launch.tutorial.programming.add",
      kind: "programming-tutorial-card",
      title: programmingSample.title,
      dashboardRowId: "semantic-source-file",
      sampleId: programmingSample.id,
      manifestId: programmingSample.manifestId,
      previewSelectors: [
        attrSelector("data-kp-preview-link", "api-catalog-item"),
        attrSelector("data-kp-preview-api-item", "semantic-source-file")
      ],
      smokeSelectors: [
        attrSelector("data-kp-tutorial-card", programmingSample.id),
        attrSelector("data-kp-tutorial-manifest", programmingSample.manifestId),
        attrSelector(
          "data-kp-tutorial-source-file",
          programmingSample.sourceFile.id
        )
      ]
    })
  ];
}

export function findKpTutorialLaunchTarget(
  targetId: string
): KpTutorialLaunchTarget | undefined {
  return listKpTutorialLaunchTargets().find((target) => target.id === targetId);
}

export function listKpTutorialLaunchTargetsByKind(
  kind: KpTutorialLaunchTargetKind
): readonly KpTutorialLaunchTarget[] {
  return listKpTutorialLaunchTargets().filter((target) => target.kind === kind);
}

function createLaunchTarget(
  input: Omit<KpTutorialLaunchTarget, "dashboardSelectRowSelector" | "launchPath">
): KpTutorialLaunchTarget {
  return {
    ...input,
    launchPath: "/",
    dashboardSelectRowSelector: [
      attrSelector("data-kp-select-agenda-row", input.dashboardRowId)
    ],
    previewSelectors: [...input.previewSelectors],
    smokeSelectors: [...input.smokeSelectors]
  };
}

function attrSelector(attributeName: string, value: string): string {
  return `[${attributeName}="${value}"]`;
}
