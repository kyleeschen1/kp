import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  KpArticleDirectiveSyntaxError,
  scanKpArticleDirectives
} from "../src/article/kp-article-directives.ts";
import { parseKpArticleFrontmatter } from "../src/article/kp-article-frontmatter.ts";
import {
  createKpArticleSource,
  sliceKpArticleSource
} from "../src/article/kp-article-source.ts";

test("scanner finds the four golden directives with exact attributes", () => {
  const source = goldenSource();
  const frontmatter = parseKpArticleFrontmatter(source);
  const directives = scanKpArticleDirectives(source, frontmatter.bodySpan);

  assert.deepEqual(directives.map(({ recognizedKind }) => recognizedKind), [
    "kp-stage",
    "kp-focus",
    "kp-passage",
    "kp-motion"
  ]);
  assert.deepEqual(
    directives[1]?.attributes.map(({ kind, name, value }) => ({ kind, name, value })),
    [
      { kind: "id", name: undefined, value: "read-curves" },
      { kind: "property", name: "stage", value: "market" },
      { kind: "property", name: "target", value: "market/demand market/supply" },
      { kind: "property", name: "context", value: "market/axes" }
    ]
  );
});

test("motion before and after slots preserve exact searchable Markdown", () => {
  const source = goldenSource();
  const motion = scanKpArticleDirectives(
    source,
    parseKpArticleFrontmatter(source).bodySpan
  ).find(({ recognizedKind }) => recognizedKind === "kp-motion");
  assert.ok(motion?.afterSpan);

  assert.match(sliceKpArticleSource(source, motion.bodySpan), /^At the same price/u);
  assert.match(sliceKpArticleSource(source, motion.bodySpan), /as it moves\.\n\n$/u);
  assert.match(sliceKpArticleSource(source, motion.afterSpan), /^\nThe new intersection/u);
  assert.match(sliceKpArticleSource(source, motion.afterSpan), /did not\nshift\.\n$/u);
});

test("directive examples inside Markdown fences remain ordinary source", () => {
  const source = createKpArticleSource("fenced.md", [
    "```markdown",
    ":::kp-motion{#example stage=x run=x/y}",
    "::after",
    ":::",
    "```",
    "",
    ":::kp-stage{#real use=example}",
    "```text",
    ":::",
    "```",
    ":::"
  ].join("\n"));
  const directives = scanKpArticleDirectives(source);

  assert.equal(directives.length, 1);
  assert.equal(directives[0]?.recognizedKind, "kp-stage");
  assert.match(sliceKpArticleSource(source, directives[0]!.bodySpan), /```text\n:::\n```\n/u);
});

test("scanner preserves unknown names for typed validation", () => {
  const source = createKpArticleSource(
    "unknown.md",
    ":::kp-slide{#not-rc1 layout=deck}\nText.\n:::\n"
  );
  const [directive] = scanKpArticleDirectives(source);

  assert.equal(directive?.name, "kp-slide");
  assert.equal(directive?.recognizedKind, undefined);
  assert.equal(directive?.attributes[0]?.value, "not-rc1");
});

test("scanner rejects nesting, misplaced after slots, and broken headers", () => {
  assertDirectiveError(
    ":::kp-passage{#outer}\n:::kp-focus{#inner}\n:::\n:::\n",
    "directive-nesting",
    2
  );
  assertDirectiveError(
    ":::kp-passage{#copy}\n::after\n:::\n",
    "directive-after-owner",
    2
  );
  assertDirectiveError(
    ":::kp-motion{#move stage=x run=x/y}\n::after\n::after\n:::\n",
    "directive-after-duplicate",
    3
  );
  assertDirectiveError(
    ":::kp-stage #stage\n:::\n",
    "directive-attributes",
    1
  );
  assertDirectiveError(
    ":::kp-stage{#stage use}\n:::\n",
    "directive-attribute-syntax",
    1
  );
  assertDirectiveError(
    ":::kp-stage{#stage use=x}\n",
    "directive-closing",
    1
  );
});

function goldenSource() {
  return createKpArticleSource(
    "economics-demand-shift.md",
    readFileSync(
      new URL("./fixtures/kp-article-v1-rc1/economics-demand-shift.md", import.meta.url),
      "utf8"
    )
  );
}

function assertDirectiveError(text: string, code: string, line: number): void {
  assert.throws(
    () => scanKpArticleDirectives(createKpArticleSource("invalid.md", text)),
    (error: unknown) => {
      assert.ok(error instanceof KpArticleDirectiveSyntaxError);
      assert.equal(error.code, code);
      assert.equal(error.span.start.line, line);
      return true;
    }
  );
}

