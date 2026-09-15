import { test } from "node:test";
import { energyDerivationInspection, sampleSubstitutionEmphasis, sampleDerivationRecordInspection } from "../src/tutorial/mechanics-relations/energy-derivation-presentation.ts";
import assert from "node:assert/strict";

test("each inspection names complete semantic cohorts and explicit permanent-row bindings", () => {
  const checked = checkMomentumEnergyDerivation(momentumEnergyDerivationSource);
  assert.equal(checked.status, "checked");
  if (checked.status !== "checked") return;
  const compiled = compileMomentumEnergyDerivation(checked.model);
  const recordMath = [compiled.moves[0]!.annotated[0]!, compiled.moves[0]!.annotated[1]!, compiled.moves[2]!.annotated[0]!, compiled.moves[2]!.annotated[1]!];
  energyDerivationInspection.forEach((focus, i) => {
    const move = compiled.moves[i]!;
    for (const [ids, math] of [[focus.source, move.annotated[0]!], [focus.target, move.annotated[1]!],
      [focus.recordSource, recordMath[i]!], [focus.recordTarget, recordMath[i + 1]!]] as const) {
      assert.ok(ids.length > 0);
      assert.equal(new Set(ids).size, ids.length);
      ids.forEach(id => assert.ok(math.includes(`kp-semantic-entity-id=${id},`), id));
    }
  });
  assert.ok(energyDerivationInspection[1].source.includes("energy.scale-magnitude.0.momentum"));
  assert.ok(!energyDerivationInspection[2].source.includes("energy.cancel-mass.0.norm"));
});

test("substitution emphasis follows semantic participants and reverses to neutral docks", () => {
  const samples = Array.from({ length: 101 }, (_, i) => sampleSubstitutionEmphasis(i / 100));
  for (let i = 100; i >= 0; i--) {
    assert.deepEqual(sampleSubstitutionEmphasis(i / 100), samples[i]);
    assert.equal(samples[i]!.source, "energy.substitute.0.velocity");
    assert.equal(samples[i]!.target, "energy.substitute.1.replacement");
    assert.ok(samples[i]!.strength >= 0 && samples[i]!.strength <= 1);
  }
  assert.equal(samples[0]!.strength, 0);
  assert.equal(samples[100]!.strength, 0);
  assert.equal(samples[25]!.strength, 1);
  assert.equal(samples[90]!.strength, 1);
  assert.throws(() => sampleSubstitutionEmphasis(NaN));
});

test("record inspection has exclusive docks and a reversible continuous emphasis envelope", () => {
  const frames = Array.from({ length: 101 }, (_, i) => sampleDerivationRecordInspection(i / 100, 180, 54));
  for (let i = 100; i >= 0; i--) {
    assert.deepEqual(sampleDerivationRecordInspection(i / 100, 180, 54), frames[i]);
    const frame = frames[i]!;
    assert.ok(frame.inspectionOpacity >= 0 && frame.inspectionOpacity <= 1);
    if (frame.kind === "docked") assert.equal(frame.inspectionOpacity, 0);
    if (i > 0) assert.ok(Math.abs(frame.inspectionOpacity - frames[i - 1]!.inspectionOpacity) < .15);
  }
  assert.equal(frames[0]!.sourceEmphasis, 1);
  assert.equal(frames[100]!.targetEmphasis, 1);
  assert.equal(frames[50]!.inspectionOpacity, 1);
  assert.throws(() => sampleDerivationRecordInspection(.5, 0, 54));
});
import { checkMomentumEnergy, momentumEnergyExamples, physicalTime, sampleMomentumEnergy } from "../domains/physics/momentum-energy.ts";
import { compileMomentumEnergyAsset } from "../src/authoring/momentum-energy-authoring.ts";
import { readFileSync } from "node:fs";
import { compileMomentumEnergyPublication, momentumEnergySourcePath } from "../src/tutorial/mechanics-relations/momentum-energy-publication.ts";
import { renderMomentumEnergyReader } from "../src/tutorial/mechanics-relations/momentum-energy-reader-publication.ts";
import { loadMomentumEnergyRuntimeSource, momentumEnergyTimeAtProgress } from "../src/tutorial/mechanics-relations/momentum-energy-runtime-source.ts";
import { projectMomentumEnergyAttention } from "../src/tutorial/mechanics-relations/momentum-energy-attention.ts";
import { checkMomentumEnergyDerivation, momentumEnergyDerivationSource, assertMomentumEnergyDerivation } from "../domains/physics/momentum-energy-derivation.ts";
import { compileMomentumEnergyDerivation } from "../src/authoring/momentum-energy-derivation-authoring.ts";
import { createEnergyDerivationPlan, assertEnergyDerivationPlan } from "../src/semantic/momentum-energy-derivation-plan.ts";
import { sampleEnergyDerivationPresentation, sampleSubstitutionPresentation, energyDerivationNavigationTarget, energyDerivationFocus, resolveEnergyDerivationPosition } from "../src/tutorial/mechanics-relations/energy-derivation-presentation.ts";
import { sampleEnergyDerivationLens, resolveEnergyDerivationLensPosition, resolveEnergyDerivationMeasuredPosition } from "../src/tutorial/mechanics-relations/energy-derivation-presentation.ts";

