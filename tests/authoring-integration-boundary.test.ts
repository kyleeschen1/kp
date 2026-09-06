import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import ts from "typescript";
import { measureKpAuthoringIntegrationCost, measureKpAuthoringPreviewImplementation } from "./helpers/authoring-integration-cost.ts";

const assembly = ["authoring-model-assembly", "authoring-explanation-assembly",
  "authoring-query-session", "authoring-diagnostics"].map(name => `src/semantic-state/${name}.ts`);
const math = ["typed-math-state-value", "typed-math-local-capabilities", "typed-math-state-optics"]
  .map(name => `src/math/${name}.ts`);

function imports(path: string): readonly string[] {
  const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true);
  return source.statements.flatMap(node =>
    (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier) ? [node.moduleSpecifier.text] : []);
}

test("internal assembly remains owner-local and math bridges do not import paint or host authority", () => {
  for (const path of assembly) for (const dependency of imports(path)) {
    const target = resolve(dirname(path), dependency);
    assert.ok(target.startsWith(`${resolve("src/semantic-state")}/`), `${path} -> ${dependency}`);
  }
  for (const path of math) for (const dependency of imports(path)) {
    const target = resolve(dirname(path), dependency);
    assert.ok(["src/math", "src/semantic-state"].some(owner => target.startsWith(`${resolve(owner)}/`)),
      `${path} -> ${dependency}`);
  }
  // Promotion is a separate decision; no convenience export makes this review
  // surface part of an existing public contract before the human checkpoint.
  const publicFiles = readdirSync("src", { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith("public-api.ts"))
    .map(entry => join(entry.parentPath, entry.name));
  const internal = new Set([...assembly, ...math].map(path => resolve(path)));
  for (const path of publicFiles) for (const dependency of imports(path)) {
    assert.equal(internal.has(resolve(dirname(path), dependency)), false, path);
  }
});

test("boundary review charges author glue and discloses math bridge implementation separately", () => {
  const cost = measureKpAuthoringIntegrationCost();
  assert.ok(cost.chargedOrchestrationLines <= 26, "retain at least half of the frozen 52-line reduction");
  assert.ok(cost.current.importModules < cost.previous.importModules);
  assert.deepEqual(cost.shared.map(item => item.path), assembly);
  const mathBridge = math.map(path => ({ path,
    nonblankLines: readFileSync(path, "utf8").split("\n").filter(line => line.trim()).length,
    imports: imports(path).length }));
  assert.ok(mathBridge.every(item => item.nonblankLines > 0));
  console.log("AUTHORING_BOUNDARY_COST", JSON.stringify({ assembly: cost.shared, mathBridge }));
});

test("preview author sources and all owner-local integration helpers are disclosed separately", () => {
  const inventory = measureKpAuthoringPreviewImplementation();
  assert.ok(inventory.files.some(file => file.path.endsWith("authoring-market-model-source.ts")));
  assert.ok(inventory.files.some(file => file.path.endsWith("authoring-market-article-source.ts")));
  assert.ok(inventory.files.some(file => file.path.endsWith("vite-authoring-market-preview.ts")));
  assert.ok(inventory.files.every(file => file.nonblankLines > 0));
  console.log("AUTHORING_PREVIEW_IMPLEMENTATION", JSON.stringify(inventory));
});
