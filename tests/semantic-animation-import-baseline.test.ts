import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  kpSemanticAnimationRenderingImportBaseline
} from "../src/architecture/semantic-animation-import-baseline.ts";

const projectRoot = fileURLToPath(new URL("..", import.meta.url));
const renderingImportPattern =
  /import\s+(?:type\s+)?(?:\{[\s\S]*?\}|[^;]+?)\s+from\s+["']((?:\.\.\/)+rendering\/[^"']+)["'];/g;
const renderingSideEffectImportPattern =
  /import\s+["']((?:\.\.\/)+rendering\/[^"']+)["'];/g;

test("rendering import baseline exactly matches semantic and animation source", () => {
  const actual = ["src/semantic", "src/animation"]
    .flatMap(typescriptFilesBeneath)
    .flatMap((sourcePath) => {
    const source = readFileSync(join(projectRoot, sourcePath), "utf8");
    return [
      ...source.matchAll(renderingImportPattern),
      ...source.matchAll(renderingSideEffectImportPattern)
    ].map((match) =>
      importKey(sourcePath, match[1]!)
    );
  });
  const expected = kpSemanticAnimationRenderingImportBaseline.map(
    ({ sourcePath, modulePath }) => importKey(sourcePath, modulePath)
  );

  assert.deepEqual(actual.sort(), expected.sort());
});

test("temporary rendering imports are exact and own a retirement slice", () => {
  const keys = new Set<string>();
  for (const dependency of kpSemanticAnimationRenderingImportBaseline) {
    const key = importKey(dependency.sourcePath, dependency.modulePath);
    assert.equal(keys.has(key), false, `duplicate import exception ${key}`);
    assert.equal(dependency.modulePath.includes("*"), false);
    assert.match(dependency.retirementSlice, /^s(?:10|11|12|13)$/);
    assert.ok(dependency.rationale.length >= 24);
    keys.add(key);
  }
  assert.equal(keys.size, 23);
});

test("dependency retirement follows the approved ownership sequence", () => {
  const slicesByClassification = new Map(
    kpSemanticAnimationRenderingImportBaseline.map((entry) => [
      entry.classification,
      entry.retirementSlice
    ])
  );

  assert.deepEqual(Object.fromEntries(slicesByClassification), {
    "semantic-compiler-location-debt": "s10",
    "motif-contract-location-debt": "s11",
    "neutral-utility-location-debt": "s12",
    "choreography-location-debt": "s12",
    "compatibility-boundary": "s13"
  });
});

function importKey(sourcePath: string, modulePath: string): string {
  return `${sourcePath} -> ${modulePath}`;
}

function typescriptFilesBeneath(relativeDirectory: string): string[] {
  return readdirSync(join(projectRoot, relativeDirectory), {
    recursive: true,
    withFileTypes: true
  })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
    .map((entry) =>
      join(relativeDirectory, entry.parentPath.slice(
        join(projectRoot, relativeDirectory).length + 1
      ), entry.name)
    );
}
