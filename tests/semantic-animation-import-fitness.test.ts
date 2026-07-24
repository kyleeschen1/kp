import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  checkKpSemanticAnimationImports
} from "../src/architecture/semantic-animation-import-fitness.ts";
import {
  kpSemanticAnimationRenderingImportBaseline
} from "../src/architecture/semantic-animation-import-baseline.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));

test("frozen rendering imports are the exact allowed exception set", () => {
  const sourceFiles = ["src/semantic", "src/animation"].flatMap((root) =>
    collectTypeScriptFiles(join(projectRoot, root)).map((path) => ({
      path: relative(projectRoot, path),
      source: readFileSync(path, "utf8")
    }))
  );
  assert.deepEqual(checkKpSemanticAnimationImports(sourceFiles), []);
});

test("new static, dynamic, re-export, and require paths cannot escape the gate", () => {
  const source = [
    'import { draw } from "../rendering/new-renderer.ts";',
    'const adapter = import("../rendering/deep/adapter.ts");',
    'export { pose } from "../rendering/pose.ts";',
    'const legacy = require("../rendering/legacy.ts");'
  ].join("\n");
  const violations = checkKpSemanticAnimationImports(
    [{ path: "src/animation/example.ts", source }],
    []
  );

  assert.equal(violations.length, 4);
  assert.ok(violations.every(({ kind }) =>
    kind === "unapproved-rendering-import"
  ));
});

test("rendering may consume neutral contracts without reversing the gate", () => {
  assert.deepEqual(
    checkKpSemanticAnimationImports(
      [{
        path: "src/rendering/adapter.ts",
        source: 'import type {} from "../animation/runtime-sampler.ts";'
      }],
      []
    ),
    []
  );
});

test("stale and duplicate exceptions fail instead of widening the baseline", () => {
  const exception = kpSemanticAnimationRenderingImportBaseline[0]!;
  assert.deepEqual(
    checkKpSemanticAnimationImports([], [exception]).map(({ kind }) => kind),
    ["stale-rendering-import-exception"]
  );
  assert.deepEqual(
    checkKpSemanticAnimationImports(
      [{
        path: exception.sourcePath,
        source: `import type {} from "${exception.modulePath}";`
      }],
      [exception, exception]
    ).map(({ kind }) => kind),
    ["duplicate-rendering-import-exception"]
  );
});

function collectTypeScriptFiles(root: string): readonly string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return collectTypeScriptFiles(path);
    return entry.isFile() && entry.name.endsWith(".ts") ? [path] : [];
  });
}
