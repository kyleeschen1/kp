import { checkScalarCancellation } from "../../../domains/public-api.ts";
import { createScalarCancellationPlan, unfoldDerivationInspection } from "../../semantic/momentum-energy-derivation-plan.ts";
import { createKpArticleSource } from "../../article/kp-article-source.ts";
import { resolveKpArticleImports } from "../../article/kp-article-import-lock.ts";
import { compileKpArticleDocument } from "../../article/kp-article-document.ts";
import { compileKpArticleMarkdownFragmentHtml as html } from "../../article/kp-article-static-html.ts";
import { defineKpLessonDocument, kpLesson } from "../../reader/document/public-api.ts";
import { sha256 } from "../../kernel/sha256.ts";
import { renderCheckedDerivationPassage } from "./momentum-energy-derivation-publication.ts";

export const scalarCancellationArticlePath = "examples/algebra/scalar-cancellation.article.md";
export const scalarCancellationSourcePath = "examples/algebra/scalar-cancellation.json";

/** Build-only Article projection. This caller supplies checked content, not
 * renderer code, DOM geometry, CSS, timing or a second navigation system. */
export function compileScalarCancellationPublication(markdown: string, input: unknown) {
  const checked = checkScalarCancellation(input);
  if (checked.status !== "checked") throw new Error(`${checked.code} at ${checked.path}: ${checked.expected}`);
  const source = createKpArticleSource(scalarCancellationArticlePath, markdown);
  const { lock } = resolveKpArticleImports(source, []);
  const article = compileKpArticleDocument({ source, registry: [], lock });
  const revision = sha256(JSON.stringify({ document: article.document, source: checked.model.source }));
  const coarse = createScalarCancellationPlan(checked.model);
  const plans = { coarse, fine: unfoldDerivationInspection(coarse, coarse.moves[0]!.id) };
  const blocks = article.document.blocks.map(block => {
    if (block.kind !== "markdown" && block.kind !== "passage") throw new Error("Scalar reading supports prose and its checked derivation, not arbitrary motion");
    return block;
  });
  if (blocks.filter(block => block.kind === "passage" && block.id === "remaining-factor").length !== 1)
    throw new Error("Scalar reading requires one remaining-factor passage");
  const title = blocks.flatMap(block => /^# (.+)$/m.exec(block.markdown)?.[1] ?? [])[0];
  if (!title) throw new Error("Scalar Article requires a source-owned title");
  const document = defineKpLessonDocument({ id: article.document.id, version: "1.0.0", title,
    blocks: blocks.map(block => kpLesson.paragraph({ id: block.kind === "passage" ? block.fullId : block.key, content: [block.markdown] })) });
  const escape = (value: string) => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
  const body = blocks.map(block => block.kind === "markdown" ? html(block.markdown)
    : `<section id="${escape(block.id)}">${block.id === "remaining-factor" ? renderCheckedDerivationPassage(block.markdown, revision, plans) : html(block.markdown)}</section>`).join("\n");
  const manifest = JSON.stringify(checked.model.source).replaceAll("<", "\\u003c");
  return Object.freeze({ document, revision, source: checked.model.source,
    html: `<article data-kp-article="${escape(document.id)}">${body}<script type="application/json" data-scalar-derivation-source>${manifest}</script></article>` });
}
