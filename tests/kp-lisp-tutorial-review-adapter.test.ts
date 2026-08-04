import assert from "node:assert/strict";
import test from "node:test";

import { createKpLispLambdaApplicationAsset } from
  "../src/semantic/lisp-lambda-application-asset.ts";
import {
  createKpLispLessonReviewAdapter,
  kpLispLessonReviewThemeId
} from "../src/tutorial/lisp-function-application/lisp-function-application-review-adapter.ts";

test("Lisp review evidence projects certified structure without provider knowledge", () => {
  const root = element();
  const adapter = createKpLispLessonReviewAdapter({
    root,
    source: createKpLispLambdaApplicationAsset()
  });
  const structure = adapter.project({
    activeBlockId: "structure",
    localProgress: 0
  });
  assert.equal(structure.expression.operation, "activate");
  assert.deepEqual(structure.expression.syntaxPath, ["expr.application"]);
  assert.equal(structure.checkpointClass, "major-hold");
  assert.equal(structure.themeId, kpLispLessonReviewThemeId);
  assert.equal(Object.keys(structure.tuning).length, 8);

  const binding = adapter.project({
    activeBlockId: "application",
    localProgress: 0.5
  });
  assert.equal(binding.expression.operation, "propagate");
  assert.equal(binding.expression.depth, 3);
  assert.deepEqual(binding.expression.destinationIdentityIds, [
    "destination.body.x",
    "occurrence.x.reference"
  ]);
});

function element(): HTMLElement {
  return { dataset: {} } as unknown as HTMLElement;
}
