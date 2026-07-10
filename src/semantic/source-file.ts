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

interface CreateSourceFileObjectInput {
  readonly id: string;
  readonly label: string;
  readonly language: string;
  readonly sourceText: string;
  readonly path?: string | undefined;
  readonly revisionId?: string | undefined;
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

export function sourceFileLines(
  sourceFile: SourceFileObject
): readonly string[] {
  return sourceFileLinesFromText(sourceFile.sourceText);
}

function sourceFileLinesFromText(sourceText: string): readonly string[] {
  return sourceText.split(/\r\n|\n|\r/);
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
