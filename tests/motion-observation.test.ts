import assert from "node:assert/strict";
import test from "node:test";
import { checkMotionObservation, motionObservationExample, motionObservationFacts, sampleMotionObservation } from "../src/semantic/motion-observation.ts";

function example(value: unknown = motionObservationExample) {
  const result = checkMotionObservation(value);
  if (result.status !== "checked") throw new Error(result.expected); return result.record;
}
test("motion record separates displacement, distance and changed coordinates", () => {
  const record = example(), facts = motionObservationFacts(record);
  assert.deepEqual(facts, { duration: 6, displacement: 1, distance: 7, coordinates: [-2, 2, 2, -1] });
  for (const shift of [-1000, -4, 0, 3, 1000]) {
    const other = example({ ...motionObservationExample, originShift: shift }), f = motionObservationFacts(other);
    assert.equal(f.coordinates.at(-1)! - f.coordinates[0]!, facts.displacement);
    assert.equal(f.distance, facts.distance);
  }
});
test("sampling preserves the explicit pause and reconstructs forward and reverse", () => {
  const record = example();
  assert.equal(sampleMotionObservation(record, 1).position, 3);
  assert.equal(sampleMotionObservation(record, 3).position, 5);
  assert.equal(sampleMotionObservation(record, 5).position, 3.5);
  assert.equal(sampleMotionObservation(record, 6).distance, 7);
  const times = [0, 1, 2, 3, 4, 5, 6];
  assert.deepEqual(times.map(t => sampleMotionObservation(record, t)), [...times].reverse().map(t => sampleMotionObservation(record, t)).reverse());
  for (const t of [NaN, Infinity, -1, 7]) assert.throws(() => sampleMotionObservation(record, t), RangeError);
});
test("source checker rejects unsupported physical claims and ambiguous observations", () => {
  for (const value of [null, { ...motionObservationExample, interpolation: "measured-continuously" },
    { ...motionObservationExample, force: 3 }, { ...motionObservationExample, originShift: NaN },
    { ...motionObservationExample, observations: [{ id: "a", time: 0, position: 1 }, { id: "a", time: 2, position: 3 }] },
    { ...motionObservationExample, observations: [{ id: "a", time: 0, position: 1 }, { id: "b", time: 0, position: 3 }] }]) {
    assert.equal(checkMotionObservation(value).status, "repair");
  }
});
test("issued data owns its inputs and copied records cannot mint mathematical authority", () => {
  const source = structuredClone(motionObservationExample), record = example(source);
  Object.assign(source.observations[0]!, { position: 99 });
  assert.equal(record.value.observations[0]!.position, 1);
  assert.throws(() => motionObservationFacts({ ...record }), /domain checker/);
  assert.throws(() => Object.assign(record.value.observations[0]!, { position: 99 }));
});
