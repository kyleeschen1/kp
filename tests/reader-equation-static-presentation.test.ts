import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpExplicitStaticCheckpointPlan
} from "../src/animation/operation-presentation-plan-types.ts";
import {
  createKpFractionCompositionEquationAnimationAsset
} from "../src/animation/fraction-composition-equation-adapter.ts";
import {
  createLinearSolveAnimationAsset,
  createLinearSolveTeacherZeroAnimationAsset
} from "../src/animation/linear-solve-adapter.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  decideKpEquationOperationChoreography
} from "../src/reader/renderers/equation-operation-choreography-compiler.ts";
import {
  projectKpReaderEquationRenderPlan,
  projectKpReaderEquationTransitionPresentation
} from "../src/reader/renderers/public-api.ts";

test("unmigrated cancellation families compile an explicit static checkpoint", () => {
  const canonical = createLinearSolveAnimationAsset();
  const teacherZero = createLinearSolveTeacherZeroAnimationAsset();

  for (const [animation, transformationId] of [
    [canonical, "transform.linear-solve.cancel-left-additive-inverse"],
    [teacherZero, "transform.linear-solve.expose-left-zero"]
  ] as const) {
    const index = animation.transformations.findIndex(
      ({ id }) => id === transformationId
    );
    const transition = projectKpReaderEquationRenderPlan({
      animation,
      runtimeFrame: sampleKpAnimationRuntimeFrame({
        animation,
        progress: (index + 0.5) / animation.transformations.length
      })
    }).transitions[0]!;
    const presentation = projectKpReaderEquationTransitionPresentation(
      transition.presentationPlan
    );

    assert.equal(transition.id, transformationId);
    assert.equal(
      transition.presentationPlan.planKind,
      "explicit-static-checkpoint"
    );
    assert.equal(
      presentation.staticCheckpoint?.reason,
      "missing-verified-plan"
    );
    assert.equal(presentation.operationChoreography, undefined);
  }
});

test("the approved fraction exemplar remains verified animated", () => {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  const transformation = animation.transformations.find(
    ({ id }) => id === "fraction-solve.step.cancel-additive-inverses"
  )!;
  const decision = decideKpEquationOperationChoreography({
    animation,
    transformation,
    motifKind: "cancelation",
    direction: "forward"
  });

  assert.equal(decision.status, "verified");
  if (decision.status !== "verified") return;
  assert.equal(
    decision.choreography.operationPresentationPlan?.planKind,
    "inverse-cancellation"
  );
});

test("static checkpoint construction rejects uninspectable evidence", () => {
  assert.throws(
    () => createKpExplicitStaticCheckpointPlan({
      transformationId: " ",
      reason: "unsupported-presentation",
      summary: "Unsupported."
    }),
    /requires a transformation id and summary/
  );
  assert.throws(
    () => createKpExplicitStaticCheckpointPlan({
      transformationId: "transform.static",
      reason: "unsupported-presentation",
      summary: " "
    }),
    /requires a transformation id and summary/
  );
});
