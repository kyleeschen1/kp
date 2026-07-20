export interface KpReaderArtifactRef<
  TKind extends string = string,
  TId extends string = string,
  TVersion extends string = string
> {
  readonly kind: TKind;
  readonly id: TId;
  readonly version: TVersion;
}

export interface KpReaderSourceLocation {
  readonly sourceId: string;
  readonly start: KpReaderSourcePosition;
  readonly end: KpReaderSourcePosition;
}

export interface KpReaderSourcePosition {
  readonly line: number;
  readonly column: number;
  readonly offset: number;
}

export interface KpLessonDocumentArtifact<TBlock = unknown> {
  readonly kind: "lesson-document";
  readonly id: string;
  readonly version: string;
  readonly title: string;
  readonly blocks: readonly TBlock[];
  readonly source?: KpReaderArtifactRef<"lesson-source"> | undefined;
}

export interface KpCompiledLessonArtifact<THydration = unknown> {
  readonly kind: "compiled-lesson";
  readonly id: string;
  readonly version: string;
  readonly document: KpReaderArtifactRef<"lesson-document">;
  readonly html: string;
  readonly tocHtml: string;
  readonly hydration: THydration;
}

export function createKpReaderArtifactRef<
  const TKind extends string,
  const TId extends string,
  const TVersion extends string
>(input: {
  readonly kind: TKind;
  readonly id: TId;
  readonly version: TVersion;
}): KpReaderArtifactRef<TKind, TId, TVersion> {
  requireText(input.kind, "artifact kind");
  requireText(input.id, "artifact id");
  requireText(input.version, "artifact version");
  return { ...input };
}

export function createKpCompiledLessonArtifact<const THydration>(input: {
  readonly id: string;
  readonly version: string;
  readonly document: KpReaderArtifactRef<"lesson-document">;
  readonly html: string;
  readonly tocHtml: string;
  readonly hydration: THydration;
}): KpCompiledLessonArtifact<THydration> {
  requireText(input.id, "compiled lesson id");
  requireText(input.version, "compiled lesson version");
  return {
    kind: "compiled-lesson",
    id: input.id,
    version: input.version,
    document: { ...input.document },
    html: input.html,
    tocHtml: input.tocHtml,
    hydration: input.hydration
  };
}

function requireText(value: string, label: string): void {
  if (value.trim() === "") throw new Error(`${label} must not be empty.`);
}
