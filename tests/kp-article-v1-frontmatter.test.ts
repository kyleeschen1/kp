import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  KpArticleFrontmatterSyntaxError,
  parseKpArticleFrontmatter
} from "../src/article/kp-article-frontmatter.ts";
import {
  createKpArticleSource,
  sliceKpArticleSource
} from "../src/article/kp-article-source.ts";

test("minimal frontmatter parses the golden document and preserves its body", () => {
  const text = readFileSync(
    new URL("./fixtures/kp-article-v1/economics-demand-shift.md", import.meta.url),
    "utf8"
  );
  const source = createKpArticleSource("economics-demand-shift.md", text);
  const parsed = parseKpArticleFrontmatter(source);

  assert.equal(parsed.schema, "kp.article.v1");
  assert.equal(parsed.id, "lesson.economics.demand-shift");
  assert.deepEqual(parsed.imports, {
    demandShift: "vignette.economics.demand-shift@1"
  });
  assert.match(sliceKpArticleSource(source, parsed.span), /^---[\s\S]+---\n$/u);
  assert.match(sliceKpArticleSource(source, parsed.bodySpan), /^\n### When demand changes/u);
});

test("frontmatter accepts quoted scalars and retains CRLF source offsets", () => {
  const text = [
    "---",
    "kp:",
    "  imports:",
    "    market: 'vignette.economics.market@1'",
    '  id: "lesson.economics.market"',
    "  schema: kp.article.v1",
    "---",
    "Body."
  ].join("\r\n");
  const source = createKpArticleSource("quoted.md", text);
  const parsed = parseKpArticleFrontmatter(source);

  assert.equal(parsed.id, "lesson.economics.market");
  assert.equal(parsed.imports["market"], "vignette.economics.market@1");
  assert.equal(sliceKpArticleSource(source, parsed.bodySpan), "Body.");
  assert.equal(parsed.bodySpan.start.line, 8);
  assert.equal(parsed.bodySpan.start.column, 1);
});

test("frontmatter rejects document prose and complex YAML as metadata", () => {
  assertFrontmatterError(
    "---\nkp:\n  schema: kp.article.v1\n  id: lesson.x\n  imports:\n  title: Reader title\n---\n",
    "frontmatter-unknown-key",
    6
  );
  assertFrontmatterError(
    "---\nkp:\n  schema: kp.article.v1\n  id: lesson.x\n  imports: { x: vignette.x@1 }\n---\n",
    "frontmatter-imports-shape",
    5
  );
  assertFrontmatterError(
    "---\nkp:\n  schema: kp.article.v1\n  id: lesson.x # comment\n  imports:\n---\n",
    "frontmatter-complex-value",
    4
  );
});

test("frontmatter fails closed on missing, duplicate, and misindented authority", () => {
  assertFrontmatterError("# No frontmatter\n", "frontmatter-opening", 1);
  assertFrontmatterError("---\nkp:\n  schema: kp.article.v1\n", "frontmatter-closing", 4);
  assertFrontmatterError(
    "---\nkp:\n  schema: kp.article.v1\n  schema: kp.article.v1\n  id: lesson.x\n  imports:\n---\n",
    "frontmatter-duplicate-key",
    4
  );
  assertFrontmatterError(
    "---\nkp:\n  schema: kp.article.v1\n  id: lesson.x\n    imports:\n---\n",
    "frontmatter-indentation",
    5
  );
});

function assertFrontmatterError(text: string, code: string, line: number): void {
  assert.throws(
    () => parseKpArticleFrontmatter(createKpArticleSource("invalid.md", text)),
    (error: unknown) => {
      assert.ok(error instanceof KpArticleFrontmatterSyntaxError);
      assert.equal(error.code, code);
      assert.equal(error.span.start.line, line);
      return true;
    }
  );
}
