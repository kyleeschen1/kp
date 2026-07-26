import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const inventoryPath =
  "docs/project/reviews/2026-07-26-radical-reader-adoption-inventory.md";

const existingAuthorities = [
  "src/animation/exponent-radical-adapter.ts",
  "src/semantic/radical-fragment-semantics.ts",
  "src/animation/radical-fragment-lineage.ts",
  "src/authoring/governed-radical-succession-fixture.ts",
  "src/rendering/native-katex-rendered-scene.ts",
  "src/rendering/native-katex-scene-compositor.ts",
  "src/reader/renderers/equation-render-plan.ts",
  "src/reader/renderers/equation-material-plan.ts",
  "src/reader/renderers/equation-scene-compositor-adapter.ts",
  "src/reader/app/reader-canonical-equation-session.ts",
  "src/reader/app/equation-lesson-descriptor.ts",
  "src/reader/compiler/reader-route-manifest.ts",
  "src/reader/app/exemplar-entry.ts",
  "src/rendering/radical-webgl-morph.ts",
  "src/editor/semantic-animation-preservation-manifest.ts"
] as const;

test("radical adoption inventory names every existing authority and seam", async () => {
  const inventory = await readFile(inventoryPath, "utf8");
  for (const path of existingAuthorities) {
    assert.match(inventory, new RegExp(escapeRegex(path)), path);
    assert.ok((await readFile(path, "utf8")).length > 0, path);
  }
});

test("radical reader activates only through the shared product seams", async () => {
  const [descriptors, radicalDescriptor, routes, entry] = await Promise.all([
    readFile("src/reader/app/equation-lesson-descriptor.ts", "utf8"),
    readFile(
      "src/reader/app/equation-lesson-descriptors/radical-succession.ts",
      "utf8"
    ),
    readFile("src/reader/compiler/reader-route-manifest.ts", "utf8"),
    readFile("src/reader/app/exemplar-entry.ts", "utf8")
  ]);
  assert.match(descriptors, /"radical-succession"\s*:/);
  assert.match(radicalDescriptor, /canonicalTransitionSelection: "all"/);
  assert.match(routes, /\/reader\/radical-succession\//);
  assert.match(entry, /compileKpReaderCanonicalTransitionPolicy/);
  assert.doesNotMatch(
    entry,
    /lessonVariant === "(radical-succession|numerator-split-merge)"/
  );
});

test("existing editor radical remains a named compatibility boundary", async () => {
  const [manifest, residual, entry] = await Promise.all([
    readFile("src/editor/semantic-animation-preservation-manifest.ts", "utf8"),
    readFile(
      "docs/project/decisions/2026-07-24-kp-radical-cross-renderer-handoff-residual.md",
      "utf8"
    ),
    readFile("src/reader/app/exemplar-entry.ts", "utf8")
  ]);
  assert.match(
    manifest,
    /editor-animation\.sample\.animation\.radical-rewrite\.square-root-as-power/
  );
  assert.match(residual, /WebGL-assisted `1\/2 -> √` animation/);
  assert.doesNotMatch(entry, /radical-webgl-morph/);
});

test("existing canonical radical proof needs no new lifecycle category", async () => {
  const [fixture, browserProof, inventory] = await Promise.all([
    readFile("tests/governed-radical-succession-fixture.test.ts", "utf8"),
    readFile("tests/native-katex-fragment-observer.browser.spec.ts", "utf8"),
    readFile(inventoryPath, "utf8")
  ]);
  assert.match(fixture, /law\.arithmetic\.rational-exponent-as-root/);
  assert.match(browserProof, /persist: 1/);
  assert.match(browserProof, /introduce: 1/);
  assert.match(browserProof, /eliminate: 3/);
  assert.match(inventory, /no radical-named paint kind or lifecycle category/);
});

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
