import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { kpArticleSourceAuthoringSchema } from
  "../src/article/kp-article-source-authoring.ts";
import {
  createKpEconomicsDemandShiftArticleAuthoringDescriptor,
  kpEconomicsDemandShiftArticleDraftStorageKey,
  resolveKpEconomicsDemandShiftArticleRevealText
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-article-authoring-descriptor.ts";

test("economics authoring is one framework-neutral whole-file descriptor", () => {
  const persistedText = "---\narticle: kp.article.v1\n---\n\n### Example\n";
  const descriptor = createKpEconomicsDemandShiftArticleAuthoringDescriptor(
    persistedText
  );

  assert.equal(descriptor.schemaVersion, kpArticleSourceAuthoringSchema);
  assert.equal(
    descriptor.sourceId,
    "content/lessons/economics-demand-shift.kp.md"
  );
  assert.equal(descriptor.sourceFilename, "economics-demand-shift.kp.md");
  assert.equal(descriptor.persistedText, persistedText);
  assert.equal(descriptor.storageKey, kpEconomicsDemandShiftArticleDraftStorageKey);
  assert.equal(descriptor.defaultRevealText, "#context");
  assert.ok(descriptor.semantic.some(({ address }) =>
    address === "market/shift-demand"
  ));
  assert.equal(Object.isFrozen(descriptor), true);
  assert.equal(Object.isFrozen(descriptor.semantic), true);
});

test("economics authoring reveals the active semantic passage", () => {
  assert.equal(
    resolveKpEconomicsDemandShiftArticleRevealText("follow-shift"),
    "#follow-shift"
  );
  assert.equal(
    resolveKpEconomicsDemandShiftArticleRevealText(undefined),
    "#context"
  );
  assert.equal(
    resolveKpEconomicsDemandShiftArticleRevealText("not a passage"),
    "#context"
  );
});

test("the authoring descriptor owns no DOM or framework lifecycle", () => {
  const source = readFileSync(
    "src/article/kp-article-source-authoring.ts",
    "utf8"
  );
  assert.doesNotMatch(source, /(?:Document|HTMLElement|svelte|mount|dialog)/u);
});

test("economics adapts the descriptor to the shared whole-file editor", () => {
  const source = readFileSync(
    "src/tutorial/economics-demand-shift/economics-demand-shift-article-authoring.ts",
    "utf8"
  );
  assert.match(source, /mountKpArticleSourceEditor/u);
  assert.match(source, /compileKpEconomicsDemandShiftArticlePublication/u);
  assert.match(source, /saveKpEconomicsDemandShiftArticleSource/u);
  assert.doesNotMatch(source, /KpEconomicsPassageEditor|CodeMirror|KpArticleDraftSession/u);
});
