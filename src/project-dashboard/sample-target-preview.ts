import type { ProjectDashboardSampleTarget } from "./model.ts";

export interface DashboardSampleTargetPreviewField {
  readonly label: string;
  readonly value: string;
}

export interface DashboardSampleTargetPreviewLink {
  readonly label: string;
  readonly href: string;
  readonly dataAttributes: readonly [string, string][];
}

export function dashboardSampleTargetPreviewFields(
  targets: readonly ProjectDashboardSampleTarget[] | undefined
): readonly DashboardSampleTargetPreviewField[] {
  const sampleTargets = targets ?? [];

  return sampleTargets.length === 0
    ? []
    : [
        {
          label: "Sample targets",
          value: sampleTargets.map((target) => target.label).join(", ")
        },
        ...sampleTargets.flatMap(dashboardSampleTargetDetailPreviewFields)
      ];
}

export function dashboardSampleTargetPreviewLinks(
  targets: readonly ProjectDashboardSampleTarget[] | undefined
): readonly DashboardSampleTargetPreviewLink[] {
  return (targets ?? []).map(dashboardSampleTargetPreviewLink);
}

export function dashboardSampleTargetSearchFields(
  targets: readonly ProjectDashboardSampleTarget[] | undefined
): readonly string[] {
  return (targets ?? []).flatMap((target) => {
    switch (target.kind) {
      case "equation-animation":
        return [
          target.kind,
          target.label,
          target.animationId,
          target.fixtureId ?? ""
        ];
      case "graph-surface-mode":
        return [target.kind, target.label, target.graphId, target.surfaceMode];
      case "synchronized-equation-graph":
        return [
          target.kind,
          target.label,
          target.animationId,
          target.graphId,
          target.layoutId ?? "",
          target.sharedClockId,
          target.fixtureId ?? "",
          target.surfaceMode ?? "",
          "sync equation graph shared clock"
        ];
      case "tutorial-card":
        return [
          target.kind,
          target.label,
          target.sampleId,
          target.manifestId,
          target.layoutId ?? "",
          target.sharedClockId ?? "",
          target.fixtureId ?? "",
          "tutorial card live sample"
        ];
      case "export-artifact":
        return [
          target.kind,
          target.label,
          target.artifactId,
          target.manifestId,
          target.profileId,
          target.payloadKind,
          "export artifact embed iframe static step sequence"
        ];
      case "api-catalog-item":
        return [target.kind, target.label, target.itemId];
    }
  });
}

function dashboardSampleTargetDetailPreviewFields(
  target: ProjectDashboardSampleTarget
): readonly DashboardSampleTargetPreviewField[] {
  switch (target.kind) {
    case "tutorial-card":
      return [
        { label: "Tutorial card sample", value: target.sampleId },
        { label: "Tutorial card manifest", value: target.manifestId },
        ...(target.sharedClockId === undefined
          ? []
          : [{ label: "Tutorial card clock", value: target.sharedClockId }]),
        ...(target.fixtureId === undefined
          ? []
          : [{ label: "Tutorial card fixture", value: target.fixtureId }])
      ];
    case "export-artifact":
      return [
        { label: "Export artifact", value: target.artifactId },
        { label: "Export profile", value: target.profileId },
        { label: "Export manifest", value: target.manifestId },
        { label: "Export payload", value: target.payloadKind }
      ];
    default:
      return [];
  }
}

function dashboardSampleTargetPreviewLink(
  target: ProjectDashboardSampleTarget
): DashboardSampleTargetPreviewLink {
  switch (target.kind) {
    case "equation-animation":
      return liveAnimationPreviewLink(
        target.animationId,
        target.label.replace(/^Open\s+/i, ""),
        target.fixtureId === undefined
          ? []
          : [["data-kp-preview-katex-transform-fixture", target.fixtureId]]
      );
    case "graph-surface-mode":
      return {
        label: target.label,
        href: "#",
        dataAttributes: [
          ["data-kp-preview-link", "graph-surface-mode"],
          ["data-kp-preview-graph-id", target.graphId],
          ["data-kp-preview-graph-surface-mode", target.surfaceMode]
        ]
      };
    case "synchronized-equation-graph": {
      const dataAttributes: [string, string][] = [
        ["data-kp-preview-link", "synchronized-equation-graph"],
        ["data-kp-preview-live-animation", target.animationId],
        ["data-kp-preview-graph-id", target.graphId],
        ["data-kp-preview-shared-clock-id", target.sharedClockId]
      ];

      if (target.layoutId !== undefined) {
        dataAttributes.push(["data-kp-preview-layout-id", target.layoutId]);
      }

      if (target.fixtureId !== undefined) {
        dataAttributes.push([
          "data-kp-preview-katex-transform-fixture",
          target.fixtureId
        ]);
      }

      if (target.surfaceMode !== undefined) {
        dataAttributes.push([
          "data-kp-preview-graph-surface-mode",
          target.surfaceMode
        ]);
      }

      return {
        label: target.label,
        href: "#project-dashboard-animation-layout-title",
        dataAttributes
      };
    }
    case "tutorial-card": {
      const dataAttributes: [string, string][] = [
        ["data-kp-preview-link", "tutorial-card"],
        ["data-kp-preview-tutorial-card", target.sampleId],
        ["data-kp-preview-manifest-id", target.manifestId]
      ];

      if (target.layoutId !== undefined) {
        dataAttributes.push(["data-kp-preview-layout-id", target.layoutId]);
      }

      if (target.sharedClockId !== undefined) {
        dataAttributes.push([
          "data-kp-preview-shared-clock-id",
          target.sharedClockId
        ]);
      }

      if (target.fixtureId !== undefined) {
        dataAttributes.push([
          "data-kp-preview-katex-transform-fixture",
          target.fixtureId
        ]);
      }

      return {
        label: target.label,
        href: "#project-dashboard-animation-layout-title",
        dataAttributes
      };
    }
    case "export-artifact":
      return {
        label: target.label,
        href: "#project-dashboard-animation-layout-title",
        dataAttributes: [
          ["data-kp-preview-link", "export-artifact"],
          ["data-kp-preview-export-artifact", target.artifactId],
          ["data-kp-preview-manifest-id", target.manifestId],
          ["data-kp-preview-export-profile", target.profileId],
          ["data-kp-preview-export-payload", target.payloadKind]
        ]
      };
    case "api-catalog-item":
      return {
        label: target.label,
        href: "#project-agenda-api-title",
        dataAttributes: [
          ["data-kp-preview-link", "api-catalog-item"],
          ["data-kp-preview-api-item", target.itemId]
        ]
      };
  }
}

function liveAnimationPreviewLink(
  animationId: string,
  label: string,
  extraDataAttributes: readonly [string, string][] = []
): DashboardSampleTargetPreviewLink {
  return {
    label: `Open ${label} sample`,
    href: "#project-dashboard-animation-layout-title",
    dataAttributes: [
      ["data-kp-preview-link", "live-animation"],
      ["data-kp-preview-live-animation", animationId],
      ...extraDataAttributes
    ]
  };
}
