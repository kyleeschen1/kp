export const kpNormalMatrixProofPublicPath =
  "/learn/math/normal-matrices/" as const;

export function isKpNormalMatrixProofPublicRoute(pathname: string): boolean {
  return pathname === kpNormalMatrixProofPublicPath ||
    pathname === kpNormalMatrixProofPublicPath.slice(0, -1);
}
