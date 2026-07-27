import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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

test("escaping inventory ratchets only the proven tutorial consolidation", async () => {
  const files = await sourceFiles(["src", "scripts"]);
  const sources = await Promise.all(files.map(async (path) => ({
    path,
    source: await readFile(path, "utf8")
  })));
  assert.equal(
    sources.filter(({ source }) => /function escapeHtml/.test(source)).length,
    21
  );
  assert.equal(
    sources.filter(({ source }) =>
      /function (?:escapeAttr|escapeAttribute)/.test(source)
    ).length,
    1
  );
  assert.equal(
    sources.filter(({ source }) => /function escapeScriptJson/.test(source)).length,
    0
  );
  assert.equal(
    sources.filter(({ source }) =>
      /generated-html-escaping\.ts/.test(source)
    ).length,
    8
  );
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

async function sourceFiles(roots: readonly string[]): Promise<readonly string[]> {
  const { readdir } = await import("node:fs/promises");
  const visit = async (path: string): Promise<string[]> => {
    const entries = await readdir(path, { withFileTypes: true });
    return (await Promise.all(entries.map((entry) => {
      const child = `${path}/${entry.name}`;
      if (entry.isDirectory()) return visit(child);
      return /\.(?:mjs|ts|tsx)$/.test(entry.name) ? [child] : [];
    }))).flat();
  };
  return (await Promise.all(roots.map(visit))).flat();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
