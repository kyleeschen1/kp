import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createKpAnimationTransformationCoverageViewModel
} from "../src/editor/animation-transformation-coverage-view-model.ts";
import {
  readKpAnimationTransformationCoverageRoute,
  writeKpAnimationTransformationCoverageRoute
} from "../src/editor/animation-transformation-coverage-route.ts";

test("coverage route is explicit and preserves unrelated query state", () => {
  assert.deepEqual(
    readKpAnimationTransformationCoverageRoute("?view=coverage"),
    { active: true }
  );
  assert.deepEqual(
    readKpAnimationTransformationCoverageRoute("?artifact=example"),
    { active: false }
  );
  assert.equal(
    writeKpAnimationTransformationCoverageRoute("?artifact=example"),
    "?artifact=example&view=coverage"
  );
});

test("coverage view is one ordered evidence-derived list", () => {
  const view = createKpAnimationTransformationCoverageViewModel();
  assert.equal(view.total, 38);
  assert.deepEqual(view.statusCounts, [
    { status: "Direct", count: 8 },
    { status: "Registered", count: 4 },
    { status: "Exemplar", count: 9 },
    { status: "Missing", count: 17 }
  ]);
  assert.deepEqual(
    view.rows.map(({ order }) => order),
    Array.from({ length: 38 }, (_value, index) => index + 1)
  );
  assert.ok(view.rows.every(({ remaining }) =>
    remaining.every(({ status }) => status === "missing")
  ));
  assert.equal(
    view.rows.find(({ capabilityId }) => capabilityId ===
      "capability.equation.function-wrapping")?.remaining.length,
    0
  );
  const logarithmBases = view.rows.find(({ capabilityId }) => capabilityId ===
    "capability.equation.alternative-logarithm-bases");
  assert.equal(logarithmBases?.status, "Direct");
  assert.deepEqual(logarithmBases?.remaining, []);
  const roots = view.rows.find(({ capabilityId }) => capabilityId ===
    "capability.equation.radical-inversion");
  assert.equal(roots?.caseCoverage?.status, "tracked");
  if (roots?.caseCoverage?.status !== "tracked") {
    assert.fail("Root case coverage must remain visible in the view model.");
  }
  assert.equal(roots.caseCoverage.caseCount, 10);
  assert.ok(view.operationDiscovery.total > 10);
  const additive = view.operationDiscovery.entries.find(({ operationId }) =>
    operationId === "kp.semantic-motion.absorb-additive-identity"
  );
  assert.ok(additive);
  assert.equal(additive.friendlyName, "Remove additive identity");
  assert.match(additive.inspectExample,
    /npm run discover:equation-operations/u);
  assert.match(additive.positiveExample, /x \+ 0/u);
});

test("coverage view projects ordered curriculum groups and maturity claims", () => {
  const symbolic = createKpAnimationTransformationCoverageViewModel()
    .symbolicMathematics;
  assert.deepEqual(symbolic.groups.map(({ id, order }) => ({ id, order })), [
    { id: "algebra-functions", order: 1 },
    { id: "trigonometric-syntax", order: 2 },
    { id: "inequalities-piecewise", order: 3 },
    { id: "sequences-series", order: 4 },
    { id: "limits", order: 5 },
    { id: "calculus-operators", order: 6 },
    { id: "polar-parametric", order: 7 },
    { id: "differential-equations", order: 8 },
    { id: "taylor-series", order: 9 }
  ]);
  assert.deepEqual(symbolic.groups.find(({ id }) =>
    id === "trigonometric-syntax")?.byStatus, {
    Direct: 0,
    Registered: 0,
    Exemplar: 0,
    Missing: 1
  });
  assert.deepEqual(symbolic.maturityDimensions.map(({ id }) => id), [
    "notation-paintable",
    "semantic-representable",
    "operation-authoritative",
    "exemplar-executable",
    "family-promoted",
    "generation-governed"
  ]);
});

test("coverage route consumes the static projection without taxonomy closure", async () => {
  const source = await readFile(new URL(
    "../src/editor/animation-transformation-coverage-view-model.ts",
    import.meta.url
  ), "utf8");
  assert.match(source, /animation-transformation-coverage\.generated\.json/u);
  assert.doesNotMatch(source,
    /symbolic-mathematics-capability-taxonomy|equation-animation-capability-plan/u);
});
