import assert from "node:assert/strict";
import test from "node:test";
import {
  kpCancellationPresentationIntentVocabulary,
  type KpCancellationPresentationIntent
} from "../src/semantic/cancellation-presentation-intent.ts";

const representativeIntent = {
  contact: "shared-center",
  approach: "opposing-arcs",
  identityBeat: "explicit",
  retirement: "after-contact",
  readability: "through-contact"
} as const satisfies KpCancellationPresentationIntent;

test("cancellation intent has a small renderer-neutral vocabulary", () => {
  assert.deepEqual(kpCancellationPresentationIntentVocabulary, {
    contact: ["shared-center"],
    approach: ["opposing-arcs", "direct-convergence"],
    identityBeat: ["implicit", "explicit"],
    retirement: ["after-contact"],
    readability: ["through-contact"]
  });
  assert.equal(representativeIntent.approach, "opposing-arcs");

  const vocabularyValues = Object.values(
    kpCancellationPresentationIntentVocabulary
  ).flat();
  assert.deepEqual(
    vocabularyValues.filter((value) => value.endsWith("-v1")),
    []
  );
});

test("cancellation intent vocabulary is deeply immutable", () => {
  assert.equal(Object.isFrozen(kpCancellationPresentationIntentVocabulary), true);
  for (const values of Object.values(
    kpCancellationPresentationIntentVocabulary
  )) {
    assert.equal(Object.isFrozen(values), true);
  }
});
