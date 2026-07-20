import assert from "node:assert/strict";
import test from "node:test";

import { parseKpMarkdownAst } from "../src/reader/compiler/markdown-ast-parser.ts";
import { kpMarkdownAstParserSelection } from "../src/reader/compiler/public-api.ts";

test("selected parser yields a source-positioned CommonMark AST", () => {
  const result = parseKpMarkdownAst({
    sourceId: "content/solve-x.md",
    markdown: "# Solve for x\n\nMake the same move on both sides.\n"
  });

  assert.equal(result.sourceId, "content/solve-x.md");
  assert.equal(result.root.type, "root");
  assert.equal(result.root.children[0]?.type, "heading");
  assert.deepEqual(result.root.children[0]?.position?.start, {
    line: 1,
    column: 1,
    offset: 0
  });
  assert.deepEqual(result.root.children[1]?.position?.end, {
    line: 3,
    column: 34,
    offset: 48
  });
});

test("parser selection explicitly rejects trusted HTML as a KP contract", () => {
  assert.deepEqual(kpMarkdownAstParserSelection, {
    engine: "mdast-util-from-markdown",
    syntax: "CommonMark",
    execution: "build-only",
    acceptsTrustedHtml: false
  });
});
