import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";

import ts from "typescript";

export type KpTypescriptImportKind = "runtime" | "type-only";

export type KpTypescriptImportSyntax =
  | "import"
  | "export"
  | "dynamic-import"
  | "import-type"
  | "import-equals"
  | "require";

export interface KpTypescriptImportReference {
  readonly importer: string;
  readonly specifier: string;
  readonly kind: KpTypescriptImportKind;
  readonly syntax: KpTypescriptImportSyntax;
  readonly line: number;
  readonly column: number;
}

export interface KpTypescriptImportEdge extends KpTypescriptImportReference {
  readonly target: string;
}

export interface KpTypescriptImportGraph {
  readonly sourcePaths: readonly string[];
  readonly references: readonly KpTypescriptImportReference[];
  readonly localEdges: readonly KpTypescriptImportEdge[];
  readonly unresolvedLocalReferences: readonly KpTypescriptImportReference[];
}

export function extractKpTypescriptImportReferences(
  importer: string,
  source: string
): readonly KpTypescriptImportReference[] {
  const sourceFile = ts.createSourceFile(
    importer,
    source,
    ts.ScriptTarget.Latest,
    false,
    scriptKindFor(importer)
  );
  const references: KpTypescriptImportReference[] = [];

  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteralLike(statement.moduleSpecifier)
    ) {
      references.push(
        referenceFromNode(
          sourceFile,
          importer,
          statement.moduleSpecifier.text,
          isTypeOnlyImport(statement) ? "type-only" : "runtime",
          "import",
          statement.moduleSpecifier
        )
      );
      continue;
    }
    if (
      ts.isExportDeclaration(statement) &&
      statement.moduleSpecifier !== undefined &&
      ts.isStringLiteralLike(statement.moduleSpecifier)
    ) {
      references.push(
        referenceFromNode(
          sourceFile,
          importer,
          statement.moduleSpecifier.text,
          isTypeOnlyExport(statement) ? "type-only" : "runtime",
          "export",
          statement.moduleSpecifier
        )
      );
      continue;
    }
    if (
      ts.isImportEqualsDeclaration(statement) &&
      ts.isExternalModuleReference(statement.moduleReference) &&
      statement.moduleReference.expression !== undefined &&
      ts.isStringLiteralLike(statement.moduleReference.expression)
    ) {
      references.push(
        referenceFromNode(
          sourceFile,
          importer,
          statement.moduleReference.expression.text,
          statement.isTypeOnly ? "type-only" : "runtime",
          "import-equals",
          statement.moduleReference.expression
        )
      );
    }
  }

  visitNestedReferences(sourceFile, sourceFile, importer, references);
  return Object.freeze(references);
}

export function collectKpTypescriptImportGraph(
  repositoryRoot: string,
  sourceDirectory = "src"
): KpTypescriptImportGraph {
  const absoluteRepositoryRoot = resolve(repositoryRoot);
  const absoluteSourceRoot = resolve(absoluteRepositoryRoot, sourceDirectory);
  const sourcePaths = collectKpTypescriptSourcePaths(absoluteSourceRoot).map(
    (path) => repositoryRelative(absoluteRepositoryRoot, path)
  );
  const references = sourcePaths.flatMap((importer) =>
    extractKpTypescriptImportReferences(
      importer,
      readFileSync(resolve(absoluteRepositoryRoot, importer), "utf8")
    )
  );
  const localEdges: KpTypescriptImportEdge[] = [];
  const unresolvedLocalReferences: KpTypescriptImportReference[] = [];

  for (const reference of references) {
    if (!reference.specifier.startsWith(".")) continue;
    const target = resolveKpTypescriptImportTarget(
      absoluteRepositoryRoot,
      reference.importer,
      reference.specifier
    );
    if (target === undefined) {
      unresolvedLocalReferences.push(reference);
    } else {
      localEdges.push(Object.freeze({ ...reference, target }));
    }
  }

  return Object.freeze({
    sourcePaths: Object.freeze(sourcePaths),
    references: Object.freeze(references),
    localEdges: Object.freeze(localEdges),
    unresolvedLocalReferences: Object.freeze(unresolvedLocalReferences)
  });
}

export function collectKpTypescriptSourcePaths(
  sourceRoot: string
): readonly string[] {
  return Object.freeze(
    readdirSync(sourceRoot, { withFileTypes: true })
      .flatMap((entry) => {
        const path = join(sourceRoot, entry.name);
        if (entry.isDirectory()) return collectKpTypescriptSourcePaths(path);
        return isTypescriptSourcePath(path) ? [resolve(path)] : [];
      })
      .sort()
  );
}

