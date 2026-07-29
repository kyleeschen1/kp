import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  kpOperationEvaluationReferenceCandidates
} from "../src/architecture/operation-evaluation-reference-candidates.ts";

test("operation evaluation references preserve one unselected historical candidate", () => {
  assert.equal(kpOperationEvaluationReferenceCandidates.length, 3);
  assert.equal(
    new Set(kpOperationEvaluationReferenceCandidates.map(({ id }) => id)).size,
    3
  );
  assert.deepEqual(
    kpOperationEvaluationReferenceCandidates.map(({ disposition }) =>
      disposition
    ),
    ["reference-candidate", "rejected", "rejected"]
  );
  assert.equal(
    "selected" in kpOperationEvaluationReferenceCandidates[0]!,
    false
  );
});

test("reference provenance uses immutable commits and source-backed evidence", async () => {
  const sha = /^[0-9a-f]{40}$/;
  for (const candidate of kpOperationEvaluationReferenceCandidates) {
    assert.ok(candidate.provenance.commitIds.every((id) => sha.test(id)));
    for (const evidence of candidate.provenance.reviewEvidence) {
      const [path, fragment] = evidence.split("#");
      assert.ok(path);
      assert.ok(fragment);
      const source = await readFile(path!, "utf8");
      assert.ok(
        source.includes(fragment!),
        `${candidate.id} lost review evidence ${fragment}`
      );
    }
  }
});

test("the recoverable candidate retains positive evaluation phases", async () => {
  const candidate = kpOperationEvaluationReferenceCandidates[0]!;
  assert.deepEqual(candidate.execution.phases, [
    "orient",
    "converge",
    "synthesize",
    "recognize",
    "retire",
    "settled"
  ]);
  assert.equal(candidate.execution.paintTransfer, "bounded-co-presence");
  assert.ok(candidate.preservedBehavior.some((behavior) =>
    behavior.includes("operator participates")
  ));

  const samplerSource = await readFile(
    "src/animation/successor-synthesis.ts",
    "utf8"
  );
  assert.ok(
    samplerSource.includes("export function sampleKpSuccessorSynthesis")
  );
  for (const phase of candidate.execution.phases) {
    assert.ok(samplerSource.includes(`"${phase}"`));
  }
});

test("rejected continuity wrappers record the distinct failure mechanisms", () => {
  const [, binary, zeroArea] = kpOperationEvaluationReferenceCandidates;
  assert.equal(binary?.execution.paintTransfer, "binary-owner-swap");
  assert.ok(binary?.knownDefects.some((defect) =>
    defect.includes("atomically swapped")
  ));
  assert.equal(
    zeroArea?.execution.paintTransfer,
    "shared-zero-area-junction"
  );
  assert.ok(zeroArea?.knownDefects.some((defect) =>
    defect.includes("zero area")
  ));
  assert.ok(zeroArea?.knownDefects.some((defect) =>
    defect.includes("positive evaluation choreography")
  ));
});
