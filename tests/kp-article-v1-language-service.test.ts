import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createKpArticleLanguageService
} from "../src/article/kp-article-language-service.ts";
import { createKpArticleSource } from "../src/article/kp-article-source.ts";
import { resolveKpArticleSemanticReferences } from "../src/article/kp-article-semantic-references.ts";

const semantic = Object.freeze([
  { address: "market/axes", detail: "Graph axes" },
  { address: "market/demand", detail: "Demand curve" },
  { address: "market/supply", detail: "Supply curve" },
  { address: "market/shift-demand", detail: "Demand-shift transition" }
]);

test("language diagnostics retain source-located parser and semantic failures", () => {
  const text = goldenText().replace("stage=market target=", "stage=missing target=");
  const service = createKpArticleLanguageService({
    sourceId: "economics.md",
    text,
    semantic
  });

  assert.deepEqual(service.diagnostics.map(({ code }) => code), [
    "semantic-stage-unknown"
  ]);
  assert.equal(service.diagnostics[0]!.span.start.line, 18);
});

test("completion remains useful while directive syntax is incomplete", () => {
  const directiveText = `${goldenText()}\n:::kp-mo`;
  const directives = createKpArticleLanguageService({
    sourceId: "economics.md",
    text: directiveText,
    semantic
  }).complete(directiveText.length);
  assert.deepEqual(directives.map(({ label }) => label), ["kp-motion"]);

  const stageText = goldenText().replace("stage=market target=", "stage=mar target=");
  const stageOffset = stageText.indexOf("stage=mar") + "stage=mar".length;
  const stages = createKpArticleLanguageService({
    sourceId: "economics.md",
    text: stageText,
    semantic
  }).complete(stageOffset);
  assert.deepEqual(stages.map(({ label }) => label), ["market"]);

  const attributeOffset = goldenText().indexOf(" target=");
  const attributes = createKpArticleLanguageService({
    sourceId: "economics.md",
    text: goldenText(),
    semantic
  }).complete(attributeOffset + 1);
  assert.deepEqual(attributes.map(({ label }) => label), [
    "target",
    "context",
    "intent"
  ]);
});

test("semantic and import completion return editor-neutral text edits", () => {
  const linkText = goldenText().replace(
    "kp-ref:market/price-axis",
    "kp-ref:market/de"
  );
  const linkOffset = linkText.indexOf("kp-ref:market/de") + "kp-ref:market/de".length;
  const service = createKpArticleLanguageService({
    sourceId: "economics.md",
    text: linkText,
    semantic
  });
  const [demand] = service.complete(linkOffset);
  assert.equal(demand?.label, "market/demand");
  assert.equal(service.apply([demand!.edit]).includes("kp-ref:market/demand"), true);

  const useText = goldenText().replace("use=demandShift", "use=demand");
  const useOffset = useText.indexOf("use=demand") + "use=demand".length;
  const imports = createKpArticleLanguageService({
    sourceId: "economics.md",
    text: useText,
    semantic
  }).complete(useOffset);
  assert.deepEqual(imports.map(({ label }) => label), ["demandShift"]);
});

test("fold and hover summaries expose structure without rendering UI", () => {
  const service = languageService();
  const folds = service.folds();
  assert.equal(folds[0]!.kind, "frontmatter");
  assert.equal(folds[1]!.summary, "kp-stage #market");
  assert.equal(folds.length, 5);

  const demand = service.source.text.indexOf("market/demand") + "market/".length + 1;
  assert.deepEqual(service.hover(demand), {
    span: service.hover(demand)!.span,
    title: "market/demand",
    detail: "Semantic attention target; prose does not own timeline state."
  });
  const market = service.source.text.indexOf("#market") + 2;
  assert.equal(service.hover(market)?.title, "#market");
});

test("definition references and rename share exact source edits", () => {
  const service = languageService();
  const objectOffset = service.source.text.lastIndexOf("market/demand") +
    "market/".length + 1;
  const definition = service.definition(objectOffset);
  assert.equal(
    service.source.text.slice(
      definition!.span.start.offset,
      definition!.span.end.offset
    ),
    "#market"
  );
  assert.equal(service.references(objectOffset).length, 2);

  const stagePrefix = service.source.text.indexOf("market/demand") + 2;
  const edits = service.rename(stagePrefix, "market-model");
  assert.equal(edits.length, 9);
  const renamed = service.apply(edits);
  assert.equal(resolveKpArticleSemanticReferences(
    createKpArticleSource("renamed.md", renamed)
  ).valid, true);
  assert.match(renamed, /target="market-model\/demand market-model\/supply"/u);
});

test("narrow formatting changes one directive header and leaves prose byte exact", () => {
  const text = goldenText().replace(
    ":::kp-motion{#raise-demand stage=market run=market/shift-demand}",
    ":::kp-motion{run=market/shift-demand stage=market #raise-demand}"
  );
  const service = createKpArticleLanguageService({
    sourceId: "economics.md",
    text,
    semantic
  });
  const offset = text.indexOf("kp-motion") + 2;
  const edits = service.formatDirective(offset);
  assert.equal(edits.length, 1);
  const formatted = service.apply(edits);
  assert.match(formatted, /:::kp-motion\{#raise-demand stage=market run=market\/shift-demand\}/u);
  assert.equal(
    formatted.slice(formatted.indexOf("At the same price")),
    goldenText().slice(goldenText().indexOf("At the same price"))
  );
});

function languageService() {
  return createKpArticleLanguageService({
    sourceId: "economics.md",
    text: goldenText(),
    semantic
  });
}

function goldenText(): string {
  return readFileSync(
    new URL("./fixtures/kp-article-v1/economics-demand-shift.md", import.meta.url),
    "utf8"
  );
}
