import assert from "node:assert/strict";
import test from "node:test";
import { createKpReasoningSource, KpReasoningRepairGap } from "../src/experiments/reusable-reasoning/source.ts";
import { bindKpReasoningEvidence } from "../src/experiments/reusable-reasoning/evidence.ts";
import { bindKpReasoningLocalReferences, pinKpReasoningReference, resolveKpReasoningReference } from "../src/experiments/reusable-reasoning/references.ts";

test("local reasoning references preserve exact IDs, revision and no playback authority", () => {
  const evidence = bindKpReasoningEvidence(createKpReasoningSource());
  const refs = bindKpReasoningLocalReferences(evidence);
  for (const reference of [refs.parentSource, refs.parentTarget, ...refs.operations, ...refs.definitions, ...refs.assumptions]) {
    const resolved = resolveKpReasoningReference(evidence, JSON.parse(JSON.stringify(reference)));
    assert.equal(resolved.id, reference.id);
    assert.equal(reference.revisionId, evidence.revisionId);
    assert.equal(reference.timelineAuthority, "none");
  }
});

test("same semantic ID in another authored revision is stale until explicitly repinned", () => {
  const source = createKpReasoningSource();
  const before = bindKpReasoningEvidence(source);
  const after = bindKpReasoningEvidence({ ...source, title: "Another revision" });
  const ref = pinKpReasoningReference(before, "state", source.parent.sourceStateId);
  assert.throws(() => resolveKpReasoningReference(after, ref), error =>
    error instanceof KpReasoningRepairGap && error.code === "kp.reasoning.stale-reference");
  assert.equal(resolveKpReasoningReference(after,
    pinKpReasoningReference(after, "state", ref.id)).id, ref.id);
});

test("references reject foreign sources, wrong kinds, labels and playback authority", () => {
  const evidence = bindKpReasoningEvidence(createKpReasoningSource());
  const ref = pinKpReasoningReference(evidence, "state", evidence.source.parent.sourceStateId);
  assert.throws(() => resolveKpReasoningReference(evidence, { ...ref, sourceId: "foreign" }), KpReasoningRepairGap);
  assert.throws(() => resolveKpReasoningReference(evidence, { ...ref, kind: "operation" }), KpReasoningRepairGap);
  assert.throws(() => pinKpReasoningReference(evidence, "definition", "Common factor"), KpReasoningRepairGap);
  assert.throws(() => resolveKpReasoningReference(evidence,
    JSON.parse(JSON.stringify({ ...ref, timelineAuthority: "play" }))), KpReasoningRepairGap);
});

test("a reference envelope cannot rescue a forged evidence object", () => {
  const evidence = bindKpReasoningEvidence(createKpReasoningSource());
  assert.throws(() => bindKpReasoningLocalReferences({ ...evidence }), KpReasoningRepairGap);
});
