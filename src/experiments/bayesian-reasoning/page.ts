import { annotateBayesQuotient } from "./notation.ts";
import { compileKpEquationExemplarTemplate } from "../../reader/compiler/equation-exemplar-page.ts";
import { renderKpFocusDeckScaffold } from "../../tutorial/focus-deck-scaffold.ts";
import { renderBayesTreeSvg, formatBayesMass } from "./tree-svg.ts";
import { checkBayesDraft, createBayesDraft, requirePreparedBayesDraft, type PreparedBayesDraft } from "./draft.ts";
import { encodeKpHtmlText as escape } from "../../rendering/html-output-encoding.ts";
import { projectBayesReading } from "./readings.ts";
import { projectBayesPrompts } from "./prompts.ts";
import { projectBayesContext } from "./context.ts";

export function renderBayesCardRevision(draft: PreparedBayesDraft) {
  requirePreparedBayesDraft(draft);
  const { score: beats, notation, model } = draft;
  const [a, b] = model.events;
  // Author prose cannot remove the compiler-owned definitions or assumptions.
  // Keep them outside the seven passage slots so short prose does not hide them.
  const editorialIntro = draft.editorial ? `<header data-bayes-editorial><h2>${escape(draft.editorial.title)}</h2><p>${escape(draft.editorial.setup)}</p></header>` : "";
  const requiredContext = draft.editorial ? `<details data-bayes-required-context><summary>Required probability context</summary>${projectBayesContext(draft).assumptions.map(text => `<p>${escape(text)}</p>`).join("")}</details>` : "";
  return `<div data-bayes-display-revision="${draft.revisionId}">${editorialIntro}<p data-bayes-model-summary>Stipulated joint probabilities: ${model.outcomes.map(outcome => `${outcome.key} = ${formatBayesMass(outcome.mass)}`).join(", ")}. A = ${escape(a.label)}; B = ${escape(b.label)}.</p>${requiredContext}
    ${renderKpFocusDeckScaffold({ id: "bayesian-reasoning", ariaLabel: "Building and reordering a probability tree", activeBeatSlug: beats[0]!.slug,
      rootAttributes: { "data-bayes-card": true }, viewportAttributes: { "data-kp-focus-deck-snap-disabled": "true" },
      headerTrailingHtml: '<span data-bayes-count>1 / 7</span>', replayHidden: false, beats,
      stageHtml: `<figure class="kp-focus-deck__stage bayes-stage"><div class="bayes-tree-panel"><p class="bayes-legend">A = ${escape(a.label)} · B = ${escape(b.label)} · ¬ = not · Ω = all</p><p data-bayes-population-label>Reference: whole population</p><div data-bayes-tree-host>${renderBayesTreeSvg(draft.tree)}</div></div>
        <div class="bayes-notation" data-bayes-notation-phase="question"><p data-bayes-question>Among B,<br>what fraction is also A?</p><span data-bayes-formula-label></span><div data-bayes-native-host aria-hidden="true"></div></div></figure>` })}
    ${compileKpEquationExemplarTemplate(notation.animation, annotateBayesQuotient)}
    <p><button type="button" data-bayes-explain>Why this denominator?</button> <button type="button" data-bayes-return hidden>Return to my position</button></p>
    <section data-bayes-reason hidden aria-label="Denominator reasoning"><h2>Why divide by P(B)?</h2><p>The denominator includes every B outcome: A ∩ B and not A ∩ B. Their combined mass is ${formatBayesMass(draft.tree.query.denominator)} of the original population. Within that population, the A-and-B share is ${formatBayesMass(draft.tree.query.numerator)} / ${formatBayesMass(draft.tree.query.denominator)} = ${formatBayesMass(draft.tree.query.value)}. Gathering B and conditioning on B are distinct steps.</p></section>
    ${(["full", "compact"] as const).map(mode => `<details data-bayes-reading="${mode}" data-bayes-reading-revision="${draft.revisionId}"><summary>${mode === "full" ? "Full" : "Compact"} reading</summary>${projectBayesReading(draft, mode).html}</details>`).join("")}
    <p data-bayes-practice-choices>${projectBayesPrompts(draft).map(prompt => `<button type="button" data-bayes-practice="${prompt.kind}">${escape(prompt.card.title)}</button>`).join(" ")}</p>
    <section data-bayes-practice-panel hidden aria-label="Probability self-check"><h2 data-bayes-prompt-title></h2><p data-bayes-prompt-text></p><p data-bayes-prompt-context></p><p>Make your prediction or explanation before revealing. This is a self-check, not automatic grading.</p><button type="button" data-bayes-reveal>Reveal answer</button><p data-bayes-answer hidden></p><button type="button" data-bayes-practice-return>Return to the card</button></section></div>`;
}

export function buildBayesPage() {
  const sourceText = JSON.stringify(createBayesDraft(), null, 2), result = checkBayesDraft(sourceText);
  if (result.status !== "compiled") throw new Error(result.diagnostic.expected);
  return `<h1>Change the question. Keep the facts.</h1>
    <div data-bayes-display>${renderBayesCardRevision(result.draft)}</div>
    <p class="review-help">Swipe across the figure or passage; release to settle. Arrows animate one semantic step. Seven stops, one shared playhead.</p>
    <details><summary>Exact model and scope</summary><p>This is stipulated data, not a claim about a real classifier. Reordering a probability tree is not reversing causation.</p></details>
    <details class="bayes-author"><summary>Edit the probability model</summary>
      <p>Edit exact fractions, event labels, the first event ID or explanation detail. Apply prepares all seven steps together; this does not change a source file.</p>
      <label for="bayes-draft">Bounded probability source (JSON)</label>
      <p><button type="button" data-bayes-load-urn disabled>Load urn example into draft</button> Apply it to change the displayed card.</p>
      <textarea id="bayes-draft" data-bayes-draft spellcheck="false">${escape(sourceText)}</textarea>
      <button type="button" data-bayes-apply disabled>Apply draft</button> <button type="button" data-bayes-restore disabled>Restore displayed source</button>
      <button type="button" data-bayes-download disabled>Download displayed source</button>
      <p>Build a local immutable edition from that file: <code>npm run author:bayesian-publication -- --source path/to/bayes.json</code>. Add <code>--check</code> to verify it. Download never exports an unapplied draft.</p>
      <p data-bayes-author-status role="status">Preparing the initial card.</p>
    </details><p data-bayes-error role="alert" hidden></p>`;
}
