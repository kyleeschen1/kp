import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  collectKpRuntimeImportClosure
} from "../scripts/runtime-import-closure.ts";

const runtimeRoots = Object.freeze([
  "src/public-web/typescript-free-shipping-entry.ts",
  "src/editor/typescript-refactor-surface-adapter.ts",
  "src/semantic/typescript-free-shipping-animation-asset.ts"
]);

const buildTimeGenerationModules = Object.freeze([
  "scripts/typescript-refactor-frontend.ts",
  "scripts/typescript-extract-helper-role-recognizer.ts",
  "scripts/typescript-extract-helper-legality.ts",
  "scripts/typescript-extract-helper-semantic-binder.ts",
  "scripts/typescript-code-generation-frontend.ts",
  "scripts/typescript-code-generation-authoring.ts"
]);

test("selected TypeScript browser closures exclude every generation module", () => {
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

test("runtime closure source never imports the TypeScript compiler", async () => {
  const closure = [...new Set(runtimeRoots.flatMap((root) =>
    collectKpRuntimeImportClosure(root)
  ))];
  const sources = await Promise.all(closure.map((path) => readFile(path, "utf8")));
  sources.forEach((source, index) => {
    assert.doesNotMatch(
      source,
      /(?:from|import\s*\()\s*["']typescript["']/u,
      closure[index]
    );
    assert.doesNotMatch(
      source,
      /scripts\/(?:typescript-code-generation|typescript-extract-helper|typescript-refactor-frontend)/u,
      closure[index]
    );
  });
});

test("the runtime semantic authority reads checked-in plain data", async () => {
  const source = await readFile(
    "src/semantic/typescript-refactor-semantic-artifact.ts",
    "utf8"
  );
  const generated = JSON.parse(await readFile(
    "src/semantic/typescript-refactor-semantics.generated.json",
    "utf8"
  ));

  assert.match(source, /typescript-refactor-semantics\.generated\.json/u);
  assert.doesNotMatch(source, /scripts\/|from\s+["']typescript["']/u);
  assert.equal(generated.schemaVersion, "kp.typescript-refactor-semantics.v1");
  assert.equal(generated.contractId, "typescript-refactor.free-shipping-threshold");
});

test("build-time and runtime ownership lists are disjoint", () => {
  assert.ok(buildTimeGenerationModules.every((path) => path.startsWith("scripts/")));
  assert.ok(runtimeRoots.every((path) => path.startsWith("src/")));
  assert.deepEqual(
    buildTimeGenerationModules.filter((path) => runtimeRoots.includes(path)),
    []
  );
});
