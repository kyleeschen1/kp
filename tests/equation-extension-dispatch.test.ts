import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  renderKpEquationExtensionDispatchSource
} from "../scripts/equation-extension-dispatch-generator.ts";
import {
  createKpEquationExtensionDispatchManifest
} from "../scripts/equation-extension-dispatch-manifest.ts";
import {
  kpGeneratedEquationDispatchIds,
  loadKpEquationExtensionPack,
  loadKpEquationMotif,
  loadKpEquationOperation,
  loadKpEquationRecipe,
  loadKpEquationRendererCapability
} from "../src/generated/equation-extension-dispatch.generated.ts";

const generatedPath = resolve(
  "src/generated/equation-extension-dispatch.generated.ts"
);

test("generated literal dispatch is current and closes over every declaration", () => {
  const manifest = createKpEquationExtensionDispatchManifest();
  const expected = renderKpEquationExtensionDispatchSource(manifest);
  assert.equal(readFileSync(generatedPath, "utf8"), expected);
  assert.deepEqual(
    Object.fromEntries(Object.entries(kpGeneratedEquationDispatchIds)),
    Object.fromEntries(
      [...new Set(manifest.map(({ kind }) => kind))].map((kind) => [
        kind,
        manifest.filter((entry) => entry.kind === kind).map(({ id }) => id)
      ])
    )
  );
});

test("generated imports are literal named-export edges to existing modules", () => {
  const source = readFileSync(generatedPath, "utf8");
  const imports = [...source.matchAll(/import\("([^"]+)"\)\.then\(\(module\) => module\.([A-Za-z0-9_$]+)\)/gu)];
  assert.equal(imports.length, createKpEquationExtensionDispatchManifest().length);
  assert.doesNotMatch(source, /import\((?!")[^)]+\)/u);
  for (const [, modulePath] of imports) {
    assert.equal(
      existsSync(resolve("src/generated", modulePath!)),
      true,
      modulePath ?? "missing generated module path"
    );
  }
});

test("all generated dispatch kinds load the declared named export", async () => {
  const [operation, recipe, motif, capability, packFactory] = await Promise.all([
    loadKpEquationOperation("operation.wrap-function.v1"),
    loadKpEquationRecipe("recipe.equation.function-application.v1"),
    loadKpEquationMotif("motif.function-wrap.v1"),
    loadKpEquationRendererCapability("renderer-capability.equation.native-katex.v1"),
    loadKpEquationExtensionPack("equation-pack.function-wrap.v1")
  ]);
  assert.equal((operation as { id: string }).id, "operation.wrap-function.v1");
  assert.equal((recipe as { id: string }).id, "recipe.equation.function-application.v1");
  assert.equal((motif as { id: string }).id, "motif.function-wrap.v1");
  assert.equal(Object.isFrozen(
    (operation as { recipeIds: readonly string[] }).recipeIds
  ), true);
  assert.equal(Object.isFrozen(
    (recipe as { motifUses: readonly unknown[] }).motifUses
  ), true);
  assert.equal(
    (capability as { id: string }).id,
    "renderer-capability.equation.native-katex.v1"
  );
  assert.equal(
    (capability as { motifId: string }).motifId,
    "motif.function-wrap.v1"
  );
  assert.equal(typeof packFactory, "function");
});

test("unknown ids fail explicitly without a fallback import", async () => {
  await assert.rejects(
    loadKpEquationMotif("motif.unknown.v1"),
    /Unknown equation motif motif\.unknown\.v1/
  );
});

test("generator rejects duplicate and non-literal declarations", () => {
  const entry = createKpEquationExtensionDispatchManifest()[0]!;
  assert.throws(
    () => renderKpEquationExtensionDispatchSource([entry, entry]),
    /Duplicate equation operation dispatch id/
  );
  assert.throws(
    () => renderKpEquationExtensionDispatchSource([{
      ...entry,
      modulePath: "dynamic/module"
    }]),
    /literal repository module/
  );
});
