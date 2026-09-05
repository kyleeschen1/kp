import assert from "node:assert/strict";
import test from "node:test";
import { assembleKpSemanticStateModel } from "../src/semantic-state/authoring-model-assembly.ts";
import {
  assembleKpSemanticStateExplanation, bindKpSemanticStateExplanationMember,
  defineKpSemanticStateModelFamily
} from "../src/semantic-state/authoring-explanation-assembly.ts";
import { createKpSemanticStateQuerySession } from "../src/semantic-state/authoring-query-session.ts";
import { kpStateDerived, kpStateGroup, kpStateValue } from "../src/semantic-state/authoring-schema.ts";
import { kpStateFamilyParameters } from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from "../src/semantic-state/state-family-transition.ts";
import { pinKpAggregateSemanticSnapshot } from "../src/semantic-state/pinned-recovery.ts";
import { createKpSemanticProgress } from "../src/semantic-state/semantic-progress.ts";
import { declareKpSemanticStateCompositionIndependent } from
  "../src/semantic-state/state-family-composition-declaration.ts";
import {
  createKpInTransitionSemanticStateCompositionAddress,
  createKpSettledSemanticStateCompositionAddress
} from "../src/semantic-state/state-family-composition-address.ts";

function fixture() {
  const model = assembleKpSemanticStateModel({ namespace: "lesson.query-session",
    schema: kpStateGroup({ value: kpStateValue<number>(0), doubled: kpStateDerived<number>() }),
    derive: ({ refs, derive }) => [derive({ target: refs.doubled,
      dependencies: [refs.value], compute: ([value]) => value * 2 })]
  });
  let calls = 0;
  const family = defineKpSemanticStateModelFamily(model, {
    id: "set-value", sourceId: "test.set-value",
    parameters: kpStateFamilyParameters<{ value: number }>(),
    transitions: builder => [builder.interpolate(declareKpSemanticStateInterpolation({
      id: "value", sourceId: "test.value", target: model.handles.refs.value
    }), ({ before, after, progress }) => before + (after - before) *
      Number(progress.numerator) / Number(progress.denominator))],
    author(parameters, state) { calls++; state.value.update(() => parameters.value); }
  });
  const make = (id: string, value: number, base = model.initial) => {
    const member = bindKpSemanticStateExplanationMember({ name: "change", sourceId: `test.${id}.member`,
      definition: family, application: family.prepareApplication({ applicationId: id,
        sourceId: `test.${id}.application`, parameters: { value } }) });
    return assembleKpSemanticStateExplanation({ model, localId: id,
      sourceId: `test.${id}.explanation`, root: member.member, members: [member], base });
  };
  const explanation = make("first", 10);
  const at = (numerator: bigint, denominator = 10n) => createKpInTransitionSemanticStateCompositionAddress({
    handles: explanation.handles, target: explanation.handles.root,
    progress: createKpSemanticProgress(numerator, denominator)
  });
  return { model, explanation, make, at, calls: () => calls };
}

test("query sessions preserve exact history across seeks, eviction, reset and disposal", () => {
  const data = fixture();
  const session = createKpSemanticStateQuerySession(data.explanation, { cacheCapacity: 2 });
  const uncached = createKpSemanticStateQuerySession(data.explanation);
  const pin = pinKpAggregateSemanticSnapshot(data.explanation.chain.after);
  const snapshots = [...session.history.snapshots];
  for (const numerator of [1n, 8n, 3n, 8n, 1n]) {
    const address = data.at(numerator);
    const expected = Number(numerator) * 2;
    assert.equal(session.evaluate(address, data.model.handles.refs.doubled), expected);
    assert.equal(uncached.evaluate(address, data.model.handles.refs.doubled), expected);
    assert.ok(session.inspect().entries <= 2);
  }
  assert.equal(data.calls(), 1);
  assert.equal(session.recover(pin), data.explanation.chain.after);
  assert.deepEqual(session.history.snapshots, snapshots);
  assert.equal(session.history.snapshots.length, 2);
  session.reset();
  assert.equal(session.inspect().entries, 0);
  assert.equal(session.evaluate(data.at(3n), data.model.handles.refs.doubled), 6);
  assert.equal(session.recover(pin), data.explanation.chain.after);
  session.dispose();
  assert.equal(session.inspect().entries, 0);
  assert.throws(() => session.evaluate(data.at(3n), data.model.handles.refs.doubled), /disposed/);
  assert.throws(() => session.recover(pin), /disposed/);
  assert.equal(uncached.evaluate(data.at(3n), data.model.handles.refs.doubled), 6);
  uncached.dispose();
});

