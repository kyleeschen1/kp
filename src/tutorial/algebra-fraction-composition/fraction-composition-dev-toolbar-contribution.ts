import {
  kpDevToolbarProtocolSchema,
  type KpDevToolbarRouteContribution
} from "../../dev-toolbar/dev-toolbar-protocol.ts";

export const kpFractionCompositionEditArticleControlId =
  "algebra-fraction-composition.edit-article" as const;

export function createKpFractionCompositionDevToolbarContribution(
  editorOpen: boolean
): KpDevToolbarRouteContribution {
  return {
    schemaVersion: kpDevToolbarProtocolSchema,
    routeId: "tutorial.algebra-fraction-composition",
    controls: [{
      kind: "action",
      id: kpFractionCompositionEditArticleControlId,
      label: editorOpen ? "Editing article" : "Edit article",
      group: "context",
      order: 15,
      disabled: editorOpen
    }]
  };
}
