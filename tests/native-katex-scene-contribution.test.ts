import assert from "node:assert/strict";
import test from "node:test";
import { projectKpNativeKatexMaterialOccupancy } from "../src/rendering/native-katex-scene-contribution.ts";
import { createKpNativeKatexSceneContribution, isKpNativeKatexSceneContribution,
  requireKpNativeKatexMeasuredMaterialFrame, assertKpNativeKatexContributionMeasurement,
  createKpNativeKatexMaterialRealization } from "../src/rendering/native-katex-scene-contribution.ts";
import { createKpNativeKatexSceneAssembly, requireKpNativeKatexContributionInspection, assertKpNativeKatexSceneAssembly } from "../src/rendering/native-katex-scene-assembly.ts";

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

test("optical realization is inside the contribution sample and cannot carry independent occupancy", () => {
  const progress: number[] = [];
  const realization = createKpNativeKatexMaterialRealization((owners, p) => {
    progress.push(p);
    return owners.map(frame => requireKpNativeKatexMeasuredMaterialFrame({ ...frame,
      expectedPaintRect: { ...ink, left: ink.left + p * 20 } }));
  });
  const contribution = createKpNativeKatexSceneContribution({ ...context, id: "optical", realization, sample: () => [owner] });
  const assembly = createKpNativeKatexSceneAssembly({ source, target, tracks: [], contributions: [contribution], endpointDwellFraction: .04 });
  const frame = assembly.sample(.37);
  assert.equal(progress.at(-1), .37, "Optical timing retains semantic progress, not the base dwell clock.");
  assert.equal(frame.occupancy[0]!.rect, frame.owners[0]!.expectedPaintRect);
  assert.equal(frame.owners[0]!.expectedPaintRect.left, ink.left + .37 * 20);
  assert.equal(contribution.realization, realization);
  assert.throws(() => createKpNativeKatexSceneContribution({ ...context, id: "forged", realization: { ...realization }, sample: () => [owner] }), /issued sampler/);
  const missing = createKpNativeKatexMaterialRealization(() => []);
  assert.throws(() => createKpNativeKatexSceneContribution({ ...context, id: "missing", realization: missing, sample: () => [owner] }).sample(.5), /participants/);
});

test("render authority rejects copied assemblies, replaced samplers and unchecked extra paint", () => {
  let calls = 0;
  const contribution = createKpNativeKatexSceneContribution({ ...context, id: "bound", sample: () => { calls++; return [owner]; } });
  const assembly = createKpNativeKatexSceneAssembly({ source, target, tracks: [], contributions: [contribution] });
  const input = { sceneAssembly: assembly, reconciliation: { source, target }, tracks: assembly.tracks };
  assert.doesNotThrow(() => assertKpNativeKatexSceneAssembly(input));
  for (const changed of [{ sceneAssembly: { ...assembly } },
    { sceneAssembly: { ...assembly, sample: () => assembly.sample(0) } },
    { copyFanOut: true }, { tracks: [{}] }])
    assert.throws(() => assertKpNativeKatexSceneAssembly({ ...input, ...changed }), /exact issued/);
  assert.throws(() => assertKpNativeKatexSceneAssembly({ ...input,
    supplementalMaterialOwners: () => [] }), /Unchecked supplemental paint is retired/);
  const frame = assembly.sample(.371);
  const sampled = calls;
  assert.equal(assembly.sample(.371), frame);
  assert.equal(calls, sampled);
  assert.equal(Object.isFrozen(assembly.audit.intersections), true);
  assert.throws(() => assembly.sample(NaN), /finite/);
});

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

test("one extension cannot hide internal transit contact or convert it into a route failure", () => {
  const contribution = createKpNativeKatexSceneContribution({ ...context, id: "fusion", participantIds: ["paint", "copy"],
    sample: p => [owner, { ...owner, ownerId: "copy", expectedPaintRect: { ...ink, left: ink.left + 100 * Math.abs(2 * p - 1) } }] });
  const assembly = createKpNativeKatexSceneAssembly({ source, target, tracks: [], contributions: [contribution] });
  assert.equal(assembly.contactPolicy, "diagnostic-only");
  assert.ok(assembly.audit.intersections.length > 0);
  assert.deepEqual(assembly.sample(.5).owners, contribution.sample(.5).owners);
});

test("endpoint and hidden-owner malformed paint fail regardless of contact policy", () => {
  for (const bad of [{ ...owner, opacity: 2 }, { ...owner, opacity: 0, rect: { ...ink, left: NaN } },
    { ...owner, paintAlignmentRect: { ...ink, height: -1 } }]) {
    const contribution = createKpNativeKatexSceneContribution({ ...context, id: "invalid", sample: p => p === 1 ? [bad] : [owner] });
    assert.throws(() => createKpNativeKatexSceneAssembly({ source, target, tracks: [], contributions: [contribution] }), /Invalid measured/);
  }
});

test("cached assemblies invalidate native measurement changes even without extensions", () => {
  const group = { id: "group", semanticEntityId: "g", atomIds: [], rect: { ...ink }, sourceElement: {} as HTMLElement };
  const measured = { ...source, groups: [group] };
  const assembly = createKpNativeKatexSceneAssembly({ source: measured, target, tracks: [], contributions: [] });
  const check = (current = measured) => assertKpNativeKatexSceneAssembly({ sceneAssembly: assembly,
    tracks: assembly.tracks, reconciliation: { source: current, target } });
  check();
  for (const changed of [{ ...measured, fontRevision: 2 }, { ...measured, viewportKey: "phone" },
    { ...measured, stage: {} as HTMLElement }, { ...measured, root: {} as HTMLElement },
    { ...measured, groups: [{ ...group, sourceElement: {} as HTMLElement }] },
    { ...measured, groups: [{ ...group, rect: { ...ink, left: ink.left + .001 } }] }])
    assert.throws(() => check(changed), /current measured/);
  // Mutating a retained observation cannot retroactively update its receipt.
  group.rect.width += 1;
  assert.throws(() => check(), /current measured/);
  const fresh = createKpNativeKatexSceneAssembly({ source: measured, target, tracks: [], contributions: [] });
  assert.doesNotThrow(() => assertKpNativeKatexSceneAssembly({ sceneAssembly: fresh,
    tracks: fresh.tracks, reconciliation: { source: measured, target } }));
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
  assert.deepEqual(projectKpNativeKatexMaterialOccupancy([owner]),
    [{ trackId: "paint", componentId: "paint", rect: ink, opacity: 1 }]);
  assert.throws(() => projectKpNativeKatexMaterialOccupancy(
    [{ ...owner, expectedPaintRect: undefined }]), /Missing measured material paint/);
});
