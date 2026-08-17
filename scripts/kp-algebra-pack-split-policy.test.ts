import assert from "node:assert/strict";
import test from "node:test";

import {
  inspectKpAlgebraPackSplit,
  KP_ALGEBRA_PACK_BASELINE_GZIP_BYTES
} from "./kp-algebra-pack-split-policy.ts";

const runtimeKey = "_algebra-runtime.js";
const validManifest = Object.freeze({
  [runtimeKey]: Object.freeze({
    file: "assets/algebra-runtime.js",
    name: "algebra-choreography-capabilities"
  }),
  "src/animation/catalog-packs/algebra-linear-solve.ts": Object.freeze({
    file: "assets/algebra-linear-solve.js",
    imports: Object.freeze([runtimeKey])
  }),
  "src/animation/catalog-packs/algebra.ts": Object.freeze({
    file: "assets/algebra.js",
    imports: Object.freeze([runtimeKey])
  })
});

test("algebra split requires material savings and one shared runtime", () => {
  const result = inspectKpAlgebraPackSplit({
    currentGzipBytes: 55_333,
    manifest: validManifest
  });

  assert.equal(result.savingsGzipBytes, 28_544);
  assert.equal(result.savingsPermille, 340);
  assert.equal(result.sharedRuntimeChunkKey, runtimeKey);
  assert.deepEqual(result.violations, []);
});

test("algebra split fails closed on marginal savings or runtime duplication", () => {
  const result = inspectKpAlgebraPackSplit({
    currentGzipBytes: KP_ALGEBRA_PACK_BASELINE_GZIP_BYTES - 1,
    manifest: {
      ...validManifest,
      "_second-runtime.js": {
        file: "assets/second-runtime.js",
        name: "algebra-choreography-capabilities"
      }
    }
  });

  assert.equal(result.violations.length, 2);
  assert.match(result.violations[0]!, /expected at least/);
  assert.match(result.violations[1]!, /expected one/);
});

