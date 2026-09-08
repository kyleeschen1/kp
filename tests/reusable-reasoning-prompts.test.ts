import assert from "node:assert/strict";
import test from "node:test";
import { createKpReasoningSource } from "../src/experiments/reusable-reasoning/source.ts";
import { bindKpReasoningEvidence } from "../src/experiments/reusable-reasoning/evidence.ts";
import { projectReasoningPrompts } from "../src/experiments/reusable-reasoning/prompts.ts";
import { createKpAuthoredDistributionProjection } from "../src/experiments/authoring-structural/distribution-projection.ts";

test("practice derives existing prediction and cloze projections from verified context", () => {
  const evidence = bindKpReasoningEvidence(createKpReasoningSource());
  const animation = createKpAuthoredDistributionProjection().projection.animationCandidate;
  const prompts = projectReasoningPrompts(evidence, animation);
  assert.deepEqual(prompts.map(item => item.projection.interactionKind), ["predict-next", "cloze"]);
  for (const prompt of prompts) {
    assert.deepEqual(prompt.projection.diagnostics, []);
    assert.equal(prompt.revisionId, evidence.revisionId);
    assert.equal(prompt.assumptions.length, 2);
    assert.equal(prompt.answerStateId, evidence.source.parent.targetStateId);
    assert.equal(prompt.answerLatex, evidence.states[4]!.segments.map(item => item.latex).join(""));
    assert.equal(Reflect.set(prompt, "answerLatex", "forged"), false);
  }
  assert.equal(prompts[0]!.answerOperations.length, 1);
  assert.equal(prompts[1]!.answerOperations.length, 4);
  assert.equal(prompts[0]!.startProgress, 3 / 13);
});

test("practice changes actual answers for a shorter supported source and rejects altered native ink", () => {
  const source = createKpReasoningSource();
  const animation = createKpAuthoredDistributionProjection().projection.animationCandidate;
  const full = projectReasoningPrompts(bindKpReasoningEvidence(source), animation);
  const short = projectReasoningPrompts(bindKpReasoningEvidence({ ...source,
    parent: { ...source.parent, targetStateId: "fraction-solve.state.constant-product" },
    reason: { ...source.reason, operationIds: source.reason.operationIds.slice(0, 3) } }), animation);
  assert.notEqual(short[0]!.answerLatex, full[0]!.answerLatex);
  assert.notEqual(short[0]!.revisionId, full[0]!.revisionId);
  const changed = structuredClone(animation);
  const index = changed.bundle.objects.findIndex(item => item.id === source.parent.targetStateId);
  const objects = changed.bundle.objects.map((item, i) => i === index ? { ...item, value: { latex: "wrong" } } : item);
  assert.throws(() => projectReasoningPrompts(bindKpReasoningEvidence(source), { ...changed, bundle: { ...changed.bundle, objects } }), { code: "kp.reasoning.prompt-endpoint" });
});
