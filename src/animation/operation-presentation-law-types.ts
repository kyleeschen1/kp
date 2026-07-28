export const kpCoreOperationPresentationLawIds = [
  "presentation.lineage",
  "presentation.ownership",
  "presentation.temporal-groups",
  "presentation.contacts",
  "presentation.endpoint-settlement",
  "presentation.rewind"
] as const;

export type KpOperationPresentationLawId =
  (typeof kpCoreOperationPresentationLawIds)[number];
