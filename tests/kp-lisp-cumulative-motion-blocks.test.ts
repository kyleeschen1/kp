import assert from "node:assert/strict";
import test from "node:test";

import {
  projectKpLispLessonRuntimeProgress,
  projectKpLispBindAndReconstructProgress,
  projectKpLispEvaluateAndGatherProgress,
  unprojectKpLispBindAndReconstructProgress,
  unprojectKpLispEvaluateAndGatherProgress
} from "../src/tutorial/lisp-function-application/lisp-function-application-motion-controller.ts";

test("evaluation motion starts at reconstructed form and settles at result", () => {
  assert.equal(projectKpLispEvaluateAndGatherProgress(0), 0.74);
  assert.equal(projectKpLispEvaluateAndGatherProgress(1), 1);
  for (let index = 0; index <= 100; index += 1) {
    const local = index / 100;
    assert.ok(Math.abs(
      unprojectKpLispEvaluateAndGatherProgress(
        projectKpLispEvaluateAndGatherProgress(local)
      ) - local
    ) < 1e-12);
  }
});

test("later runtime state keeps application semantically complete", () => {
  for (let index = 0; index <= 100; index += 1) {
    const global = projectKpLispEvaluateAndGatherProgress(index / 100);
    assert.equal(unprojectKpLispBindAndReconstructProgress(global), 1);
  }
  assert.equal(unprojectKpLispEvaluateAndGatherProgress(0.4), 0);
});

test("application and evaluation share one exact runtime boundary", () => {
  assert.equal(
    projectKpLispBindAndReconstructProgress(1),
    projectKpLispEvaluateAndGatherProgress(0)
  );
});

test("structural motion advances locally without pretending to evaluate", () => {
  for (let index = 0; index <= 100; index += 1) {
    assert.equal(projectKpLispLessonRuntimeProgress("structure", index / 100), 0);
  }
  assert.equal(projectKpLispLessonRuntimeProgress("application", 1), 0.74);
  assert.equal(projectKpLispLessonRuntimeProgress("evaluation", 0), 0.74);
  assert.equal(projectKpLispLessonRuntimeProgress("evaluation", 1), 1);
});
