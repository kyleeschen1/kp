import { fromMarkdown } from "mdast-util-from-markdown";
import type { Root } from "mdast";

export interface KpMarkdownAstParseInput {
  readonly sourceId: string;
  readonly markdown: string;
}

export interface KpMarkdownAstParseResult {
  readonly sourceId: string;
  readonly root: Root;
}

export const kpMarkdownAstParserSelection = {
  engine: "mdast-util-from-markdown",
  syntax: "CommonMark",
  execution: "build-only",
  acceptsTrustedHtml: false
} as const;

/**
 * This adapter is intentionally private to the compiler layer. Downstream
 * reader contracts receive KP's LessonDocument IR, never vendor AST nodes.
 */
export function parseKpMarkdownAst(
  input: KpMarkdownAstParseInput
): KpMarkdownAstParseResult {
  return {
    sourceId: input.sourceId,
    root: fromMarkdown(input.markdown)
  };
}
