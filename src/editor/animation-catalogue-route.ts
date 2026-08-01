export const KP_ANIMATION_CATALOGUE_VIEW = "animation-catalogue";
export const KP_ANIMATION_CATALOGUE_ARTIFACT_PARAM = "artifact";

export interface KpAnimationCatalogueRoute {
  readonly active: boolean;
  readonly source: "default" | "explicit" | "other-view";
  readonly artifactId?: string | undefined;
}

export function readKpAnimationCatalogueRoute(
  search: string
): KpAnimationCatalogueRoute {
  const params = new URLSearchParams(search);
  const view = params.get("view");
  const artifactId = nonBlank(
    params.get(KP_ANIMATION_CATALOGUE_ARTIFACT_PARAM)
  );
  if (view === null) {
    return Object.freeze({
      active: true,
      source: "default" as const,
      ...(artifactId === undefined ? {} : { artifactId })
    });
  }
  if (view === KP_ANIMATION_CATALOGUE_VIEW) {
    return Object.freeze({
      active: true,
      source: "explicit" as const,
      ...(artifactId === undefined ? {} : { artifactId })
    });
  }
  return Object.freeze({ active: false, source: "other-view" as const });
}

function nonBlank(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
}
