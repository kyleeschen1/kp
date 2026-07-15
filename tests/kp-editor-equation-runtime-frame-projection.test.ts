import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import {
  projectKpEditorEquationRuntimeFrame
} from "../src/editor/equation-runtime-frame-projection.ts";

test("equation runtime projection exposes honest source, target, focus, and correspondence", () => {
  const catalog = createKpAnimationAssets();
  const animation = catalog.find(
    (candidate) => candidate.id === "animation.linear-solve.solve-x"
  );
  assert.ok(animation);

  const projection = projectKpEditorEquationRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      childAnimations: catalog,
      progress: 0.5
    })
  });
  const [transition] = projection.transitions;

  assert.equal(projection.kind, "editor-equation-runtime-frame");
  assert.equal(transition?.id, "transform.linear-solve.cancel-left-additive-inverse");
  assert.deepEqual(transition?.source.map((object) => object.latex), [
    "x + 3 - 3 = 7 - 3"
  ]);
  assert.deepEqual(transition?.target.map((object) => object.latex), [
    "x = 7 - 3"
  ]);
  assert.equal(transition?.correspondence.length, 4);
  assert.deepEqual(projection.focusSelectorIds, [
    "equation.linear-solve.after-subtract.lhs.plus3",
    "equation.linear-solve.after-subtract.lhs.minus3"
  ]);
  assert.equal(
    transition?.source[0]?.selectors.filter((selector) => selector.focused).length,
    2
  );
  assert.deepEqual(projection.diagnostics, []);
});

test("equation runtime projection mirrors source, target, and correspondence for rewind", () => {
  const animation = createKpAnimationAssets().find(
    (candidate) => candidate.id === "animation.linear-solve.solve-x"
  );
  assert.ok(animation);

  const forwardTransformation = animation.transformations[1]!;
  const projection = projectKpEditorEquationRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      direction: "rewind",
      progress: 0.5
    })
  });
  const [transition] = projection.transitions;

  assert.deepEqual(transition?.source.map((object) => object.latex), ["x = 7 - 3"]);
  assert.deepEqual(transition?.target.map((object) => object.latex), [
    "x + 3 - 3 = 7 - 3"
  ]);
  assert.equal(
    transition?.correspondence[0]?.sourceSelectorId,
    forwardTransformation.correspondence[0]?.targetSelectorId
  );
  assert.equal(
    transition?.correspondence[0]?.targetSelectorId,
    forwardTransformation.correspondence[0]?.sourceSelectorId
  );
});

test("equation runtime projection expands comparison targets into their source forms", () => {
  const animation = createKpAnimationAssets().find(
    (candidate) => candidate.id === "animation.comparison.jacobian-hessian"
  );
  assert.ok(animation);

  const projection = projectKpEditorEquationRuntimeFrame({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      progress: 1
    })
  });
  const [transition] = projection.transitions;

  assert.equal(transition?.target.length, 2);
  assert.match(transition?.target[0]?.latex ?? "", /J_f/);
  assert.match(transition?.target[1]?.latex ?? "", /H_f/);
  assert.deepEqual(projection.diagnostics, []);
});
