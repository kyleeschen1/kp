export const kpFractionCompositionPublicPath =
  "/learn/math/fraction-composition/" as const;

export function isKpFractionCompositionPublicRoute(pathname: string): boolean {
  return pathname === kpFractionCompositionPublicPath ||
    pathname === kpFractionCompositionPublicPath.slice(0, -1);
}
