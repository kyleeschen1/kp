import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import ts from "typescript";

/** Follow only runtime imports; type-only imports do not enlarge production JS. */
export function collectKpRuntimeImportClosure(entry: string): readonly string[] {
  const pending = [resolve(entry)];
  const visited = new Set<string>();
  while (pending.length > 0) {
    const path = pending.pop()!;
    if (visited.has(path)) continue;
    visited.add(path);
    const source = readFileSync(path, "utf8");
    for (const fileName of runtimeModuleSpecifiers(path, source)) {
      if (!fileName.startsWith(".")) continue;
      const resolved = resolveLocalImport(path, fileName);
      if (resolved !== undefined) pending.push(resolved);
    }
  }
  return Object.freeze([...visited].sort());
}

function runtimeModuleSpecifiers(
  path: string,
  source: string
): readonly string[] {
  const file = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS
  );
  return file.statements.flatMap((statement) => {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      if (clause?.isTypeOnly === true) return [];
      if (
        clause?.name === undefined &&
        clause?.namedBindings !== undefined &&
        ts.isNamedImports(clause.namedBindings) &&
        clause.namedBindings.elements.every(({ isTypeOnly }) => isTypeOnly)
      ) return [];
      return ts.isStringLiteral(statement.moduleSpecifier)
        ? [statement.moduleSpecifier.text]
        : [];
    }
    if (
      ts.isExportDeclaration(statement) &&
      !statement.isTypeOnly &&
      statement.moduleSpecifier !== undefined &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) return [statement.moduleSpecifier.text];
    return [];
  });
}

function resolveLocalImport(
  importer: string,
  specifier: string
): string | undefined {
  const path = resolve(dirname(importer), specifier);
  const candidates = [
    path,
    path.replace(/\.js$/, ".ts"),
    `${path}.ts`,
    resolve(path, "index.ts")
  ];
  return candidates.find((candidate) => existsSync(candidate));
}
