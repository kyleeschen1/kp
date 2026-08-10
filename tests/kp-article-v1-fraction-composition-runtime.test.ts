import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { KpArticleImportLock } from
  "../src/article/kp-article-import-lock.ts";
import {
  compileKpFractionCompositionArticle
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-article-compiler.ts";
import {
  decodeKpFractionCompositionArticleLocation,
  encodeKpFractionCompositionArticleCheckpointLocation
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-article-location.ts";
import {
  kpFractionCompositionArticleRuntimeManifest
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-runtime-manifest.ts";
import {
  createKpFractionCompositionArticleRuntimeCheckpoints,
  createKpFractionCompositionArticleRuntimeRanges
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-runtime-ranges.ts";
import {
  kpFractionCompositionArticleSemanticReferences,
  resolveKpFractionCompositionArticleSemanticReference
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-semantic-navigation.ts";

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

test("six checkpoint seeks derive from the same five canonical ranges", () => {
  const ranges = createKpFractionCompositionArticleRuntimeRanges();
  const checkpoints = createKpFractionCompositionArticleRuntimeCheckpoints();

  assert.deepEqual(checkpoints.map(({ path }) => path), [
    "factored",
    "normalized",
    "constant-quotient",
    "difference-simplified",
    "right-product-simplified",
    "solved"
  ]);
  assert.deepEqual(checkpoints.map(({ progress }) => progress), [
    0,
    ...ranges.map(({ end }) => end)
  ]);
});

test("article semantic addresses resolve only through locked object bindings", () => {
  assert.equal(kpFractionCompositionArticleSemanticReferences.length, 12);
  const factor = resolveKpFractionCompositionArticleSemanticReference(
    "solve/factor"
  );
  assert.equal(factor?.address, "solve/factor");
  assert.equal(factor?.stageId, "solve");
  assert.equal(factor?.objectPath, "factor");
  assert.deepEqual(factor?.targetIds, ["fraction-fan-out.source.factor"]);
  assert.deepEqual(factor?.paintTargetIds, [
    "fraction-fan-out.source.factor.numerator",
    "fraction-fan-out.source.factor.denominator"
  ]);
  assert.equal(
    resolveKpFractionCompositionArticleSemanticReference("solve/not-authored"),
    undefined
  );
});

test("article locations distinguish checkpoints from non-temporal object links", () => {
  assert.deepEqual(
    decodeKpFractionCompositionArticleLocation(
      "#kp-ref:solve/difference-simplified"
    ),
    { kind: "checkpoint", path: "difference-simplified" }
  );
  assert.deepEqual(
    decodeKpFractionCompositionArticleLocation("#kp-ref:solve/factor"),
    { kind: "semantic-reference", address: "solve/factor" }
  );
  assert.equal(
    decodeKpFractionCompositionArticleLocation("#read-the-expression"),
    undefined
  );
  assert.equal(
    decodeKpFractionCompositionArticleLocation("#kp-ref:solve/%E0%A4%A"),
    undefined
  );
});

test("article checkpoint URLs preserve route and query state", () => {
  assert.equal(
    encodeKpFractionCompositionArticleCheckpointLocation(
      "https://kinetic.press/tutorials/algebra/fraction-composition/?review=1#old",
      "solved"
    ),
    "/tutorials/algebra/fraction-composition/?review=1#kp-ref:solve/solved"
  );
  assert.throws(
    () => encodeKpFractionCompositionArticleCheckpointLocation(
      "https://kinetic.press/tutorials/algebra/fraction-composition/",
      "not-authored"
    ),
    /Unknown algebra article checkpoint/u
  );
});

test("article activation keeps the renderer behind one dynamic capability", () => {
  const entry = readFileSync(
    "src/tutorial/algebra-fraction-composition/fraction-composition-progressive-entry.ts",
    "utf8"
  );
  assert.match(entry, /IntersectionObserver/u);
  assert.match(entry, /import\("\.\/fraction-composition-runtime-capability\.ts"\)/u);
  assert.doesNotMatch(entry, /requestAnimationFrame|setInterval|setTimeout/u);
  assert.doesNotMatch(entry, /seekCheckpoint\([^)]*kpFocus/u);
});
