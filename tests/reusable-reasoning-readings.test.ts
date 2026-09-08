import assert from "node:assert/strict";
import test from "node:test";
import { createKpReasoningSource } from "../src/experiments/reusable-reasoning/source.ts";
import { bindKpReasoningEvidence } from "../src/experiments/reusable-reasoning/evidence.ts";
import { projectReasoningReading } from "../src/experiments/reusable-reasoning/readings.ts";
import { reasoningBeats, renderReasoningPage } from "../src/experiments/reusable-reasoning/scaffold.ts";

test("full and compact keep exactly the same revision, claims and required context", () => {
  const evidence = bindKpReasoningEvidence(createKpReasoningSource());
  const full = projectReasoningReading(evidence, "full");
  const compact = projectReasoningReading(evidence, "compact");
  for (const key of ["revisionId", "claims", "assumptions", "source", "target", "operations", "definitions"] as const)
    assert.deepEqual(full[key], compact[key]);
  assert.equal(compact.text, evidence.source.compact);
  assert.equal(compact.claims.length, 9);
  assert.equal(compact.editorialStatus, "editorial");
  assert.equal(reasoningBeats(evidence, "reason", "full").length, 5);
  for (const view of ["parent", "reason"] as const)
    for (const mode of ["full", "compact"] as const) {
      const beats = reasoningBeats(evidence, view, mode);
      assert.equal(beats.length, 5);
      assert.deepEqual(beats.map(beat => beat.attributes?.["data-reasoning-state"]),
        evidence.states.slice(0, 5).map(state => state.stateId));
    }
  assert.ok(Object.isFrozen(compact));
});

test("reading scaffold escapes editorial markup and never hides required qualifications", () => {
  const source = createKpReasoningSource();
  const evidence = bindKpReasoningEvidence({ ...source, compact: '<img src=x onerror="alert(1)">' });
  assert.match(reasoningBeats(evidence, "parent", "compact")[0]!.html, /&lt;img/);
  const page = renderReasoningPage(evidence);
  assert.match(page, /data-reasoning-context aria-label/);
  assert.match(page, /denominator 3 is nonzero/);
});
