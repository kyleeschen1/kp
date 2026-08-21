import ts from "typescript";

export interface KpTypeScriptFrontendDiagnostic {
  readonly code: number;
  readonly category: "warning" | "error" | "suggestion" | "message";
  readonly message: string;
  readonly startOffset?: number | undefined;
  readonly length?: number | undefined;
}

export interface KpTypeScriptSyntaxRecord {
  readonly id: string;
  readonly syntaxKind: number;
  readonly kindName: string;
  readonly parentId?: string | undefined;
  readonly startOffset: number;
  readonly endOffset: number;
  readonly start: { readonly line: number; readonly column: number };
  readonly end: { readonly line: number; readonly column: number };
  readonly text: string;
  readonly facts?: Readonly<{
    declaredName?: string | undefined;
    parameterNames?: readonly string[] | undefined;
    calledName?: string | undefined;
    argumentTexts?: readonly string[] | undefined;
    referencedNames?: readonly string[] | undefined;
  }> | undefined;
}

export interface KpTypeScriptFrontendResult {
  readonly schemaVersion: "kp.typescript-frontend.v1";
  readonly status: "accepted" | "rejected";
  readonly language: "typescript";
  readonly path: string;
  readonly revisionId: string;
  readonly sourceText: string;
  readonly syntax: readonly KpTypeScriptSyntaxRecord[];
  readonly diagnostics: readonly KpTypeScriptFrontendDiagnostic[];
}

export interface CompileKpTypeScriptFrontendInput {
  readonly path: string;
  readonly revisionId: string;
  readonly sourceText: string;
}

const compilerOptions: ts.CompilerOptions = {
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  noEmit: true,
  skipLibCheck: true,
  strict: true,
  target: ts.ScriptTarget.ES2022,
  types: []
};

/**
 * The TypeScript package is a build-time evidence source only. This result is
 * deliberately plain data so product code can consume generated artifacts
 * without loading the compiler or retaining AST objects in durable state.
 */
export function compileKpTypeScriptFrontend(
  input: CompileKpTypeScriptFrontendInput
): KpTypeScriptFrontendResult {
  assertNonEmpty(input.path, "TypeScript source path");
  assertNonEmpty(input.revisionId, "TypeScript revision id");
  assertNonEmpty(input.sourceText, "TypeScript source text");

  const sourceFile = ts.createSourceFile(
    input.path,
    input.sourceText,
    compilerOptions.target ?? ts.ScriptTarget.ES2022,
    true,
    ts.ScriptKind.TS
  );
  const program = createSingleSourceProgram(sourceFile);
  const diagnostics = ts.getPreEmitDiagnostics(program)
    .filter((diagnostic) => diagnostic.file?.fileName === input.path)
    .map(serializeDiagnostic);
  const syntax: KpTypeScriptSyntaxRecord[] = [];

  collectSyntax(sourceFile, sourceFile, undefined, syntax);

  return {
    schemaVersion: "kp.typescript-frontend.v1",
    status: diagnostics.some(({ category }) => category === "error")
      ? "rejected"
      : "accepted",
    language: "typescript",
    path: input.path,
    revisionId: input.revisionId,
    sourceText: input.sourceText,
    syntax,
    diagnostics
  };
}

function createSingleSourceProgram(
  sourceFile: ts.SourceFile
): ts.Program {
  const host = ts.createCompilerHost(compilerOptions, true);
  const defaultGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreate) =>
    fileName === sourceFile.fileName
      ? sourceFile
      : defaultGetSourceFile(
          fileName,
          languageVersion,
          onError,
          shouldCreate
        );
  host.fileExists = (fileName) =>
    fileName === sourceFile.fileName || ts.sys.fileExists(fileName);
  host.readFile = (fileName) =>
    fileName === sourceFile.fileName
      ? sourceFile.text
      : ts.sys.readFile(fileName);

  return ts.createProgram({
    rootNames: [sourceFile.fileName],
    options: compilerOptions,
    host
  });
}

function collectSyntax(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  parentId: string | undefined,
  output: KpTypeScriptSyntaxRecord[]
): void {
  const startOffset = node.getStart(sourceFile);
  const endOffset = node.getEnd();
  const id = syntaxRecordId(node.kind, startOffset, endOffset);
  const start = sourceFile.getLineAndCharacterOfPosition(startOffset);
  const end = sourceFile.getLineAndCharacterOfPosition(endOffset);

  output.push({
    id,
    syntaxKind: node.kind,
    kindName: ts.SyntaxKind[node.kind] ?? `SyntaxKind.${node.kind}`,
    ...(parentId === undefined ? {} : { parentId }),
    startOffset,
    endOffset,
    start: { line: start.line + 1, column: start.character + 1 },
    end: { line: end.line + 1, column: end.character + 1 },
    text: inputSlice(sourceFile.text, startOffset, endOffset),
    ...syntaxFacts(node, sourceFile)
  });

  node.forEachChild((child) => collectSyntax(child, sourceFile, id, output));
}

function syntaxFacts(
  node: ts.Node,
  sourceFile: ts.SourceFile
): Pick<KpTypeScriptSyntaxRecord, "facts"> {
  if (ts.isFunctionDeclaration(node)) {
    return {
      facts: {
        ...(node.name === undefined ? {} : { declaredName: node.name.text }),
        parameterNames: node.parameters.flatMap(({ name }) =>
          ts.isIdentifier(name) ? [name.text] : []
        )
      }
    };
  }
  if (ts.isCallExpression(node)) {
    return {
      facts: {
        ...(ts.isIdentifier(node.expression)
          ? { calledName: node.expression.text }
          : {}),
        argumentTexts: node.arguments.map((argument) =>
          inputSlice(sourceFile.text, argument.getStart(sourceFile), argument.getEnd())
        )
      }
    };
  }
  if (ts.isBinaryExpression(node)) {
    const referencedNames: string[] = [];
    collectIdentifierNames(node, referencedNames);
    return { facts: { referencedNames: [...new Set(referencedNames)] } };
  }
  return {};
}

function collectIdentifierNames(node: ts.Node, output: string[]): void {
  if (ts.isIdentifier(node)) output.push(node.text);
  node.forEachChild((child) => collectIdentifierNames(child, output));
}

function syntaxRecordId(
  syntaxKind: number,
  startOffset: number,
  endOffset: number
): string {
  return `syntax.${syntaxKind}.${startOffset}.${endOffset}`;
}

function serializeDiagnostic(
  diagnostic: ts.Diagnostic
): KpTypeScriptFrontendDiagnostic {
  return {
    code: diagnostic.code,
    category: diagnosticCategory(diagnostic.category),
    message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
    ...(diagnostic.start === undefined ? {} : { startOffset: diagnostic.start }),
    ...(diagnostic.length === undefined ? {} : { length: diagnostic.length })
  };
}

function diagnosticCategory(
  category: ts.DiagnosticCategory
): KpTypeScriptFrontendDiagnostic["category"] {
  switch (category) {
    case ts.DiagnosticCategory.Warning:
      return "warning";
    case ts.DiagnosticCategory.Error:
      return "error";
    case ts.DiagnosticCategory.Suggestion:
      return "suggestion";
    case ts.DiagnosticCategory.Message:
      return "message";
  }
}

function inputSlice(source: string, start: number, end: number): string {
  return source.slice(start, end);
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
