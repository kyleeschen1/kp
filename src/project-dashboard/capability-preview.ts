import type {
  ApiCatalogGroup,
  ApiCatalogItem
} from "../editor/api-catalog.ts";
import {
  createDefaultSemanticObjectRegistry,
  type SemanticObjectCapabilityAdvertisement
} from "../semantic/object-registry.ts";

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

export function semanticCapabilityPreviewFields(
  group: ApiCatalogGroup,
  item: ApiCatalogItem
): readonly ProjectDashboardCapabilityPreviewField[] {
  const advertisements = semanticCapabilityAdvertisementsForApiItem(
    group,
    item
  );

  if (advertisements.length === 0) {
    return [];
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
