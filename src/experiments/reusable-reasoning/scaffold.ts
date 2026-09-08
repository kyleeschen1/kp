import { renderKpFocusDeckScaffold, type KpFocusDeckScaffoldBeat } from "../../tutorial/focus-deck-scaffold.ts";
import { bindKpReasoningSupport } from "./support.ts";
import type { KpReasoningEvidence } from "./evidence.ts";
import { projectReasoningReading, type ReasoningReading } from "./readings.ts";

const titles = ["Before distribution", "Distribute to both terms", "Normalize the fractions",
  "Evaluate the constant product", "Evaluate the constant quotient"];
const descriptions = [
  "Inspect the common factor and the grouped sum.",
  "The same factor now multiplies each addend.",
  "Each product is written with its factor in the numerator.",
  "Evaluate the multiplication in the constant numerator.",
  "Evaluate the constant quotient; the variable term is retained."
];

export function reasoningBeats(evidence: KpReasoningEvidence, view: "parent" | "reason", mode: ReasoningReading = "full"): readonly KpFocusDeckScaffoldBeat[] {
  const support = bindKpReasoningSupport(evidence);
  const count = support.procedure.operations.length;
  const reading = projectReasoningReading(evidence, mode);
  // Reading density changes prose, never the semantic slots or their spacing.
  const checkpoints = Array.from({ length: count + 1 }, (_, index) => index);
  return checkpoints.map(index => ({
    slug: `checkpoint-${index}`, title: titles[index]!,
    html: `<p>${escapeReasoningText(index === 0
      ? mode === "compact" ? reading.text : view === "parent"
        ? evidence.source.parent.statement : evidence.source.reason.explanation
      : descriptions[index]!)}</p>`,
    attributes: { "data-reasoning-state": evidence.states[index]!.stateId }
  }));
}

export function renderReasoningCard(evidence: KpReasoningEvidence, view: "parent" | "reason" = "parent", mode: ReasoningReading = "full") {
  const beats = reasoningBeats(evidence, view, mode);
  return renderKpFocusDeckScaffold({
    id: "reusable-reasoning", ariaLabel: evidence.source.title, activeBeatSlug: beats[0]!.slug,
    beats, stageHtml: '<div class="kp-focus-deck__stage" data-distribution-stage aria-label="Verified equation"></div>',
    replayHidden: false,
    headerTrailingHtml: `<span data-reasoning-view-label>${view === "parent" ? "Argument" : "Supporting reason"}</span><span data-reasoning-beat-count aria-label="Beat 1 of ${beats.length}">1 / ${beats.length}</span>`,
    rootAttributes: { "data-kp-focus-card-enhancement": "preparing", "data-kp-reasoning-card": true }
  });
}

export function renderReasoningPage(evidence: KpReasoningEvidence) {
  const support = bindKpReasoningSupport(evidence);
  return `<h1 data-reasoning-title>${escapeReasoningText(evidence.source.title)}</h1>
    <p class="source-label">One argument · inspect its reason · return to your place</p>
    <div class="reasoning-toolbar" aria-label="Reasoning navigation">
      <button type="button" data-reasoning-open>${escapeReasoningText(evidence.source.reason.title)}</button>
      <button type="button" data-reasoning-return hidden>← Return to the argument</button>
      <span data-reasoning-location>Argument</span>
      <label>Reading <select data-reasoning-reading><option value="full">Full</option><option value="compact">Compact</option></select></label>
      <button type="button" data-reasoning-practice="prediction">Predict</button>
      <button type="button" data-reasoning-practice="reconstruction">Reconstruct</button>
    </div>
    <div data-reasoning-reader>${renderReasoningCard(evidence)}</div>
    <section data-reasoning-practice-panel hidden aria-label="Retrieval practice">
      <h2 data-reasoning-prompt-title></h2><p data-reasoning-prompt></p>
      <label>Your working (self-check, not automatically graded)<textarea data-reasoning-working rows="3"></textarea></label>
      <div class="reasoning-toolbar"><button type="button" data-reasoning-reveal>Compare with the verified answer</button>
      <button type="button" data-reasoning-practice-return>Return to reading</button></div>
      <p data-reasoning-answer hidden></p>
    </section>
    <section data-reasoning-context aria-label="Reason assumptions and evidence">
      <h2>The rule and its context</h2>
      <p>${escapeReasoningText(support.procedure.formula.notation)} — the common factor applies to both addends.</p>
      <ul>${evidence.assumptions.map(item => `<li>${escapeReasoningText(item.statement)}</li>`).join("")}</ul>
      <details><summary>Inspect the bound evidence</summary><ol>${support.procedure.operations.map(item =>
        `<li><code>${escapeReasoningText(item.reference.id)}</code><br>${item.evidenceIds.map(escapeReasoningText).join("; ")}</li>`).join("")}</ol></details>
    </section>
    <p class="review-help">Swipe the passage for one step; drag the slider to inspect the motion. Arrows move one step at a time.</p>
    <p class="review-help">Equation relationships are verified for this bounded example. Explanatory prose remains editorial.</p>
    <details data-reasoning-editor><summary>Edit source JSON</summary>
      <p>Edit the draft, then choose Apply source. This example supports the first one to four verified operations, with a matching parent target. It does not support arbitrary coefficients or new algebra rules.</p>
      <label>Reasoning source JSON<textarea data-reasoning-json rows="20" spellcheck="false"></textarea></label>
      <div class="reasoning-toolbar"><button type="button" data-reasoning-apply>Apply source</button>
      <button type="button" data-reasoning-short-draft>Load three-step draft</button>
      <button type="button" data-reasoning-reset-draft>Load original draft</button></div>
      <p data-reasoning-draft-status role="status">Drafts are local to this page; reload restores the original example.</p>
      <p class="review-help">Active revision: <code data-reasoning-revision>${escapeReasoningText(evidence.revisionId)}</code></p>
    </details>
    <p data-reasoning-error role="alert" hidden></p>`;
}

export function escapeReasoningText(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
