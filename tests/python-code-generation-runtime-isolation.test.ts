import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { collectKpRuntimeImportClosure } from
  "../scripts/runtime-import-closure.ts";

const runtimeRoots = Object.freeze([
  "src/editor/python-refactor-surface-adapter.ts",
  "src/editor/programming-surface-capability.ts",
  "src/semantic/python-free-shipping-animation-asset.ts"
]);

const buildTimeGenerationModules = Object.freeze([
  "scripts/python-refactor-frontend.ts",
  "scripts/python-refactor-frontend.py",
  "scripts/python-extract-helper-role-recognizer.ts",
  "scripts/python-extract-helper-legality.ts",
  "scripts/python-extract-helper-semantic-binder.ts",
  "scripts/python-code-generation-frontend.ts",
  "scripts/python-code-generation-authoring.ts"
]);

test("selected Python browser closures exclude every generation module", () => {
  for (const root of runtimeRoots) {
    const closure = collectKpRuntimeImportClosure(root);
    assert.equal(
      closure.some((path) => buildTimeGenerationModules.some((module) =>
        path.endsWith(module)
      )),
      false,
      root
    );
    assert.equal(
      closure.some((path) => path.includes("/scripts/")),
      false,
      root
    );
  }
});

test("runtime closure source never reaches Python process authority", async () => {
  const closure = [...new Set(runtimeRoots.flatMap((root) =>
    collectKpRuntimeImportClosure(root)
  ))];
  const sources = await Promise.all(closure.map((path) => readFile(path, "utf8")));
  sources.forEach((source, index) => {
    const sourcePath = closure[index]!;
    assert.doesNotMatch(
      source,
      /(?:node:child_process|spawnSync|python-refactor-frontend\.py)/u,
      sourcePath
    );
    assert.doesNotMatch(
      source,
      /scripts\/(?:python-code-generation|python-extract-helper|python-refactor-frontend)/u,
      sourcePath
    );
  });
});

test("the Python runtime authority reads checked-in plain data", async () => {
  const source = await readFile(
    "src/semantic/python-refactor-semantic-artifact.ts",
    "utf8"
  );
  const generated = JSON.parse(await readFile(
    "src/semantic/python-refactor-semantics.generated.json",
    "utf8"
  ));

  assert.match(source, /python-refactor-semantics\.generated\.json/u);
  assert.doesNotMatch(source, /scripts\/|node:child_process|spawnSync/u);
  assert.equal(generated.schemaVersion, "kp.python-refactor-semantics.v1");
  assert.equal(generated.contractId, "python-refactor.free-shipping-threshold");
});

test("build-time and runtime ownership lists are disjoint", () => {
  assert.ok(buildTimeGenerationModules.every((path) => path.startsWith("scripts/")));
  assert.ok(runtimeRoots.every((path) => path.startsWith("src/")));
  assert.deepEqual(
    buildTimeGenerationModules.filter((path) => runtimeRoots.includes(path)),
    []
  );
});
