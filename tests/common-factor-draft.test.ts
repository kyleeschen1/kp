import assert from "node:assert/strict";
import test from "node:test";
import { prepareKpCommonFactorDraft, assertKpPreparedCommonFactorDraft, exportKpCommonFactorSource } from "../src/authoring/common-factor-draft.ts";
import { KpCommonFactorRepair } from "../src/authoring/common-factor-source.ts";
import { createVerifiedCommonFactorAnimationAsset } from "../src/animation/distribution-adapter.ts";

const source = { schemaVersion: "kp.common-factor-source.v1", id: "lesson.factor", domain: "real-scalars", symbols: ["a", "b", "c"],
  states: [{ id: "state.before", latex: "ab+ac", narration: "Two products share a factor." }, { id: "state.after", latex: "a(b+c)", narration: "Write that factor once." }],
  editorial: { title: "Common factoring", setup: "Find what is shared.", summary: "Distribution works in both directions." } };

test("ordinary source prepares one governed transition using the established fan-in mechanism", () => {
  const draft = prepareKpCommonFactorDraft(source);
  assertKpPreparedCommonFactorDraft(draft);
  assert.equal(draft.candidate.request.states.length, 2);
  assert.equal(draft.animation.transformations.length, 1);
  assert.equal(draft.animation.transformations[0]!.transformType, "factorCommonTerm");
  assert.match(draft.animation.id, /^animation.authored.common-factor\./);
  assert.equal(draft.animation.transformations[0]!.correspondenceMap!.records.filter(r => r.relation === "fan-in").length, 1);
  assert.equal(prepareKpCommonFactorDraft(JSON.parse(exportKpCommonFactorSource(draft))).revisionId, draft.revisionId);
  const edited = prepareKpCommonFactorDraft({ ...source, editorial: { ...source.editorial, title: "New explanation" } });
  assert.notEqual(edited.revisionId, draft.revisionId);
  assert.equal(edited.proof.revisionId, draft.proof.revisionId);
  assert.equal(edited.animation.id, draft.animation.id);
});

test("serial copies, candidates and forged brands cannot cross render or export boundaries", () => {
  const draft = prepareKpCommonFactorDraft(source);
  for (const value of [source, draft.candidate, { ...draft }, JSON.parse(JSON.stringify(draft))]) {
    assert.throws(() => assertKpPreparedCommonFactorDraft(value), TypeError);
    // Exercise untyped callers without pretending the candidate has authority.
    assert.throws(() => Reflect.apply(exportKpCommonFactorSource, undefined, [value]), TypeError);
    assert.throws(() => Reflect.apply(createVerifiedCommonFactorAnimationAsset, undefined, [value]), TypeError);
  }
  assert.throws(() => prepareKpCommonFactorDraft({ ...source, states: [source.states[0], { ...source.states[1], latex: "b(b+c)" }] }),
    (e: unknown) => e instanceof KpCommonFactorRepair && e.code === "invalid-factorization");
});

test("verified but unrepresented numeric-addend paint returns a typed gap, not concatenated digits", () => {
  assert.throws(() => prepareKpCommonFactorDraft({ ...source, states: [
    { ...source.states[0], latex: "2*3+2*4" }, { ...source.states[1], latex: "2(3+4)" }
  ] }), (e: unknown) => e instanceof KpCommonFactorRepair && e.code === "unsupported-presentation");
});
