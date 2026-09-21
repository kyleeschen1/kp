import { renderKpFocusDeckScaffold } from "../focus-deck-scaffold.ts";
import type { KpTypeScriptRefactorScoreV1 } from "../../semantic/typescript-refactor-score.ts";
import { encodeKpHtmlText } from "../../rendering/html-output-encoding.ts";

export function renderShippingFocus(score: KpTypeScriptRefactorScoreV1) {
  return `<div data-shipping-focus hidden>${renderKpFocusDeckScaffold({
    id: "shipping.shared-rule.focus", ariaLabel: "One shipping rule, two callers",
    activeBeatSlug: score.stages[0]!.id,
    classAliases: { root: "kp-code-focus-card shipping-focus-card" },
    headerTrailingHtml: '<button type="button" data-shipping-copy title="Copy the nearest complete source version">Copy code</button>',
    stageHtml: '<div data-shipping-focus-slot></div>',
    beats: score.stages.map(stage => ({ slug: stage.id, title: stage.narration,
      html: `<p>${encodeKpHtmlText(stage.narration)}</p>` }))
  })}<p data-shipping-fit-note></p><p data-shipping-copy-status role="status"></p><div data-shipping-copy-fallback hidden><label>Copy this complete code version<textarea class="kp-typescript-refactor__revision" data-shipping-copy-source readonly rows="11" spellcheck="false"></textarea></label></div></div>`;
}
