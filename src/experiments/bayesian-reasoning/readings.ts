import { requirePreparedBayesDraft, type PreparedBayesDraft } from "./draft.ts";
import { createKpArticleSource } from "../../article/kp-article-source.ts";
import { compileKpArticleDocument } from "../../article/kp-article-document.ts";
import { resolveKpArticleImports } from "../../article/kp-article-import-lock.ts";
import { compileKpArticleStaticHtml } from "../../article/kp-article-static-html.ts";
import { formatBayesMass as mass } from "./tree-svg.ts";

/** Labels are data, not Article directives, links, Markdown or TeX. Numeric
 * character references keep Markdown punctuation literal. Dollar signs use
 * Article's literal-code boundary so its later math pass cannot reinterpret them. */
const literal = (text: string) => Array.from(text, char => char === "$" ? "`$`" : `&#${char.codePointAt(0)};`).join("");

export function projectBayesReading(draft: PreparedBayesDraft, mode: "full" | "compact") {
  requirePreparedBayesDraft(draft);
  const { model, tree, trace } = draft, query = tree.query;
  const definitions = Object.freeze(model.events.map((event, index) => Object.freeze({ id: event.id,
    symbol: index === 0 ? "A" : "B", label: event.label, complementLabel: event.complementLabel })));
  const assumptions = Object.freeze([
    "Four disjoint, exhaustive joint outcomes describe one stipulated population; no independence assumption is made.",
    `Conditioning uses B as its reference population; P(B) = ${mass(query.denominator)} is positive.`,
    "Tree order changes factorization, not joint probabilities or causal direction."
  ]);
  const facts = Object.freeze({ jointMasses: Object.freeze(model.outcomes.map(outcome => Object.freeze({
    outcomeId: outcome.id, mass: mass(outcome.mass) }))), numerator: mass(query.numerator),
    denominator: mass(query.denominator), posterior: mass(query.value), referencePopulationId: tree.marginalId });
  const context = `${definitions.map(event => `${event.symbol} means ${literal(event.label)}; not ${event.symbol} means ${literal(event.complementLabel)}.`).join("\n\n")}\n\n${assumptions.join("\n\n")}\n\nJoint masses (A ∩ B, A ∩ not B, not A ∩ B, not A ∩ not B): ${facts.jointMasses.map(fact => fact.mass).join(", ")}.`;
  const answer = `P(A | B) = P(A ∩ B) / P(B) = (${facts.numerator}) / (${facts.denominator}) = ${facts.posterior}.`;
  const first = tree.initial.first === 0 ? "A" : "B", second = tree.initial.second === 0 ? "A" : "B";
  const explanation = mode === "compact"
    ? `Gather the two B outcomes, then divide the A-and-B joint mass by their sum. ${answer} Restore the full population before reordering the tree.`
    : `Start with the whole population. Split first on ${first}, then on ${second}. Multiply along each path to recover its joint mass.\n\nGather A ∩ B and not A ∩ B. Their sum, ${facts.denominator}, is still a share of the whole population.\n\nNow restrict the reference population to B. ${answer}\n\nRestore the whole population. Reorder the branches to ${second} first, then ${first}; all four original joint masses survive.`;
  const documentId = `lesson.probability.bayes-${mode}`;
  const source = createKpArticleSource(`${model.sourceId}.${mode}.${draft.revisionId.slice(7)}`, `---\nkp:\n  schema: kp.article.v1\n  id: ${documentId}\n  imports:\n---\n\n# ${mode === "full" ? "Full" : "Compact"} probability reading\n\n## Required context\n\n${context}\n\n## Reasoning\n\n${explanation}\n`);
  // This is a reading-only Article, not a fabricated vignette release or a
  // second interactive stage. Domain references remain explicitly pinned.
  const lock = resolveKpArticleImports(source, []).lock;
  const { document } = compileKpArticleDocument({ source, registry: [], lock });
  const html = compileKpArticleStaticHtml(document).articleHtml;
  return Object.freeze({ mode, revisionId: draft.revisionId, source, document, html, definitions, assumptions, facts,
    references: Object.freeze([...trace.states.map(state => state.id), ...trace.operations.map(operation => operation.id)]),
    editorialStatus: "editorial" as const });
}
