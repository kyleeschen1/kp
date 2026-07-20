import assert from "node:assert/strict";
import test from "node:test";

import {
  searchableLinearEquationStoryText,
  solveXPlusThreeSymbolicStory
} from "../content/mathematics/linear-equations/solve-with-balance/symbolic-story.ts";
import {
  createLinearSolveKpAssetBundle
} from "../src/semantic/linear-solve-asset.ts";

test("symbolic story composes searchable prose around the canonical animation", () => {
  assert.equal(solveXPlusThreeSymbolicStory.animationId, "linear-equation-solve-x");
  assert.deepEqual(
    solveXPlusThreeSymbolicStory.beats.map((beat) => beat.progressPermille),
    [0, 333, 667, 1000]
  );
  assert.match(searchableLinearEquationStoryText(solveXPlusThreeSymbolicStory), /Subtract 3 from both sides/);
  assert.match(searchableLinearEquationStoryText(solveXPlusThreeSymbolicStory), /x = 4/);
});

test("every story focus resolves to a canonical asset object or transformation", () => {
  const asset = createLinearSolveKpAssetBundle();
  const knownIds = new Set([
    ...asset.bundle.objects.map((object) => object.id),
    ...asset.transformations.map((transformation) => transformation.id)
  ]);

  for (const beat of solveXPlusThreeSymbolicStory.beats) {
    for (const semanticRef of beat.focus) assert.ok(knownIds.has(semanticRef), semanticRef);
  }
});