test("interleaved prose changes spatial intervals without changing semantic checkpoints", () => {
  const centers = [27, 260, 314, 368];
  centers.forEach((center, i) => assert.equal(resolveEnergyDerivationMeasuredPosition(center, centers), i));
  for (let i = 0; i < 3; i++) assert.equal(resolveEnergyDerivationMeasuredPosition((centers[i]! + centers[i + 1]!) / 2, centers), i + .5);
  assert.equal(resolveEnergyDerivationMeasuredPosition(-100, centers), 0);
  assert.equal(resolveEnergyDerivationMeasuredPosition(1000, centers), 3);
  assert.throws(() => resolveEnergyDerivationMeasuredPosition(10, [0, 0, 10, 20]));
});

test("lens position is continuous, reversible and rests only near complete lines", () => {
  let previous = 0;
  for (let i = 0; i <= 300; i++) {
    const raw = i / 100, position = resolveEnergyDerivationLensPosition(raw);
    assert.ok(position >= previous && position - previous < .012);
    assert.equal(resolveEnergyDerivationLensPosition(raw), position);
    const { progress } = resolveEnergyDerivationPosition(position);
    const frame = sampleEnergyDerivationLens(progress);
    assert.equal(frame.carry, progress);
    if (frame.phase === "orient") assert.equal(frame.algebra, 0);
    previous = position;
  }
  for (const line of [0, 1, 2, 3]) {
    for (const delta of [-.04, 0, .04]) assert.equal(resolveEnergyDerivationLensPosition(line + delta), line);
  }
  for (const value of [.3, .5, .7]) assert.ok(resolveEnergyDerivationLensPosition(value) > 0 && resolveEnergyDerivationLensPosition(value) < 1);
  assert.equal(sampleEnergyDerivationLens(0).algebra, 0);
  assert.equal(sampleEnergyDerivationLens(1).algebra, 1);
  assert.throws(() => resolveEnergyDerivationLensPosition(NaN));
});

test("directional navigation retraces interiors before crossing shared endpoints", () => {
  for (let move = 0; move < 3; move++) {
    for (const progress of [.01, .5, .99]) {
      assert.equal(energyDerivationNavigationTarget(move, progress, "forward"), move);
      assert.equal(energyDerivationNavigationTarget(move, progress, "rewind"), move);
    }
    assert.equal(energyDerivationNavigationTarget(move, 0, "rewind"), Math.max(0, move - 1));
    assert.equal(energyDerivationNavigationTarget(move, 1, "forward"), Math.min(2, move + 1));
  }
  assert.throws(() => energyDerivationNavigationTarget(3, .5, "rewind"));
});

