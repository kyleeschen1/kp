import assert from "node:assert/strict";
import test from "node:test";
import { composeKpNativeKatexMaterialSamplers, projectKpNativeKatexMaterialOccupancy } from "../src/rendering/native-katex-scene-contribution.ts";
import { createKpNativeKatexSceneContribution, isKpNativeKatexSceneContribution,
  requireKpNativeKatexMeasuredMaterialFrame, assertKpNativeKatexContributionMeasurement } from "../src/rendering/native-katex-scene-contribution.ts";

const ink = { left: 2, top: 3, width: 4, height: 5 };
const owner = { ownerId: "paint", sourceElement: {} as HTMLElement,
  rect: { left: 0, top: 0, width: 20, height: 20 }, expectedPaintRect: ink,
  opacity: 1, transform: "none" };
const stage = {} as HTMLElement;
const source = { kind: "native-katex-rendered-scene-observation" as const,
  lifecycle: "renderer-session" as const, endpoint: "source" as const,
  stage, root: {} as HTMLElement, atoms: [], groups: [], fontRevision: 1, viewportKey: "wide" };
const target = { ...source, endpoint: "target" as const, root: {} as HTMLElement };
const context = { source, target, participantIds: ["paint"] };

test("issued contribution derives occupancy from the exact sampled paint once", () => {
  let calls = 0;
  const contribution = createKpNativeKatexSceneContribution({ ...context, id: "one",
    sample: () => { calls++; return [owner]; } });
  const frame = contribution.sample(.37);
  assert.equal(calls, 1);
  assert.equal(frame.occupancy[0]!.rect, frame.owners[0]!.expectedPaintRect);
  assert.equal(Object.isFrozen(frame.owners[0]!.expectedPaintRect), true);
  assert.equal(isKpNativeKatexSceneContribution(contribution), true);
  assert.equal(isKpNativeKatexSceneContribution({ ...contribution }), false);
});

test("participant declarations reject duplicate, missing and late-introduced owners at every sample", () => {
  assert.throws(() => createKpNativeKatexSceneContribution({ ...context, id: "one",
    participantIds: ["paint", "paint"], sample: () => [owner] }), /unique/);
  for (const bad of [[], [owner, owner], [{ ...owner, ownerId: "late" }]]) {
    const contribution = createKpNativeKatexSceneContribution({ ...context, id: "one",
      sample: p => p === .37 ? bad : [owner] });
    assert.equal(contribution.sample(0).owners.length, 1);
    assert.throws(() => contribution.sample(.37), /participants/);
    assert.equal(contribution.sample(0).owners.length, 1);
  }
});

test("contribution evidence binds stage, endpoint roots, fonts and measured geometry", () => {
  const contribution = createKpNativeKatexSceneContribution({ ...context, id: "one", sample: () => [owner] });
  assert.doesNotThrow(() => assertKpNativeKatexContributionMeasurement(contribution, source, target));
  for (const changed of [{ ...source, stage: {} as HTMLElement },
    { ...source, root: {} as HTMLElement }, { ...source, fontRevision: 2 },
    { ...source, viewportKey: "phone" },
    { ...source, groups: [{ id: "new", semanticEntityId: "x", atomIds: [], rect: ink }] }])
    assert.throws(() => assertKpNativeKatexContributionMeasurement(contribution, changed, target), /current measured/);
  assert.throws(() => assertKpNativeKatexContributionMeasurement({ ...contribution }, source, target), /current measured/);
  assert.throws(() => createKpNativeKatexSceneContribution({ ...context, id: "one",
    target: { ...target, stage: {} as HTMLElement }, sample: () => [owner] }), /coordinate frame/);
});

test("measured contribution boundary rejects nonfinite geometry and opacity", () => {
  for (const rect of [{ ...ink, left: NaN }, { ...ink, width: -1 }])
    assert.throws(() => requireKpNativeKatexMeasuredMaterialFrame({ ...owner, expectedPaintRect: rect }), /Invalid measured/);
  assert.throws(() => requireKpNativeKatexMeasuredMaterialFrame({ ...owner, opacity: Infinity }), /Invalid measured/);
});

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
