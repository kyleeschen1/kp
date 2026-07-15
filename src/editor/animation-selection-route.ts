export const KP_EDITOR_ANIMATION_QUERY_PARAM = "animation";

export function readKpEditorAnimationSelection(
  search: string
): string | undefined {
  const value = new URLSearchParams(search).get(
    KP_EDITOR_ANIMATION_QUERY_PARAM
  )?.trim();

  return value === undefined || value.length === 0 ? undefined : value;
}

export function writeKpEditorAnimationSelection(
  search: string,
  descriptorId: string
): string {
  const params = new URLSearchParams(search);
  params.set(KP_EDITOR_ANIMATION_QUERY_PARAM, descriptorId);
  const serialized = params.toString();

  return serialized.length === 0 ? "" : `?${serialized}`;
}

export function kpEditorAnimationSelectionHref(input: {
  readonly pathname: string;
  readonly search: string;
  readonly hash?: string | undefined;
  readonly descriptorId: string;
}): string {
  return `${input.pathname}${writeKpEditorAnimationSelection(
    input.search,
    input.descriptorId
  )}${input.hash ?? ""}`;
}
