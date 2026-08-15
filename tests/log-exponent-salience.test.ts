import assert from "node:assert/strict";
import test from "node:test";

import { kpCanonicalLogExponentContinuity } from "../src/animation/log-exponent-continuity.ts";
import { kpCanonicalLogExponentSalience } from "../src/animation/log-exponent-salience.ts";
import { validateKpTransferableSalienceGraph } from "../src/animation/salience-graph.ts";

test("canonical log-exponent salience is valid and preserves full semantic presence", () => {
  assert.equal(kpCanonicalLogExponentSalience.length, 3);
  kpCanonicalLogExponentSalience.forEach((plan, index) => {
    assert.deepEqual(
      validateKpTransferableSalienceGraph(
        plan.graph,
        kpCanonicalLogExponentContinuity[index]!.lineage
      ),
      []
    );
    assert.deepEqual(plan.stages.map(({ phase }) => phase), ["orient", "act", "settle"]);
    for (const stage of plan.stages) {
      assert.ok(stage.assignments.every(({ state }) => state.presence === 1));
      assert.equal(
        new Set(stage.assignments.map(({ entityId }) => entityId)).size,
        stage.assignments.length
      );
    }
  });
});

test("attention choreography names the dominant mathematical action", () => {
  const applyLog = kpCanonicalLogExponentSalience[0]!;
  const extraction = kpCanonicalLogExponentSalience[1]!;
  assert.deepEqual(
    applyLog.stages[1]!.assignments
      .filter(({ state }) => state.level === "focus")
      .map(({ entityId }) => entityId),
    ["logged.left.log", "logged.right.log"]
  );
  assert.deepEqual(
    extraction.stages[1]!.assignments
      .filter(({ state }) => state.level === "focus")
      .map(({ entityId }) => entityId),
    ["logged.exponent", "extracted.coefficient"]
  );
  assert.ok(extraction.graph.edges.every(
    ({ targetReadyAt, sourceReleaseAt }) => targetReadyAt <= sourceReleaseAt
  ));
});
