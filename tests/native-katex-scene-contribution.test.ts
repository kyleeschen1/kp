import assert from "node:assert/strict";
import test from "node:test";
import { composeKpNativeKatexMaterialSamplers, projectKpNativeKatexMaterialOccupancy } from "../src/rendering/native-katex-scene-contribution.ts";

const ink = { left: 2, top: 3, width: 4, height: 5 };
const owner = { ownerId: "paint", sourceElement: {} as HTMLElement,
  rect: { left: 0, top: 0, width: 20, height: 20 }, expectedPaintRect: ink,
  opacity: 1, transform: "none" };

test("material composition preserves contributor order and uses one bounded progress", () => {
  const samples: number[] = [];
  const sampler = (p: number) => { samples.push(p); return [owner]; };
  const callbacks = [sampler, () => [{ ...owner, ownerId: "second" }]];
  const combined = composeKpNativeKatexMaterialSamplers(callbacks);
  callbacks.length = 0;
  for (const p of [0, .37, 1, .37, -1, 2]) {
    assert.deepEqual(combined(p).map(frame => frame.ownerId), ["paint", "second"]);
  }
  assert.deepEqual(samples, [0, .37, 1, .37, 0, 1]);
  assert.throws(() => combined(NaN), /finite/);
});

test("material occupancy uses actual transformed ink and rejects absent measurements", () => {
  assert.deepEqual(projectKpNativeKatexMaterialOccupancy([owner], "group"),
    [{ trackId: "paint", componentId: "group", rect: ink, opacity: 1 }]);
  assert.throws(() => projectKpNativeKatexMaterialOccupancy(
    [{ ...owner, expectedPaintRect: undefined }], "group"), /Missing measured material paint/);
});
