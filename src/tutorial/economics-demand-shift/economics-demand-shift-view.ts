import type {
  KpEconomicsDemandShiftPresentationLayout
} from "./economics-demand-shift-layout.ts";

export type KpEconomicsDemandShiftView =
  | "reader"
  | "deck"
  | KpEconomicsDemandShiftPresentationLayout;

export const kpEconomicsDemandShiftViews:
readonly KpEconomicsDemandShiftView[] = Object.freeze([
  "reader",
  "deck",
  "split",
  "inline-sticky",
  "two-column-scroll",
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

export function isKpEconomicsPresenterView(
  value: string | null | undefined
): value is KpEconomicsDemandShiftPresentationLayout {
  return value === "split" ||
    value === "inline-sticky" ||
    value === "two-column-scroll" ||
    value === "animation-station";
}

function isKpEconomicsDemandShiftView(
  value: string | null
): value is KpEconomicsDemandShiftView {
  return value === "reader" || value === "deck" ||
    isKpEconomicsPresenterView(value);
}
