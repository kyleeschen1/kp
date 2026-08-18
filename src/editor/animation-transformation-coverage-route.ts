export const KP_ANIMATION_TRANSFORMATION_COVERAGE_VIEW = "coverage";

export function readKpAnimationTransformationCoverageRoute(
  search: string
): Readonly<{ readonly active: boolean }> {
  return Object.freeze({
    active: readKpAnimationDevelopmentUrlState(search).view ===
      KP_ANIMATION_TRANSFORMATION_COVERAGE_VIEW
  });
}

export function writeKpAnimationTransformationCoverageRoute(
  search: string
): string {
  const params = new URLSearchParams(search);
  params.set("view", KP_ANIMATION_TRANSFORMATION_COVERAGE_VIEW);
  return `?${params.toString()}`;
}
import {
  readKpAnimationDevelopmentUrlState
} from "./animation-development-url-state.ts";
