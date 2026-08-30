export const KP_SUPPLY_TAX_KINETIC_FIGURE_PATH =
  "/experiments/kinetic-figure/supply-tax/";

export function isKpSupplyTaxKineticFigureRoute(pathname: string): boolean {
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return normalized === KP_SUPPLY_TAX_KINETIC_FIGURE_PATH;
}
