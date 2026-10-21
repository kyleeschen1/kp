import { renderKpFocusDeckScaffold } from "../../tutorial/focus-deck-scaffold.ts";
import type { KpComposedAlgebraPresentationV2 } from "../../authoring/composed-algebra-presentation-v2.ts";
import { composedAlgebraSequenceV2, composedAlgebraWindowV2 } from "../composed-algebra/sequence.ts";
import type { KpComposedAlgebraSubexplanation } from "../composed-algebra/subexplanations.ts";

/** Shared markup only: selecting a fixture or editing a source belongs to hosts. */
export function renderAlgebraIntuitionCard(draft: KpComposedAlgebraPresentationV2, reference?: KpComposedAlgebraSubexplanation, textFirst = false) {
  const sequence = reference ? composedAlgebraWindowV2(draft, reference) : composedAlgebraSequenceV2(draft), total = sequence.beats.length;
  return renderKpFocusDeckScaffold({ id: reference ? `composed-algebra-${reference.kind}` : "composed-algebra-intuition", ariaLabel: reference?.question ?? draft.checked.source.editorial.title,
    activeBeatSlug: sequence.beats[0]!.slug, beats: sequence.beats, replayHidden: false,
    stageHtml: '<div class="kp-focus-deck__stage" data-distribution-stage aria-label="Verified regrouping and distribution"></div>',
    headerTrailingHtml: `<span data-composed-count aria-label="Step 1 of ${total}">1 / ${total}</span>`,
    rootAttributes: { "data-kp-focus-card-enhancement": "preparing", "data-kp-reasoning-card": true, "data-composed-card": true,
      ...(textFirst ? { "data-composed-text-first": true } : {}) } });
}
