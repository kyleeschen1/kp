import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createKpArticleSource } from "../src/article/kp-article-source.ts";
import { validateKpArticle } from "../src/article/kp-article-validation.ts";

test("golden v1 article validates into four typed directives", () => {
  const validation = validateKpArticle(goldenSource());

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.diagnostics, []);
  assert.deepEqual(validation.directives.map(({ kind, id }) => ({ kind, id })), [
    { kind: "stage", id: "market" },
    { kind: "focus", id: "read-curves" },
    { kind: "passage", id: "predict-shift" },
    { kind: "motion", id: "raise-demand" }
  ]);
  const focus = validation.directives[1];
  assert.ok(focus?.kind === "focus");
  assert.deepEqual(focus.targets, ["market/demand", "market/supply"]);
});

test("frontmatter schema, IDs, and imports fail with stable diagnostics", () => {
  const invalid = article(
    "kp.article.v2",
    "Lesson.Not-Lowercase",
    "animation.economics.shift@latest",
    stage()
  );
  const validation = validateKpArticle(createKpArticleSource("invalid.md", invalid));

  assert.equal(validation.valid, false);
  assert.deepEqual(validation.diagnostics.map(({ code }) => code), [
    "schema-unsupported",
    "document-id-invalid",
    "import-reference-invalid"
  ]);
  assert.ok(validation.diagnostics.every(({ span }) => span.start.line === 1));
});

test("directive validation is closed, typed, and source located", () => {
  const invalid = article(
    "kp.article.v1",
    "lesson.economics.invalid",
    "vignette.economics.shift@1",
    [
      ":::kp-stage{#Market use=shift layout=sticky}",
      "Unexpected prose.",
      ":::",
      "",
      ":::kp-focus{#focus stage=market target=market/demand target=market/supply}",
      "Look.",
      ":::",
      "",
      ":::kp-motion{#move stage=market run=market/shift range=a..b}",
      "Move.",
      "::after",
      ":::",
      "",
      ":::kp-slide{#slide}",
      "No slide syntax.",
      ":::"
    ].join("\n")
  );
  const validation = validateKpArticle(createKpArticleSource("invalid.md", invalid));

  assert.equal(validation.valid, false);
  assert.deepEqual(validation.diagnostics.map(({ code }) => code), [
    "directive-id-invalid",
    "directive-attribute-unknown",
    "stage-body-forbidden",
    "directive-attribute-duplicate",
    "motion-transition-exclusive",
    "motion-after-empty",
    "directive-unknown"
  ]);
  assert.ok(validation.diagnostics.every(({ span }) => span.sourceId === "invalid.md"));
});

test("required attributes and bodies cannot disappear silently", () => {
  const invalid = article(
    "kp.article.v1",
    "lesson.economics.invalid",
    "vignette.economics.shift@1",
    [
      ":::kp-stage{#market}",
      ":::",
      "",
      ":::kp-passage{#empty}",
      ":::",
      "",
      ":::kp-focus{#look stage=market}",
      "Look.",
      ":::",
      "",
      ":::kp-motion{#move stage=market range=broken}",
      "Move.",
      ":::"
    ].join("\n")
  );
  const validation = validateKpArticle(createKpArticleSource("invalid.md", invalid));

  assert.deepEqual(validation.diagnostics.map(({ code }) => code), [
    "directive-attribute-required",
    "directive-body-required",
    "directive-attribute-required",
    "motion-range-invalid"
  ]);
});

test("raw HTML is rejected outside code fences but inert examples remain valid", () => {
  const markdown = [
    "```html",
    "<aside>Shown as code.</aside>",
    "```",
    "",
    "<aside>Executable authoring surface.</aside>",
    "",
    stage()
  ].join("\n");
  const validation = validateKpArticle(createKpArticleSource(
    "html.md",
    article("kp.article.v1", "lesson.economics.html", "vignette.economics.shift@1", markdown)
  ));

  assert.equal(validation.valid, false);
  assert.deepEqual(validation.diagnostics.map(({ code }) => code), ["raw-html-forbidden"]);
  assert.match(validation.diagnostics[0]?.message ?? "", /Markdown and typed KP directives/u);
});

test("frontmatter and scanner exceptions become diagnostics", () => {
  const malformedFrontmatter = validateKpArticle(
    createKpArticleSource("frontmatter.md", "# Missing frontmatter\n")
  );
  assert.deepEqual(malformedFrontmatter.diagnostics.map(({ code }) => code), [
    "frontmatter-opening"
  ]);

  const malformedDirective = validateKpArticle(createKpArticleSource(
    "directive.md",
    article(
      "kp.article.v1",
      "lesson.economics.directive",
      "vignette.economics.shift@1",
      ":::kp-stage{#market use=shift}\n"
    )
  ));
  assert.deepEqual(malformedDirective.diagnostics.map(({ code }) => code), [
    "directive-closing"
  ]);
});

function goldenSource() {
  return createKpArticleSource(
    "economics-demand-shift.md",
    readFileSync(
      new URL("./fixtures/kp-article-v1/economics-demand-shift.md", import.meta.url),
      "utf8"
    )
  );
}

function article(schema: string, id: string, imported: string, body: string): string {
  return [
    "---",
    "kp:",
    `  schema: ${schema}`,
    `  id: ${id}`,
    "  imports:",
    `    shift: ${imported}`,
    "---",
    "",
    body,
    ""
  ].join("\n");
}

function stage(): string {
  return ":::kp-stage{#market use=shift}\n:::\n";
}
