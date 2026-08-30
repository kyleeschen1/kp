export const KP_DELTA_EPSILON_KINETIC_FIGURE_PATH =
  "/experiments/kinetic-figure/delta-epsilon/";

export function isKpDeltaEpsilonKineticFigureRoute(pathname: string): boolean {
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return normalized === KP_DELTA_EPSILON_KINETIC_FIGURE_PATH;
}
