import assert from "node:assert/strict";
import test from "node:test";
import { dependentColumns } from "../content/authoring/linear-algebra/dependent-columns.ts";
import { dependentColumnsWalk as score } from "../content/authoring/linear-algebra/dependent-columns-walk.ts";
import { walk, WalkGap, type Stop } from "../src/experiments/matrix-column-combinations/walk.ts";

const make = (stops: readonly Stop[]) => walk(dependentColumns.product, dependentColumns.reading, stops);

test("authored order retains the same product and native column identities", () => {
  for (const scene of score.scenes) {
    assert.equal(scene.env.product, dependentColumns.product);
    assert.equal(scene.combination.cells[0], dependentColumns.product.cell(0, scene.column));
  }
  assert.deepEqual(score.stops.map(stop => stop.at), ["initial", "weights", "scaled", "placed", "initial", "weights", "scaled", "placed"]);
  assert.equal(score.durationMs, 37800);
  score.checkpoints.forEach((progress, i) => {
    const frame = score.sample(progress);
    assert.equal(frame.index, i); assert.equal(frame.stop, score.stops[i]);
    assert.equal(frame.column, score.stops[i]!.column);
    assert.equal(frame.nativeProgress, [0, 1 / 3, 2 / 3, 1, 0, 1 / 3, 2 / 3, 1][i]);
  });
});

test("seek, reverse, interruption and replay are pure projections over native paths", () => {
  const positions = Array.from({ length: 1001 }, (_, i) => i / 1000);
  const frames = positions.map(value => score.sample(value));
  for (const value of [...positions].reverse()) assert.deepEqual(score.sample(value), frames[Math.round(value * 1000)]);
  for (const value of [.46, .91, .1, 1, 0, .46]) assert.deepEqual(score.sample(value), frames[Math.round(value * 1000)]);
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1]!, b = frames[i]!;
    if (a.column !== b.column) assert.ok(a.nativeProgress < .004 && b.nativeProgress < .004);
    assert.ok(Math.abs(a.nativeProgress - b.nativeProgress) <= .00300000001);
  }
  for (const bad of [NaN, Infinity, -1, 1.001]) assert.throws(() => score.sample(bad), WalkGap);
});

test("authors can start with the second input and revisit checkpoints without engine changes", () => {
  const input: Stop[] = [
    { id: "start", column: 1, at: "initial", text: "Second first" },
    { id: "result", column: 1, at: "placed", text: "Result" },
    { id: "inspect", column: 1, at: "scaled", text: "Revisit contributions" },
    { id: "return", column: 0, at: "initial", text: "Return" },
    { id: "weights", column: 0, at: "weights", text: "First weights" }
  ];
  const other = make(input); input.pop();
  assert.equal(other.stops.length, 5); assert.ok(Object.isFrozen(other.stops[0]));
  const middle = other.sample((other.checkpoints[2]! + other.checkpoints[3]!) / 2);
  assert.equal(middle.column, 1); assert.ok(Math.abs(middle.nativeProgress - 1 / 3) < 1e-12);
  assert.equal(other.sample(other.checkpoints[3]!).column, 0);
});

test("unsupported bridges and invalid declarations produce located repair gaps", () => {
  const a: Stop = { id: "a", column: 0, at: "weights", text: "A" };
  const b: Stop = { id: "b", column: 1, at: "scaled", text: "B" };
  const cases: readonly (readonly Stop[])[] = [[], [a], [a, b], [a, { ...b, at: "weights" }], [a, { ...a }], [a, { ...b, id: "bad id" }]];
  for (const stops of cases)
    assert.throws(() => make(stops), WalkGap);
  assert.throws(() => make([a, b]), (error: unknown) => error instanceof WalkGap && error.code === "bridge" && error.path === "stops[1]");
  // @ts-expect-error unsupported column is not authorable
  const wrongColumn: Stop = { ...a, column: 2 };
  // @ts-expect-error arbitrary choreography is not a native checkpoint
  const wrongPose: Stop = { ...b, at: "fade" };
  for (const invalid of [wrongColumn, wrongPose, { ...b, text: " " }, { ...b, duration: 1 }])
    assert.throws(() => make([a, invalid]), WalkGap);
});
