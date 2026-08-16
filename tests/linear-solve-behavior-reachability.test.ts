import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import ts from "typescript";

import {
  collectKpTypescriptSourcePaths,
  resolveKpTypescriptImportTarget
} from "../scripts/typescript-import-extractor.ts";
import { kpLinearSolveBehaviorReachabilityAudit as audit } from
  "../src/architecture/linear-solve-behavior-reachability.ts";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));

test("linear-solve tutorial behavior has no production importer", () => {
  assert.deepEqual(namedImporters("src"), audit.productionImporters);
  assert.deepEqual(namedImporters("tests"), audit.testImporters);
  assert.equal(audit.disposition, "move-to-experience");
});

function namedImporters(sourceDirectory: "src" | "tests"): readonly string[] {
  return collectKpTypescriptSourcePaths(resolve(repositoryRoot, sourceDirectory))
    .map((absolutePath) => relative(repositoryRoot, absolutePath).replaceAll("\\", "/"))
    .filter((sourcePath) => importsAuditedSymbol(sourcePath))
    .sort();
}

function importsAuditedSymbol(sourcePath: string): boolean {
  const source = readFileSync(resolve(repositoryRoot, sourcePath), "utf8");
  const sourceFile = ts.createSourceFile(
    sourcePath,
    source,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS
  );

  return sourceFile.statements.some((statement) => {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteralLike(statement.moduleSpecifier) ||
      resolveKpTypescriptImportTarget(
        repositoryRoot,
        sourcePath,
        statement.moduleSpecifier.text
      ) !== audit.currentOwner
    ) {
      return false;
    }
    const bindings = statement.importClause?.namedBindings;
    if (bindings === undefined) return false;
    if (ts.isNamespaceImport(bindings)) return true;
    return bindings.elements.some(
      (element) =>
        (element.propertyName?.text ?? element.name.text) === audit.symbol
    );
  });
}
