import type {
  ProjectDashboardData,
  ProjectDashboardSampleTarget
} from "../project-dashboard/model.ts";
import type { KpTutorialLaunchTarget } from "./launch-targets.ts";

export interface KpDashboardExportLaunchTargetDiagnostic {
  readonly targetId: string;
  readonly dashboardRowId: string;
  readonly path: string;
  readonly message: string;
}

export function validateKpDashboardExportLaunchTargetLinks(
  data: ProjectDashboardData,
  targets: readonly KpTutorialLaunchTarget[]
): readonly KpDashboardExportLaunchTargetDiagnostic[] {
  const diagnostics: KpDashboardExportLaunchTargetDiagnostic[] = [];

  for (const target of targets.filter(isExportLaunchTarget)) {
    const dashboardRow = data.gallery.find(
      (item) => item.id === target.dashboardRowId
    );

    if (dashboardRow === undefined) {
      diagnostics.push({
        targetId: target.id,
        dashboardRowId: target.dashboardRowId,
        path: `gallery.${target.dashboardRowId}`,
        message: `Dashboard row ${target.dashboardRowId} is missing for export launch target ${target.id}.`
      });
      continue;
    }

    const sampleTargets = dashboardRow.sampleTargets ?? [];
    const hasMatchingSampleTarget = sampleTargets.some((sampleTarget) =>
      exportSampleTargetMatches(sampleTarget, target)
    );

    if (!hasMatchingSampleTarget) {
      diagnostics.push({
        targetId: target.id,
        dashboardRowId: target.dashboardRowId,
        path: `gallery.${target.dashboardRowId}.sampleTargets`,
        message: `Dashboard row ${target.dashboardRowId} must include export artifact sample target ${target.artifactId}.`
      });
    }
  }

  return diagnostics;
}

function isExportLaunchTarget(
  target: KpTutorialLaunchTarget
): target is KpTutorialLaunchTarget & {
  readonly artifactId: string;
  readonly profileId: string;
  readonly payloadKind: string;
} {
  return (
    target.kind === "iframe-export-artifact" ||
    target.kind === "static-step-export-artifact"
  );
}

function exportSampleTargetMatches(
  sampleTarget: ProjectDashboardSampleTarget,
  target: KpTutorialLaunchTarget & {
    readonly artifactId: string;
    readonly profileId: string;
    readonly payloadKind: string;
  }
): boolean {
  return (
    sampleTarget.kind === "export-artifact" &&
    sampleTarget.artifactId === target.artifactId &&
    sampleTarget.manifestId === target.manifestId &&
    sampleTarget.profileId === target.profileId &&
    sampleTarget.payloadKind === target.payloadKind
  );
}
