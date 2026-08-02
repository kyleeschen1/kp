export const KP_SVELTE_CATALOGUE_EXEMPLAR_PARAM = "catalogueShell";
export const KP_SVELTE_CATALOGUE_EXEMPLAR_VALUE = "svelte-exemplar";
export const KP_IMPERATIVE_CATALOGUE_ROLLBACK_VALUE = "imperative-rollback";

export type KpAnimationCatalogueShellSelection =
  | "svelte"
  | "imperative-rollback";

export function selectKpAnimationCatalogueShell(
  search: string
): KpAnimationCatalogueShellSelection {
  // The approved Svelte composition is canonical. Only this exact query value
  // crosses the reversible cutover boundary back to the preserved old host.
  return new URLSearchParams(search).get(
      KP_SVELTE_CATALOGUE_EXEMPLAR_PARAM
    ) === KP_IMPERATIVE_CATALOGUE_ROLLBACK_VALUE
    ? "imperative-rollback"
    : "svelte";
}

export function selectsKpSvelteCatalogueExemplar(search: string): boolean {
  // Retain the migration-era explicit selector until compatibility cleanup.
  return new URLSearchParams(search).get(
    KP_SVELTE_CATALOGUE_EXEMPLAR_PARAM
  ) === KP_SVELTE_CATALOGUE_EXEMPLAR_VALUE;
}
