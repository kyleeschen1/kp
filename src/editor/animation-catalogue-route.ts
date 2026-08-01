export const KP_ANIMATION_CATALOGUE_VIEW = "animation-catalogue";
export const KP_ANIMATION_CATALOGUE_ARTIFACT_PARAM = "artifact";
export const KP_ANIMATION_CATALOGUE_PLAYHEAD_PARAM = "playhead";

export interface KpAnimationCatalogueRoute {
  readonly active: boolean;
  readonly source: "default" | "explicit" | "other-view";
  readonly artifactId?: string | undefined;
  readonly playhead?: number | undefined;
}

export function readKpAnimationCatalogueRoute(
  search: string
): KpAnimationCatalogueRoute {
  const params = new URLSearchParams(search);
  const view = params.get("view");
  const artifactId = nonBlank(
    params.get(KP_ANIMATION_CATALOGUE_ARTIFACT_PARAM)
  );
  const playhead = readPlayhead(
    params.get(KP_ANIMATION_CATALOGUE_PLAYHEAD_PARAM)
  );
  if (view === null) {
    return Object.freeze({
      active: true,
      source: "default" as const,
      ...(artifactId === undefined ? {} : { artifactId }),
      ...(playhead === undefined ? {} : { playhead })
    });
  }
  if (view === KP_ANIMATION_CATALOGUE_VIEW) {
    return Object.freeze({
      active: true,
      source: "explicit" as const,
      ...(artifactId === undefined ? {} : { artifactId }),
      ...(playhead === undefined ? {} : { playhead })
    });
  }
  return Object.freeze({ active: false, source: "other-view" as const });
}

export function writeKpAnimationCatalogueRoute(
  search: string,
  state: {
    readonly artifactId?: string | undefined;
    readonly playhead?: number | undefined;
  }
): string {
  const params = new URLSearchParams(search);
  if (state.artifactId === undefined || state.artifactId.trim().length === 0) {
    params.delete(KP_ANIMATION_CATALOGUE_ARTIFACT_PARAM);
  } else {
    params.set(
      KP_ANIMATION_CATALOGUE_ARTIFACT_PARAM,
      state.artifactId.trim()
    );
  }
  if (state.playhead === undefined || state.playhead === 0) {
    params.delete(KP_ANIMATION_CATALOGUE_PLAYHEAD_PARAM);
  } else if (!Number.isFinite(state.playhead) ||
    state.playhead < 0 || state.playhead > 1) {
    throw new RangeError("Catalogue playhead must be between zero and one");
  } else {
    params.set(
      KP_ANIMATION_CATALOGUE_PLAYHEAD_PARAM,
      formatPlayhead(state.playhead)
    );
  }
  const query = params.toString();
  return query.length === 0 ? "" : `?${query}`;
}

function nonBlank(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
}

function readPlayhead(value: string | null): number | undefined {
  if (value === null || value.trim().length === 0) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1
    ? parsed
    : undefined;
}

function formatPlayhead(value: number): string {
  return String(Math.round(value * 1_000) / 1_000);
}
