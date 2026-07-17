import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpFactoringChoreography,
  sampleKpFactoringChoreography
} from "../src/animation/factoring-choreography.ts";

test("factoring previews repeated-factor focus before collection", () => {
  const preview = sampleKpFactoringChoreography({
    plan: factoringPlan(),
    progress: 0.18
  });
  assert.ok(preview.focusStrength > 0.9);
  assert.ok(preview.addendCompactionProgress > 0);
  assert.ok(preview.addendCompactionProgress < 0.2);
  assert.equal(preview.groupingOpacity, 0);
  assert.equal(preview.factorCopies[1]!.pathProgress, 0);
});

test("later factor copies collect toward the anchored first factor", () => {
  const frame = sampleKpFactoringChoreography({
    plan: factoringPlan(),
    progress: 0.5
  });
  assert.ok(frame.factorCopies[0]!.pathProgress < frame.factorCopies[1]!.pathProgress);
  assert.equal(frame.factorCopies[0]!.opacity, 1);
  assert.ok(frame.factorCopies[1]!.opacity > 0.9);
  assert.equal(frame.commonFactor.opacity, 0);
  assert.deepEqual(frame.factorCopies.map((copy) => copy.semanticIndex), [0, 1]);
});

test("grouping enters as products compact and settlement is exact", () => {
  const plan = factoringPlan();
  const grouping = sampleKpFactoringChoreography({ plan, progress: 0.68 });
  assert.ok(grouping.groupingOpacity > 0 && grouping.groupingOpacity < 1);
  assert.ok(grouping.addendCompactionProgress > 0.5);
  const settled = sampleKpFactoringChoreography({ plan, progress: 1 });
  assert.equal(settled.groupingOpacity, 1);
  assert.equal(settled.commonFactor.opacity, 1);
  assert.equal(settled.commonFactor.scale, 1);
  assert.ok(settled.factorCopies.every((copy) => copy.opacity === 0));
  assert.equal(settled.focusStrength, 0);
  assert.equal(settled.addendCompactionProgress, 1);
});

test("factoring rejects incomplete inverse-operation roles", () => {
  assert.throws(() => compileKpFactoringChoreography({
    id: "bad-factoring",
    factorCopyIds: ["source.factor.0", "source.factor.1"],
    commonFactorId: "target.factor",
    addendPairs: [{ sourceId: "source.term.0", targetId: "target.term.0", semanticIndex: 0 }],
    connectorPairs: [],
    groupingArtifactIds: ["target.left-paren", "target.right-paren"]
  }), /one addend pair per factor copy/);
});

function factoringPlan() {
  return compileKpFactoringChoreography({
    id: "factoring.ab-plus-ac",
    factorCopyIds: ["source.factor.0", "source.factor.1"],
    commonFactorId: "target.factor",
    addendPairs: [
      { sourceId: "source.term.0", targetId: "target.term.0", semanticIndex: 0 },
      { sourceId: "source.term.1", targetId: "target.term.1", semanticIndex: 1 }
    ],
    connectorPairs: [
      { sourceId: "source.connector.0", targetId: "target.connector.0", semanticIndex: 0 }
    ],
    groupingArtifactIds: ["target.left-paren", "target.right-paren"]
  });
}
