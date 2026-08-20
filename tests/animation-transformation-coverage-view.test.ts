import assert from "node:assert/strict";
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
  assert.equal(view.total, 28);
  assert.deepEqual(view.statusCounts, [
    { status: "Direct", count: 6 },
    { status: "Registered", count: 3 },
    { status: "Exemplar", count: 9 },
    { status: "Missing", count: 10 }
  ]);
  assert.deepEqual(
    view.rows.map(({ order }) => order),
    Array.from({ length: 28 }, (_value, index) => index + 1)
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
