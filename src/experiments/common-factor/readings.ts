import { assertKpPreparedCommonFactorDraft, type KpPreparedCommonFactorDraft } from "../../authoring/common-factor-draft.ts";
import { createKpArticleSource } from "../../article/kp-article-source.ts";
import { compileKpArticleDocument } from "../../article/kp-article-document.ts";
import { resolveKpArticleImports } from "../../article/kp-article-import-lock.ts";
import { compileKpArticleStaticHtml } from "../../article/kp-article-static-html.ts";
import { encodeKpArticleLiteralProse as literal } from "../../article/literal-prose.ts";
import { commonFactorEndpoints } from "./endpoints.ts";

export function projectCommonFactorReading(draft: KpPreparedCommonFactorDraft, mode: "full" | "compact") {
  assertKpPreparedCommonFactorDraft(draft);
  const endpoints = commonFactorEndpoints(draft);
  const atom = (value: KpPreparedCommonFactorDraft["proof"]["factor"]) => value.kind === "symbol" ? value.name : String(value.value);
  const facts = Object.freeze({ factor: atom(draft.proof.factor), addends: Object.freeze(draft.proof.addends.map(atom)),
    sourceLatex: endpoints[0]!.annotated.rawLatex, targetLatex: endpoints[1]!.annotated.rawLatex,
    domain: draft.proof.domain, lawId: draft.proof.inverseDistribution.lawId });
  const assumptions = Object.freeze(["All declared symbols denote real scalars.",
    "Product order and addend order are preserved in this bounded rewrite.", "No division is performed; the common factor may be zero."]);
  const references = Object.freeze([draft.source.states[0].id, `${draft.source.id}.factor`, draft.source.states[1].id].map(id =>
    Object.freeze({ sourceId: draft.source.id, revisionId: draft.revisionId, id })));
  const paragraphs = mode === "full" ? [draft.source.editorial.setup, ...draft.source.states.map(s => s.narration), draft.source.editorial.summary]
    : [draft.source.editorial.summary];
  const documentId = `${draft.source.id}.reading.${mode}`;
  const text = `---\nkp:\n  schema: kp.article.v1\n  id: ${documentId}\n  imports:\n---\n\n## ${mode === "full" ? "Full" : "Compact"} reading\n\n${paragraphs.map(literal).join("\n\n")}\n\n### Required context\n\n${assumptions.join("\n\n")}\n\nCommon factor: ${literal(facts.factor)}. Ordered addends: ${facts.addends.map(literal).join(", ")}.\n\n### Verified step\n\n$$\n${facts.sourceLatex}\n$$\n\nFactor the common scalar using the distributive law in reverse.\n\n$$\n${facts.targetLatex}\n$$\n\nExplanatory prose is editorial; the displayed equality is verified for this bounded task.\n`;
  const source = createKpArticleSource(`${documentId}.${draft.revisionId.slice(7)}`, text);
  const lock = resolveKpArticleImports(source, []).lock;
  const { document } = compileKpArticleDocument({ source, registry: [], lock });
  const html = compileKpArticleStaticHtml(document, { headingIdPrefix: documentId }).articleHtml;
  return Object.freeze({ mode, revisionId: draft.revisionId, source, document, html, facts, assumptions, references, editorialStatus: "editorial" as const });
}