test("substitution overlap is reversible, act-gated and retains native endpoints", () => {
  const samples = Array.from({ length: 101 }, (_, i) => sampleSubstitutionPresentation(i / 100));
  assert.equal(samples[0]!.carry, 0); assert.equal(samples[0]!.algebra, 0);
  assert.equal(samples[100]!.carry, 1); assert.equal(samples[100]!.algebra, 1);
  assert.ok(samples.some(frame => frame.carry > 0 && frame.carry < 1 && frame.algebra > 0));
  for (let i = 100; i >= 0; i--) {
    assert.deepEqual(sampleSubstitutionPresentation(i / 100), samples[i]);
    if (samples[i]!.phase === "orient") assert.equal(samples[i]!.algebra, 0);
    if (i > 0) {
      assert.ok(samples[i]!.carry >= samples[i - 1]!.carry);
      assert.ok(samples[i]!.algebra >= samples[i - 1]!.algebra);
    }
  }
});

test("whole-proof positions resolve to stable completed checkpoints and continuous local coordinates", () => {
  assert.deepEqual(resolveEnergyDerivationPosition(0), { move: 0, progress: 0 });
  for (const n of [1, 2, 3]) assert.deepEqual(resolveEnergyDerivationPosition(n), { move: n - 1, progress: 1 });
  for (let i = 0; i <= 300; i++) {
    const value = i / 100, resolved = resolveEnergyDerivationPosition(value);
    assert.equal(resolved.move + resolved.progress, value);
    assert.ok(resolved.progress >= 0 && resolved.progress <= 1);
  }
  for (const value of [-.1, 3.1, NaN, Infinity]) assert.throws(() => resolveEnergyDerivationPosition(value));
});

test("proof carry cannot advance algebra and all callout targets belong to the checked source", () => {
  const checked = checkMomentumEnergyDerivation(momentumEnergyDerivationSource);
  assert.equal(checked.status, "checked"); if (checked.status !== "checked") return;
  const compiled = compileMomentumEnergyDerivation(checked.model);
  for (const [i, focus] of energyDerivationFocus.entries()) {
    assert.ok(compiled.moves[i]!.transformation.correspondenceMap!.records.some(r => r.sourceSelectorIds.includes(focus.source)));
    assert.ok(compiled.moves[i]!.transformation.correspondenceMap!.records.some(r => r.targetSelectorIds.includes(focus.target)));
  }
  const forward = Array.from({ length: 101 }, (_, i) => sampleEnergyDerivationPresentation(i / 100));
  for (const [i, frame] of forward.entries()) {
    if (frame.carry < 1) assert.equal(frame.algebra, 0);
    if (frame.phase === "orient") assert.equal(frame.algebra, 0);
    assert.deepEqual(sampleEnergyDerivationPresentation(i / 100), frame);
  }
  for (let i = 100; i >= 0; i--) assert.deepEqual(sampleEnergyDerivationPresentation(i / 100), forward[i]);
  assert.equal(forward[100]!.algebra, 1);
  for (const bad of [NaN, -1, 1.01]) assert.throws(() => sampleEnergyDerivationPresentation(bad));
});

