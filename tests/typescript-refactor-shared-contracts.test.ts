import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createKpTypeScriptFreeShippingAnimationAsset } from
  "../src/semantic/typescript-free-shipping-animation-asset.ts";
import { createKpTypeScriptRefactorSourceProjections } from
  "../src/semantic/typescript-refactor-source-projections.ts";

test("TypeScript adopts only the approved shared projection and settlement seams", async () => {
  const projectionSource = await readFile(
    new URL("../src/semantic/typescript-refactor-source-projections.ts", import.meta.url),
    "utf8"
  );
  const theaterSource = await readFile(
    new URL("../src/animation/typescript-refactor-token-theater.ts", import.meta.url),
    "utf8"
  );
  const frameSource = await readFile(
    new URL("../src/animation/typescript-refactor-motion-frame.ts", import.meta.url),
    "utf8"
  );

  assert.match(projectionSource, /composeKpCompleteCodeSourceProjection/);
  assert.match(theaterSource, /sampleKpCodeSettlement/);
  assert.match(frameSource, /accessibleNativeOwner/);
  assert.doesNotMatch(`${projectionSource}${theaterSource}${frameSource}`, /python-refactor/u);
});

test("shared projection migration preserves exact TypeScript endpoint bytes", () => {
  const exemplar = createKpTypeScriptFreeShippingAnimationAsset();
  const projections = createKpTypeScriptRefactorSourceProjections(exemplar.semantics);

  assert.equal(projections[0]?.sourceText, exemplar.semantics.revisions[0]?.sourceText);
  assert.equal(projections.at(-1)?.sourceText, exemplar.semantics.revisions[1]?.sourceText);
  assert.deepEqual(projections.map(({ id }) => id), [
    "projection.typescript.before",
    "projection.typescript.helper-introduced",
    "projection.typescript.cost-replaced",
    "projection.typescript.final"
  ]);
});
