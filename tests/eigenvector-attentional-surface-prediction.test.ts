import assert from "node:assert/strict";
import test from "node:test";

import {
  evaluateKpEigenvectorPrediction,
  kpEigenvectorPrediction
} from "../src/tutorial/eigenvector-attentional-surface/eigenvector-prediction.ts";

test("the prediction asks for a consequence before the reveal beat", () => {
  assert.equal(
    kpEigenvectorPrediction.prompt,
    "If A sends v to 3v, where must it send 2v?"
  );
  assert.deepEqual(kpEigenvectorPrediction.source, [2, 2]);
  assert.deepEqual(
    kpEigenvectorPrediction.choices.map(({ label }) => label),
    ["6v", "3v", "a new direction"]
  );
});

test("only the linearity consequence unlocks the reveal", () => {
  const correct = evaluateKpEigenvectorPrediction("maps-to-6v");
  const sameImage = evaluateKpEigenvectorPrediction("maps-to-3v");
  const turned = evaluateKpEigenvectorPrediction("changes-direction");

  assert.equal(correct.correct, true);
  assert.equal(correct.revealBeatId, "verify-the-multiple");
  assert.deepEqual(
    kpEigenvectorPrediction.choices[0]?.destination,
    [6, 6]
  );
  assert.equal(sameImage.correct, false);
  assert.equal(turned.correct, false);
  assert.equal(sameImage.revealBeatId, undefined);
  assert.equal(turned.revealBeatId, undefined);
});

test("feedback explains linearity without changing semantic state", () => {
  assert.match(
    evaluateKpEigenvectorPrediction("maps-to-6v").feedback,
    /A\(2v\) = 2Av = 6v/
  );
  assert.equal(
    evaluateKpEigenvectorPrediction("maps-to-3v").feedback,
    "Keep the scalar outside: A(2v) = 2Av."
  );
});
