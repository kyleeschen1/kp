import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  kpHtmlEncodingConsolidations,
  kpHtmlEncodingOwners
} from "../src/architecture/html-output-encoding-inventory.ts";

const inventoryPath =
  "docs/project/reviews/2026-07-25-canonical-animation-construction-path-inventory.md";

const canonicalPaths = [
  "src/semantic/numerator-split-merge-equation-asset.ts",
  "src/animation/numerator-split-merge-equation-adapter.ts",
  "src/authoring/governed-semantic-request.ts",
  "src/authoring/governed-semantic-compiler.ts",
  "src/reader/compiler/numerator-split-merge-equation-lesson-model.ts",
  "src/reader/compiler/numerator-split-merge-equation-lesson.ts",
  "src/reader/app/equation-lesson-descriptor.ts",
  "src/reader/renderers/equation-render-plan.ts",
  "src/reader/renderers/equation-material-plan.ts",
  "src/reader/app/exemplar-entry.ts",
  "src/reader/renderers/equation-scene-compositor-adapter.ts",
  "src/rendering/native-katex-rendered-scene.ts",
  "src/rendering/native-katex-scene-compositor.ts",
  "src/animation/asset-projections.ts"
] as const;

test("construction inventory names every existing canonical authority", async () => {
  const inventory = await readFile(inventoryPath, "utf8");
  for (const path of canonicalPaths) {
    assert.match(inventory, new RegExp(escapeRegex(path)), path);
    assert.ok((await readFile(path, "utf8")).length > 0, path);
  }
});

test("fraction migration seam is canonical, exclusive, and explicit", async () => {
  const [entry, descriptorRegistry, fractionDescriptor] = await Promise.all([
    readFile("src/reader/app/exemplar-entry.ts", "utf8"),
    readFile("src/reader/app/equation-lesson-descriptor.ts", "utf8"),
    readFile(
      "src/reader/app/equation-lesson-descriptors/numerator-split-merge.ts",
      "utf8"
    )
  ]);
  assert.match(
    descriptorRegistry,
    /"numerator-split-merge"\s*:/
  );
  assert.match(
    fractionDescriptor,
    /defineKpCanonicalEquationLessonDescriptor/
  );
  assert.match(entry, /compileKpReaderCanonicalTransitionPolicy/);
  assert.match(entry, /transitionIds: canonicalTransitionIds/);
  assert.match(
    entry,
    /if \(canonicalEquationSessionApplied\) \{\s*materialLayer\.sync\(\[\]\)/
  );
  assert.doesNotMatch(
    entry,
    /lessonVariant === "(?:numerator-split-merge|radical-succession)"/
  );
});

test("clone authority sanitation is already one shared browser contract", async () => {
  const cloneSource = await readFile(
    "src/rendering/computed-style-clone.ts",
    "utf8"
  );
  assert.match(cloneSource, /export function stripKpMaterialCloneAuthority/);
  assert.match(cloneSource, /attribute\.name\.startsWith\("aria-"\)/);
  assert.match(cloneSource, /attribute\.name\.startsWith\("data-kp-"\)/);
  for (const consumer of [
    "src/reader/renderers/equation-material-layer.ts",
    "src/rendering/native-katex-glyph-compositor.ts",
    "src/rendering/equation-material-layer-dom.ts"
  ]) {
    assert.match(
      await readFile(consumer, "utf8"),
      /stripKpMaterialCloneAuthority/
    );
  }
});

test("escaping inventory ratchets the selected context consolidation", async () => {
  assert.equal(kpHtmlEncodingOwners.length, 50);
  assert.deepEqual(
    kpHtmlEncodingConsolidations.map(({ sourceFile }) => sourceFile),
    ["src/editor/exact-fraction-quantity-surface-adapter.ts"]
  );

  const selected = await readFile(
    kpHtmlEncodingConsolidations[0].sourceFile,
    "utf8"
  );
  assert.match(selected, /encodeKpEditorHtmlText/);
  assert.match(selected, /encodeKpEditorHtmlAttribute/);
  assert.doesNotMatch(selected, /function escapeHtml/);
});

test("canonical animation exports stay out of the concept authoring barrel", async () => {
  const [conceptApi, canonicalApi] = await Promise.all([
    readFile("src/authoring/public-api.ts", "utf8"),
    readFile("src/authoring/canonical-animation-public-api.ts", "utf8")
  ]);
  for (const symbol of [
    "createKpCanonicalAnimationConstruction",
    "compileKpGovernedCanonicalConstruction",
    "createKpGovernedCanonicalConstructionCohort",
    "createKpGovernedCanonicalCompoundConstruction",
    "projectKpGovernedCanonicalConstructionCohort"
  ]) {
    assert.doesNotMatch(conceptApi, new RegExp(symbol), symbol);
    assert.match(canonicalApi, new RegExp(symbol), symbol);
  }
});

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
