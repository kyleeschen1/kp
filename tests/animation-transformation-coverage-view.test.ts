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
    { status: "Direct", count: 5 },
    { status: "Registered", count: 3 },
    { status: "Exemplar", count: 9 },
    { status: "Missing", count: 11 }
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
  assert.deepEqual(
    view.rows.find(({ capabilityId }) => capabilityId ===
      "capability.equation.alternative-logarithm-bases")?.remaining.map(
      ({ summary }) => summary
    ),
    [
      "The endpoint parser preserves explicit bases in forms such as log_b(x) and log_{10}(x).",
      "A typed law relates source base, target base, numerator log, and denominator log under valid domain assumptions.",
      "A canonical recipe owns base transfer and quotient construction without treating the base as decoration.",
      "A distinct motif preserves base identity as notation moves between operator subscripts and the change-of-base quotient.",
      "One reviewed exemplar establishes syntax, identity, and attention choreography before promotion.",
      "Authors name source and target bases semantically; KP chooses notation and motion.",
      "Fixtures cover symbolic and numeric bases, omitted natural bases, and invalid base/domain cases."
    ]
  );
});
