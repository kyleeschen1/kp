export const KP_ANIMATION_CATALOGUE_VIEW = "animation-catalogue";

export interface KpAnimationCatalogueRoute {
  readonly active: boolean;
  readonly source: "default" | "explicit" | "other-view";
}

export function readKpAnimationCatalogueRoute(
  search: string
): KpAnimationCatalogueRoute {
  const view = new URLSearchParams(search).get("view");
  if (view === null) {
    return Object.freeze({ active: true, source: "default" as const });
  }
  if (view === KP_ANIMATION_CATALOGUE_VIEW) {
    return Object.freeze({ active: true, source: "explicit" as const });
  }
  return Object.freeze({ active: false, source: "other-view" as const });
}
