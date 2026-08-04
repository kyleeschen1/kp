import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createKpLispBotanicalPresentationPlan } from "../src/animation/lisp-botanical-presentation-plan.ts";
import { sampleKpLispLambdaApplicationRuntimeFrame } from "../src/animation/lisp-lambda-application-runtime-frame.ts";
import { createKpLispLambdaApplicationAsset } from "../src/semantic/lisp-lambda-application-asset.ts";
import { compileKpLispFunctionApplicationPublication } from "../src/tutorial/lisp-function-application/lisp-function-application-publication.ts";
import { renderKpLispFunctionApplicationStaticPublication } from "../src/tutorial/lisp-function-application/lisp-function-application-static-publication.ts";
import { createKpLispLessonStageProjector } from "../src/tutorial/lisp-function-application/lisp-function-application-stage-projector.ts";

const markdown = await readFile(
  new URL("../content/lessons/programming-lisp-function-application.md", import.meta.url),
  "utf8"
);
const asset = createKpLispLambdaApplicationAsset();
const publication = compileKpLispFunctionApplicationPublication(markdown);
const runtimeFrame = sampleKpLispLambdaApplicationRuntimeFrame({
  asset,
  progress: 0
});
const stage = createKpLispLessonStageProjector({
  source: asset,
  botanicalPlan: createKpLispBotanicalPresentationPlan(asset)
});
const html = renderKpLispFunctionApplicationStaticPublication({
  publication,
  animationId: asset.id,
  stageHtml: stage.render({
    runtimeFrame,
    activeBlockId: "structure",
    localProgress: 0,
    availableWidthPx: 720,
    reducedMotion: true
  })
});

test("static Lisp publication preserves complete prose navigation and native code", () => {
  assert.match(html, /data-kp-lisp-tutorial-projection="static"/);
  assert.match(html, /data-kp-tutorial-shell data-kp-tutorial-shell-toc="rail"/);
  assert.match(html, /class="kp-tutorial-shell__layout kp-lisp-tutorial__layout"/);
  assert.equal((html.match(/<h3 /g) ?? []).length, 4);
  assert.equal((html.match(/data-kp-tutorial-motion-block=/g) ?? []).length, 3);
  const nativeApplication = html.match(
    /<code data-kp-lisp-native-code="application">([\s\S]*?)<\/code>/
  )?.[1];
  assert.equal(
    nativeApplication?.replace(/<[^>]+>/g, ""),
    "((lambda (x) (+ x 1)) 4)"
  );
  assert.match(html, /data-kp-tutorial-scrub-enhancement="pending"/);
  assert.match(html, /<button[^>]*data-action="toggle" disabled>Play<\/button>/);
});

test("native settled layers expose only the current expression to assistive technology", () => {
  assert.equal((html.match(/data-kp-lisp-native-code=/g) ?? []).length, 1);
  assert.match(html, /data-kp-lisp-motion-mode="reduced"/);
  assert.match(html, /role="status" aria-live="polite" aria-atomic="true"/);
});
