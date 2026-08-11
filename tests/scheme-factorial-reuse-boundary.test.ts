import assert from "node:assert/strict";
import test from "node:test";

import {
  kpSchemeFactorialReuseBoundary as boundary
} from "../src/architecture/scheme-factorial-reuse-boundary.ts";

test("factorial reuse boundary covers each intended disposition exactly", () => {
  assert.equal(new Set(boundary.map(({ id }) => id)).size, boundary.length);
  assert.deepEqual(
    [...new Set(boundary.map(({ disposition }) => disposition))].sort(),
    ["adapt", "factorial-local", "preserve", "reject", "reuse"]
  );
});

test("factorial semantic truth stays independent from the lambda fixture", () => {
  const semanticEntries = boundary.filter(({ authority }) =>
    authority === "semantic"
  );
  assert.ok(
    semanticEntries.every(({ sources }) =>
      sources.every((source) => !source.includes("lambda-application-asset"))
    )
  );
  assert.equal(
    boundary.find(({ id }) => id === "current-lambda-exemplar")?.disposition,
    "preserve"
  );
});

test("factorial reuses pure presentation seams and rejects the old runtime", () => {
  const reusedSources = boundary
    .filter(({ disposition }) => disposition === "reuse")
    .flatMap(({ sources }) => sources);
  assert.ok(reusedSources.includes(
    "src/animation/lisp-s-expression-contained-jostle.ts"
  ));
  assert.ok(reusedSources.includes(
    "src/rendering/lisp-s-expression-material-dom.ts"
  ));
  assert.ok(reusedSources.includes(
    "src/tutorial/kp-tutorial-scrub-bar.ts"
  ));
  assert.equal(
    boundary.find(({ id }) => id === "legacy-imperative-loop")?.disposition,
    "reject"
  );
});

test("Svelte is absent from factorial semantic and presentation authority", () => {
  const governedSources = boundary
    .filter(({ authority }) =>
      authority === "semantic" || authority === "presentation"
    )
    .flatMap(({ sources }) => sources);
  assert.ok(governedSources.every((source) => !source.endsWith(".svelte")));
});
