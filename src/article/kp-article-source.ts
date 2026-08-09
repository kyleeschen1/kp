export interface KpArticleSourcePosition {
  /** Zero-based UTF-16 offset, matching JavaScript strings and CodeMirror. */
  readonly offset: number;
  /** One-based line for human diagnostics. */
  readonly line: number;
  /** One-based UTF-16 column for human diagnostics. */
  readonly column: number;
}

export interface KpArticleSourceSpan {
  readonly sourceId: string;
  readonly start: KpArticleSourcePosition;
  readonly end: KpArticleSourcePosition;
}

export interface KpArticleSource {
  readonly sourceId: string;
  readonly text: string;
  readonly lineStarts: readonly number[];
}

export function createKpArticleSource(
  sourceId: string,
  text: string
): KpArticleSource {
  if (sourceId.trim().length === 0) {
    throw new Error("An article source needs a non-empty sourceId.");
  }

  const lineStarts = [0];
  for (let offset = 0; offset < text.length; offset += 1) {
    if (text.charCodeAt(offset) === 10) lineStarts.push(offset + 1);
  }

  return Object.freeze({
    sourceId,
    text,
    lineStarts: Object.freeze(lineStarts)
  });
}

export function kpArticleSourcePositionAt(
  source: KpArticleSource,
  offset: number
): KpArticleSourcePosition {
  assertOffset(source, offset);

  let low = 0;
  let high = source.lineStarts.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (source.lineStarts[middle]! <= offset) low = middle;
    else high = middle - 1;
  }

  const lineStart = source.lineStarts[low]!;
  return Object.freeze({
    offset,
    line: low + 1,
    column: offset - lineStart + 1
  });
}

export function kpArticleSourceOffsetAt(
  source: KpArticleSource,
  line: number,
  column: number
): number {
  if (!Number.isInteger(line) || line < 1 || line > source.lineStarts.length) {
    throw new RangeError(`Article source line ${line} is out of range.`);
  }
  if (!Number.isInteger(column) || column < 1) {
    throw new RangeError(`Article source column ${column} is out of range.`);
  }

  const lineIndex = line - 1;
  const lineStart = source.lineStarts[lineIndex]!;
  const nextLineStart = source.lineStarts[lineIndex + 1];
  // Newline code units belong to the preceding line so every raw offset has a
  // reversible diagnostic position, including CRLF input retained verbatim.
  const maximumColumn = nextLineStart === undefined
    ? source.text.length - lineStart + 1
    : nextLineStart - lineStart;
  if (column > maximumColumn) {
    throw new RangeError(
      `Article source column ${column} is out of range for line ${line}.`
    );
  }

  return lineStart + column - 1;
}

export function createKpArticleSourceSpan(
  source: KpArticleSource,
  startOffset: number,
  endOffset: number
): KpArticleSourceSpan {
  assertOffset(source, startOffset);
  assertOffset(source, endOffset);
  if (endOffset < startOffset) {
    throw new RangeError("An article source span cannot end before it starts.");
  }

  return Object.freeze({
    sourceId: source.sourceId,
    start: kpArticleSourcePositionAt(source, startOffset),
    end: kpArticleSourcePositionAt(source, endOffset)
  });
}

export function sliceKpArticleSource(
  source: KpArticleSource,
  span: KpArticleSourceSpan
): string {
  if (span.sourceId !== source.sourceId) {
    throw new Error(
      `Source span ${span.sourceId} cannot select text from ${source.sourceId}.`
    );
  }
  assertOffset(source, span.start.offset);
  assertOffset(source, span.end.offset);
  if (span.end.offset < span.start.offset) {
    throw new RangeError("An article source span cannot end before it starts.");
  }
  return source.text.slice(span.start.offset, span.end.offset);
}

function assertOffset(source: KpArticleSource, offset: number): void {
  if (!Number.isInteger(offset) || offset < 0 || offset > source.text.length) {
    throw new RangeError(`Article source offset ${offset} is out of range.`);
  }
}

