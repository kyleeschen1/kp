import assert from "node:assert/strict";
import test from "node:test";

import { createKpTypeScriptFreeShippingAnimationAsset } from
  "../src/semantic/typescript-free-shipping-animation-asset.ts";
import {
  renderKpTypeScriptRefactorCodeHtml,
  renderKpTypeScriptRevisionCodeHtml
} from "../src/rendering/typescript-refactor-code-html.ts";

const exemplar = createKpTypeScriptFreeShippingAnimationAsset();

test("native code renderer preserves exact selectable source text", () => {
  for (const revision of exemplar.semantics.revisions) {
    const html = renderKpTypeScriptRevisionCodeHtml(revision);
    assert.equal(decodeHtml(stripTags(html)), revision.sourceText);
    for (const entity of revision.entities) {
      assert.equal(count(html, `data-kp-semantic-entity-id=\"${entity.id}\"`), 1);
    }
  }
});

test("renderer exposes one native owner per revision and no painted clone", () => {
  const html = renderKpTypeScriptRefactorCodeHtml({
    semantics: exemplar.semantics,
    stageId: "stage.compare-duplicates",
    narration: "These two expressions are one rule written in two places.",
    activeProjectionId: "projection.typescript.before",
    focusSelectorIds: [
      "selector.typescript.rule.shipping-cost.before",
      "selector.typescript.rule.shipping-message.before"
    ],
    accessibleDescription: exemplar.accessibility.description
  });

  assert.equal(count(html, "data-kp-typescript-source-owner"), 1);
  assert.equal(count(html, "data-kp-typescript-projection-id="), 4);
  assert.equal(count(html, "data-kp-typescript-projection-current=\"true\""), 1);
  // Focus is projected into inert neighboring source states so direct seek
  // never needs to rebuild markup.
  assert.equal(count(html, "data-kp-typescript-focus=\"true\""), 5);
  assert.doesNotMatch(html, /canvas|svg|painted-clone|aria-label="Source code copy"/);
  assert.match(html, /data-kp-typescript-projection-current="false"[^>]+aria-hidden="true" inert/);
});

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, "");
}

function decodeHtml(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#039;", "'")
    .replaceAll("&amp;", "&");
}

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}
