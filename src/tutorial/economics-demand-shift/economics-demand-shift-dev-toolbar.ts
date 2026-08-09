import {
  mountKpDevToolbar,
  type KpMountedDevToolbar
} from "../../dev-toolbar/dev-toolbar-dom.ts";
import {
  kpDevToolbarReviewControlId,
} from "../../dev-toolbar/dev-toolbar-protocol.ts";
import { mountKpTutorialDevReview } from "../../dev-review/tutorial-review-bootstrap.ts";
import {
  writeKpEconomicsDemandShiftTheme
} from "./economics-demand-shift-theme.ts";
import {
  writeKpEconomicsDemandShiftView,
  type KpEconomicsDemandShiftView
} from "./economics-demand-shift-view.ts";
import { createKpEconomicsDevToolbarContribution } from
  "./economics-demand-shift-dev-toolbar-contribution.ts";

export interface KpEconomicsDemandShiftDevToolbar {
  readonly update: (search: string) => void;
  readonly dispose: () => void;
}

export function mountKpEconomicsDemandShiftDevToolbar(input: {
  readonly ownerWindow?: Window;
  readonly search: string;
  readonly navigate: (search: string) => void;
}): KpEconomicsDemandShiftDevToolbar {
  const ownerWindow = input.ownerWindow ?? window;
  const disposeReview = mountKpTutorialDevReview(ownerWindow);
  const reviewShell = ownerWindow.document.querySelector<HTMLElement>(
    "[data-kp-dev-review-shell]"
  );
  const launcher = reviewShell?.shadowRoot?.querySelector<HTMLButtonElement>(".launcher");
  if (launcher !== undefined && launcher !== null) launcher.style.display = "none";
  let search = input.search;
  let toolbar: KpMountedDevToolbar;
  toolbar = mountKpDevToolbar({
    ownerDocument: ownerWindow.document,
    contribution: createKpEconomicsDevToolbarContribution(search),
    execute: (command) => {
      if (command.controlId === kpDevToolbarReviewControlId) {
        launcher?.click();
        return;
      }
      if (command.controlId === "economics.view" && typeof command.value === "string") {
        input.navigate(writeKpEconomicsDemandShiftView({
          search,
          view: command.value as KpEconomicsDemandShiftView
        }));
        return;
      }
      if (command.controlId === "economics.theme" && typeof command.value === "boolean") {
        input.navigate(writeKpEconomicsDemandShiftTheme({
          search,
          theme: command.value ? "dark" : "light"
        }));
      }
    }
  });
  return Object.freeze({
    update: (nextSearch: string) => {
      search = nextSearch;
      toolbar.update(createKpEconomicsDevToolbarContribution(search));
    },
    dispose: () => {
      toolbar.dispose();
      disposeReview();
    }
  });
}
