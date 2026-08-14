import assert from "node:assert/strict";
import test from "node:test";

import {
  kpEigenvectorPublicPath,
  renderKpEigenvectorPublicLesson
} from "../src/public-web/eigenvector-attentional-surface-publication.ts";
import { kpEigenvectorTranscript } from
  "../src/tutorial/eigenvector-attentional-surface/eigenvector-transcript.ts";

test("the isolated public lesson publishes the approved route and static truth", () => {
  const html = renderKpEigenvectorPublicLesson();

  assert.equal(kpEigenvectorPublicPath, "/learn/math/eigenvectors/");
  for (const passage of kpEigenvectorTranscript) {
    assert.match(html, new RegExp(`id="${passage.beatId}"`));
    assert.match(html, new RegExp(passage.heading));
  }
  assert.equal((html.match(/data-kp-eigenvector-passage=/g) ?? []).length, 9);
});

test("the publication contains one stable stage and minimal fixed transport", () => {
  const html = renderKpEigenvectorPublicLesson();

  assert.equal((html.match(/data-kp-eigenvector-stage-host/g) ?? []).length, 1);
  assert.equal((html.match(/data-kp-eigenvector-transport-host/g) ?? []).length, 1);
  assert.doesNotMatch(html, /Play|Pause|Rewind|<iframe|<canvas/);
});

test("math is build-rendered KaTeX and learner actions have static fallbacks", () => {
  const html = renderKpEigenvectorPublicLesson();

  assert.match(html, /class="katex"/);
  assert.match(html, /data-kp-eigenvector-prediction-choice="maps-to-6v"/);
  assert.match(html, /data-kp-eigenvector-scalar-input/);
  assert.match(html, /Together with zero/);
});
