export type KpEconomicsDemandShiftEnhancementMode =
  | "published"
  | "presenter";

/**
 * Keeps route composition separate from the lesson's semantic publication.
 * The query switch is temporary migration authority, not an authoring field.
 */
export function readKpEconomicsDemandShiftEnhancementMode(
  search: string
): KpEconomicsDemandShiftEnhancementMode {
  return new URLSearchParams(search).get("enhancement") === "published"
    ? "published"
    : "presenter";
}
