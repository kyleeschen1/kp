import { getKpDevelopmentToolbar } from
  "../../dev-toolbar/development-toolbar-bootstrap.ts";
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
  readonly editArticle: () => void;
  readonly navigate: (search: string) => void;
}): KpEconomicsDemandShiftDevToolbar {
  const ownerWindow = input.ownerWindow ?? window;
  const toolbar = getKpDevelopmentToolbar(ownerWindow);
  if (toolbar === undefined) {
    throw new Error("The application development toolbar is not mounted.");
  }
  const disposeReview = mountKpTutorialDevReview(ownerWindow);
  let search = input.search;
  const execute = (command: {
    readonly controlId: string;
    readonly value?: string | boolean;
  }): void => {
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
      return;
    }
    if (command.controlId === "economics.edit-article") {
      input.editArticle();
    }
  };
  toolbar.setRoute(createKpEconomicsDevToolbarContribution(search), execute);
  return Object.freeze({
    update: (nextSearch: string) => {
      search = nextSearch;
      toolbar.setRoute(createKpEconomicsDevToolbarContribution(search), execute);
    },
    dispose: () => {
      toolbar.clearRoute("tutorial.economics.demand-shift");
      disposeReview();
    }
  });
}