test("vector derivation accepts only its bounded assumptions and keeps runtime roles tied to governed source", () => {
  for (const input of [null, {}, { ...momentumEnergyDerivationSource, mass: "zero" },
    { ...momentumEnergyDerivationSource, velocity: "real-scalar" }, { ...momentumEnergyDerivationSource, proof: "trust-me" }])
    assert.equal(checkMomentumEnergyDerivation(input).status, "repair-required");
  let invoked = false;
  assert.equal(checkMomentumEnergyDerivation({ ...momentumEnergyDerivationSource, get mass() { invoked = true; return "positive-real"; } }).status, "repair-required");
  assert.equal(invoked, false);
  const result = checkMomentumEnergyDerivation(momentumEnergyDerivationSource);
  assert.equal(result.status, "checked"); if (result.status !== "checked") return;
  assert.throws(() => assertMomentumEnergyDerivation({ ...result.model }));
  const plan = createEnergyDerivationPlan(result.model), compiled = compileMomentumEnergyDerivation(result.model);
  assert.throws(() => assertEnergyDerivationPlan({ ...plan }));
  assert.equal(compiled.animation.transformations.length, 3);
  assert.ok(compiled.construction);
  for (const [i, move] of compiled.moves.entries()) {
    assert.deepEqual(move.persist, plan.moves[i]!.persist);
    assert.deepEqual(move.exits, plan.moves[i]!.exits);
    assert.deepEqual(move.entries, plan.moves[i]!.entries);
    const records = move.transformation.correspondenceMap!.records;
    assert.equal(new Set(records.flatMap(r => r.sourceSelectorIds)).size, move.sourceRoles.length);
    assert.equal(new Set(records.flatMap(r => r.targetSelectorIds)).size, move.targetRoles.length);
  }
});

