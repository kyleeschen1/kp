export const KP_SVELTE_CATALOGUE_EXEMPLAR_PARAM = "catalogueShell";
export const KP_SVELTE_CATALOGUE_EXEMPLAR_VALUE = "svelte-exemplar";

export function selectsKpSvelteCatalogueExemplar(search: string): boolean {
  // This flag selects a reversible host implementation, not catalogue state.
  // Canonical artifact and playhead authority remain in the existing codec.
  return new URLSearchParams(search).get(
    KP_SVELTE_CATALOGUE_EXEMPLAR_PARAM
  ) === KP_SVELTE_CATALOGUE_EXEMPLAR_VALUE;
}
