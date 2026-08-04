import assert from "node:assert/strict";
import test from "node:test";

import { createKpLispBotanicalPresentationPlan } from
  "../src/animation/lisp-botanical-presentation-plan.ts";
import { sampleKpLispLambdaApplicationRuntimeFrame } from
  "../src/animation/lisp-lambda-application-runtime-frame.ts";
import { createKpLispLambdaApplicationAsset } from
  "../src/semantic/lisp-lambda-application-asset.ts";
import {
  createKpLispLessonStageProjector,
  kpLispBotanicalRollbackRendererKind,
  kpLispDefaultLessonStageRendererKind,
  kpLispSExpressionMaterialRendererKind
} from "../src/tutorial/lisp-function-application/lisp-function-application-stage-projector.ts";

const source = createKpLispLambdaApplicationAsset();
const botanicalPlan = createKpLispBotanicalPresentationPlan(source);

test("defaults the existing lesson projection boundary to material motion", () => {
  const projector = createKpLispLessonStageProjector({ source, botanicalPlan });
  const runtimeFrame = sampleKpLispLambdaApplicationRuntimeFrame({
    asset: source,
    progress: 0.51
  });
  const html = projector.render({
    runtimeFrame,
    activeBlockId: "bind-and-reconstruct",
    localProgress: 0.5,
    availableWidthPx: 760
  });

  assert.equal(kpLispDefaultLessonStageRendererKind,
    kpLispSExpressionMaterialRendererKind);
  assert.equal(projector.rendererKind, kpLispSExpressionMaterialRendererKind);
  assert.match(html, /data-kp-lisp-lesson-stage-projection="lisp-s-expression-material-v0"/u);
  assert.match(html, /data-kp-lisp-application-stage/u);
  assert.match(html, new RegExp(`data-kp-lisp-runtime-frame="${runtimeFrame.id}"`, "u"));
  assert.equal(count(html, "data-kp-lisp-paint-owner="), 1);
  assert.doesNotMatch(html, /data-kp-lisp-botanical-stage/u);
});

test("maps the existing evaluation block to the causal material reduction", () => {
  const projector = createKpLispLessonStageProjector({ source, botanicalPlan });
  const runtimeFrame = sampleKpLispLambdaApplicationRuntimeFrame({
    asset: source,
    progress: 1
  });
  const html = projector.render({
    runtimeFrame,
    activeBlockId: "evaluate-and-gather",
    localProgress: 1,
    availableWidthPx: 390
  });

  assert.match(html, /data-kp-lisp-evaluation-stage/u);
  assert.match(html, /data-kp-lisp-native-code="result"/u);
  assert.match(html, />5<\/span>/u);
  assert.equal(count(html, "data-kp-lisp-paint-owner="), 1);
});

test("keeps botanical paint behind an explicit inactive rollback selector", () => {
  const projector = createKpLispLessonStageProjector({
    source,
    botanicalPlan,
    rendererKind: kpLispBotanicalRollbackRendererKind
  });
  const runtimeFrame = sampleKpLispLambdaApplicationRuntimeFrame({
    asset: source,
    progress: 0.5
  });
  const html = projector.render({
    runtimeFrame,
    activeBlockId: "bind-and-reconstruct",
    localProgress: 0.5,
    availableWidthPx: 760
  });

  assert.equal(projector.rendererKind, kpLispBotanicalRollbackRendererKind);
  assert.match(html, /data-kp-lisp-lesson-stage-projection="lisp-botanical-local-v0"/u);
  assert.match(html, /data-kp-lisp-botanical-stage/u);
  assert.doesNotMatch(html, /data-kp-lisp-application-stage/u);
});

test("rejects invalid presentation coordinates without mutating runtime truth", () => {
  const projector = createKpLispLessonStageProjector({ source, botanicalPlan });
  const runtimeFrame = sampleKpLispLambdaApplicationRuntimeFrame({
    asset: source,
    progress: 0.34
  });
  assert.throws(() => projector.render({
    runtimeFrame,
    activeBlockId: "bind-and-reconstruct",
    localProgress: Number.NaN,
    availableWidthPx: 760
  }), /progress must be finite/u);
  assert.equal(runtimeFrame.progress, 0.34);
  assert.equal(runtimeFrame.checkpointId, "binding-established");
});

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}