function model(index: number, massKg = 1) {
  const result = checkMomentumEnergy({ ...momentumEnergyExamples[index], massKg });
  assert.equal(result.status, "checked");
  return result.model;
}
const near = (actual: number, expected: number, tolerance = 1e-8) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} != ${expected}`);

test("one analytical state owns position, momentum, force, energy and work", () => {
  const straight = sampleMomentumEnergy(model(0), physicalTime(2));
  assert.deepEqual(straight.position, { x: 4, y: 0 });
  assert.deepEqual(straight.momentum, { x: 4, y: 0 });
  assert.equal(straight.work, 8); assert.equal(straight.energyChange, 8);
  const turning = sampleMomentumEnergy(model(1), physicalTime(Math.PI / 2));
  assert.deepEqual(turning.momentumChange, { x: -1, y: -1 });
  assert.equal(turning.kineticEnergy, .5); assert.equal(turning.energyChange, 0); assert.equal(turning.work, 0);
});

test("interior samples obey differential laws and replay without accumulation drift", () => {
  for (const index of [0, 1]) for (const mass of [1, 2, 4]) {
    const checked = model(index, mass), dt = 1e-5;
    for (const fraction of [.1, .3, .5, .8]) {
      const t = fraction * checked.durationSeconds, frame = sampleMomentumEnergy(checked, physicalTime(t));
      const before = sampleMomentumEnergy(checked, physicalTime(t - dt)), after = sampleMomentumEnergy(checked, physicalTime(t + dt));
      near((after.position.x - before.position.x) / (2 * dt), frame.velocity.x);
      near((after.position.y - before.position.y) / (2 * dt), frame.velocity.y);
      near((after.momentum.x - before.momentum.x) / (2 * dt), frame.force.x);
      near((after.momentum.y - before.momentum.y) / (2 * dt), frame.force.y);
      near((after.kineticEnergy - before.kineticEnergy) / (2 * dt), frame.power);
      near(frame.force.x * frame.velocity.x + frame.force.y * frame.velocity.y, frame.power);
      near(.5 * mass * (frame.velocity.x ** 2 + frame.velocity.y ** 2), frame.kineticEnergy);
      near(frame.work, frame.energyChange);
      sampleMomentumEnergy(checked, physicalTime(checked.durationSeconds));
      assert.deepEqual(sampleMomentumEnergy(checked, physicalTime(t)), frame);
    }
  }
});

test("source boundary rejects unsupported claims, geometry, mass and getters without invoking them", () => {
  for (const input of [null, {}, { ...momentumEnergyExamples[0], massKg: NaN }, { ...momentumEnergyExamples[0], massKg: 0 },
    { ...momentumEnergyExamples[0], massKg: 5 }, { ...momentumEnergyExamples[0], energy: 7 }, { ...momentumEnergyExamples[0], episode: "free-form" }])
    assert.equal(checkMomentumEnergy(input).status, "repair");
  let called = false;
  assert.equal(checkMomentumEnergy({ ...momentumEnergyExamples[0], get massKg() { called = true; return 1; } }).status, "repair");
  assert.equal(called, false);
  const input = { ...momentumEnergyExamples[0]!, massKg: 1 }, result = checkMomentumEnergy(input);
  assert.equal(result.status, "checked"); if (result.status !== "checked") return;
  input.massKg = 4; assert.equal(result.model.source.massKg, 1); assert.ok(Object.isFrozen(result.model.source));
});

test("physical seconds cannot be confused with presentation progress or forged models", () => {
  const checked = model(0);
  assert.throws(() => physicalTime(NaN)); assert.throws(() => physicalTime(-1));
  assert.throws(() => sampleMomentumEnergy(checked, physicalTime(3)));
  // @ts-expect-error A presentation percentage is not a physical-time coordinate.
  assert.throws(() => sampleMomentumEnergy(checked, .5));
  assert.throws(() => sampleMomentumEnergy({ ...checked }, physicalTime(0)));
});

test("each episode traverses governed construction with immutable state lineage", () => {
  for (const index of [0, 1]) {
    const compiled = compileMomentumEnergyAsset(model(index));
    assert.equal(compiled.animation.transformations.length, 1);
    assert.ok(compiled.construction);
    assert.equal(compiled.animation.transformations[0]!.correspondenceMap!.records.length, 4);
    assert.notEqual(compileMomentumEnergyAsset(model(index, 2)).revisionId, compiled.revisionId);
  }
});

test("the canonical Article resolves governed vignettes and complete no-script static figures", () => {
  const text = readFileSync(momentumEnergySourcePath, "utf8");
  const publication = compileMomentumEnergyPublication(text, JSON.parse(readFileSync("examples/physics/momentum-energy.article.lock.json", "utf8")));
  assert.equal(publication.capabilities.length, 2);
  assert.equal(publication.assets.size, 4);
  assert.equal(publication.staticHtml.math.clientRuntimeRequired, false);
  assert.ok(publication.staticHtml.math.displayCount >= 6);
  assert.match(publication.staticHtml.articleHtml, /direction/);
  assert.match(publication.staticHtml.articleHtml, /<math/);
  assert.doesNotMatch(publication.staticHtml.articleHtml, /<script/);
  assert.deepEqual(compileMomentumEnergyPublication(text, publication.article.document.importLock).article.document, publication.article.document);
  assert.throws(() => compileMomentumEnergyPublication(text.replace("straight/advance", "straight/unsupported")));
  for (const svg of publication.assets.values()) assert.match(svg, /data-momentum/);
  const reader = renderMomentumEnergyReader(publication);
  assert.equal(reader.document.blocks.filter(block => block.kind === "animation-story").length, 2);
  assert.match(reader.html, /type="application\/json"/);
  assert.equal(reader.document.title, "Force, momentum and energy: how the relationships fit together");
  assert.match(reader.html, /data-energy-derivation/);
  assert.throws(() => renderMomentumEnergyReader(compileMomentumEnergyPublication(text.replace("K&=\\frac12m", "K&=\\frac13m"))), /repair the bounded semantic binding/);
  for (const rendered of [reader.html, publication.staticHtml.articleHtml]) {
    const ids = new Set([...rendered.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
    for (const link of rendered.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.has(link[1]), `Unresolved inspection link ${link[1]}`);
    assert.ok(rendered.indexOf('id="energy-from-momentum"') < rendered.indexOf("<figure"));
    for (const label of ["Assumptions", "Definition", "Physical law", "Deduction"]) assert.ok(rendered.includes(label));
  }
  const revised = text.replace("# Force, momentum and energy: how the relationships fit together", "# A revised source title");
  assert.equal(renderMomentumEnergyReader(compileMomentumEnergyPublication(revised)).document.title, "A revised source title");
});

test("the displayed momentum-energy deductions agree with both checked physical fixtures", () => {
  for (const index of [0, 1]) for (const mass of [1, 2, 4]) {
    const checked = model(index, mass);
    const f = sampleMomentumEnergy(checked, physicalTime(checked.durationSeconds * .6));
    near((f.momentum.x ** 2 + f.momentum.y ** 2) / (2 * mass), f.kineticEnergy);
    near(Math.sqrt(2 * mass * f.kineticEnergy), Math.hypot(f.momentum.x, f.momentum.y));
    near((f.momentum.x * f.force.x + f.momentum.y * f.force.y) / mass, f.power);
  }
  // Equal time under this fixed force means equal momentum, not equal speed.
  const light = sampleMomentumEnergy(model(0, 1), physicalTime(1));
  const heavy = sampleMomentumEnergy(model(0, 2), physicalTime(1));
  assert.deepEqual(light.momentum, heavy.momentum);
  near(heavy.kineticEnergy, light.kineticEnergy / 2);
  const equalSpeed = sampleMomentumEnergy(model(0, 2), physicalTime(2));
  near(equalSpeed.speed, light.speed);
  near(equalSpeed.kineticEnergy, light.kineticEnergy * 2);
});

test("runtime transport rejects stale or unsupported authority and keeps time separate from attention", () => {
  const compiled = compileMomentumEnergyAsset(model(1));
  const input = { schemaVersion: "kp.physics.momentum-energy.runtime.v1", source: compiled.model.source,
    revisionId: compiled.revisionId, representationId: "representation.physics.momentum-energy.native-2d.v1" };
  const checked = loadMomentumEnergyRuntimeSource(input);
  assert.equal(momentumEnergyTimeAtProgress(checked, .5).seconds, Math.PI / 4);
  assert.equal(projectMomentumEnergyAttention("test", .5).primaryTarget, "visual");
  assert.equal(projectMomentumEnergyAttention("test", 1).primaryTarget, "correspondence");
  for (const patch of [{ revisionId: "stale" }, { representationId: "generic-fade" }, { extra: true }, { source: { ...input.source, massKg: 3 } }])
    assert.throws(() => loadMomentumEnergyRuntimeSource({ ...input, ...patch }));
  assert.throws(() => momentumEnergyTimeAtProgress(checked, NaN));
});
import { validateEnergyReturn } from "../src/tutorial/mechanics-relations/energy-derivation-return.ts";

test("local return validates the entire revision-pinned frame before restoration", () => {
  const boundary = { revision: "publication.a", transitions: ["substitute", "scale-magnitude", "cancel-mass"], disclosureCount: 4, focusIds: ["focus.0"] };
  const frame = { revision: boundary.revision, transition: "scale-magnitude", progress: .42,
    disclosures: [true, false, true, false], focus: "focus.0", anchorRow: 1, anchorOffset: -125.5 };
  const saved = validateEnergyReturn(frame, boundary);
  assert.deepEqual(saved, frame); assert.ok(Object.isFrozen(saved.disclosures));
  frame.disclosures[0] = false;
  assert.equal(saved.disclosures[0], true);
  for (const patch of [{ revision: "publication.old" }, { transition: "guessed" }, { progress: NaN }, { progress: 1.1 },
    { disclosures: [] }, { disclosures: [true, false, "yes", false] }, { focus: "missing" },
    { anchorRow: -1 }, { anchorRow: 4 }, { anchorOffset: Infinity }, { extra: true }])
    assert.throws(() => validateEnergyReturn({ ...frame, ...patch }, boundary));
  let called = false;
  assert.throws(() => validateEnergyReturn({ ...frame, get progress() { called = true; return .5; } }, boundary));
  assert.equal(called, false);
});
