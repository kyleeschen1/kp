export const KP_LOG_PRODUCT_KINETIC_FIGURE_PATH =
  "/experiments/kinetic-figure/log-product/";

export function isKpLogProductKineticFigureRoute(pathname: string): boolean {
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return normalized === KP_LOG_PRODUCT_KINETIC_FIGURE_PATH;
}
