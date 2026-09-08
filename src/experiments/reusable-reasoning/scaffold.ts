import { renderKpFocusDeckScaffold, type KpFocusDeckScaffoldBeat } from "../../tutorial/focus-deck-scaffold.ts";
import { bindKpReasoningSupport } from "./support.ts";
import type { KpReasoningEvidence } from "./evidence.ts";

const titles = ["Before distribution", "Distribute to both terms", "Normalize the fractions",
  "Evaluate the constant product", "Evaluate the constant quotient"];
const descriptions = [
  "Inspect the common factor and the grouped sum.",
  "The same factor now multiplies each addend.",
  "Each product is written with its factor in the numerator.",
  "Evaluate the multiplication in the constant numerator.",
  "Evaluate the constant quotient; the variable term is retained."
];

export function reasoningBeats(evidence: KpReasoningEvidence, view: "parent" | "reason"): readonly KpFocusDeckScaffoldBeat[] {
  const support = bindKpReasoningSupport(evidence);
  const count = support.procedure.operations.length;
  const checkpoints = view === "parent" ? [0, count] : Array.from({ length: count + 1 }, (_, index) => index);
  return checkpoints.map((index, position) => ({
    slug: `checkpoint-${index}`, title: titles[index]!,
    html: `<p>${escapeReasoningText(view === "parent"
      ? position === 0 ? evidence.source.parent.statement : evidence.source.reason.explanation
      : position === 0 ? evidence.source.reason.explanation : descriptions[index]!)}</p>`,
    attributes: { "data-reasoning-state": evidence.states[index]!.stateId }
  }));
}

export function renderReasoningCard(evidence: KpReasoningEvidence, view: "parent" | "reason" = "parent") {
  const beats = reasoningBeats(evidence, view);
  return renderKpFocusDeckScaffold({
    id: "reusable-reasoning", ariaLabel: evidence.source.title, activeBeatSlug: beats[0]!.slug,
    beats, stageHtml: '<div class="kp-focus-deck__stage" data-distribution-stage aria-label="Verified equation"></div>',
    replayHidden: false,
    headerTrailingHtml: `<span data-reasoning-view-label>${view === "parent" ? "Argument" : "Supporting reason"}</span>`,
    rootAttributes: { "data-kp-focus-card-enhancement": "preparing", "data-kp-reasoning-card": true }
  });
}

export function renderReasoningPage(evidence: KpReasoningEvidence) {
  const support = bindKpReasoningSupport(evidence);
  return `<h1 data-reasoning-title>${escapeReasoningText(evidence.source.title)}</h1>
    <p class="source-label">One argument · inspect its reason · return to your place</p>
    <div class="reasoning-toolbar" aria-label="Reasoning navigation">
      <button type="button" data-reasoning-open>Why does this step work?</button>
      <button type="button" data-reasoning-return hidden>← Return to the argument</button>
      <span data-reasoning-location>Argument</span>
    </div>
    <div data-reasoning-reader>${renderReasoningCard(evidence)}</div>
    <section data-reasoning-context hidden aria-label="Reason assumptions and evidence">
      <h2>The rule and its context</h2>
      <p>${escapeReasoningText(support.procedure.formula.notation)} — the common factor applies to both addends.</p>
      <ul>${evidence.assumptions.map(item => `<li>${escapeReasoningText(item.statement)}</li>`).join("")}</ul>
      <details><summary>Inspect the bound evidence</summary><ol>${support.procedure.operations.map(item =>
        `<li><code>${escapeReasoningText(item.reference.id)}</code><br>${item.evidenceIds.map(escapeReasoningText).join("; ")}</li>`).join("")}</ol></details>
    </section>
    <p class="review-help">Use arrows, drag the slider, or swipe the passage. The reason preserves the verified intermediate steps.</p>
    <p class="review-help">Equation relationships are verified for this bounded example. Explanatory prose remains editorial.</p>
    <p data-reasoning-error role="alert" hidden></p>`;
}

export function escapeReasoningText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
