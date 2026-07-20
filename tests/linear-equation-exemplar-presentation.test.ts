import assert from "node:assert/strict";
import test from "node:test";

import {
  linearEquationSecondaryFeatureIds,
  symbolicFirstLinearEquationPresentation
} from "../src/app-adapters/linear-equation-exemplar-presentation.ts";

test("linear equation exemplar opens as symbolic left-to-right scrollytelling", () => {
  const presentation = symbolicFirstLinearEquationPresentation;

  assert.equal(presentation.opening.projection, "symbolic");
  assert.deepEqual(presentation.opening.readingOrder, ["explanation", "stage"]);
  assert.equal(presentation.opening.autoPlay, false);
  assert.equal(presentation.opening.continuousScrollScrub, false);
  assert.equal(presentation.canonicalAnimation.selectionId, "linear-equation-solve-x");
  assert.equal(presentation.canonicalAnimation.presentationRecipe, "continuity-v1");
});

test("secondary features remain available but outside the opening composition", () => {
  const presentation = symbolicFirstLinearEquationPresentation;

  assert.equal(presentation.secondarySurface.kind, "disclosure");
  assert.equal(presentation.secondarySurface.label, "Explore more");
  assert.deepEqual(presentation.secondarySurface.features, linearEquationSecondaryFeatureIds);
  assert.ok(presentation.secondarySurface.features.includes("geometric-proof"));
  assert.ok(presentation.secondarySurface.features.includes("harder-example"));
  assert.equal(Object.isFrozen(presentation), true);
  assert.equal(Object.isFrozen(presentation.opening), true);
  assert.equal(Object.isFrozen(presentation.secondarySurface.features), true);
});
