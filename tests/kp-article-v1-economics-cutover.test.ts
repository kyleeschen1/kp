import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { KpArticleImportLock } from
  "../src/article/kp-article-import-lock.ts";
import { compileKpArticleStaticHtml } from
  "../src/article/kp-article-static-html.ts";
import {
  compileKpEconomicsDemandShiftArticle,
  kpEconomicsDemandShiftArticleSourceId
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-article-compiler.ts";
import {
  compileKpEconomicsDemandShiftArticlePublication
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-publication.ts";

const articleText = readFileSync(kpEconomicsDemandShiftArticleSourceId, "utf8");
const importLock = JSON.parse(readFileSync(
  "content/lessons/economics-demand-shift.kp.lock.json",
  "utf8"
)) as KpArticleImportLock;

test("canonical economics v1 source derives stable lesson and presenter passages", () => {
  const compiled = compileKpEconomicsDemandShiftArticle({
    text: articleText,
    lock: importLock
  });

  assert.equal(compiled.article.document.sourceId, kpEconomicsDemandShiftArticleSourceId);
  assert.equal(compiled.article.document.importLock.entries[0]!.version, "1.2.0");
  assert.deepEqual(compiled.lesson.sections.map(({ id }) => id), [
    "equilibrium",
    "demand-increase",
    "market-clearing",
    "model-scope"
  ]);
  assert.deepEqual(
    compiled.lesson.sections.flatMap(({ passages }) => passages.map(({ id }) => id)),
    [
      "context",
      "initial-equilibrium",
      "demand-change",
      "prediction",
      "follow-shift",
      "new-equilibrium",
      "shift-versus-movement",
      "equation-check",
      "scope",
      "synthesis",
      "explore"
    ]
  );
  assert.deepEqual(compiled.twoColumnParagraphs.map(({ id }) => id), [
    "graph-at-rest",
    "initial-equilibrium",
    "follow-shift",
    "new-equilibrium",
    "shift-versus-movement",
    "movement-along-supply"
  ]);
  assert.match(
    compiled.twoColumnParagraphs[0]!.paragraphs[0]!.html,
    /data-kp-tutorial-text-reference="price-axis-inline"/u
  );
});

test("document references, TOC, deck, and static output share the v1 IR", () => {
  const compiled = compileKpEconomicsDemandShiftArticle({
    text: articleText,
    lock: importLock
  });
  const staticHtml = compileKpArticleStaticHtml(compiled.article.document);
  const publication = compileKpEconomicsDemandShiftArticlePublication({
    articleText,
    importLock
  });

  assert.deepEqual([...compiled.article.document.references.map(({ address }) => address)].sort(), [
    "market/equilibrium",
    "market/axes",
    "market/demand",
    "market/supply",
    "market/demand",
    "market/supply",
    "market/axes",
    "market/shift-demand",
    "market/trace-supply-movement",
    "market/price-axis"
  ].sort());
  assert.deepEqual(
    compiled.deck.scenes.filter(({ kind }) => kind === "motion").map(({ id }) => id),
    ["follow-shift", "shift-versus-movement"]
  );
  assert.match(staticHtml.tocHtml, /Check and generalize/u);
  assert.match(staticHtml.articleHtml, /Supply did not shift/u);
  assert.equal(staticHtml.math.clientRuntimeRequired, false);
  assert.match(publication.tocHtml, /kp-section-market-clearing/u);
  assert.equal(publication.twoColumnParagraphs.length, 6);
  assert.equal(
    publication.semanticTransit.textReferences[0]!.id,
    "price-axis-inline"
  );
});

test("canonical source stays under the accepted authoring-noise limit", () => {
  const meaningful = articleText.split("\n").filter((line) => line.trim() !== "");
  let inFrontmatter = false;
  let frontmatterClosed = false;
  const metadata = meaningful.filter((line) => {
    if (line === "---" && !frontmatterClosed) {
      inFrontmatter = !inFrontmatter;
      if (!inFrontmatter) frontmatterClosed = true;
      return true;
    }
    return inFrontmatter || line.startsWith(":::kp-") || line === ":::" ||
      line === "::after";
  });
  assert.ok(metadata.length / meaningful.length <= 0.25);
});

test("the build and dev write stack have one v1 source authority", () => {
  const buildSource = readFileSync(
    "scripts/compile-economics-demand-shift-publication.ts",
    "utf8"
  );
  const serverSource = readFileSync("server/main.ts", "utf8");

  assert.match(buildSource, /economics-demand-shift\.kp\.md/u);
  assert.match(buildSource, /economics-demand-shift\.kp\.lock\.json/u);
  assert.doesNotMatch(buildSource, /economics-demand-shift\.md["']/u);
  assert.doesNotMatch(buildSource, /economics-demand-shift-two-column\.json/u);
  assert.match(serverSource, /createKpArticleSourceRoutesFromEnvironment/u);
  assert.doesNotMatch(serverSource, /economics-lesson-source-config/u);
});
