import assert from "node:assert/strict";
import test from "node:test";

import { createKpLispBotanicalPresentationPlan } from "../src/animation/lisp-botanical-presentation-plan.ts";
import { sampleKpLispLambdaApplicationRuntimeFrame } from "../src/animation/lisp-lambda-application-runtime-frame.ts";
import { renderKpLispBotanicalStageHtml } from "../src/rendering/lisp-botanical-stage-html.ts";
import { createKpLispLambdaApplicationAsset } from "../src/semantic/lisp-lambda-application-asset.ts";
import {
  projectKpLispLessonSalience,
  resolveKpLispSalienceState
} from "../src/tutorial/lisp-function-application/lisp-function-application-salience.ts";
import type { KpLispLessonMotionBlockId } from
  "../src/tutorial/lisp-function-application/lisp-function-application-motion-blocks.ts";

const asset = createKpLispLambdaApplicationAsset();
const plan = createKpLispBotanicalPresentationPlan(asset);

function projection(
  progress: number,
  activeBlockId: KpLispLessonMotionBlockId,
  localProgress = progress
) {
  const frame = sampleKpLispLambdaApplicationRuntimeFrame({ asset, progress });
  return {
    frame,
    salience: projectKpLispLessonSalience({
      frame,
      plan,
      activeBlockId,
      localProgress
    })
  };
}

test("semantic stages project exact targets while retaining named context", () => {
  assert.deepEqual(projection(0, "structure").salience.targetNodeIds, [
    "botanical.application"
  ]);
  assert.deepEqual(projection(0.34, "application").salience.targetNodeIds, [
    "botanical.binder",
    "botanical.argument",
    "botanical.environment"
  ]);
  assert.deepEqual(projection(0.72, "application").salience.targetNodeIds, [
    "botanical.reconstructed"
  ]);
  assert.deepEqual(projection(0.96, "evaluation").salience.targetNodeIds, [
    "botanical.result"
  ]);
  assert.equal(projection(0.5, "application").salience.attenuation, 0.58);
});

test("passage emphasis changes state without changing authored prose", () => {
  assert.equal(
    projection(0, "structure", 0.3).salience.activePassageId,
    "structure-before"
  );
  assert.equal(
    projection(0, "structure", 1).salience.activePassageId,
    "structure-after"
  );
  assert.equal(
    projection(0.8, "evaluation", 0.3).salience.activePassageId,
    "evaluation-before"
  );
  assert.equal(
    projection(0.96, "evaluation", 1).salience.activePassageId,
    "evaluation-after"
  );
});

test("renderer marks targets context and attenuated material without hiding native code", () => {
  const { frame, salience } = projection(0.5, "application");
  const html = renderKpLispBotanicalStageHtml({ frame, plan, salience });
  assert.match(html, /data-kp-lisp-botanical-node="botanical\.reconstructed" data-kp-lisp-salience="target"/);
  assert.match(html, /data-kp-lisp-botanical-node="botanical\.reference" data-kp-lisp-salience="context"/);
  assert.match(html, /data-kp-lisp-botanical-path="botanical\.path\.bind"[^>]*data-kp-lisp-salience="target"/);
  assert.match(html, /data-kp-lisp-botanical-path="botanical\.path\.reconstruct"[^>]*data-kp-lisp-salience="target"/);
  assert.match(html, /data-kp-lisp-botanical-path="botanical\.path\.evaluate"[^>]*data-kp-lisp-salience="attenuated"/);
  assert.match(html, /data-kp-lisp-native-code="reconstructed">\(\+ 4 1\)<\/code>/);
});

test("target precedence keeps semantic focus stronger than contextual overlap", () => {
  assert.equal(resolveKpLispSalienceState({
    id: "botanical.result",
    targets: ["botanical.result"],
    context: ["botanical.result"]
  }), "target");
});
