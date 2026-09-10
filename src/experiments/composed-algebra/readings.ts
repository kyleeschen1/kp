import { assertKpComposedAlgebraPresentation, type KpComposedAlgebraPresentation } from "../../authoring/composed-algebra-presentation.ts";
import { createKpArticleSource } from "../../article/kp-article-source.ts";
import { compileKpArticleDocument } from "../../article/kp-article-document.ts";
import { resolveKpArticleImports } from "../../article/kp-article-import-lock.ts";
import { compileKpArticleStaticHtml } from "../../article/kp-article-static-html.ts";
import { encodeKpArticleLiteralProse as literal } from "../../article/literal-prose.ts";

export function projectComposedAlgebraReading(draft: KpComposedAlgebraPresentation, mode: "full" | "compact") {
  assertKpComposedAlgebraPresentation(draft);
  const authored = draft.checked.source;
  const facts = Object.freeze({ states: authored.states.map(s => ({ id: s.id, latex: s.latex })),
    domain: authored.domain, operationIds: draft.animation.transformations.map(t => t.id), proofRevisionId: draft.checked.chain.revisionId });
  const assumptions = Object.freeze(["All declared symbols denote real scalars.",
    "Product order and addend order are preserved. Only the integer coefficient sum is evaluated.",
    "No division is performed; the common expression may be zero."]);
  const references = Object.freeze([...authored.states.map(s => s.id), ...facts.operationIds].map(id =>
    Object.freeze({ sourceId: authored.id, revisionId: draft.revisionId, id })));
  const paragraphs = mode === "full" ? [authored.editorial.setup, ...authored.states.map(s => s.narration), authored.editorial.summary] : [authored.editorial.summary];
  const documentId = `${authored.id}.reading.${mode}`;
  const text = `---\nkp:\n  schema: kp.article.v1\n  id: ${documentId}\n  imports:\n---\n\n## ${mode === "full" ? "Full" : "Compact"} reading\n\n${paragraphs.map(literal).join("\n\n")}\n\n### Required context\n\n${assumptions.join("\n\n")}\n\n### Two verified steps\n\n$$\n${facts.states[0]!.latex}\n$$\n\nFactor the unchanged shared expression using the distributive law in reverse.\n\n$$\n${facts.states[1]!.latex}\n$$\n\nEvaluate the coefficient sum while keeping the surrounding expression unchanged.\n\n$$\n${facts.states[2]!.latex}\n$$\n\nExplanatory prose is editorial; both displayed equalities are verified for this bounded task.\n`;
  const source = createKpArticleSource(`${documentId}.${draft.revisionId.slice(7)}`, text), lock = resolveKpArticleImports(source, []).lock;
  const { document } = compileKpArticleDocument({ source, registry: [], lock });
  const html = compileKpArticleStaticHtml(document, { headingIdPrefix: documentId }).articleHtml;
  return Object.freeze({ mode, revisionId: draft.revisionId, source, document, html, facts, assumptions, references, editorialStatus: "editorial" as const });
}
