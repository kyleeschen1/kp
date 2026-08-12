export const kpSchemeFactorialTutorialPath =
  "/tutorials/programming/scheme-factorial/";

export function isKpSchemeFactorialTutorialRoute(pathname: string): boolean {
  return pathname === kpSchemeFactorialTutorialPath ||
    pathname === kpSchemeFactorialTutorialPath.slice(0, -1);
}
