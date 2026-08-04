import assert from "node:assert/strict";
import test from "node:test";

import {
  readKpTutorialReviewEvidence,
  writeKpTutorialReviewEvidence
} from "../src/dev-review/tutorial-review-evidence.ts";

test("tutorial review extensions round-trip through one bounded generic seam", () => {
  const root = element();
  writeKpTutorialReviewEvidence(root, {
    expression: {
      expressionId: "expr.body",
      operation: "propagate",
      syntaxPath: ["expr.application", "expr.lambda", "expr.body"],
      depth: 2,
      sourceIdentityIds: ["binding.x"],
      destinationIdentityIds: ["destination.body.x"]
    },
    checkpointClass: "minor-transition",
    themeId: "theme.kp.lesson.lisp-paper-v1",
    tuning: { compression: "0.58" }
  });
  assert.deepEqual(readKpTutorialReviewEvidence(root), {
    expression: {
      expressionId: "expr.body",
      operation: "propagate",
      syntaxPath: ["expr.application", "expr.lambda", "expr.body"],
      depth: 2,
      sourceIdentityIds: ["binding.x"],
      destinationIdentityIds: ["destination.body.x"]
    },
    checkpointClass: "minor-transition",
    themeId: "theme.kp.lesson.lisp-paper-v1",
    tuning: { compression: "0.58" }
  });
});

test("generic tutorial evidence rejects malformed domain payloads", () => {
  const root = element();
  root.dataset["kpTutorialReviewEvidence"] = JSON.stringify({
    expression: {
      syntaxPath: ["unsafe path"],
      sourceIdentityIds: [],
      destinationIdentityIds: []
    }
  });
  assert.throws(() => readKpTutorialReviewEvidence(root), /expected string matching/);
});

function element(): HTMLElement {
  return { dataset: {} } as unknown as HTMLElement;
}
