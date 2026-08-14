import assert from "node:assert/strict";
import test from "node:test";

import {
  projectKpEigenvectorTransport,
  renderKpEigenvectorTransportHtml
} from "../src/tutorial/eigenvector-attentional-surface/eigenvector-transport.ts";

test("transport projects stable neighbors and progress", () => {
  assert.deepEqual(projectKpEigenvectorTransport("one-direction-survives"), {
    currentBeatId: "one-direction-survives",
    current: 3,
    total: 9,
    previousBeatId: "watch-the-fan",
    nextBeatId: "geometry-becomes-equation",
    status: "Moment 3 of 9: One direction survives"
  });
});

test("boundary controls are visibly and semantically unavailable", () => {
  const first = renderKpEigenvectorTransportHtml("most-vectors-turn");
  const last = renderKpEigenvectorTransportHtml("compressed-recall");

  assert.match(first, /data-kp-eigenvector-previous aria-disabled="true"/);
  assert.match(first, /href="#watch-the-fan"/);
  assert.match(last, /href="#reveal-the-eigenspace"/);
  assert.match(last, /data-kp-eigenvector-next aria-disabled="true"/);
});

test("transport remains useful as static HTML before enhancement", () => {
  const html = renderKpEigenvectorTransportHtml("geometry-becomes-equation");

  assert.match(html, /<nav/);
  assert.match(html, /<progress[^>]+max="9"[^>]+value="4"/);
  assert.match(html, /href="#one-direction-survives"/);
  assert.match(html, /href="#name-the-scale-factor"/);
  assert.match(html, /aria-live="polite"/);
  assert.doesNotMatch(html, /Play|Pause|Rewind/);
});
