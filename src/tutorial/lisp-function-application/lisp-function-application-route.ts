export const kpLispFunctionApplicationTutorialPath =
  "/tutorials/programming/lisp-function-application/";

export function isKpLispFunctionApplicationTutorialRoute(
  pathname: string
): boolean {
  return pathname === kpLispFunctionApplicationTutorialPath ||
    pathname === kpLispFunctionApplicationTutorialPath.slice(0, -1);
}
