import {
  KP_WORKBENCH_ROADMAP_SORTS,
  type KpWorkbenchRoadmapSort,
  type KpWorkbenchRoadmapSortDirection
} from "./semantic-animation-workbench-roadmap-query.ts";
import type {
  KpWorkbenchRoadmapRow
} from "./semantic-animation-workbench-roadmap.ts";

export const KP_ANIMATION_WORKBENCH_VIEW = "animation-workbench";
export const KP_ANIMATION_WORKBENCH_QUERY_PARAM = "q";
export const KP_ANIMATION_WORKBENCH_SELECTION_PARAM = "workbenchAnimation";
export const KP_ANIMATION_WORKBENCH_REPRESENTATION_PARAM = "representation";
export const KP_ANIMATION_WORKBENCH_ROADMAP_SORT_PARAM = "roadmapSort";
export const KP_ANIMATION_WORKBENCH_ROADMAP_DIRECTION_PARAM =
  "roadmapDirection";
export const KP_ANIMATION_WORKBENCH_ROADMAP_TOPIC_PARAM = "roadmapTopic";
export const KP_ANIMATION_WORKBENCH_ROADMAP_HORIZON_PARAM = "roadmapHorizon";
export const KP_ANIMATION_WORKBENCH_ROADMAP_STATE_PARAM = "roadmapState";

export interface KpSemanticAnimationWorkbenchRoadmapRouteState {
  readonly sortBy: KpWorkbenchRoadmapSort;
  readonly direction: KpWorkbenchRoadmapSortDirection;
  readonly topic?: string;
  readonly horizon?: KpWorkbenchRoadmapRow["horizon"];
  readonly state?: KpWorkbenchRoadmapRow["state"];
}

export interface KpSemanticAnimationWorkbenchRouteState {
  readonly active: boolean;
  readonly query: string;
  readonly animationId?: string;
  readonly representationId?: string;
  readonly roadmap: KpSemanticAnimationWorkbenchRoadmapRouteState;
}

export function readKpSemanticAnimationWorkbenchRoute(
  search: string
): KpSemanticAnimationWorkbenchRouteState {
  const params = new URLSearchParams(search);
  return {
    active: params.get("view") === KP_ANIMATION_WORKBENCH_VIEW,
    query: params.get(KP_ANIMATION_WORKBENCH_QUERY_PARAM)?.trim() ?? "",
    ...optionalParam(params, KP_ANIMATION_WORKBENCH_SELECTION_PARAM, "animationId"),
    ...optionalParam(
      params,
      KP_ANIMATION_WORKBENCH_REPRESENTATION_PARAM,
      "representationId"
    ),
    roadmap: readRoadmapState(params)
  };
}

export function writeKpSemanticAnimationWorkbenchRoute(
  search: string,
  state: Omit<
    KpSemanticAnimationWorkbenchRouteState,
    "active" | "roadmap"
  > & {
    readonly roadmap?: KpSemanticAnimationWorkbenchRoadmapRouteState;
  }
): string {
  const params = new URLSearchParams(search);
  params.set("view", KP_ANIMATION_WORKBENCH_VIEW);
  setOptional(params, KP_ANIMATION_WORKBENCH_QUERY_PARAM, state.query);
  setOptional(
    params,
    KP_ANIMATION_WORKBENCH_SELECTION_PARAM,
    state.animationId
  );
  setOptional(
    params,
    KP_ANIMATION_WORKBENCH_REPRESENTATION_PARAM,
    state.representationId
  );
  writeRoadmapState(params, state.roadmap);
  return `?${params.toString()}`;
}

function readRoadmapState(
  params: URLSearchParams
): KpSemanticAnimationWorkbenchRoadmapRouteState {
  const sortValue = params.get(KP_ANIMATION_WORKBENCH_ROADMAP_SORT_PARAM);
  const directionValue = params.get(
    KP_ANIMATION_WORKBENCH_ROADMAP_DIRECTION_PARAM
  );
  const horizonValue = params.get(
    KP_ANIMATION_WORKBENCH_ROADMAP_HORIZON_PARAM
  );
  const stateValue = params.get(KP_ANIMATION_WORKBENCH_ROADMAP_STATE_PARAM);
  return {
    sortBy: (KP_WORKBENCH_ROADMAP_SORTS as readonly string[]).includes(
      sortValue ?? ""
    )
      ? (sortValue as KpWorkbenchRoadmapSort)
      : "canonical",
    direction:
      directionValue === "descending" ? "descending" : "ascending",
    ...optionalParam(
      params,
      KP_ANIMATION_WORKBENCH_ROADMAP_TOPIC_PARAM,
      "topic"
    ),
    ...(isHorizon(horizonValue) ? { horizon: horizonValue } : {}),
    ...(isState(stateValue) ? { state: stateValue } : {})
  };
}

function writeRoadmapState(
  params: URLSearchParams,
  state: KpSemanticAnimationWorkbenchRoadmapRouteState | undefined
): void {
  setOptional(
    params,
    KP_ANIMATION_WORKBENCH_ROADMAP_SORT_PARAM,
    state?.sortBy === "canonical" ? undefined : state?.sortBy
  );
  setOptional(
    params,
    KP_ANIMATION_WORKBENCH_ROADMAP_DIRECTION_PARAM,
    state?.direction === "descending" ? "descending" : undefined
  );
  setOptional(params, KP_ANIMATION_WORKBENCH_ROADMAP_TOPIC_PARAM, state?.topic);
  setOptional(
    params,
    KP_ANIMATION_WORKBENCH_ROADMAP_HORIZON_PARAM,
    state?.horizon
  );
  setOptional(
    params,
    KP_ANIMATION_WORKBENCH_ROADMAP_STATE_PARAM,
    state?.state
  );
}

function isHorizon(
  value: string | null
): value is KpWorkbenchRoadmapRow["horizon"] {
  return value === "now" ||
    value === "next" ||
    value === "later" ||
    value === "someday";
}

function isState(
  value: string | null
): value is KpWorkbenchRoadmapRow["state"] {
  return value === "planned" ||
    value === "active" ||
    value === "complete" ||
    value === "deferred";
}

function optionalParam<Key extends string>(
  params: URLSearchParams,
  parameter: string,
  key: Key
): Partial<Record<Key, string>> {
  const value = params.get(parameter)?.trim();
  return value === undefined || value === "" ? {} : { [key]: value } as Record<
    Key,
    string
  >;
}

function setOptional(
  params: URLSearchParams,
  key: string,
  value: string | undefined
): void {
  const normalized = value?.trim() ?? "";
  if (normalized === "") params.delete(key);
  else params.set(key, normalized);
}
