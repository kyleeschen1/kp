import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAnimationAsset
} from "../src/animation/asset.ts";
import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import {
  applyKpAnimationRepresentationTransform,
  checkKpAnimationRepresentationTransformLaw,
  createKpAnimationRepresentationTransform
} from "../src/animation/representation-transform.ts";

test("representation transforms preserve semantic animation structure", () => {
  const transform = createKpAnimationRepresentationTransform({
    id: "representation.equation-to-dashboard-preview",
    title: "Equation to dashboard preview",
    sourceRepresentation: "equation",
    targetRepresentation: "dashboard-preview",
    preservation: "strict",
    apply: (animation) =>
      createKpAnimationAsset({
        ...animation,
        renderTargets: animation.renderTargets.map((target) => ({
          ...target,
          summary: "Dashboard preview render target.",
          metadata: {
            ...(target.metadata ?? {}),
            representation: "dashboard-preview"
          }
        })),
        metadata: {
          ...(animation.metadata ?? {}),
          representation: "dashboard-preview"
        }
      })
  });
  const source = createLinearSolveAnimationAsset();
  const result = applyKpAnimationRepresentationTransform(transform, source);

  assert.equal(
    result.transformId,
    "representation.equation-to-dashboard-preview"
  );
  assert.equal(result.sourceAnimationId, "animation.linear-solve.solve-x");
  assert.equal(result.targetAnimation.metadata?.["representation"], "dashboard-preview");
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(checkKpAnimationRepresentationTransformLaw(transform, source), {
    lawId: "animation-representation.preservation",
    passed: true,
    failures: []
  });
});

test("representation transform law reports semantic identity loss", () => {
  const transform = createKpAnimationRepresentationTransform({
    id: "representation.drop-transform",
    title: "Drop transform",
    sourceRepresentation: "equation",
    targetRepresentation: "broken",
    preservation: "lossy",
    apply: (animation) =>
      createKpAnimationAsset({
        ...animation,
        transformations: animation.transformations.slice(0, -1)
      })
  });
  const source = createLinearSolveAnimationAsset();

  assert.deepEqual(checkKpAnimationRepresentationTransformLaw(transform, source), {
    lawId: "animation-representation.preservation",
    passed: false,
    failures: [
      {
        path: "target.transformations",
        message:
          "Representation transform representation.drop-transform must preserve transformation ids."
      }
    ]
  });
});

