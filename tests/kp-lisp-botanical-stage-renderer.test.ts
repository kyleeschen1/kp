import assert from "node:assert/strict";
import test from "node:test";

import { createKpLispBotanicalPresentationPlan } from "../src/animation/lisp-botanical-presentation-plan.ts";
import { sampleKpLispLambdaApplicationRuntimeFrame } from "../src/animation/lisp-lambda-application-runtime-frame.ts";
import { renderKpLispBotanicalStageHtml } from "../src/rendering/lisp-botanical-stage-html.ts";
import { createKpLispLambdaApplicationAsset } from "../src/semantic/lisp-lambda-application-asset.ts";

const asset = createKpLispLambdaApplicationAsset();
const plan = createKpLispBotanicalPresentationPlan(asset);
const render = (progress: number, reducedMotion = false) =>
  renderKpLispBotanicalStageHtml({
    frame: sampleKpLispLambdaApplicationRuntimeFrame({ asset, progress }),
    plan,
    reducedMotion
  });

test("botanical stage renders every local role and semantic path", () => {
  const html = render(0.55);
  for (const { id } of plan.nodes) assert.match(html, new RegExp(id));
  for (const { id } of plan.paths) assert.match(html, new RegExp(id));
  assert.match(html, /data-kp-lisp-botanical-mode="animated"/);
});

test("native code remains present beneath the aria-hidden botanical projection", () => {
  const html = render(1);
  assert.match(html, /role="presentation" aria-hidden="true"/);
  assert.match(html, /data-kp-lisp-native-code="reconstructed">\(\+ 4 1\)<\/code>/);
  assert.match(html, /data-kp-lisp-native-code="result">5<\/code>/);
  assert.match(html, /data-kp-lisp-accessible-state/);
});

test("absolute progress makes direct seek and rewind render identically", () => {
  for (let index = 0; index <= 40; index += 1) {
    const progress = index / 40;
    assert.equal(render(progress), render(progress));
  }
});

test("reduced motion removes travel while preserving settled semantics", () => {
  const midpoint = render(0.55, true);
  const settled = render(1, true);
  assert.match(midpoint, /data-kp-lisp-botanical-mode="reduced"/);
  assert.match(midpoint, /--kp-lisp-substitute:0\.0000/);
  assert.match(settled, /--kp-lisp-evaluate:1\.0000/);
  assert.match(settled, /data-kp-lisp-native-code="result">5<\/code>/);
});
