import {
  kpDevToolbarProtocolSchema,
  type KpDevToolbarRouteContribution
} from "../../dev-toolbar/dev-toolbar-protocol.ts";
import {
  kpEconomicsDemandShiftViews,
  readKpEconomicsDemandShiftView,
  type KpEconomicsDemandShiftView
} from "./economics-demand-shift-view.ts";

export function createKpEconomicsDevToolbarContribution(
  search: string
): KpDevToolbarRouteContribution {
  const view = readKpEconomicsDemandShiftView(search);
  return {
    schemaVersion: kpDevToolbarProtocolSchema,
    routeId: "tutorial.economics.demand-shift",
    controls: [{
      kind: "choice",
      id: "economics.view",
      label: "Layout",
      group: "context",
      order: 10,
      value: view,
      options: kpEconomicsDemandShiftViews.map((value) => ({
        value,
        label: viewLabel(value)
      }))
    }, {
      kind: "action",
      id: "economics.edit-article",
      label: "Edit article",
      group: "context",
      order: 15,
      disabled: false
    }]
  };
}

function viewLabel(view: KpEconomicsDemandShiftView): string {
  switch (view) {
    case "reader": return "Reader";
    case "deck": return "Deck";
    case "attention-stage": return "Attention stage";
    case "split": return "Split";
    case "inline-sticky": return "Inline sticky";
    case "two-column-scroll": return "Two columns";
  }
}
