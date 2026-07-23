import assert from "node:assert/strict";
import test from "node:test";

import roadmapV6 from "../docs/theseus/nodes/plan-revisions/plan-revision.kp.v6.json" with {
  type: "json"
};
import {
  projectKpWorkbenchRoadmap
} from "../src/editor/semantic-animation-workbench-roadmap.ts";
import type {
  KpWorkbenchPlanRevisionNode
} from "../src/editor/semantic-animation-workbench-roadmap-authority.ts";

const expectedPhaseIds = [
  "gold-equation-reader",
  "distribution-factoring-grammar",
  "fraction-composition-architecture",
  "generated-symbolic-transform-library",
  "derivative-secant-to-tangent",
  "governed-semantic-authoring",
  "semantic-animation-workbench",
  "authoritative-roadmap-workbench",
  "radical-native-settlement",
  "quadratic-semantic-branching",
  "integral-accumulation",
  "vector-dot-projection",
  "matrix-linear-map",
  "exact-fraction-quantity-models",
  "multidigit-addition",
  "multidigit-subtraction",
  "multidigit-multiplication",
  "multidigit-division",
  "ratios-rates-percent-units",
  "rational-expressions",
  "polynomial-algebra",
  "exponent-logarithm-laws",
  "fractional-power-radical-generalization",
  "functions-coordinate-algebra",
  "equations-inequalities-systems",
  "trigonometry",
  "sequences-large-operators",
  "euclidean-geometry",
  "measurement-units-scale",
  "probability",
  "data-statistics",
  "programming-algorithms",
  "economics-parametric",
  "physics-work-energy",
  "cross-domain-governed-authoring"
] as const;

test("v6 preserves the exact accepted product coverage ledger", () => {
  const roadmap = projectKpWorkbenchRoadmap(
    roadmapV6 as KpWorkbenchPlanRevisionNode
  );

  assert.deepEqual(
    roadmap.rows.map(({ id }) => id),
    expectedPhaseIds
  );
  assert.equal(roadmap.rows.length, 35);
  assert.deepEqual(
    countBy(roadmap.rows.map(({ horizon }) => horizon)),
    { now: 10, next: 3, later: 14, someday: 8 }
  );
  assert.deepEqual(
    countBy(roadmap.rows.map(({ state }) => state)),
    { complete: 7, active: 2, planned: 26 }
  );
  assert.equal(
    roadmap.rows.every(
      (row) =>
        row.topic !== undefined &&
        row.architectureBenefit !== undefined &&
        row.rationale !== undefined &&
        row.canonicalExemplar !== undefined
    ),
    true
  );
});

test("v6 retains every explicitly accepted future domain lane", () => {
  const rows = projectKpWorkbenchRoadmap(
    roadmapV6 as KpWorkbenchPlanRevisionNode
  ).rows;
  const byId = new Map(rows.map((row) => [row.id, row]));

  for (const id of [
    "exact-fraction-quantity-models",
    "multidigit-addition",
    "multidigit-subtraction",
    "multidigit-multiplication",
    "multidigit-division",
    "ratios-rates-percent-units",
    "exponent-logarithm-laws",
    "trigonometry",
    "euclidean-geometry",
    "probability",
    "data-statistics",
    "programming-algorithms",
    "economics-parametric",
    "physics-work-energy"
  ]) {
    assert.ok(byId.has(id), `missing accepted roadmap lane ${id}`);
  }
  assert.match(
    byId.get("fractional-power-radical-generalization")!.objective,
    /negative exponents that become reciprocal radical expressions/
  );
});

function countBy(values: readonly string[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}
