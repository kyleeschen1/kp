export const kpTypeScriptFreeShippingPublicPath =
  "/learn/code/free-shipping/" as const;

export function isKpTypeScriptFreeShippingPublicRoute(pathname: string): boolean {
  return pathname === kpTypeScriptFreeShippingPublicPath ||
    pathname === kpTypeScriptFreeShippingPublicPath.slice(0, -1);
}
