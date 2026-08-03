import assert from "node:assert/strict";
import test from "node:test";

import { sampleKpLispLambdaApplicationRuntimeFrame } from "../src/animation/lisp-lambda-application-runtime-frame.ts";
import { renderKpLispLambdaApplicationHtml } from "../src/rendering/lisp-lambda-application-html.ts";
import { createKpLispLambdaApplicationAsset } from "../src/semantic/lisp-lambda-application-asset.ts";

const asset = createKpLispLambdaApplicationAsset();
const render = (progress: number) => renderKpLispLambdaApplicationHtml(
  sampleKpLispLambdaApplicationRuntimeFrame({ asset, progress })
);

test("every settled expression is native selectable code", () => {
  const html = render(1);

  assert.match(html, /<code data-kp-lisp-native-code="application">\(\(lambda \(x\) \(\+ x 1\)\) 4\)<\/code>/);
  assert.match(html, /<code data-kp-lisp-native-code="reconstructed">\(\+ 4 1\)<\/code>/);
  assert.match(html, /<code data-kp-lisp-native-code="result">5<\/code>/);
  assert.doesNotMatch(html, /<svg|<canvas|<path/u);
});

test("renderer keeps transient motion separate from native checkpoint truth", () => {
  const html = render(0.55);

  assert.match(html, /data-kp-lisp-native-layer/);
  assert.match(html, /data-kp-lisp-motion-layer aria-hidden="true"/);
  assert.match(html, /data-kp-lisp-expression="reconstructed" data-kp-lisp-current="true"/);
  assert.match(html, /data-kp-lisp-checkpoint="binding-established"/);
});

test("each frame exposes equivalent nonvisual state", () => {
  for (const progress of [0, 0.3, 0.55, 0.85, 1]) {
    const html = render(progress);
    assert.match(html, /data-kp-lisp-accessible-state aria-live="polite">[^<]+<\/p>/);
    assert.match(html, /aria-label="[^"]+"/);
  }
});

test("renderer derives visibility from the supplied frame only", () => {
  assert.equal(render(0.55), render(0.55));
  assert.match(render(1), /data-kp-lisp-stage="settle"/);
  assert.match(render(1), /data-kp-lisp-current="true" style="--kp-lisp-expression-opacity:1\.0000"/);
});
