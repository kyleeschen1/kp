import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";
import { encodeKpHtmlText } from "../src/rendering/html-output-encoding.ts";
import { codeReasoningArticlePath, compileCodeReasoningPublication } from "../src/tutorial/code-reasoning/publication.ts";
import { kpTypeScriptFreeShippingRefactorContract as contract } from "../src/semantic/typescript-free-shipping-refactor-contract.ts";
import { createKpTypeScriptFreeShippingRuntimeProjection } from "../src/public-web/typescript-free-shipping-runtime.ts";
import { sha256 } from "../src/kernel/sha256.ts";

const markdown = readFileSync(codeReasoningArticlePath, "utf8");
test("code record publishes exact language-owned states once, with inert canonical inspection", () => {
  const publication = compileCodeReasoningPublication(markdown);
  const html = publication.html;
  assert.equal([...html.matchAll(/data-code-record=/g)].length, 2);
  for (const revision of ["before", "after"] as const) {
    assert.ok(html.includes(`data-code-record="${revision}"><code>${encodeKpHtmlText(contract[revision].source)}</code>`));
  }
  assert.match(html, /<template data-code-stage-template><section[^>]+data-kp-typescript-refactor-stage=/);
  assert.match(html, /not.*proof for all inputs/s);
  assert.equal([...html.matchAll(/<tr><td>/g)].length, 3);
  assert.equal(publication.pin, sha256(JSON.stringify(createKpTypeScriptFreeShippingRuntimeProjection().semantics)));
});
test("code publication rejects missing or reordered states instead of improvising a motion", () => {
  assert.throws(() => compileCodeReasoningPublication(markdown.replace("#before}", "#unknown}")), /ordered before/);
  assert.throws(() => compileCodeReasoningPublication(markdown.replace("#after}", "#before}")));
});
test("editorial edits preserve the exact code authority", () => {
  const first = compileCodeReasoningPublication(markdown);
  const edited = compileCodeReasoningPublication(markdown.replace("One decision, two callers", "A shared decision"));
  assert.equal(edited.pin, first.pin);
  assert.match(edited.html, /A shared decision/);
});
