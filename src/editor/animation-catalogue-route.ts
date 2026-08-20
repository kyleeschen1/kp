import { formatKpAnimationUrlPlayhead } from
  "./animation-playhead-url-policy.ts";

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
  const state = readKpAnimationDevelopmentUrlState(search);
  if (state.viewSource === "default") {
    return Object.freeze({
      active: true,
      source: "default" as const,
      ...(state.artifactId === undefined
        ? {}
        : { artifactId: state.artifactId }),
      ...(state.playhead === undefined ? {} : { playhead: state.playhead })
    });
  }
  if (state.view === KP_ANIMATION_CATALOGUE_VIEW) {
    return Object.freeze({
      active: true,
      source: "explicit" as const,
      ...(state.artifactId === undefined
        ? {}
        : { artifactId: state.artifactId }),
      ...(state.playhead === undefined ? {} : { playhead: state.playhead })
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
      formatKpAnimationUrlPlayhead(state.playhead)
    );
  }
  const query = params.toString();
  return query.length === 0 ? "" : `?${query}`;
}
import {
  readKpAnimationDevelopmentUrlState
} from "./animation-development-url-state.ts";
