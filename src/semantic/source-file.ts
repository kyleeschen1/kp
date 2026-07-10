export interface SourceFileObject {
  readonly id: string;
  readonly type: "source-file";
  readonly label: string;
  readonly language: string;
  readonly sourceText: string;
  readonly lineCount: number;
  readonly path?: string | undefined;
  readonly revisionId?: string | undefined;
}

export interface SourcePosition {
  readonly line: number;
  readonly column: number;
}

export interface SourceRangeSelector {
  readonly id: string;
  readonly kind: "source-range";
  readonly sourceFileId: string;
  readonly start: SourcePosition;
  readonly end: SourcePosition;
  readonly summary?: string | undefined;
}

export interface ResolvedSourceRangeSelector {
  readonly selector: SourceRangeSelector;
  readonly text: string;
  readonly startOffset: number;
  readonly endOffset: number;
}

interface CreateSourceFileObjectInput {
  readonly id: string;
  readonly label: string;
  readonly language: string;
  readonly sourceText: string;
  readonly path?: string | undefined;
  readonly revisionId?: string | undefined;
}

interface CreateSourceRangeSelectorInput {
  readonly id: string;
  readonly sourceFileId: string;
  readonly start: SourcePosition;
  readonly end: SourcePosition;
  readonly summary?: string | undefined;
}

export function createSourceFileObject(
  input: CreateSourceFileObjectInput
): SourceFileObject {
  assertNonEmpty(input.id, "SourceFile id");
  assertNonEmpty(input.label, `SourceFile ${input.id} label`);
  assertNonEmpty(input.language, `SourceFile ${input.id} language`);
  assertNonEmpty(input.sourceText, `SourceFile ${input.id} source text`);

  return {
    id: input.id,
    type: "source-file",
    label: input.label,
    language: input.language,
    ...(input.path === undefined ? {} : { path: input.path }),
    ...(input.revisionId === undefined ? {} : { revisionId: input.revisionId }),
    sourceText: input.sourceText,
    lineCount: sourceFileLinesFromText(input.sourceText).length
  };
}

export function createSourceRangeSelector(
  input: CreateSourceRangeSelectorInput
): SourceRangeSelector {
  assertNonEmpty(input.id, "Source range selector id");
  assertNonEmpty(
    input.sourceFileId,
    `Source range selector ${input.id} sourceFileId`
  );
  validateSourcePosition(input.start, `Source range selector ${input.id} start`);
  validateSourcePosition(input.end, `Source range selector ${input.id} end`);

  if (compareSourcePositions(input.start, input.end) >= 0) {
    throw new Error(
      `Source range selector ${input.id} end must be after start.`
    );
  }

  return {
    id: input.id,
    kind: "source-range",
    sourceFileId: input.sourceFileId,
    start: { ...input.start },
    end: { ...input.end },
    ...(input.summary === undefined ? {} : { summary: input.summary })
  };
}

export function sourceFileLines(
  sourceFile: SourceFileObject
): readonly string[] {
  return sourceFileLinesFromText(sourceFile.sourceText);
}

export function resolveSourceRangeSelector(
  sourceFile: SourceFileObject,
  selector: SourceRangeSelector
): ResolvedSourceRangeSelector {
  if (selector.sourceFileId !== sourceFile.id) {
    throw new Error(
      `Source range selector ${selector.id} targets ${selector.sourceFileId} but was resolved against ${sourceFile.id}.`
    );
  }

  const startOffset = sourcePositionToOffset(sourceFile, selector.start);
  const endOffset = sourcePositionToOffset(sourceFile, selector.end);

  if (startOffset >= endOffset) {
    throw new Error(
      `Source range selector ${selector.id} resolves to an empty range.`
    );
  }

  return {
    selector,
    text: sourceFile.sourceText.slice(startOffset, endOffset),
    startOffset,
    endOffset
  };
}

function sourceFileLinesFromText(sourceText: string): readonly string[] {
  return sourceText.split(/\r\n|\n|\r/);
}

function sourcePositionToOffset(
  sourceFile: SourceFileObject,
  position: SourcePosition
): number {
  const lines = sourceFileLines(sourceFile);
  const line = lines[position.line - 1];

  if (line === undefined || position.column > line.length + 1) {
    throw new Error(
      `SourceFile ${sourceFile.id} does not contain line ${position.line} column ${position.column}.`
    );
  }

  return sourceLineStartOffsets(sourceFile.sourceText)[position.line - 1]! +
    position.column -
    1;
}

function sourceLineStartOffsets(sourceText: string): readonly number[] {
  const offsets = [0];
  const newlinePattern = /\r\n|\n|\r/g;
  let match: RegExpExecArray | null;

  while ((match = newlinePattern.exec(sourceText)) !== null) {
    offsets.push(match.index + match[0].length);
  }

  return offsets;
}

function compareSourcePositions(
  left: SourcePosition,
  right: SourcePosition
): number {
  return left.line === right.line
    ? left.column - right.column
    : left.line - right.line;
}

function validateSourcePosition(position: SourcePosition, label: string): void {
  if (!Number.isInteger(position.line) || position.line < 1) {
    throw new Error(`${label} line must be a positive integer.`);
  }

  if (!Number.isInteger(position.column) || position.column < 1) {
    throw new Error(`${label} column must be a positive integer.`);
  }
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
