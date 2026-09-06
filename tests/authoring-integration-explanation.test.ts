import assert from "node:assert/strict";
import test from "node:test";
import { assembleKpSemanticStateModel } from
  "../src/semantic-state/authoring-model-assembly.ts";
import {
  assembleKpSemanticStateExplanation, bindKpSemanticStateExplanationMember,
  defineKpSemanticStateModelFamily
} from "../src/semantic-state/authoring-explanation-assembly.ts";
import { kpStateDerived, kpStateGroup, kpStateValue } from
  "../src/semantic-state/authoring-schema.ts";
import { kpStateFamilyParameters } from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../src/semantic-state/state-family-transition.ts";
import {
  declareKpSemanticStateCompositionGroup,
  declareKpSemanticStateCompositionIndependent,
  declareKpSemanticStateCompositionSequence
} from "../src/semantic-state/state-family-composition-declaration.ts";
import { KpSemanticStateCompositionPreflightError } from
  "../src/semantic-state/state-family-composition-preflight.ts";
import { createKpSemanticStateQuerySession } from "../src/semantic-state/authoring-query-session.ts";
import { createKpSettledSemanticStateCompositionAddress } from "../src/semantic-state/state-family-composition-address.ts";

function fixture(overlap = false) {
  const model = assembleKpSemanticStateModel({
    namespace: "lesson.explanation-assembly",
    schema: kpStateGroup({ a: kpStateValue<number>(0), b: kpStateValue<number>(0), sum: kpStateDerived<number>() }),
    derive: ({ refs, derive }) => [derive({ target: refs.sum,
      dependencies: [refs.a, refs.b], compute: ([a, b]) => a + b })]
  });
  let calls = 0;
  const family = (name: "a" | "b") => defineKpSemanticStateModelFamily(model, {
    id: `set-${name}`, sourceId: `test.${name}.family`,
    parameters: kpStateFamilyParameters<{ value: number }>(),
    transitions: builder => [builder.interpolate(declareKpSemanticStateInterpolation({
      id: `interpolate-${name}`, sourceId: `test.${name}.transition`,
      target: model.handles.refs[overlap ? "a" : name]
    }), ({ before, after, progress }) => before + (after - before) *
      Number(progress.numerator) / Number(progress.denominator))],
    author(parameters, state) {
      calls++;
      state[overlap ? "a" : name].update(() => parameters.value);
    }
  });
  const aFamily = family("a");
  const bFamily = family("b");
  const a = bindKpSemanticStateExplanationMember({
    name: "raise-a", sourceId: "test.a.member", definition: aFamily,
    application: aFamily.prepareApplication({ applicationId: "raise-a",
      sourceId: "test.a.application", parameters: { value: 4 } })
  });
  const b = bindKpSemanticStateExplanationMember({
    name: "raise-b", sourceId: "test.b.member", definition: bFamily,
    application: bFamily.prepareApplication({ applicationId: "raise-b",
      sourceId: "test.b.application", parameters: { value: 6 } })
  });
  return { model, aFamily, bFamily, a, b, calls: () => calls };
}

test("named nested explanation preserves inferred handles, plans and exact operation provenance", () => {
  const data = fixture();
  const explanation = assembleKpSemanticStateExplanation({
    model: data.model, localId: "ordered", sourceId: "test.ordered",
    root: declareKpSemanticStateCompositionGroup({ name: "policy", sourceId: "test.policy",
      body: declareKpSemanticStateCompositionSequence({ name: "timeline", sourceId: "test.timeline",
        members: [data.a.member, data.b.member] }) }),
    members: [data.a, data.b]
  });
  const literal: "raise-a" = explanation.handles.root.children.timeline.children["raise-a"].name;
  assert.equal(literal, "raise-a");
  assert.equal(data.calls(), 2);
  assert.equal(explanation.chain.before, data.model.initial);
  assert.equal(data.model.handles.pin(explanation.chain.after).a.read(), 4);
  assert.equal(data.model.handles.pin(explanation.chain.after).b.read(), 6);
  const manualA = data.aFamily.applyPreparedApplication(data.model.initial, data.a.member.application);
  const manualB = data.bFamily.applyPreparedApplication(manualA.commit.after, data.b.member.application);
  assert.deepEqual(explanation.chain.after, manualB.commit.after);
  assert.deepEqual(explanation.chain.applications[0]?.application.commit.journal, manualA.commit.journal);
  assert.deepEqual(explanation.chain.applications[1]?.application.commit.journal, manualB.commit.journal);
  assert.equal(explanation.preflight.members.every(member => member.graph === data.model.graph), true);
});