test("branch queries retain their chosen source and never rewrite another session's history", () => {
  const data = fixture();
  const branch = data.make("branch", 7, data.explanation.chain.after);
  const original = createKpSemanticStateQuerySession(data.explanation);
  const branched = createKpSemanticStateQuerySession(branch);
  const end = createKpSettledSemanticStateCompositionAddress({ handles: branch.handles,
    boundary: branch.handles.composition.after });
  assert.equal(branched.evaluate(end, data.model.handles.refs.doubled), 14);
  assert.equal(branched.history.snapshots[0], data.explanation.chain.after);
  assert.equal(original.recover(pinKpAggregateSemanticSnapshot(data.explanation.chain.after)),
    data.explanation.chain.after);
  assert.throws(() => original.recover(pinKpAggregateSemanticSnapshot(branch.chain.after)), /no snapshot/);
  assert.equal(data.model.handles.pin(data.model.initial).value.read(), 0);
  assert.equal(data.calls(), 2);
  original.dispose();
  branched.dispose();
});

test("pair queries use simultaneous driver overlays and never retain private pair endpoints", () => {
  const model = assembleKpSemanticStateModel({ namespace: "lesson.query-pair",
    schema: kpStateGroup({ a: kpStateValue<number>(0), b: kpStateValue<number>(0), sum: kpStateDerived<number>() }),
    derive: ({ refs, derive }) => [derive({ target: refs.sum,
      dependencies: [refs.a, refs.b], compute: ([a, b]) => a + b })]
  });
  const member = (name: "a" | "b", value: number) => {
    const definition = defineKpSemanticStateModelFamily(model, {
      id: name, sourceId: `test.${name}.family`, parameters: kpStateFamilyParameters<{ value: number }>(),
      transitions: builder => [builder.interpolate(declareKpSemanticStateInterpolation({
        id: name, sourceId: `test.${name}.transition`, target: model.handles.refs[name]
      }), ({ before, after, progress }) => before + (after - before) *
        Number(progress.numerator) / Number(progress.denominator))],
      author(parameters, state) { state[name].update(() => parameters.value); }
    });
    return bindKpSemanticStateExplanationMember({ name, definition, sourceId: `test.${name}.member`,
      application: definition.prepareApplication({ applicationId: name,
        sourceId: `test.${name}.application`, parameters: { value } }) });
  };
  const a = member("a", 4);
  const b = member("b", 6);
  const explanation = assembleKpSemanticStateExplanation({ model, localId: "pair", sourceId: "test.pair",
    root: declareKpSemanticStateCompositionIndependent({ name: "pair", sourceId: "test.pair.node",
      evidence: { id: "disjoint", sourceId: "test.pair.evidence" }, members: [a.member, b.member] }),
    members: [a, b]
  });
  const session = createKpSemanticStateQuerySession(explanation, { cacheCapacity: 1 });
  const address = createKpInTransitionSemanticStateCompositionAddress({ handles: explanation.handles,
    target: explanation.handles.root, progress: createKpSemanticProgress(1n, 2n) });
  assert.equal(session.evaluate(address, model.handles.refs.sum), 5);
  assert.equal(session.history.snapshots.length, 2);
  assert.throws(() => session.recover(pinKpAggregateSemanticSnapshot(
    explanation.chain.applications[0]!.application.commit.after
  )), /no snapshot/);
  session.reset();
  assert.equal(session.evaluate(address, model.handles.refs.sum), 5);
  session.dispose();
});
