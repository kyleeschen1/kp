export const KP_SURFACE_CONTOUR_KINETIC_FIGURE_PATH =
  "/experiments/kinetic-figure/surface-contour/" as const;

export function isKpSurfaceContourKineticFigureRoute(pathname: string): boolean {
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return normalized === KP_SURFACE_CONTOUR_KINETIC_FIGURE_PATH;
}
