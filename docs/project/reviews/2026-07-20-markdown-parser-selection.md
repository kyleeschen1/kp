# Semantic reader Markdown parser selection

Status: accepted for the isolated x-plus-3 exemplar.

## Decision

Use `mdast-util-from-markdown` behind `src/reader/compiler/markdown-ast-parser.ts` as a build-only CommonMark parser. Keep its AST private to the compiler. All reader-facing code consumes KP's `LessonDocument`, compiled HTML, and hydration contracts instead.

The selected package is ESM-only, ships TypeScript declarations, preserves source positions, and is built on the CommonMark-focused micromark tokenizer. KP does not adopt the broader unified processor/plugin abstraction for this exemplar.

Primary references:

- <https://github.com/syntax-tree/mdast-util-from-markdown>
- <https://github.com/syntax-tree/mdast>
- <https://github.com/micromark/micromark>

## Why this boundary

- Exact line, column, and offset positions support author diagnostics and stable links back to source.
- A syntax tree lets KP compile only an explicit vocabulary instead of accepting arbitrary trusted HTML.
- The narrow adapter is replaceable: no document, runtime, renderer, or app type mentions mdast.
- `devDependencies`, the semantic-reader import gate, and a production-asset scan independently guard the build-only boundary.

## Deliberate omissions

This decision does not select GFM, MDX, directives, frontmatter, math syntax, or a plugin system. The next slice may recognize only the minimum x-plus-3 source vocabulary. Adding syntax extensions remains a separate product and security decision.
