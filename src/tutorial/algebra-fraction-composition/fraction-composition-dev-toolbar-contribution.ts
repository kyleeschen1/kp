import {
  kpDevToolbarProtocolSchema,
  type KpDevToolbarRouteContribution
} from "../../dev-toolbar/dev-toolbar-protocol.ts";
import type {
  KpFractionCompositionAttentionTempo
} from "./fraction-composition-attention-pacing.ts";

export const kpFractionCompositionEditArticleControlId =
  "algebra-fraction-composition.edit-article" as const;
export const kpFractionCompositionAttentionTempoControlId =
  "algebra-fraction-composition.attention-tempo" as const;

export function createKpFractionCompositionDevToolbarContribution(
  editorOpen: boolean,
  attentionTempo?: KpFractionCompositionAttentionTempo | undefined
): KpDevToolbarRouteContribution {
  return {
    schemaVersion: kpDevToolbarProtocolSchema,
    routeId: "tutorial.algebra-fraction-composition",
    controls: [
      {
        kind: "action",
        id: kpFractionCompositionEditArticleControlId,
        label: editorOpen ? "Editing article" : "Edit article",
        group: "context",
        order: 15,
        disabled: editorOpen
      },
      ...(attentionTempo === undefined ? [] : [{
        kind: "choice" as const,
        id: kpFractionCompositionAttentionTempoControlId,
        label: "Tempo",
        group: "preferences" as const,
        order: 20,
        value: attentionTempo,
        options: [
          { value: "slow", label: "Slow" },
          { value: "deliberate", label: "Deliberate" },
          { value: "brisk", label: "Brisk" }
        ]
      }])
    ]
  };
}
