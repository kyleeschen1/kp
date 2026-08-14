export const kpNormalMatrixProofPublicPath =
  "/learn/math/normal-matrices/" as const;
export const kpNormalMatrixProofReviewPath =
  "/learn/math/normal-matrices/review/" as const;

export function isKpNormalMatrixProofPublicRoute(pathname: string): boolean {
  return pathname === kpNormalMatrixProofPublicPath ||
    pathname === kpNormalMatrixProofPublicPath.slice(0, -1);
}

export function isKpNormalMatrixProofReviewRoute(pathname: string): boolean {
  return pathname === kpNormalMatrixProofReviewPath ||
    pathname === kpNormalMatrixProofReviewPath.slice(0, -1);
}