test("assembly retains pinned-base pair confluence and rejects conflicting drivers before authoring", () => {
  const run = (data: ReturnType<typeof fixture>) => assembleKpSemanticStateExplanation({
    model: data.model, localId: "pair", sourceId: "test.pair",
    root: declareKpSemanticStateCompositionIndependent({ name: "pair", sourceId: "test.pair.node",
      evidence: { id: "disjoint", sourceId: "test.disjoint" },
      members: [data.a.member, data.b.member] }),
    members: [data.a, data.b]
  });
  const data = fixture();
  assert.equal(run(data).chain.confluence[0]?.valueEquivalent, true);
  assert.equal(data.calls(), 4);
  const conflicting = fixture(true);
  assert.throws(() => run(conflicting), error => error instanceof KpSemanticStateCompositionPreflightError &&
    error.diagnostics.some(item => item.code === "independent-write-conflict"));
  assert.equal(conflicting.calls(), 0);
});

test("binding a prepared application to a different named family is rejected", () => {
  const data = fixture();
  assert.throws(() => bindKpSemanticStateExplanationMember({
    name: "foreign", sourceId: "test.foreign", definition: data.bFamily,
    application: data.a.member.application
  }), /foreign prepared application/);
  assert.equal(data.calls(), 0);
});

test("one family can retain several distinct named applications", () => {
  const data = fixture();
  const again = bindKpSemanticStateExplanationMember({
    name: "raise-again", sourceId: "test.again.member", definition: data.aFamily,
    application: data.aFamily.prepareApplication({ applicationId: "raise-again",
      sourceId: "test.again.application", parameters: { value: 7 } })
  });
  const explanation = assembleKpSemanticStateExplanation({
    model: data.model, localId: "repeated", sourceId: "test.repeated",
    root: declareKpSemanticStateCompositionSequence({ name: "twice", sourceId: "test.twice",
      members: [data.a.member, again.member] }), members: [data.a, again]
  });
  assert.equal(data.calls(), 2);
  assert.equal(data.model.handles.pin(explanation.chain.after).a.read(), 7);
  assert.equal(explanation.handles.root.children["raise-again"].applicationId, "raise-again");
  assert.notEqual(explanation.chain.applications[0]?.application.transformationId,
    explanation.chain.applications[1]?.application.transformationId);
});

function rejectInvalidParameters(): void {
  const data = fixture();
  data.aFamily.prepareApplication({ applicationId: "invalid", sourceId: "test.invalid",
    // @ts-expect-error inferred family parameters require a numeric value
    parameters: { value: "seven" }
  });
}
void rejectInvalidParameters;

test("editing declared order changes historical queries without changing member meaning", () => {
  const data = fixture();
  const run = (reverse: boolean) => assembleKpSemanticStateExplanation({
    model: data.model, localId: reverse ? "b-then-a" : "a-then-b", sourceId: "test.author-order",
    root: declareKpSemanticStateCompositionSequence({ name: "ordered", sourceId: "test.author-order.sequence",
      members: reverse ? [data.b.member, data.a.member] : [data.a.member, data.b.member] }),
    members: [data.a, data.b]
  });
  const totals = [false, true].map(reverse => {
    const explanation = run(reverse);
    const query = createKpSemanticStateQuerySession(explanation);
    try { return explanation.handles.boundaries.map(boundary => query.evaluate(
      createKpSettledSemanticStateCompositionAddress({ handles: explanation.handles, boundary }), data.model.handles.refs.sum)); }
    finally { query.dispose(); }
  });
  assert.deepEqual(totals, [[0, 4, 10], [0, 6, 10]]);
});
