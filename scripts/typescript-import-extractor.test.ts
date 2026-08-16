import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  collectKpTypescriptImportGraph,
  extractKpTypescriptImportReferences,
  resolveKpTypescriptImportTarget
} from "./typescript-import-extractor.ts";

test("AST extraction distinguishes runtime and type-only source coupling", () => {
  const references = extractKpTypescriptImportReferences(
    "src/example.ts",
    [
      'import "./side-effect.ts";',
      'import type { A } from "./type-a.ts";',
      'import { type B } from "./type-b.ts";',
      'import Default, { type C } from "./mixed.ts";',
      'export type { D } from "./type-d.ts";',
      'export { type E } from "./type-e.ts";',
      'export { value } from "./value.ts";',
      'type Client = typeof import("./client.ts");',
      'const load = () => import("./lazy.ts");',
      'const legacy = require("./legacy.ts");'
    ].join("\n")
  );

  assert.deepEqual(
    references.map(({ specifier, kind, syntax, line }) => ({
      specifier,
      kind,
      syntax,
      line
    })),
    [
      { specifier: "./side-effect.ts", kind: "runtime", syntax: "import", line: 1 },
      { specifier: "./type-a.ts", kind: "type-only", syntax: "import", line: 2 },
      { specifier: "./type-b.ts", kind: "type-only", syntax: "import", line: 3 },
      { specifier: "./mixed.ts", kind: "runtime", syntax: "import", line: 4 },
      { specifier: "./type-d.ts", kind: "type-only", syntax: "export", line: 5 },
      { specifier: "./type-e.ts", kind: "type-only", syntax: "export", line: 6 },
      { specifier: "./value.ts", kind: "runtime", syntax: "export", line: 7 },
      { specifier: "./client.ts", kind: "type-only", syntax: "import-type", line: 8 },
      { specifier: "./lazy.ts", kind: "runtime", syntax: "dynamic-import", line: 9 },
      { specifier: "./legacy.ts", kind: "runtime", syntax: "require", line: 10 }
    ]
  );
});

test("AST extraction ignores import-like comments and ordinary strings", () => {
  const references = extractKpTypescriptImportReferences(
    "src/example.ts",
    '// import "./comment.ts"\nconst source = \'import("./string.ts")\';'
  );
  assert.deepEqual(references, []);
});

test("local resolution handles explicit, emitted-JS, extensionless, and index paths", (context) => {
  const root = mkdtempSync(join(tmpdir(), "kp-import-extractor-"));
  context.after(() => rmSync(root, { recursive: true }));
  mkdirSync(join(root, "src", "folder"), { recursive: true });
  writeFileSync(join(root, "src", "target.ts"), "export const value = 1;\n");
  writeFileSync(join(root, "src", "content.md"), "# Content\n");
  writeFileSync(join(root, "src", "folder", "index.ts"), "export {};\n");

  assert.equal(
    resolveKpTypescriptImportTarget(root, "src/importer.ts", "./target.ts"),
    "src/target.ts"
  );
  assert.equal(
    resolveKpTypescriptImportTarget(root, "src/importer.ts", "./target.js"),
    "src/target.ts"
  );
  assert.equal(
    resolveKpTypescriptImportTarget(root, "src/importer.ts", "./folder"),
    "src/folder/index.ts"
  );
  assert.equal(
    resolveKpTypescriptImportTarget(root, "src/importer.ts", "./content.md?raw"),
    "src/content.md"
  );
  assert.equal(
    resolveKpTypescriptImportTarget(root, "src/importer.ts", "external-package"),
    undefined
  );
});

test("graph collection returns resolved edges and explicit unresolved locals", (context) => {
  const root = mkdtempSync(join(tmpdir(), "kp-import-graph-"));
  context.after(() => rmSync(root, { recursive: true }));
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(
    join(root, "src", "entry.ts"),
    'import type { Value } from "./types.ts";\nvoid import("./missing.ts");\n'
  );
  writeFileSync(join(root, "src", "types.ts"), "export type Value = string;\n");

  const graph = collectKpTypescriptImportGraph(root);
  assert.deepEqual(graph.sourcePaths, ["src/entry.ts", "src/types.ts"]);
  assert.deepEqual(
    graph.localEdges.map(({ importer, target, kind }) => ({ importer, target, kind })),
    [{ importer: "src/entry.ts", target: "src/types.ts", kind: "type-only" }]
  );
  assert.deepEqual(
    graph.unresolvedLocalReferences.map(({ specifier, kind }) => ({ specifier, kind })),
    [{ specifier: "./missing.ts", kind: "runtime" }]
  );
});
