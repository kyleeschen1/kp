import type {
  ApiCatalogGroup,
  ApiCatalogItem
} from "../editor/api-catalog.ts";
import {
  createDefaultSemanticObjectRegistry,
  type SemanticObjectCapabilityAdvertisement
} from "../semantic/object-registry.ts";
import {
  createLinearSolveTutorialCardManifest
} from "../tutorial/card-manifest.ts";
import {
  createLinearSolveTutorialCardFrameSampler
} from "../tutorial/card-frame-sampler.ts";
import {
  createKpTutorialExportCapabilityAdvertisements,
  type KpTutorialExportCapabilityAdvertisement
} from "../tutorial/export-capability-advertisements.ts";
import {
  createKpTutorialParentTimelineFrameExportContract
} from "../tutorial/frame-export-contract.ts";

export interface ProjectDashboardCapabilityPreviewField {
  readonly label: string;
  readonly value: string;
}

const semanticObjectRegistry = createDefaultSemanticObjectRegistry();

const semanticObjectTypeByApiItemId = new Map<string, string>([
  ["semantic-expression", "expression"],
  ["semantic-equation", "equation"],
  ["semantic-matrix", "matrix"],
  ["semantic-graph-2d", "graph-2d"],
  ["semantic-graph-3d", "graph-3d"]
]);

const exportCapabilityApiItemIds = new Set<string>([
  "embed-frame-sequence-export-preview"
]);

export function semanticCapabilityPreviewFields(
  group: ApiCatalogGroup,
  item: ApiCatalogItem
): readonly ProjectDashboardCapabilityPreviewField[] {
  const advertisements = semanticCapabilityAdvertisementsForApiItem(
    group,
    item
  );

  if (advertisements.length === 0) {
    return exportCapabilityPreviewFields(group, item);
  }

  return [
    {
      label: "Capabilities",
      value: advertisements
        .map((advertisement) =>
          `${advertisement.capability} (${advertisement.status})`
        )
        .join(", ")
    },
    ...listPreviewField(
      "Derive descriptors",
      advertisements.flatMap(
        (advertisement) => advertisement.descriptorIds ?? []
      )
    ),
    ...listPreviewField(
      "Derive targets",
      advertisements.flatMap((advertisement) => advertisement.targetTypes ?? [])
    ),
    ...listPreviewField(
      "Computation protocols",
      advertisements.flatMap((advertisement) => advertisement.protocolIds ?? [])
    )
  ];
}

export function semanticCapabilitySearchFields(
  group: ApiCatalogGroup,
  item: ApiCatalogItem
): readonly string[] {
  const advertisements = semanticCapabilityAdvertisementsForApiItem(
    group,
    item
  );

  if (advertisements.length === 0) {
    return exportCapabilitySearchFields(group, item);
  }

  return advertisements.flatMap((advertisement) => [
    advertisement.capability,
    advertisement.status,
    advertisement.summary,
    ...(advertisement.descriptorIds ?? []),
    ...(advertisement.targetTypes ?? []),
    ...(advertisement.protocolIds ?? [])
  ]);
}

function semanticCapabilityAdvertisementsForApiItem(
  group: ApiCatalogGroup,
  item: ApiCatalogItem
): readonly SemanticObjectCapabilityAdvertisement[] {
  if (group.category !== "semantic-object") {
    return [];
  }

  const objectType = semanticObjectTypeByApiItemId.get(item.id);

  return objectType === undefined
    ? []
    : semanticObjectRegistry.listCapabilityAdvertisementsForType(objectType);
}

function exportCapabilityPreviewFields(
  group: ApiCatalogGroup,
  item: ApiCatalogItem
): readonly ProjectDashboardCapabilityPreviewField[] {
  const advertisements = exportCapabilityAdvertisementsForApiItem(group, item);

  if (advertisements.length === 0) {
    return [];
  }

  return [
    {
      label: "Export capabilities",
      value: advertisements
        .map((advertisement) =>
          exportCapabilityAdvertisementLabel(advertisement)
        )
        .join(", ")
    },
    {
      label: "Hosted readiness",
      value: hostedReadinessLabel(advertisements)
    },
    ...listPreviewField(
      "Dependency phases",
      advertisements.flatMap((advertisement) =>
        advertisement.dependencyPhases
      )
    )
  ];
}

function exportCapabilitySearchFields(
  group: ApiCatalogGroup,
  item: ApiCatalogItem
): readonly string[] {
  return exportCapabilityAdvertisementsForApiItem(group, item).flatMap(
    (advertisement) => [
      advertisement.capabilityKey,
      advertisement.library,
      advertisement.capability,
      advertisement.objectType,
      advertisement.mode,
      advertisement.hostedReadiness,
      advertisement.summary,
      ...advertisement.dependencyPhases,
      ...advertisement.loadStages
    ]
  );
}

function exportCapabilityAdvertisementsForApiItem(
  group: ApiCatalogGroup,
  item: ApiCatalogItem
): readonly KpTutorialExportCapabilityAdvertisement[] {
  if (group.category !== "embed" || !exportCapabilityApiItemIds.has(item.id)) {
    return [];
  }

  return linearSolveFrameExportCapabilityAdvertisements();
}

let cachedLinearSolveFrameExportCapabilityAdvertisements:
  | readonly KpTutorialExportCapabilityAdvertisement[]
  | undefined;

// Dashboard renders repeatedly; cache keeps sample timeline construction out of
// every search and row-selection pass.
function linearSolveFrameExportCapabilityAdvertisements():
  readonly KpTutorialExportCapabilityAdvertisement[] {
  if (cachedLinearSolveFrameExportCapabilityAdvertisements !== undefined) {
    return cachedLinearSolveFrameExportCapabilityAdvertisements;
  }

  const manifest = createLinearSolveTutorialCardManifest();
  const contract = createKpTutorialParentTimelineFrameExportContract({
    manifest,
    parentTimeline: createLinearSolveTutorialCardFrameSampler().parentTimeline,
    exportKind: "gif",
    frameCount: 5
  });

  cachedLinearSolveFrameExportCapabilityAdvertisements =
    createKpTutorialExportCapabilityAdvertisements({
      artifact: contract.artifact,
      manifest
    });

  return cachedLinearSolveFrameExportCapabilityAdvertisements;
}

function exportCapabilityAdvertisementLabel(
  advertisement: KpTutorialExportCapabilityAdvertisement
): string {
  const phases = advertisement.dependencyPhases.join("+");

  return [
    advertisement.capabilityKey,
    `(${phases}, ${advertisement.hostedReadiness})`
  ].join(" ");
}

function hostedReadinessLabel(
  advertisements: readonly KpTutorialExportCapabilityAdvertisement[]
): string {
  const diagnosticCount = advertisements.reduce(
    (sum, advertisement) => sum + advertisement.diagnostics.length,
    0
  );

  return diagnosticCount === 0 ? "ready" : `${diagnosticCount} diagnostics`;
}

function listPreviewField(
  label: string,
  values: readonly string[]
): readonly ProjectDashboardCapabilityPreviewField[] {
  const uniqueValues = uniqueStrings(values);

  return uniqueValues.length === 0
    ? []
    : [{ label, value: uniqueValues.join(", ") }];
}

function uniqueStrings(values: readonly string[]): readonly string[] {
  return [...new Set(values.filter((value) => value.length > 0))];
}