export function resolveKpTypescriptImportTarget(
  repositoryRoot: string,
  importer: string,
  specifier: string
): string | undefined {
  if (!specifier.startsWith(".")) return undefined;
  const absoluteRepositoryRoot = resolve(repositoryRoot);
  const importerPath = resolve(absoluteRepositoryRoot, importer);
  const unresolvedPath = resolve(
    dirname(importerPath),
    stripModuleQuery(specifier)
  );
  for (const candidate of targetCandidates(unresolvedPath)) {
    if (existsSync(candidate) && statSync(candidate).isFile()) {
      return repositoryRelative(absoluteRepositoryRoot, candidate);
    }
  }
  return undefined;
}

function visitNestedReferences(
  node: ts.Node,
  sourceFile: ts.SourceFile,
  importer: string,
  references: KpTypescriptImportReference[]
): void {
  if (
    ts.isImportTypeNode(node) &&
    ts.isLiteralTypeNode(node.argument) &&
    ts.isStringLiteralLike(node.argument.literal)
  ) {
    references.push(
      referenceFromNode(
        sourceFile,
        importer,
        node.argument.literal.text,
        "type-only",
        "import-type",
        node.argument.literal
      )
    );
    return;
  }
  if (
    ts.isCallExpression(node) &&
    node.expression.kind === ts.SyntaxKind.ImportKeyword &&
    node.arguments.length === 1 &&
    ts.isStringLiteralLike(node.arguments[0]!)
  ) {
    references.push(
      referenceFromNode(
        sourceFile,
        importer,
        node.arguments[0]!.text,
        "runtime",
        "dynamic-import",
        node.arguments[0]!
      )
    );
    return;
  }
  if (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === "require" &&
    node.arguments.length === 1 &&
    ts.isStringLiteralLike(node.arguments[0]!)
  ) {
    references.push(
      referenceFromNode(
        sourceFile,
        importer,
        node.arguments[0]!.text,
        "runtime",
        "require",
        node.arguments[0]!
      )
    );
    return;
  }
  ts.forEachChild(node, (child) =>
    visitNestedReferences(child, sourceFile, importer, references)
  );
}

function isTypeOnlyImport(declaration: ts.ImportDeclaration): boolean {
  const clause = declaration.importClause;
  if (clause === undefined) return false;
  if (clause.isTypeOnly) return true;
  if (clause.name !== undefined) return false;
  return (
    clause.namedBindings !== undefined &&
    ts.isNamedImports(clause.namedBindings) &&
    clause.namedBindings.elements.length > 0 &&
    clause.namedBindings.elements.every(({ isTypeOnly }) => isTypeOnly)
  );
}

function isTypeOnlyExport(declaration: ts.ExportDeclaration): boolean {
  if (declaration.isTypeOnly) return true;
  return (
    declaration.exportClause !== undefined &&
    ts.isNamedExports(declaration.exportClause) &&
    declaration.exportClause.elements.length > 0 &&
    declaration.exportClause.elements.every(({ isTypeOnly }) => isTypeOnly)
  );
}

function referenceFromNode(
  sourceFile: ts.SourceFile,
  importer: string,
  specifier: string,
  kind: KpTypescriptImportKind,
  syntax: KpTypescriptImportSyntax,
  node: ts.Node
): KpTypescriptImportReference {
  const location = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return Object.freeze({
    importer,
    specifier,
    kind,
    syntax,
    line: location.line + 1,
    column: location.character + 1
  });
}

function targetCandidates(unresolvedPath: string): readonly string[] {
  const extension = extname(unresolvedPath);
  if (extension === ".js" || extension === ".mjs" || extension === ".cjs") {
    const withoutExtension = unresolvedPath.slice(0, -extension.length);
    return codeCandidates(withoutExtension);
  }
  if (extension.length > 0) return [unresolvedPath];
  return codeCandidates(unresolvedPath);
}

function codeCandidates(path: string): readonly string[] {
  return [
    path,
    `${path}.ts`,
    `${path}.tsx`,
    `${path}.mts`,
    `${path}.cts`,
    `${path}.svelte`,
    join(path, "index.ts"),
    join(path, "index.tsx")
  ];
}

function isTypescriptSourcePath(path: string): boolean {
  return /\.(?:cts|mts|ts|tsx)$/.test(path) && !path.endsWith(".d.ts");
}

function scriptKindFor(path: string): ts.ScriptKind {
  return path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}

function repositoryRelative(repositoryRoot: string, path: string): string {
  return relative(repositoryRoot, path).replaceAll("\\", "/");
}

function stripModuleQuery(specifier: string): string {
  return specifier.split(/[?#]/, 1)[0]!;
}
