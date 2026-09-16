import ts from "typescript";
import { createKpArticleSource } from "../src/article/kp-article-source.ts";
import { resolveKpArticleImports } from "../src/article/kp-article-import-lock.ts";
import { compileKpArticleDocument } from "../src/article/kp-article-document.ts";
import { compileKpArticleMarkdownFragmentHtml as markdownHtml } from "../src/article/kp-article-static-html.ts";
import { encodeKpHtmlText as text } from "../src/rendering/html-output-encoding.ts";

export const centroidPaths = {
  article: "examples/programming/centroid.article.md",
  before: "examples/programming/centroid-before.ts",
  after: "examples/programming/centroid-after.ts"
} as const;

// These ranges certify only that excerpts come from real source. They confer
// no refactor correspondence, execution proof or animation authority.
function functionSource(source: string, name: string) {
  const file = ts.createSourceFile("centroid.ts", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const matches = file.statements.filter(ts.isFunctionDeclaration).filter(node => node.name?.text === name);
  if (matches.length !== 1 || !matches[0]?.body) throw new Error(`Expected one function body for ${name}`);
  const node = matches[0];
  return { whole: node.getText(file), kinds: node.body!.statements.map(statement => statement.kind), statements: node.body!.statements.map(statement => statement.getText(file)) };
}

function unindentBody(statements: readonly string[]): string {
  return statements.map(statement => statement.replaceAll("\n  ", "\n")).join("\n");
}

export function compileCentroidPublication(markdown: string, before: string, after: string) {
  const source = createKpArticleSource(centroidPaths.article, markdown);
  const { lock } = resolveKpArticleImports(source, []);
  const article = compileKpArticleDocument({ source, registry: [], lock });
  const passages = article.document.blocks.filter(block => block.kind === "passage");
  if (passages.map(block => block.id).join(",") !== "pattern,extract,reuse,check") {
    throw new Error("Centroid publication requires ordered pattern, extract, reuse, check passages");
  }
  const original = functionSource(before, "centroid");
  const helper = functionSource(after, "mean");
  const result = functionSource(after, "centroid");
  // The exemplar's clipping boundaries are deliberately bounded. A changed
  // procedure must be reviewed instead of silently omitting added statements.
  if (original.statements.length !== 7 || helper.statements.length !== 3 || result.statements.length !== 3) {
    throw new Error("Centroid excerpt structure changed; review the clipping boundaries");
  }
  const { VariableStatement: variable, ForOfStatement: loop, ReturnStatement: returns } = ts.SyntaxKind;
  for (const [actual, expected] of [
    [original.kinds, [variable, loop, variable, variable, loop, variable, returns]],
    [helper.kinds, [variable, loop, returns]], [result.kinds, [variable, variable, returns]]
  ]) {
    if (actual!.join() !== expected!.join()) throw new Error("Centroid excerpt statement roles changed; review the clipping boundaries");
  }
  const excerpts = {
    x: unindentBody(original.statements.slice(0, 3)),
    y: unindentBody(original.statements.slice(3, 6)),
    helper: helper.whole.replace(/^export /, ""),
    calls: unindentBody(result.statements)
  };
  const code = (id: keyof typeof excerpts) => `<pre class="kp-typescript-refactor__revision" data-centroid-excerpt="${id}"><code>${text(excerpts[id])}</code></pre>`;
  const figure = (label: string, id: keyof typeof excerpts) => `<figure><figcaption>${label}</figcaption>${code(id)}</figure>`;
  const attachments: Record<string, string> = {
    pattern: `<div class="centroid-pair">${figure("Horizontal coordinates · xs → cx", "x")}${figure("Vertical coordinates · ys → cy", "y")}</div>`,
    extract: `<div class="centroid-extraction">${figure("The shared procedure", "helper")}<dl aria-label="How the original becomes the helper">
      <dt>Input · xs or ys → vs</dt><dd>The parameter stands for whichever array this call receives.</dd>
      <dt>Local work · sx or sy → s</dt><dd>The sum and loop stay inside the helper. Each call gets its own locals.</dd>
      <dt>Output · assigned average → return</dt><dd>The same division supplies the value back to the caller.</dd>
    </dl></div>`,
    reuse: `${figure("The centroid body after extraction", "calls")}<details><summary>See both complete source files</summary><h3>Before</h3><pre class="kp-typescript-refactor__revision" data-centroid-source="before"><code>${text(before)}</code></pre><h3>After</h3><pre class="kp-typescript-refactor__revision" data-centroid-source="after"><code>${text(after)}</code></pre></details>`,
    check: `<details><summary>Check your reasoning</summary><p><code>const cz = mean(zs);</code> reuses the same procedure. It gets a fresh local sum, just like the other calls.</p></details>`
  };
  const html = article.document.blocks.map(block => {
    if (block.kind === "markdown") return markdownHtml(block.markdown);
    if (block.kind !== "passage") throw new Error("The centroid static draft supports Article prose only");
    return `<section id="${block.id}">${markdownHtml(block.markdown)}${attachments[block.id]}</section>`;
  }).join("\n");
  return { html: `<article data-centroid-reading>${html}</article>`, excerpts };
}
