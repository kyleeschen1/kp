export const KP_SUPPLY_TAX_SCROLL_SCORE_PATH =
  "/experiments/kinetic-figure/supply-tax-scroll-score/";

export function isKpSupplyTaxScrollScoreRoute(pathname: string): boolean {
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return normalized === KP_SUPPLY_TAX_SCROLL_SCORE_PATH;
}
