import assert from "node:assert/strict";
import test from "node:test";

import {
  kpNormalMatrixProofCheckpointTimeMs
} from "../src/semantic/normal-matrix-proof-checkpoints.ts";
import {
  checkKpNormalMatrixProofPrompts,
  findKpNormalMatrixProofPrompt,
  kpNormalMatrixProofPromptIds,
  kpNormalMatrixProofPrompts
} from "../src/semantic/normal-matrix-proof-prompts.ts";

test("all eleven proof prompts validate over the same semantic asset", () => {
  assert.deepEqual(checkKpNormalMatrixProofPrompts(), []);
  assert.deepEqual(
    kpNormalMatrixProofPrompts.map(({ id }) => id),
    kpNormalMatrixProofPromptIds
  );
  assert.equal(kpNormalMatrixProofPrompts.length, 11);
});

test("prompt time is derived from checkpoint authority", () => {
  for (const prompt of kpNormalMatrixProofPrompts) {
    assert.equal(
      prompt.card.timeMs,
      kpNormalMatrixProofCheckpointTimeMs(prompt.checkpointId)
    );
  }
  assert.equal(
    findKpNormalMatrixProofPrompt("predict-row-remainder").checkpointId,
    "norm-equation"
  );
});

test("prediction answer names the authored zero-row transformation", () => {
  const prediction = findKpNormalMatrixProofPrompt("predict-row-remainder");

  assert.equal(prediction.card.kind, "predict-next");
  assert.deepEqual(prediction.card.answer, {
    kind: "transformation",
    value: "transform.normal-proof.force-row-remainder-zero"
  });
  assert.ok(prediction.card.selectorIds?.some((id) => id.endsWith("matrix.row-remainder")));
});

test("prompt validation rejects unresolved semantic and answer references", () => {
  const source = kpNormalMatrixProofPrompts[0]!;
  const invalid = {
    ...source,
    card: {
      ...source.card,
      selectorIds: ["selector.normal-proof.missing"],
      answer: {
        kind: "transformation" as const,
        value: "transform.normal-proof.missing"
      }
    }
  };
  const issues = checkKpNormalMatrixProofPrompts([invalid]);

  assert.ok(issues.some((issue) => issue.includes("missing selector")));
  assert.ok(issues.some((issue) => issue.includes("unknown transformation")));
  assert.ok(issues.some((issue) => issue.includes("all eleven")));
});
