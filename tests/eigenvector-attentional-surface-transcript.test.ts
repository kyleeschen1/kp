import assert from "node:assert/strict";
import test from "node:test";

import { kpEigenvectorBeatIds } from
  "../src/tutorial/eigenvector-attentional-surface/eigenvector-endpoints.ts";
import {
  checkKpEigenvectorTranscript,
  findKpEigenvectorPassage,
  kpEigenvectorSearchableText,
  kpEigenvectorTranscript
} from "../src/tutorial/eigenvector-attentional-surface/eigenvector-transcript.ts";

test("the complete transcript matches all nine semantic beats", () => {
  assert.deepEqual(checkKpEigenvectorTranscript(), []);
  assert.deepEqual(
    kpEigenvectorTranscript.map(({ beatId }) => beatId),
    kpEigenvectorBeatIds
  );
});

test("the static text contains every concept needed to understand the stage", () => {
  for (const phrase of [
    "change direction",
    "does not rotate",
    "Av = 3v",
    "Av = λv",
    "2v",
    "linearity",
    "eigenspace",
    "span(v)"
  ]) {
    assert.match(
      kpEigenvectorSearchableText,
      new RegExp(phrase.replace(/[()]/g, "\\$&"), "i")
    );
  }
});

test("the final beat is a compact reconstruction cue", () => {
  const recall = findKpEigenvectorPassage("compressed-recall");

  assert.equal(recall.heading, "Keep the small machine");
  assert.equal(
    recall.text,
    "The line survives. λ records what A does along it."
  );
  assert.ok(recall.text.split(/\s+/).length <= 12);
});

test("each passage fits the austere one-screen reading budget", () => {
  assert.ok(kpEigenvectorTranscript.every(({ text }) =>
    text.split(/\s+/).length <= 24
  ));
});
