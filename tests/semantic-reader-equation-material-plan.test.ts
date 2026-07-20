import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  compileKpReaderEquationMaterialPlan,
  projectKpReaderEquationRenderPlan
} from "../src/reader/renderers/public-api.ts";

function materialPlan(direction: "forward" | "rewind") {
  const animation = createLinearSolveAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: `runtime.reader.material.${direction}`,
    animation,
    direction,
    progress: 0.5
  });
  return compileKpReaderEquationMaterialPlan(
    projectKpReaderEquationRenderPlan({ animation, runtimeFrame })
  );
}

test("material plans derive stable owners and anchors from semantic correspondence", () => {
  const plan = materialPlan("forward");
  const transition = plan.transitions[0]!;

  assert.equal(plan.kind, "reader-equation-material-plan");
  assert.deepEqual(plan.diagnostics, []);
  assert.equal(transition.anchors.length, 12);
  assert.equal(transition.owners.length, 6);

  const xOwner = transition.owners.find(
    (owner) => owner.relationRecordId === "x-persists"
  );
  assert.deepEqual(xOwner, {
    id: "material-owner.x-persists",
    transitionId: "transform.linear-solve.cancel-left-additive-inverse",
    relationRecordId: "x-persists",
    relation: "identity",
    lifecycle: "persist",
    continuity: "source-target",
    sourceAnchorIds: [
      "anchor.equation.linear-solve.after-subtract.lhs.x"
    ],
    targetAnchorIds: [
      "anchor.equation.linear-solve.left-simplified.lhs.x"
    ],
    seedAnchorId: "anchor.equation.linear-solve.after-subtract.lhs.x",
    focused: false
  });

  const equalsAnchor = transition.anchors.find(
    (anchor) => anchor.selectorId === "equation.linear-solve.after-subtract.equals"
  );
  assert.equal(equalsAnchor?.anchorKind, "relation-center");
});

test("cancellation is a focused source-only owner in forward motion", () => {
  const cancellation = materialPlan("forward").transitions[0]!.owners.find(
    (owner) => owner.relationRecordId === "left-inverses-cancel"
  );

  assert.equal(cancellation?.continuity, "source-only");
  assert.equal(cancellation?.lifecycle, "cancel");
  assert.equal(cancellation?.focused, true);
  assert.deepEqual(cancellation?.sourceAnchorIds, [
    "anchor.equation.linear-solve.after-subtract.lhs.plus3",
    "anchor.equation.linear-solve.after-subtract.lhs.minus3"
  ]);
  assert.deepEqual(cancellation?.targetAnchorIds, []);
});

test("rewind preserves owner identity while reversing endpoint ownership", () => {
  const forward = materialPlan("forward").transitions[0]!;
  const rewind = materialPlan("rewind").transitions[0]!;
  assert.deepEqual(
    rewind.owners.map((owner) => owner.id),
    forward.owners.map((owner) => owner.id)
  );

  const cancellation = rewind.owners.find(
    (owner) => owner.relationRecordId === "left-inverses-cancel"
  );
  assert.equal(cancellation?.continuity, "target-only");
  assert.equal(cancellation?.lifecycle, "enter");
  assert.deepEqual(cancellation?.sourceAnchorIds, []);
  assert.deepEqual(cancellation?.targetAnchorIds, [
    "anchor.equation.linear-solve.after-subtract.lhs.plus3",
    "anchor.equation.linear-solve.after-subtract.lhs.minus3"
  ]);
});
