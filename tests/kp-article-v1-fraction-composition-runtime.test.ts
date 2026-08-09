import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { KpArticleImportLock } from
  "../src/article/kp-article-import-lock.ts";
import {
  compileKpFractionCompositionArticle
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-article-compiler.ts";
import {
  kpFractionCompositionArticleRuntimeManifest
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-runtime-manifest.ts";
import {
  createKpFractionCompositionArticleRuntimeRanges
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-runtime-ranges.ts";

const compiled = compileKpFractionCompositionArticle({
  text: readFileSync(
    "content/lessons/algebra-fraction-composition.kp.md",
    "utf8"
  ),
  lock: JSON.parse(readFileSync(
    "content/lessons/algebra-fraction-composition.kp.lock.json",
    "utf8"
  )) as KpArticleImportLock
});

test("browser runtime manifest equals the build-owned stage projection", () => {
  assert.deepEqual(
    kpFractionCompositionArticleRuntimeManifest,
    compiled.stageManifests[0]
  );
});

test("five named ranges partition all thirteen canonical operations", () => {
  const ranges = createKpFractionCompositionArticleRuntimeRanges();
  assert.equal(ranges.length, 5);
  assert.equal(ranges[0]?.start, 0);
  assert.equal(ranges.at(-1)?.end, 1);
  assert.equal(ranges.flatMap(({ operationIds }) => operationIds).length, 13);
  for (let index = 1; index < ranges.length; index += 1) {
    assert.equal(ranges[index - 1]?.end, ranges[index]?.start);
  }
});

test("article activation keeps the renderer behind one dynamic capability", () => {
  const entry = readFileSync(
    "src/tutorial/algebra-fraction-composition/fraction-composition-progressive-entry.ts",
    "utf8"
  );
  assert.match(entry, /IntersectionObserver/u);
  assert.match(entry, /import\("\.\/fraction-composition-runtime-capability\.ts"\)/u);
  assert.doesNotMatch(entry, /requestAnimationFrame|setInterval|setTimeout/u);
});
