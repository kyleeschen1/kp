export const kpEconomicsDemandShiftTutorialPath =
  "/tutorials/economics/demand-shift/";

export function isKpEconomicsDemandShiftTutorialRoute(
  pathname: string
): boolean {
  const normalized = pathname.endsWith("/") ? pathname : `${pathname}/`;
  return normalized === kpEconomicsDemandShiftTutorialPath;
}
