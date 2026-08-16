import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";

import {
  runKpEquationIntentCli,
  type KpEquationIntentCliDependencies
} from "../scripts/compile-equation-intent.ts";
import {
  listKpEquationIntentSurfaceVocabularies
} from "../src/authoring/compile-equation-intent.ts";
import {
  kpEquationGenerationPressureFixtures
} from "../src/authoring/equation-generation-pressure-contract.ts";

interface CliResponse {
  readonly status: string;
  readonly surfaces: unknown;
  readonly plan: Readonly<Record<string, string>>;
  readonly diagnostics: readonly Readonly<{ code: string; path: string }>[];
}

test("list mode exposes deterministic canonical vocabularies", async () => {
  const harness = cliHarness();
  assert.equal(await runKpEquationIntentCli(["--list"], harness.dependencies), 0);
  const response = harness.output();
  assert.equal(response.status, "catalogue");
  assert.deepEqual(response.surfaces, listKpEquationIntentSurfaceVocabularies());
});

test("stdin compiles a canonical request into a compact authority summary", async () => {
  const vocabulary = listKpEquationIntentSurfaceVocabularies()[0]!;
  const request = {
    ...kpEquationGenerationPressureFixtures[0]!.request,
    operation: {
      operationId: vocabulary.operationId,
      roleBindings: vocabulary.canonicalRoleBindings
    }
  };
  const harness = cliHarness(JSON.stringify(request));
  assert.equal(await runKpEquationIntentCli([], harness.dependencies), 0);
  const response = harness.output();
  assert.equal(response.status, "accepted");
  assert.equal(response.plan["kind"], "function-wrap-motif-plan");
  assert.equal(response.plan["animationId"], vocabulary.animationId);
  assert.equal(response.plan["operationId"], vocabulary.operationId);
  assert.equal("tracks" in response.plan, false);
  assert.equal("keyframes" in response.plan, false);
});

test("unresolved aliases return typed repairs and exit two", async () => {
  const harness = cliHarness(JSON.stringify(
    kpEquationGenerationPressureFixtures[1]!.request
  ));
  assert.equal(await runKpEquationIntentCli([], harness.dependencies), 2);
  const response = harness.output();
  assert.equal(response.status, "repair-required");
  assert.ok(response.diagnostics.length > 0);
  assert.ok(response.diagnostics.every(
    (diagnostic) => diagnostic.code === "equation-llm.entity.unresolved"
  ));
});

test("malformed JSON returns a stable request diagnostic and exit two", async () => {
  const harness = cliHarness("{not-json");
  assert.equal(await runKpEquationIntentCli([], harness.dependencies), 2);
  const response = harness.output();
  assert.equal(response.status, "repair-required");
  assert.equal(response.diagnostics[0]?.code, "equation-intent.request.json");
  assert.equal(response.diagnostics[0]?.path, "$.request");
});

test("the tool-neutral command does not import editor or browser authority", () => {
  const source = readFileSync(new URL(
    "../scripts/compile-equation-intent.ts",
    import.meta.url
  ), "utf8");
  assert.doesNotMatch(source, /(?:src\/editor|\.svelte|window\.|document\.|HTMLElement|SVGElement)/);
  assert.match(source, /compileEquationIntent/);
});

test("the local command closure excludes editor, Svelte, and browser modules", () => {
  const entry = fileURLToPath(new URL(
    "../scripts/compile-equation-intent.ts",
    import.meta.url
  ));
  const inputs = collectLocalImportClosure(entry);
  assert.ok(inputs.some((path) => path.endsWith("compile-equation-intent.ts")));
  assert.deepEqual(inputs.filter((path) =>
    path.includes("/src/editor/") ||
    path.includes("/src/rendering/") ||
    path.endsWith(".svelte")
  ), []);
});

function collectLocalImportClosure(entry: string): readonly string[] {
  const pending = [entry];
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
  return [...visited].sort();
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

function cliHarness(stdin = ""): {
  readonly dependencies: KpEquationIntentCliDependencies;
  readonly output: () => CliResponse;
} {
  let output = "";
  return {
    dependencies: {
      readFile: async () => stdin,
      readStdin: async () => stdin,
      write: (chunk) => { output += chunk; }
    },
    output: () => JSON.parse(output) as CliResponse
  };
}
