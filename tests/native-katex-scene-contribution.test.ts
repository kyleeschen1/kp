import assert from "node:assert/strict";
import test from "node:test";
import { projectKpNativeKatexMaterialOccupancy } from "../src/rendering/native-katex-scene-contribution.ts";
import { createKpNativeKatexSceneContribution, isKpNativeKatexSceneContribution,
  requireKpNativeKatexMeasuredMaterialFrame, assertKpNativeKatexContributionMeasurement } from "../src/rendering/native-katex-scene-contribution.ts";
import { createKpNativeKatexSceneAssembly, requireKpNativeKatexContributionInspection } from "../src/rendering/native-katex-scene-assembly.ts";

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

test("final assembly inspects all actual contributions jointly without rewriting their paint", () => {
  const first = createKpNativeKatexSceneContribution({ ...context, id: "first", sample: () => [owner] });
  const second = createKpNativeKatexSceneContribution({ ...context, id: "second", participantIds: ["other"],
    sample: p => [{ ...owner, ownerId: "other", expectedPaintRect: { ...ink, left: ink.left + 100 * Math.abs(2 * p - 1) } }] });
  const alone = createKpNativeKatexSceneAssembly({ source, target, tracks: [], contributions: [first] });
  const together = createKpNativeKatexSceneAssembly({ source, target, tracks: [], contributions: [first, second] });
  assert.equal(alone.audit.intersections.length, 0);
  assert.ok(together.audit.intersections.length > 0);
  assert.deepEqual(together.sample(.37).owners[0], first.sample(.37).owners[0]);
  assert.equal(together.sample(.37).occupancy.length, 2);
  assert.equal(requireKpNativeKatexContributionInspection(together, second), together.audit);
  assert.throws(() => requireKpNativeKatexContributionInspection(alone, second), /issued final-scene/);
  assert.throws(() => requireKpNativeKatexContributionInspection({ ...together }, first), /issued final-scene/);
});

test("final assembly rejects colliding participant identities across contributions", () => {
  const contributions = ["one", "two"].map(id => createKpNativeKatexSceneContribution({ ...context, id, sample: () => [owner] }));
  assert.throws(() => createKpNativeKatexSceneAssembly({ source, target, tracks: [], contributions }), /participants must be unique/);
});

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

test("issued contribution preserves paint order and uses bounded finite progress", () => {
  const samples: number[] = [];
  const contribution = createKpNativeKatexSceneContribution({ ...context, id: "ordered", participantIds: ["paint", "second"],
    sample: p => { samples.push(p); return [owner, { ...owner, ownerId: "second" }]; } });
  for (const p of [0, .37, 1, .37, -1, 2]) {
    assert.deepEqual(contribution.sample(p).owners.map(frame => frame.ownerId), ["paint", "second"]);
  }
  assert.deepEqual(samples, [0, .37, 1, .37, 0, 1]);
  assert.throws(() => contribution.sample(NaN), /finite/);
});

test("material occupancy uses actual transformed ink and rejects absent measurements", () => {
  assert.deepEqual(projectKpNativeKatexMaterialOccupancy([owner], "group"),
    [{ trackId: "paint", componentId: "group", rect: ink, opacity: 1 }]);
  assert.throws(() => projectKpNativeKatexMaterialOccupancy(
    [{ ...owner, expectedPaintRect: undefined }], "group"), /Missing measured material paint/);
});
