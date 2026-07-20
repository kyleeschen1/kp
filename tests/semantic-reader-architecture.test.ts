import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  kpSemanticReaderExemplarContract,
  kpSemanticReaderLayers
} from "../src/architecture/semantic-reader-boundaries.ts";
import { checkKpSemanticReaderImports } from "../src/architecture/semantic-reader-import-fitness.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

test("semantic reader layers form an acyclic enhancement pipeline", () => {
  const ids = new Set(kpSemanticReaderLayers.map((layer) => layer.id));
  assert.equal(ids.size, kpSemanticReaderLayers.length);

  const visited = new Set<string>();
  const active = new Set<string>();
  const visit = (id: string): void => {
    assert.equal(active.has(id), false, `semantic reader dependency cycle at ${id}`);
    if (visited.has(id)) return;
    active.add(id);
    const layer = kpSemanticReaderLayers.find((candidate) => candidate.id === id);
    assert.ok(layer);
    for (const dependency of layer.mayImport) visit(dependency);
    active.delete(id);
    visited.add(id);
  };
  for (const layer of kpSemanticReaderLayers) visit(layer.id);
});

test("semantic reader permits only public imports in the allowed direction", () => {
  assert.deepEqual(checkKpSemanticReaderImports([
    {
      path: "src/reader/compiler/compile.ts",
      source: 'import type { LessonDocument } from "../document/public-api.ts";'
    },
    {
      path: "src/reader/renderers/equation.ts",
      source: 'import type { ReaderClock } from "../runtime/public-api.ts";'
    },
    {
      path: "src/reader/app/mount.ts",
      source: 'import { hydrate } from "../runtime/public-api.ts";'
    }
  ]), []);
});

test("semantic reader rejects backward and cross-layer deep imports", () => {
  const violations = checkKpSemanticReaderImports([
    {
      path: "src/reader/runtime/hydrate.ts",
      source: 'import { compile } from "../compiler/public-api.ts";'
    },
    {
      path: "src/reader/renderers/equation.ts",
      source: 'import type { LessonDocument } from "../document/model.ts";'
    }
  ]);
  assert.deepEqual(violations.map((violation) => violation.kind), [
    "cross-layer-deep-import",
    "dependency-direction"
  ]);
});

test("semantic reader rejects editor and Three.js dependencies at every layer", () => {
  const violations = checkKpSemanticReaderImports([
    {
      path: "src/reader/app/mount.ts",
      source: 'import { renderEditorDocument } from "../../editor/editor.ts";'
    },
    {
      path: "src/reader/renderers/equation.ts",
      source: 'import * as THREE from "three";'
    },
    {
      path: "src/reader/runtime/load.ts",
      source: 'const module = import("../../rendering/graph-webgl-three.ts");'
    }
  ]);
  assert.equal(violations.length, 3);
  assert.ok(violations.every((violation) =>
    violation.kind === "forbidden-learner-dependency"
  ));
});

test("Markdown AST dependencies remain confined to the build-only compiler", () => {
  const allowed = checkKpSemanticReaderImports([{
    path: "src/reader/compiler/markdown-ast-parser.ts",
    source: 'import { fromMarkdown } from "mdast-util-from-markdown";'
  }]);
  assert.deepEqual(allowed, []);

  const violations = checkKpSemanticReaderImports([
    {
      path: "src/reader/document/markdown.ts",
      source: 'import type { Root } from "mdast";'
    },
    {
      path: "src/reader/runtime/hydrate.ts",
      source: 'import { fromMarkdown } from "mdast-util-from-markdown";'
    },
    {
      path: "src/reader/app/mount.ts",
      source: 'import { micromark } from "micromark";'
    }
  ]);
  assert.equal(violations.length, 3);
  assert.ok(violations.every((violation) =>
    violation.kind === "build-only-dependency-leak"
  ));
});

test("semantic reader exemplar contract names references, rollback, and promotion gate", () => {
  assert.equal(kpSemanticReaderExemplarContract.canonicalReferences.length, 5);
  assert.ok(kpSemanticReaderExemplarContract.rollbackUnit.includes("isolated src/reader"));
  assert.ok(kpSemanticReaderExemplarContract.promotionCriteria.some((criterion) =>
    criterion.includes("human")
  ));
  for (const source of kpSemanticReaderExemplarContract.canonicalReferences) {
    assert.ok(existsSync(join(projectRoot, source)), `missing canonical reference ${source}`);
  }
});
