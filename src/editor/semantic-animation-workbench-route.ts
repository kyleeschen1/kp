export const KP_ANIMATION_WORKBENCH_VIEW = "animation-workbench";
export const KP_ANIMATION_WORKBENCH_QUERY_PARAM = "q";
export const KP_ANIMATION_WORKBENCH_SELECTION_PARAM = "workbenchAnimation";
export const KP_ANIMATION_WORKBENCH_REPRESENTATION_PARAM = "representation";

export interface KpSemanticAnimationWorkbenchRouteState {
  readonly active: boolean;
  readonly query: string;
  readonly animationId?: string;
  readonly representationId?: string;
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
    )
  };
}

export function writeKpSemanticAnimationWorkbenchRoute(
  search: string,
  state: Omit<KpSemanticAnimationWorkbenchRouteState, "active">
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
  return `?${params.toString()}`;
}

function optionalParam<
  Key extends "animationId" | "representationId"
>(
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
