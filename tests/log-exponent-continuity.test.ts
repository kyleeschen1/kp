import assert from "node:assert/strict";
import test from "node:test";

import { kpCanonicalLogExponentContinuity } from "../src/animation/log-exponent-continuity.ts";
import { validateKpChoreographyLifecycle } from "../src/animation/choreography-lifecycle.ts";
import { validateKpSemanticLineageGraph } from "../src/semantic/semantic-lineage-graph.ts";

test("canonical log-exponent continuants validate against lifecycle and lineage", () => {
  assert.equal(kpCanonicalLogExponentContinuity.length, 3);
  for (const plan of kpCanonicalLogExponentContinuity) {
    assert.deepEqual(validateKpSemanticLineageGraph(plan.lineage), []);
    assert.deepEqual(validateKpChoreographyLifecycle({
      lifecycle: plan.lifecycle,
      vocabulary: plan.vocabulary,
      sourceEntityIds: plan.lineage.sourceEntityIds,
      targetEntityIds: plan.lineage.targetEntityIds
    }), []);
    assert.ok(plan.vocabulary.objectConstancy.every(({ preserveThrough }) =>
      preserveThrough.includes("seek") &&
      preserveThrough.includes("rewind") &&
      preserveThrough.includes("renderer-handoff")
    ));
  }
});

test("x receives explicit representational succession during exponent extraction", () => {
  const extraction = kpCanonicalLogExponentContinuity[1]!;
  const x = extraction.lineage.edges.find(
    ({ id }) => id === "lineage.correspondence.extract-exponent.unknown-x"
  );
  assert.deepEqual(x, {
    id: "lineage.correspondence.extract-exponent.unknown-x",
    relation: "representation-succession",
    sourceEntityIds: ["logged.exponent"],
    targetEntityIds: ["extracted.coefficient"],
    summary: "The same x moves from exponent to coefficient.",
    representationAuthorityId: "transformation.log-exponent.extract-exponent"
  });
  assert.ok(extraction.vocabulary.continuants.some(
    ({ id }) => id === "continuant.correspondence.extract-exponent.unknown-x"
  ));
});
