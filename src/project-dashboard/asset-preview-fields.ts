import type { KpInterpretation } from "../semantic/asset-interpreter.ts";
import type { KpDashboardAssetPreview } from "../semantic/dashboard-preview-interpreter.ts";

export interface DashboardAssetPreviewField {
  readonly label: string;
  readonly value: string;
}

export function dashboardAssetPreviewFields(
  interpretation: KpInterpretation<KpDashboardAssetPreview> | undefined
): readonly DashboardAssetPreviewField[] {
  if (interpretation === undefined) return [];

  return [
    { label: "Dashboard interpreter", value: interpretation.interpreterId },
    { label: "Asset summary", value: interpretation.output.summary },
    ...interpretation.output.fields,
    ...previewListField(
      "Asset diagnostics",
      interpretation.diagnostics.map((diagnostic) => diagnostic.message)
    )
  ];
}

export function dashboardAssetPreviewSearchFields(
  interpretation: KpInterpretation<KpDashboardAssetPreview> | undefined
): readonly string[] {
  if (interpretation === undefined) return [];

  return [
    interpretation.interpreterId,
    interpretation.output.summary,
    ...interpretation.output.searchFields,
    ...interpretation.diagnostics.map((diagnostic) => diagnostic.message)
  ];
}

export function dashboardAssetPreviewDataAttributes(
  interpretation: KpInterpretation<KpDashboardAssetPreview> | undefined
): readonly [string, string][] {
  return interpretation === undefined
    ? []
    : [["data-kp-dashboard-preview-interpreter", interpretation.interpreterId]];
}

function previewListField(
  label: string,
  values: readonly string[] | undefined
): readonly DashboardAssetPreviewField[] {
  return values === undefined || values.length === 0
    ? []
    : [{ label, value: values.join(", ") }];
}
