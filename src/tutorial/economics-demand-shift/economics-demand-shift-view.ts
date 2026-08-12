import type {
  KpEconomicsDemandShiftPresentationLayout
} from "./economics-demand-shift-layout.ts";

export type KpEconomicsDemandShiftView =
  | "reader"
  | "deck"
  | "attention-stage"
  | KpEconomicsDemandShiftPresentationLayout;

export const kpEconomicsDemandShiftViews:
readonly KpEconomicsDemandShiftView[] = Object.freeze([
  "reader",
  "deck",
  "attention-stage",
  "split",
  "inline-sticky",
  "two-column-scroll"
]);

const retiredKpEconomicsDemandShiftViews = new Set([
  "animation-station"
]);

export function readKpEconomicsDemandShiftView(
  search: string
): KpEconomicsDemandShiftView {
  const parameters = new URLSearchParams(search);
  const view = parameters.get("view");
  if (isKpEconomicsDemandShiftView(view)) return view;

  // Old review URLs remain exact inputs while newly shared links use `view`.
  const legacyLayout = parameters.get("layout");
  return isKpEconomicsPresenterView(legacyLayout) ? legacyLayout : "reader";
}

export function writeKpEconomicsDemandShiftView(input: {
  readonly search: string;
  readonly view: KpEconomicsDemandShiftView;
}): string {
  const parameters = new URLSearchParams(input.search);
  parameters.set("view", input.view);
  parameters.delete("layout");
  parameters.delete("enhancement");
  parameters.delete("scene");
  if (input.view !== "two-column-scroll") {
    parameters.delete("scrub");
    parameters.delete("dwell");
    parameters.delete("text");
    parameters.delete("gap");
  }
  return `?${parameters.toString()}`;
}

/**
 * Retired review URLs settle on searchable publication truth. Keeping this
 * decoder at the route edge lets the removed projection leave every active
 * type and import graph without turning old links into broken pages.
 */
export function normalizeKpEconomicsDemandShiftViewSearch(
  search: string
): string {
  const parameters = new URLSearchParams(search);
  const view = parameters.get("view");
  const layout = parameters.get("layout");
  const activeCanonicalView = isKpEconomicsDemandShiftView(view);
  const retiredViewRequested = retiredKpEconomicsDemandShiftViews.has(
    view ?? ""
  );
  const retiredLegacyLayoutRequested = !activeCanonicalView &&
    retiredKpEconomicsDemandShiftViews.has(layout ?? "");
  if (!retiredViewRequested && !retiredLegacyLayoutRequested) {
    return search;
  }
  return writeKpEconomicsDemandShiftView({ search, view: "reader" });
}

export function isKpEconomicsPresenterView(
  value: string | null | undefined
): value is KpEconomicsDemandShiftPresentationLayout {
  return value === "split" ||
    value === "inline-sticky" ||
    value === "two-column-scroll";
}

function isKpEconomicsDemandShiftView(
  value: string | null
): value is KpEconomicsDemandShiftView {
  return value === "reader" || value === "deck" ||
    value === "attention-stage" ||
    isKpEconomicsPresenterView(value);
}
