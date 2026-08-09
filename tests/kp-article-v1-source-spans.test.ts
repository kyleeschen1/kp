import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpArticleSource,
  createKpArticleSourceSpan,
  kpArticleSourceOffsetAt,
  kpArticleSourcePositionAt,
  sliceKpArticleSource
} from "../src/article/kp-article-source.ts";

test("article source positions retain exact offsets across LF and CRLF", () => {
  const source = createKpArticleSource("lesson.md", "alpha\r\nbeta\n");

  assert.deepEqual(source.lineStarts, [0, 7, 12]);
  assert.deepEqual(kpArticleSourcePositionAt(source, 0), {
    offset: 0,
    line: 1,
    column: 1
  });
  assert.deepEqual(kpArticleSourcePositionAt(source, 7), {
    offset: 7,
    line: 2,
    column: 1
  });
  assert.deepEqual(kpArticleSourcePositionAt(source, source.text.length), {
    offset: 12,
    line: 3,
    column: 1
  });
});

test("line and column positions round-trip every raw source offset", () => {
  const source = createKpArticleSource("unicode.md", "A😀B\r\n$Q$\n");

  for (let offset = 0; offset <= source.text.length; offset += 1) {
    const position = kpArticleSourcePositionAt(source, offset);
    assert.equal(
      kpArticleSourceOffsetAt(source, position.line, position.column),
      offset
    );
  }

  assert.equal(kpArticleSourcePositionAt(source, 3).column, 4);
});

test("source spans select exact unnormalized text and allow empty EOF spans", () => {
  const source = createKpArticleSource(
    "article.md",
    ":::kp-motion{#move}\r\nBefore.\n::after\nAfter.\n:::\n"
  );
  const start = source.text.indexOf("Before.");
  const end = source.text.indexOf("\n:::");
  const span = createKpArticleSourceSpan(source, start, end);

  assert.equal(sliceKpArticleSource(source, span), "Before.\n::after\nAfter.");
  assert.equal(
    sliceKpArticleSource(
      source,
      createKpArticleSourceSpan(source, source.text.length, source.text.length)
    ),
    ""
  );
});

test("source positions and spans reject ambiguous ranges", () => {
  const source = createKpArticleSource("article.md", "one\ntwo");

  assert.throws(() => createKpArticleSource(" ", "text"), /non-empty sourceId/);
  assert.throws(() => kpArticleSourcePositionAt(source, -1), /offset -1/);
  assert.throws(() => kpArticleSourcePositionAt(source, 8), /offset 8/);
  assert.throws(() => kpArticleSourceOffsetAt(source, 0, 1), /line 0/);
  assert.throws(() => kpArticleSourceOffsetAt(source, 1, 5), /column 5/);
  assert.throws(() => createKpArticleSourceSpan(source, 4, 3), /end before/);

  const foreign = createKpArticleSource("other.md", "one\ntwo");
  assert.throws(
    () => sliceKpArticleSource(foreign, createKpArticleSourceSpan(source, 0, 3)),
    /cannot select text/
  );
});

