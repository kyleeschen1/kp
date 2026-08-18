import {
  readKpAnimationDevelopmentUrlState,
  writeKpAnimationDevelopmentUrlState,
  type KpAnimationDevelopmentView
} from "./animation-development-url-state.ts";

export const KP_ANIMATION_DEVELOPMENT_LOCATION_EVENT =
  "kp-animation-development-location";

/**
 * Same-document development navigation preserves the exact selected artifact
 * and display context. The root host, rather than this headless command, owns
 * remounting the appropriate application view.
 */
export function navigateKpAnimationDevelopmentView(input: {
  readonly ownerWindow?: Window | undefined;
  readonly view: KpAnimationDevelopmentView;
  readonly history?: "push" | "replace" | undefined;
}): string {
  const ownerWindow = input.ownerWindow ?? window;
  const current = readKpAnimationDevelopmentUrlState(
    ownerWindow.location.href
  );
  if (current.view === undefined) {
    throw new Error("Animation development navigation requires an active view.");
  }
  const href = writeKpAnimationDevelopmentUrlState({
    baseUrl: ownerWindow.location.href,
    state: {
      ...current,
      view: input.view,
      viewSource: "explicit"
    }
  });
  if (href === ownerWindow.location.href) return href;
  if (input.history === "replace") {
    ownerWindow.history.replaceState(null, "", href);
  } else {
    ownerWindow.history.pushState(null, "", href);
  }
  ownerWindow.dispatchEvent(new CustomEvent(
    KP_ANIMATION_DEVELOPMENT_LOCATION_EVENT,
    { detail: Object.freeze({ href }) }
  ));
  return href;
}
