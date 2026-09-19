import ts from "typescript";
import { createKpArticleSource } from "../src/article/kp-article-source.ts";
import { resolveKpArticleImports } from "../src/article/kp-article-import-lock.ts";
import { compileKpArticleDocument } from "../src/article/kp-article-document.ts";
import { compileKpArticleMarkdownFragmentHtml as markdownHtml } from "../src/article/kp-article-static-html.ts";
import { renderCentroidNativeCode } from "../src/rendering/centroid-native-code-html.ts";
import { tokenizeKpTypeScriptSource } from "../src/semantic/typescript-source-tokens.ts";
import generated from "../src/semantic/centroid-extraction.generated.json" with { type: "json" };
import { sha256 } from "../src/kernel/sha256.ts";
import { resolveKpTypeScriptRefactorOpticalEndpoint, serializeKpTypeScriptRefactorOpticalEndpoint } from "../src/rendering/typescript-refactor-optical-theme.ts";
import { centroidReading } from "../src/tutorial/code-reasoning/centroid-reading.ts";
import { centroidClaims } from "../src/tutorial/code-reasoning/centroid-attention.ts";

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
  const highlight = (source: string) => renderCentroidNativeCode({ source, tokens: tokenizeKpTypeScriptSource(source) });
  const code = (id: keyof typeof excerpts) => `<pre class="kp-typescript-refactor__revision" data-centroid-excerpt="${id}"><code>${highlight(excerpts[id])}</code></pre>`;
  const figure = (label: string, id: keyof typeof excerpts) => `<figure><figcaption>${label}</figcaption>${code(id)}</figure>`;
  const sourcePin = sha256(JSON.stringify([before, after]));
  const cueHtml = (reason: typeof centroidReading[number]) => {
    let html = markdownHtml(reason.cue);
    if (reason.id === "extracted") for (const claim of centroidClaims) {
      const phrase = markdownHtml(claim.phrase).trim().replace(/^<p>|<\/p>$/g, "");
      if (html.split(phrase).length !== 2) throw new Error(`Centroid claim phrase must occur exactly once: ${claim.id}`);
      html = html.replace(phrase, `<button type="button" class="centroid-claim" data-centroid-claim="${claim.id}" aria-pressed="false" disabled>${phrase}</button>`);
    }
    return html;
  };
  const narrative = `<ol class="centroid-narrative" aria-label="Reasons for extracting the helper">${centroidReading.map(reason =>
    `<li id="centroid-${reason.id}" data-centroid-reason="${reason.id}"><h3>${reason.title}</h3>${cueHtml(reason)}
      <details data-centroid-depth><summary>${reason.question}</summary>${markdownHtml(reason.detail)}</details>
      <div class="code-controls"><button type="button" data-centroid-select="${reason.id}" hidden>Inspect this state</button></div></li>`).join("")}</ol>`;
  const inspection = `<div class="centroid-extraction" data-centroid-local-inspection data-centroid-source-pin="${sourcePin}">
    ${narrative}<figure data-centroid-evidence>
    <figcaption>The shared procedure <button type="button" data-centroid-open hidden>Trace the first loop</button></figcaption>
    <div data-centroid-static-helper>${code("helper")}</div>
    <div data-centroid-stage hidden class="kp-typescript-refactor centroid-stage" style="${serializeKpTypeScriptRefactorOpticalEndpoint(resolveKpTypeScriptRefactorOpticalEndpoint("light"))}">
      <pre class="kp-typescript-refactor__revision" data-centroid-native></pre>
      <div class="kp-typescript-refactor__token-theater" data-kp-typescript-token-theater aria-hidden="true"></div>
    </div>
    <div data-centroid-controls hidden>
      <p class="centroid-inspection-label">Local refactor inspection · not program execution</p>
      <div class="code-controls"><button type="button" data-centroid-previous>Previous</button><button type="button" data-centroid-next>Next</button><output data-centroid-position>1 / 3</output><button type="button" data-centroid-close>Return to reading</button>
      <input type="range" min="0" max="1" step="0.001" value="0" aria-label="Inspect first-loop extraction" data-centroid-seek></div>
    </div><p data-centroid-attention-description role="status" class="centroid-attention-description" hidden></p><p data-centroid-error role="status" hidden></p>
  </figure></div>`;
  // Stale semantic evidence must never animate newly edited source. The
  // static draft may still publish so authors can inspect and repair it.
  const helperFigure = sourcePin === generated.sourcePin ? inspection : `${figure("The shared procedure", "helper")}<p>Inspection unavailable: source evidence needs regeneration.</p>`;
  const attachments: Record<string, string> = {
    pattern: `<div class="centroid-pair">${figure("Horizontal coordinates · xs → cx", "x")}${figure("Vertical coordinates · ys → cy", "y")}</div>`,
    extract: helperFigure,
    reuse: `${figure("The centroid body after extraction", "calls")}<details><summary>See both complete source files</summary><h3>Before</h3><pre class="kp-typescript-refactor__revision" data-centroid-source="before"><code>${highlight(before)}</code></pre><h3>After</h3><pre class="kp-typescript-refactor__revision" data-centroid-source="after"><code>${highlight(after)}</code></pre></details>`,
    check: `<details><summary>Check your reasoning</summary><p><code>const cz = mean(zs);</code> reuses the same procedure. It gets a fresh local sum, just like the other calls.</p></details>`
  };
  const html = article.document.blocks.map(block => {
    if (block.kind === "markdown") return markdownHtml(block.markdown);
    if (block.kind !== "passage") throw new Error("The centroid static draft supports Article prose only");
    return `<section id="${block.id}">${markdownHtml(block.markdown)}${attachments[block.id]}</section>`;
  }).join("\n");
  return { html: `<article data-centroid-reading class="kp-typescript-source" style="${serializeKpTypeScriptRefactorOpticalEndpoint(resolveKpTypeScriptRefactorOpticalEndpoint("light"))}">${html}</article>`, excerpts };
}
