import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  compileKpEditorSelectedSurfaceCapabilityDeclarationSet,
  KpEditorSelectedSurfaceCapabilityDeclarationError,
  kpEditorSelectedSurfaceCapabilityDeclarationSet,
  type KpEditorSelectedSurfaceCapabilityDeclaration
} from "../src/editor/selected-surface-capability-declarations.ts";
import {
  kpEditorSelectedSurfaceCapabilityValues
} from "../src/editor/selected-surface-capability.ts";

test("capability declarations exhaust the selected capability vocabulary", () => {
  assert.deepEqual(
    kpEditorSelectedSurfaceCapabilityDeclarationSet.entries.map(
      ({ capabilityId }) => capabilityId
    ).sort(),
    [...kpEditorSelectedSurfaceCapabilityValues].sort()
  );
  assert.ok(kpEditorSelectedSurfaceCapabilityDeclarationSet.entries.every(
    ({ adapterIds, registrationGuardAdapterId }) =>
      adapterIds.includes(registrationGuardAdapterId)
  ));
  assert.equal(Object.isFrozen(
    kpEditorSelectedSurfaceCapabilityDeclarationSet.entries
  ), true);
});

test("capability declaration validation rejects duplicate and missing ids", () => {
  const equation = kpEditorSelectedSurfaceCapabilityDeclarationSet.find(
    "equation-katex"
  );
  assert.throws(
    () => compileKpEditorSelectedSurfaceCapabilityDeclarationSet({
      declarations: [equation, equation],
      expectedCapabilityIds: ["equation-katex", "log-product"]
    }),
    (error: unknown) =>
      error instanceof KpEditorSelectedSurfaceCapabilityDeclarationError &&
      error.diagnostics.some(({ code }) => code === "duplicate-capability") &&
      error.diagnostics.some(({ code }) => code === "missing-capability")
  );
});

test("capability declaration validation rejects unknown ids and adapter gaps", () => {
  const malformed = {
    ...kpEditorSelectedSurfaceCapabilityDeclarationSet.find("equation-katex"),
    capabilityId: "unknown-capability",
    adapterIds: []
  } as unknown as KpEditorSelectedSurfaceCapabilityDeclaration;
  assert.throws(
    () => compileKpEditorSelectedSurfaceCapabilityDeclarationSet({
      declarations: [malformed],
      expectedCapabilityIds: ["equation-katex"]
    }),
    (error: unknown) =>
      error instanceof KpEditorSelectedSurfaceCapabilityDeclarationError &&
      error.diagnostics.some(({ code }) => code === "unexpected-capability") &&
      error.diagnostics.some(({ code }) => code === "missing-adapter") &&
      error.diagnostics.some(({ code }) => code === "invalid-registration-guard")
  );
});

test("every capability loader remains a literal dynamic import", async () => {
  const source = await readFile(
    "src/editor/selected-surface-capability-declarations.ts",
    "utf8"
  );
  const paths = [
    "equation-surface-capability.ts",
    "log-exponent-surface-capability.ts",
    "log-quotient-surface-capability.ts",
    "log-product-surface-capability.ts",
    "exact-fraction-quantity-surface-capability.ts",
    "operation-evaluation-surface-capability.ts",
    "place-value-addition-surface-capability.ts",
    "economics-graph-svg-surface-capability.ts",
    "graph-svg-surface-capability.ts",
    "graph-3d-surface-capability.ts",
    "programming-surface-capability.ts"
  ];
  for (const path of paths) {
    assert.match(source, new RegExp(
      `import\\(\\s*[\"']\\./${path.replaceAll(".", "\\.")}[\"']\\s*\\)`
    ));
  }
  assert.doesNotMatch(source, /import\(\s*`|import\(\s*[a-zA-Z_$]/);
});

test("equation capabilities no longer branch in the selected host", async () => {
  const host = await readFile(
    "src/editor/selected-surface-capability-host.ts",
    "utf8"
  );
  assert.match(host, /kpEditorSelectedSurfaceCapabilityDeclarationSet\.find/);
  for (const capabilityId of [
    "equation-katex",
    "log-exponent",
    "log-quotient",
    "log-product",
    "exact-fraction-quantity",
    "operation-evaluation",
    "place-value-addition"
  ]) {
    assert.doesNotMatch(host, new RegExp(
      `capability\\s*===\\s*[\"']${capabilityId}[\"']`
    ));
  }
});

test("non-equation capabilities no longer branch in the selected host", async () => {
  const host = await readFile(
    "src/editor/selected-surface-capability-host.ts",
    "utf8"
  );
  for (const capabilityId of [
    "graph-svg-economics",
    "graph-svg-katex-labels",
    "graph-webgl-3d",
    "programming-trace"
  ]) {
    assert.doesNotMatch(host, new RegExp(
      `capability\\s*===\\s*[\"']${capabilityId}[\"']`
    ));
  }
  assert.doesNotMatch(host, /import\(\s*["']\.\/[^"']+-surface-capability\.ts["']\s*\)/);
});
