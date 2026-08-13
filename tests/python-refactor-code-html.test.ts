import assert from "node:assert/strict";
import test from "node:test";

import { createKpPythonFreeShippingAnimationAsset } from
  "../src/semantic/python-free-shipping-animation-asset.ts";
import {
  renderKpPythonRefactorCodeHtml,
  renderKpPythonRevisionCodeHtml
} from "../src/rendering/python-refactor-code-html.ts";

const exemplar = createKpPythonFreeShippingAnimationAsset();

test("Python native renderer preserves exact selectable source text", () => {
  for (const revision of exemplar.semantics.revisions) {
    const html = renderKpPythonRevisionCodeHtml(revision);
    assert.equal(decodeHtml(stripTags(html)), revision.sourceText);
    for (const entity of revision.entities) {
      assert.equal(count(html, `data-kp-semantic-entity-id=\"${entity.id}\"`), 1);
    }
  }
});

test("Python renderer emits generated syntax roles without changing source", () => {
  const html = renderKpPythonRevisionCodeHtml(exemplar.semantics.revisions[1]!);

  assert.match(html, /data-kp-python-syntax-kind="keyword">def<\/span>/);
  assert.match(html, /data-kp-python-syntax-kind="function">qualifies_for_free_shipping<\/span>/);
  assert.match(html, /data-kp-python-syntax-kind="type">int<\/span>/);
  assert.match(html, /data-kp-python-syntax-kind="number">50<\/span>/);
  // Quotes are safe and source-faithful in a text node; only attributes use
  // the stricter quote encoding contract.
  assert.match(html, /data-kp-python-syntax-kind="string">"Free shipping"<\/span>/);
  assert.match(html, /data-kp-python-syntax-kind="operator">&gt;=<\/span>/);
  assert.equal(decodeHtml(stripTags(html)), exemplar.semantics.revisions[1]!.sourceText);
});

test("Python renderer emits one accessible native projection owner", () => {
  const html = renderKpPythonRefactorCodeHtml({
    semantics: exemplar.semantics,
    stageId: "stage.compare-duplicates",
    narration: "These two expressions are one rule written in two places.",
    activeProjectionId: "projection.python.before",
    focusSelectorIds: [
      "selector.python.rule.shipping-cost.before",
      "selector.python.rule.shipping-message.before"
    ],
    accessibleDescription: exemplar.accessibility.description
  });

  assert.equal(count(html, "data-kp-python-source-owner"), 1);
  assert.equal(count(html, "data-kp-python-projection-id="), 4);
  assert.equal(count(html, "data-kp-python-projection-current=\"true\""), 1);
  assert.doesNotMatch(html, /canvas|svg|painted-clone|aria-label="Source code copy"/);
  assert.match(html, /data-kp-python-projection-current="false"[^>]+aria-hidden="true" inert/);
});

test("Python renderer uses the context-specific shared HTML encoders", async () => {
  const source = await import("node:fs/promises").then(({ readFile }) =>
    readFile("src/rendering/python-refactor-code-html.ts", "utf8")
  );

  assert.match(source, /encodeKpEditorHtmlText/);
  assert.match(source, /encodeKpEditorHtmlAttribute/);
  assert.doesNotMatch(source, /function escapeHtml/);
});

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, "");
}

function decodeHtml(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&amp;", "&");
}

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}
