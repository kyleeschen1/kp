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
  const parameters = new URLSearchParams(search);
  const explicit = parameters.get("enhancement");
  if (explicit === "published") return "published";
  if (explicit === "presenter") return "presenter";
  // Existing layout URLs remain exact review links while the public route
  // defaults to the smaller published-document enhancement.
  return isKpEconomicsPresenterView(readKpEconomicsDemandShiftView(search))
    ? "presenter"
    : "published";
}
import {
  isKpEconomicsPresenterView,
  readKpEconomicsDemandShiftView
} from "./economics-demand-shift-view.ts";
