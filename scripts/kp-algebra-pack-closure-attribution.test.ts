import assert from "node:assert/strict";
import test from "node:test";

import {
  attributeKpAlgebraPackClosure,
  classifyKpAlgebraClosureFile,
  KP_ALGEBRA_CLOSURE_OWNERS
} from "./kp-algebra-pack-closure-attribution.ts";

const resources = Object.freeze([
  measured("assets/algebra-a.js", 101, ["src/animation/catalog-packs/algebra.ts"]),
  measured("assets/semantic-lineage-b.js", 103, ["semantic-lineage-graph"]),
  measured("assets/choreography-c.js", 107, ["distribution-choreography"]),
  measured("assets/surface-d.js", 109, ["equation-surface-adapter"]),
  measured("assets/KaTeX_Main-e.woff2", 113, ["equation-surface-capability"])
]);

test("algebra closure ownership uses deterministic exclusive precedence", () => {
  assert.deepEqual(resources.map(classifyKpAlgebraClosureFile), [
    "caller",
    "semantic",
    "runtime",
    "renderer",
    "katex"
  ]);
  assert.equal(classifyKpAlgebraClosureFile(measured(
    "assets/katex-surface.js",
    1,
    ["equation-surface-adapter"]
  )), "katex");
});

test("algebra closure attribution accounts for every byte and file once", () => {
  const report = attributeKpAlgebraPackClosure({
    scenarioId: "bundle-experience.catalogue.solve-x",
    files: [...resources].reverse()
  });

  assert.deepEqual(report.owners.map(({ owner }) => owner), [
    ...KP_ALGEBRA_CLOSURE_OWNERS
  ]);
  assert.equal(report.gzipBytes, 533);
  assert.equal(
    report.owners.reduce((total, owner) => total + owner.gzipBytes, 0),
    report.gzipBytes
  );
  assert.deepEqual(
    report.owners.flatMap(({ files }) => files.map(({ file }) => file)).sort(),
    resources.map(({ file }) => file).sort()
  );
});

function measured(
  file: string,
  gzipBytes: number,
  ownerSources: readonly string[]
) {
  return Object.freeze({
    file,
    kind: file.endsWith(".woff2") ? "font" as const : "script" as const,
    gzipBytes,
    ownerSources: Object.freeze([...ownerSources])
  });
}

