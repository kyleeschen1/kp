import {
  readKpAnimationCatalogueRoute
} from "../editor/animation-catalogue-route.ts";
import {
  readKpAnimationTransformationCoverageRoute
} from "../editor/animation-transformation-coverage-route.ts";
import {
  isKpEconomicsDemandShiftTutorialRoute
} from "../tutorial/economics-demand-shift/economics-demand-shift-route.ts";
import {
  isKpLispFunctionApplicationTutorialRoute
} from "../tutorial/lisp-function-application/lisp-function-application-route.ts";
import {
  isKpSchemeFactorialTutorialRoute
} from "../tutorial/scheme-factorial/scheme-factorial-route.ts";
export const kpLegacyRootRouteKinds = [
  "scheme-factorial",
  "lisp-function-application",
  "economics-demand-shift",
  "kinetic-figure-log-product",
  "concept-room",
  "animation-coverage",
  "animation-catalogue",
  "internal-studio-fallback"
] as const;

export type KpLegacyRootRouteKind =
  (typeof kpLegacyRootRouteKinds)[number];

/**
 * The legacy HTML root chooses capabilities but owns none of their semantic or
 * rendering implementations. Concept routes have a reserved namespace so the
 * editor fallback does not eagerly load concept publication machinery.
 */
export function selectKpLegacyRootRoute(input: {
  readonly pathname: string;
  readonly search: string;
}): KpLegacyRootRouteKind {
  if (isKpSchemeFactorialTutorialRoute(input.pathname)) {
    return "scheme-factorial";
  }
  if (isKpLispFunctionApplicationTutorialRoute(input.pathname)) {
    return "lisp-function-application";
  }
  if (isKpEconomicsDemandShiftTutorialRoute(input.pathname)) {
    return "economics-demand-shift";
  }
  const normalizedPathname = input.pathname.endsWith("/")
    ? input.pathname
    : `${input.pathname}/`;
  if (normalizedPathname === "/experiments/kinetic-figure/log-product/") {
    return "kinetic-figure-log-product";
  }
  if (input.pathname === "/concepts" ||
      input.pathname.startsWith("/concepts/")) {
    return "concept-room";
  }
  if (readKpAnimationTransformationCoverageRoute(input.search).active) {
    return "animation-coverage";
  }
  if (readKpAnimationCatalogueRoute(input.search).active) {
    return "animation-catalogue";
  }
  return "internal-studio-fallback";
}
